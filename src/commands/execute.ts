import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { SubscriptionManager } from '../services/subscriptionManager';
import { apiClient } from '../services/apiClient';

interface ExecuteOptions {
  file?: string;
  code?: string;
  language?: string;
  test?: boolean;
  memory?: boolean;
  port?: number;
}

export function createExecuteCommand(): Command {
  const command = new Command('execute');
  
  command
    .description('Execute code using the CodeContext Pro execution engine')
    .option('-f, --file <file>', 'Execute code from file')
    .option('-c, --code <code>', 'Execute code directly')
    .option('-l, --language <language>', 'Specify language (js, ts, py, go, rs)')
    .option('-t, --test', 'Run with test verification')
    .option('-m, --memory', 'Use memory integration for learning')
    .option('-p, --port <port>', 'Execution engine port', '3001')
    .action(async (options: ExecuteOptions) => {
      await executeCode(options);
    });

  return command;
}

async function executeCode(options: ExecuteOptions): Promise<void> {
  console.log(chalk.cyan('\n🚀 CodeContext Pro Execution Engine\n'));

  try {
    // Validate project setup
    const projectConfig = await validateProjectSetup();
    if (!projectConfig) {
      console.log(chalk.red('❌ CodeContext Pro not initialized in this project'));
      console.log(chalk.gray('   Run "codecontext-pro init" first'));
      return;
    }

    // DEVELOPER MODE: Skip authentication for testing
    const isDeveloperMode = process.env.CODECONTEXT_DEV_MODE === 'true' ||
                           process.env.NODE_ENV === 'development' ||
                           process.cwd().includes('code-context-pro'); // Local dev detection

    if (isDeveloperMode) {
      console.log(chalk.yellow('🧪 Developer mode detected - skipping authentication'));
      console.log(chalk.gray('   Using local development version with superpowers'));
    } else {
      // CRITICAL: Validate execution with secure server (UNGAMEABLE)
      console.log(chalk.blue('🔐 Validating execution permissions...'));

      try {
        const validationResult = await apiClient.validateExecution();
        console.log(chalk.green(`✅ ${validationResult.message}`));

        if (validationResult.usage) {
          console.log(chalk.gray(`   Executions: ${validationResult.usage.used}/${validationResult.usage.limit}`));
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Execution validation failed:'));
        console.error(chalk.red(`   ${error.message}`));

        if (error.message.includes('Not authenticated')) {
          console.log(chalk.yellow('\n💡 Run "codecontext login" to authenticate.'));
        } else if (error.message.includes('Subscription required')) {
          console.log(chalk.yellow('\n💡 Please activate your subscription at https://codecontextpro.com'));
        } else if (error.message.includes('Usage limit exceeded')) {
          console.log(chalk.yellow('\n💡 Upgrade your plan or wait for monthly reset.'));
        }

        return;
      }
    }

    // Legacy subscription check (keeping for backward compatibility)
    const subscriptionManager = new SubscriptionManager(process.cwd());
    await subscriptionManager.initialize();

    const canExecute = await subscriptionManager.canExecute();
    if (!canExecute.allowed) {
      console.log(chalk.red('❌ Execution not allowed:'), canExecute.reason);
      console.log(chalk.yellow('💎 Upgrade to Pro: codecontextpro.com'));
      return;
    }

    // Get code to execute
    const { code, language } = await getCodeToExecute(options);

    // Check if execution engine is running
    const engineUrl = `http://localhost:${options.port || 3001}`;
    const isEngineRunning = await checkExecutionEngine(engineUrl);
    
    if (!isEngineRunning) {
      console.log(chalk.yellow('⚠️  Execution engine not running'));
      console.log(chalk.gray(`   Start it with: node .codecontext/start-execution-engine.js`));
      return;
    }

    // Execute the code
    const spinner = ora('Executing code...').start();
    
    const executionRequest = {
      id: generateExecutionId(),
      language,
      code,
      timeout: 30000,
      memoryLimit: '256m',
      projectContext: {
        projectId: projectConfig.projectId,
        workingDirectory: process.cwd(),
        installedPackages: await getInstalledPackages(language),
        environmentVariables: {}
      }
    };

    try {
      const response = await axios.post(`${engineUrl}/execute`, executionRequest, {
        headers: {
          'Content-Type': 'application/json',
          'ai-assistant': 'codecontext-cli',
          'conversation-id': generateConversationId()
        },
        timeout: 35000
      });

      const result = response.data;
      spinner.stop();

      // Record execution usage
      await subscriptionManager.recordExecution();

      // Display results
      displayExecutionResult(result, options);

      // Show usage summary
      const usage = subscriptionManager.getUsageStats();
      if (usage) {
        console.log(chalk.gray(`\n📊 Usage: ${usage.executionsThisMonth}/700 executions this month`));
      }

    } catch (error: any) {
      spinner.fail('Execution failed');

      if (error.isAxiosError || error.response || error.request) {
        if (error.code === 'ECONNREFUSED') {
          console.log(chalk.red('❌ Cannot connect to execution engine'));
          console.log(chalk.gray(`   Make sure it's running on port ${options.port || 3001}`));
        } else if (error.response) {
          console.log(chalk.red('❌ Execution error:'), error.response.data);
        } else {
          console.log(chalk.red('❌ Network error:'), error.message);
        }
      } else {
        console.log(chalk.red('❌ Unexpected error:'), error);
      }
    }

  } catch (error) {
    console.error(chalk.red('💥 Command failed:'), error);
  }
}

async function validateProjectSetup(): Promise<any> {
  const configPath = path.join(process.cwd(), '.codecontext', 'config.json');
  
  if (!(await fs.pathExists(configPath))) {
    return null;
  }
  
  try {
    return await fs.readJson(configPath);
  } catch (error) {
    return null;
  }
}

async function getCodeToExecute(options: ExecuteOptions): Promise<{ code: string; language: string }> {
  let code: string;
  let language: string;

  if (options.file) {
    // Read code from file
    const filePath = path.resolve(options.file);
    
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    code = await fs.readFile(filePath, 'utf8');
    language = options.language || detectLanguageFromFile(filePath);
    
  } else if (options.code) {
    // Use provided code
    code = options.code;
    language = options.language || 'javascript';
    
  } else {
    throw new Error('Either --file or --code must be provided');
  }

  return { code, language };
}

function detectLanguageFromFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.js': return 'javascript';
    case '.ts': return 'typescript';
    case '.py': return 'python';
    case '.go': return 'go';
    case '.rs': return 'rust';
    default: return 'javascript';
  }
}

