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
declare class ApiClient {
    private client;
    private credentials;
    constructor();
    private loadCredentials;
    private saveCredentials;
    isAuthenticated(): boolean;
    getCredentials(): Credentials | null;
    login(apiKey: string): Promise<UserInfo>;
    logout(): void;
    getUserInfo(): Promise<UserInfo>;
    validateExecution(): Promise<ExecutionValidationResponse>;
    createUser(uid: string, email: string, displayName?: string): Promise<{
        apiKey: string;
    }>;
}
export declare const apiClient: ApiClient;
export default apiClient;
//# sourceMappingURL=apiClient.d.ts.map