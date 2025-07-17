import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class VSCodeExtensionManager {
  private extensionId = 'codecontext-pro.memory-extension';
  private extensionPath: string;

  constructor() {
    // VS Code extensions directory
    this.extensionPath = path.join(
      os.homedir(),
      '.vscode',
      'extensions',
      'codecontext-pro.memory-extension-0.1.0'
    );
  }

  async ensureExtensionInstalled(): Promise<void> {
    // Check if extension is already installed
    if (await fs.pathExists(this.extensionPath)) {
      return;
    }

    // For now, we'll create a placeholder extension
    // In production, this would install from marketplace or local package
    await this.createPlaceholderExtension();
  }

  async configureForProject(projectPath: string): Promise<void> {
    // Create VS Code workspace settings for the project
    const vscodeDir = path.join(projectPath, '.vscode');
    await fs.ensureDir(vscodeDir);

    const settingsPath = path.join(vscodeDir, 'settings.json');
    let settings: any = {};

    // Load existing settings if they exist
    if (await fs.pathExists(settingsPath)) {
      try {
        settings = await fs.readJson(settingsPath);
      } catch (error) {
        // If settings file is malformed, start fresh
        settings = {};
      }
    }

    // Add CodeContext Pro settings
    settings['codecontext-pro.enabled'] = true;
    settings['codecontext-pro.projectPath'] = projectPath;
    settings['codecontext-pro.memoryMode'] = true;

    await fs.writeJson(settingsPath, settings, { spaces: 2 });

    // Create launch configuration for debugging the extension
    const launchPath = path.join(vscodeDir, 'launch.json');
    const launchConfig = {
      version: '0.2.0',
      configurations: [
        {
          name: 'CodeContext Pro Debug',
          type: 'extensionHost',
          request: 'launch',
          args: ['--extensionDevelopmentPath=${workspaceFolder}/../memory-extension'],
          outFiles: ['${workspaceFolder}/../memory-extension/out/**/*.js'],
          preLaunchTask: 'npm: compile'
        }
      ]
    };

    await fs.writeJson(launchPath, launchConfig, { spaces: 2 });
  }

  private async createPlaceholderExtension(): Promise<void> {
    await fs.ensureDir(this.extensionPath);

    // Create basic package.json for the extension
    const packageJson = {
      name: 'memory-extension',
      displayName: 'CodeContext Pro Memory',
      description: 'AI Assistant Memory Engine',
      version: '0.1.0',
      publisher: 'codecontext-pro',
      engines: {
        vscode: '^1.74.0'
      },
      categories: ['Other'],
      activationEvents: ['onStartupFinished'],
      main: './out/extension.js',
      contributes: {
        commands: [
          {
            command: 'codecontext.showMemory',
            title: 'Show Project Memory',
            category: 'CodeContext'
          },
          {
            command: 'codecontext.recordDecision',
            title: 'Record Architectural Decision',
            category: 'CodeContext'
          }
        ],
        configuration: {
          title: 'CodeContext Pro',
          properties: {
            'codecontext-pro.enabled': {
              type: 'boolean',
              default: true,
              description: 'Enable CodeContext Pro memory tracking'
            },
            'codecontext-pro.memoryMode': {
              type: 'boolean',
              default: true,
              description: 'Enable memory-only mode (Phase 1)'
            }
          }
        }
      },
      scripts: {
        'vscode:prepublish': 'npm run compile',
        compile: 'tsc -p ./',
        watch: 'tsc -watch -p ./'
      },
      devDependencies: {
        '@types/vscode': '^1.74.0',
        '@types/node': '16.x',
        typescript: '^4.9.4'
      }
    };

    await fs.writeJson(path.join(this.extensionPath, 'package.json'), packageJson, { spaces: 2 });

    // Create basic TypeScript config
    const tsConfig = {
      compilerOptions: {
        module: 'commonjs',
        target: 'ES2020',
        outDir: 'out',
        lib: ['ES2020'],
        sourceMap: true,
        rootDir: 'src',
        strict: true
      },
      exclude: ['node_modules', '.vscode-test']
    };

    await fs.writeJson(path.join(this.extensionPath, 'tsconfig.json'), tsConfig, { spaces: 2 });

    // Create src directory and basic extension file
    const srcDir = path.join(this.extensionPath, 'src');
    await fs.ensureDir(srcDir);

    const extensionCode = `
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('🧠 CodeContext Pro Memory Extension is now active!');
    
    // Register commands
    const showMemoryCommand = vscode.commands.registerCommand('codecontext.showMemory', () => {
        vscode.window.showInformationMessage('🧠 Memory feature coming soon!');
    });
    
    const recordDecisionCommand = vscode.commands.registerCommand('codecontext.recordDecision', () => {
        vscode.window.showInformationMessage('📝 Decision recording coming soon!');
    });
    
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "🧠 Memory";
    statusBarItem.command = 'codecontext.showMemory';
    statusBarItem.show();
    
    context.subscriptions.push(showMemoryCommand, recordDecisionCommand, statusBarItem);
}

export function deactivate() {
    console.log('👋 CodeContext Pro Memory Extension deactivated');
}
`;

    await fs.writeFile(path.join(srcDir, 'extension.ts'), extensionCode);

    console.log(`📦 Placeholder extension created at ${this.extensionPath}`);
  }

  async isExtensionInstalled(): Promise<boolean> {
    return await fs.pathExists(this.extensionPath);
  }

  async getExtensionVersion(): Promise<string> {
    try {
      const packagePath = path.join(this.extensionPath, 'package.json');
      const packageJson = await fs.readJson(packagePath);
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  async checkVSCodeInstallation(): Promise<boolean> {
    try {
      await execAsync('code --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async installExtensionFromMarketplace(): Promise<void> {
    // This would install from VS Code marketplace in production
    try {
      await execAsync(`code --install-extension ${this.extensionId}`);
    } catch (error) {
      throw new Error(`Failed to install extension: ${error}`);
    }
  }

  async uninstallExtension(): Promise<void> {
    try {
      await execAsync(`code --uninstall-extension ${this.extensionId}`);
    } catch (error) {
      // Extension might not be installed, which is fine
    }
    
    // Remove local extension directory
    if (await fs.pathExists(this.extensionPath)) {
      await fs.remove(this.extensionPath);
    }
  }

  async openProjectInVSCode(projectPath: string): Promise<void> {
    try {
      await execAsync(`code "${projectPath}"`);
    } catch (error) {
      throw new Error(`Failed to open project in VS Code: ${error}`);
    }
  }

  async createExtensionDevelopmentEnvironment(projectPath: string): Promise<void> {
    // Create development environment for the memory extension
    const extensionDevPath = path.join(projectPath, 'memory-extension');
    
    if (await fs.pathExists(extensionDevPath)) {
      return; // Already exists
    }

    // Copy the placeholder extension to the project for development
    await fs.copy(this.extensionPath, extensionDevPath);
    
    // Update package.json for development
    const packagePath = path.join(extensionDevPath, 'package.json');
    const packageJson = await fs.readJson(packagePath);
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'compile': 'tsc -p ./',
      'watch': 'tsc -watch -p ./',
      'test': 'node ./out/test/runTest.js'
    };
    
    await fs.writeJson(packagePath, packageJson, { spaces: 2 });
  }
}
