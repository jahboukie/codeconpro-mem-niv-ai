import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// API Configuration
const API_BASE_URL = 'https://us-central1-context-code-pro.cloudfunctions.net/api/api';
const CONFIG_DIR = path.join(os.homedir(), '.codecontext-pro');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.json');

interface Credentials {
  apiKey: string;
  userId: string;
  email: string;
}

interface UserInfo {
  uid: string;
  email: string;
  displayName?: string;
  subscriptionTier: 'starter' | 'professional' | 'team';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  usage: {
    executions: {
      used: number;
      limit: number;
      resetDate: string;
    };
    files: {
      tracked: number;
      limit: number;
    };
  };
}

interface ExecutionValidationResponse {
  success: boolean;
  message: string;
  usage?: {
    used: number;
    limit: number;
    resetDate: string;
  };
}

class ApiClient {
  private client: any;
  private credentials: Credentials | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load credentials on initialization
    this.loadCredentials();

    // Add request interceptor to include API key
    this.client.interceptors.request.use((config: any) => {
      if (this.credentials?.apiKey) {
        config.headers.Authorization = `Bearer ${this.credentials.apiKey}`;
      }
      return config;
    });
  }

  // Load credentials from local file
  private loadCredentials(): void {
    try {
      if (fs.existsSync(CREDENTIALS_FILE)) {
        const credentialsData = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
        this.credentials = JSON.parse(credentialsData);
      }
    } catch (error) {
      console.warn('Warning: Could not load credentials');
      this.credentials = null;
    }
  }

  // Save credentials to local file
  private saveCredentials(credentials: Credentials): void {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      // Save credentials securely
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
        mode: 0o600, // Read/write for owner only
      });

      this.credentials = credentials;
    } catch (error) {
      throw new Error(`Failed to save credentials: ${(error as Error).message}`);
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.credentials !== null && this.credentials.apiKey !== undefined;
  }

  // Get current credentials
  public getCredentials(): Credentials | null {
    return this.credentials;
  }

  // Login with API key
  public async login(apiKey: string): Promise<UserInfo> {
    try {
      // Temporarily set API key for this request
      const response = await this.client.get('/v1/users/me', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const userInfo = response.data;

      // Save credentials
      const credentials: Credentials = {
        apiKey,
        userId: userInfo.uid,
        email: userInfo.email,
      };

      this.saveCredentials(credentials);

      return userInfo;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your credentials.');
      }
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Logout (remove credentials)
  public logout(): void {
    try {
      if (fs.existsSync(CREDENTIALS_FILE)) {
        fs.unlinkSync(CREDENTIALS_FILE);
      }
      this.credentials = null;
    } catch (error) {
      console.warn('Warning: Could not remove credentials file');
    }
  }

  // Get current user info
  public async getUserInfo(): Promise<UserInfo> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please run "codecontext login" first.');
    }

    try {
      const response = await this.client.get('/v1/users/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication expired. Please run "codecontext login" again.');
      }
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  // CRITICAL: Validate execution usage (UNGAMEABLE)
  public async validateExecution(): Promise<ExecutionValidationResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please run "codecontext login" first.');
    }

    try {
      const response = await this.client.post('/v1/executions/validate');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication expired. Please run "codecontext login" again.');
      }

      if (error.response?.status === 403) {
        throw new Error('Subscription required. Please activate your subscription to use executions.');
      }

      if (error.response?.status === 429) {
        const errorData = error.response.data;
        throw new Error(
          `Usage limit exceeded: ${errorData.message}\n` +
          `Reset date: ${new Date(errorData.resetDate).toLocaleDateString()}`
        );
      }

      throw new Error(`Execution validation failed: ${error.message}`);
    }
  }

  // Create user account (called after web signup)
  public async createUser(uid: string, email: string, displayName?: string): Promise<{ apiKey: string }> {
    try {
      const response = await this.client.post('/v1/users/create', {
        uid,
        email,
        displayName,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create user: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