async function checkExecutionEngine(url: string): Promise<boolean> {
  try {
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function getInstalledPackages(language: string): Promise<string[]> {
  const packages: string[] = [];
  
  try {
    if (language === 'javascript' || language === 'typescript') {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        packages.push(...Object.keys(packageJson.dependencies || {}));
        packages.push(...Object.keys(packageJson.devDependencies || {}));
      }
    } else if (language === 'python') {
      const requirementsPath = path.join(process.cwd(), 'requirements.txt');
      if (await fs.pathExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf8');
        packages.push(...requirements.split('\n').filter(line => line.trim()));
      }
    }
  } catch (error) {
    // Ignore errors in package detection
  }
  
  return packages;
}

function displayExecutionResult(result: any, options: ExecuteOptions): void {
  console.log(chalk.cyan('\n📊 Execution Results\n'));
  
  // Status
  if (result.success) {
    console.log(chalk.green('✅ Status: Success'));
  } else {
    console.log(chalk.red('❌ Status: Failed'));
  }
  
  // Timing and memory
  console.log(chalk.gray(`⏱️  Execution Time: ${result.executionTime}ms`));
  console.log(chalk.gray(`🧠 Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`));
  
  // Output
  if (result.output) {
    console.log(chalk.cyan('\n📤 Output:'));
    console.log(chalk.white(result.output));
  }
  
  // Errors
  if (result.errors && result.errors.length > 0) {
    console.log(chalk.red('\n❌ Errors:'));
    result.errors.forEach((error: string) => {
      console.log(chalk.red(`   ${error}`));
    });
  }
  
  // Test results
  if (result.testResults && result.testResults.length > 0) {
    console.log(chalk.cyan('\n🧪 Test Results:'));
    result.testResults.forEach((test: any) => {
      const status = test.passed ? chalk.green('✅') : chalk.red('❌');
      console.log(`   ${status} ${test.name} (${test.duration}ms)`);
      if (!test.passed && test.error) {
        console.log(chalk.red(`      ${test.error}`));
      }
    });
  }
  
  // Performance metrics
  if (result.performanceMetrics) {
    console.log(chalk.cyan('\n📈 Performance:'));
    console.log(chalk.gray(`   CPU Usage: ${result.performanceMetrics.cpuUsage}%`));
    console.log(chalk.gray(`   Memory Peak: ${(result.performanceMetrics.memoryPeak / 1024 / 1024).toFixed(2)}MB`));
    console.log(chalk.gray(`   I/O Operations: ${result.performanceMetrics.ioOperations}`));
  }
  
  // Security report
  if (result.securityReport) {
    const riskColor = result.securityReport.riskLevel === 'high' ? chalk.red : 
                     result.securityReport.riskLevel === 'medium' ? chalk.yellow : chalk.green;
    console.log(chalk.cyan('\n🔒 Security:'));
    console.log(`   Risk Level: ${riskColor(result.securityReport.riskLevel.toUpperCase())}`);
    
    if (result.securityReport.suspiciousOperations.length > 0) {
      console.log(chalk.yellow('   Suspicious Operations:'));
      result.securityReport.suspiciousOperations.forEach((op: string) => {
        console.log(chalk.yellow(`     - ${op}`));
      });
    }
  }
  
  // Improvements (if execution failed)
  if (result.improvements) {
    console.log(chalk.cyan('\n💡 Suggested Improvements:'));
    
    if (result.improvements.codeImprovements.length > 0) {
      console.log(chalk.yellow('   Code:'));
      result.improvements.codeImprovements.forEach((improvement: string) => {
        console.log(chalk.yellow(`     - ${improvement}`));
      });
    }
    
    if (result.improvements.performanceOptimizations.length > 0) {
      console.log(chalk.yellow('   Performance:'));
      result.improvements.performanceOptimizations.forEach((optimization: string) => {
        console.log(chalk.yellow(`     - ${optimization}`));
      });
    }
  }
  
  console.log(); // Empty line at end
}

function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
