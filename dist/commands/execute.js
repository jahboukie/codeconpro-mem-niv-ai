"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecuteCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const subscriptionManager_1 = require("../services/subscriptionManager");
const apiClient_1 = require("../services/apiClient");
function createExecuteCommand() {
    const command = new commander_1.Command('execute');
    command
        .description('Execute code using the CodeContext Pro execution engine')
        .option('-f, --file <file>', 'Execute code from file')
        .option('-c, --code <code>', 'Execute code directly')
        .option('-l, --language <language>', 'Specify language (js, ts, py, go, rs)')
        .option('-t, --test', 'Run with test verification')
        .option('-m, --memory', 'Use memory integration for learning')
        .option('-p, --port <port>', 'Execution engine port', '3001')
        .action(async (options) => {
        await executeCode(options);
    });
    return command;
}
exports.createExecuteCommand = createExecuteCommand;
async function executeCode(options) {
    console.log(chalk_1.default.cyan('\n🚀 CodeContext Pro Execution Engine\n'));
    try {
        // Validate project setup
        const projectConfig = await validateProjectSetup();
        if (!projectConfig) {
            console.log(chalk_1.default.red('❌ CodeContext Pro not initialized in this project'));
            console.log(chalk_1.default.gray('   Run "codecontext-pro init" first'));
            return;
        }
        // DEVELOPER MODE: Skip authentication for testing
        const isDeveloperMode = process.env.CODECONTEXT_DEV_MODE === 'true' ||
            process.env.NODE_ENV === 'development' ||
            process.cwd().includes('code-context-pro'); // Local dev detection
        if (isDeveloperMode) {
            console.log(chalk_1.default.yellow('🧪 Developer mode detected - skipping authentication'));
            console.log(chalk_1.default.gray('   Using local development version with superpowers'));
        }
        else {
            // CRITICAL: Validate execution with secure server (UNGAMEABLE)
            console.log(chalk_1.default.blue('🔐 Validating execution permissions...'));
            try {
                const validationResult = await apiClient_1.apiClient.validateExecution();
                console.log(chalk_1.default.green(`✅ ${validationResult.message}`));
                if (validationResult.usage) {
                    console.log(chalk_1.default.gray(`   Executions: ${validationResult.usage.used}/${validationResult.usage.limit}`));
                }
            }
            catch (error) {
                console.error(chalk_1.default.red('❌ Execution validation failed:'));
                console.error(chalk_1.default.red(`   ${error.message}`));
                if (error.message.includes('Not authenticated')) {
                    console.log(chalk_1.default.yellow('\n💡 Run "codecontext login" to authenticate.'));
                }
                else if (error.message.includes('Subscription required')) {
                    console.log(chalk_1.default.yellow('\n💡 Please activate your subscription at https://codecontextpro.com'));
                }
                else if (error.message.includes('Usage limit exceeded')) {
                    console.log(chalk_1.default.yellow('\n💡 Upgrade your plan or wait for monthly reset.'));
                }
                return;
            }
        }
        // Legacy subscription check (keeping for backward compatibility)
        const subscriptionManager = new subscriptionManager_1.SubscriptionManager(process.cwd());
        await subscriptionManager.initialize();
        const canExecute = await subscriptionManager.canExecute();
        if (!canExecute.allowed) {
            console.log(chalk_1.default.red('❌ Execution not allowed:'), canExecute.reason);
            console.log(chalk_1.default.yellow('💎 Upgrade to Pro: codecontextpro.com'));
            return;
        }
        // Get code to execute
        const { code, language } = await getCodeToExecute(options);
        // Check if execution engine is running
        const engineUrl = `http://localhost:${options.port || 3001}`;
        const isEngineRunning = await checkExecutionEngine(engineUrl);
        if (!isEngineRunning) {
            console.log(chalk_1.default.yellow('⚠️  Execution engine not running'));
            console.log(chalk_1.default.gray(`   Start it with: node .codecontext/start-execution-engine.js`));
            return;
        }
        // Execute the code
        const spinner = (0, ora_1.default)('Executing code...').start();
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
            const response = await axios_1.default.post(`${engineUrl}/execute`, executionRequest, {
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
                console.log(chalk_1.default.gray(`\n📊 Usage: ${usage.executionsThisMonth}/700 executions this month`));
            }
        }
        catch (error) {
            spinner.fail('Execution failed');
            if (error.isAxiosError || error.response || error.request) {
                if (error.code === 'ECONNREFUSED') {
                    console.log(chalk_1.default.red('❌ Cannot connect to execution engine'));
                    console.log(chalk_1.default.gray(`   Make sure it's running on port ${options.port || 3001}`));
                }
                else if (error.response) {
                    console.log(chalk_1.default.red('❌ Execution error:'), error.response.data);
                }
                else {
                    console.log(chalk_1.default.red('❌ Network error:'), error.message);
                }
            }
            else {
                console.log(chalk_1.default.red('❌ Unexpected error:'), error);
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('💥 Command failed:'), error);
    }
}
async function validateProjectSetup() {
    const configPath = path.join(process.cwd(), '.codecontext', 'config.json');
    if (!(await fs.pathExists(configPath))) {
        return null;
    }
    try {
        return await fs.readJson(configPath);
    }
    catch (error) {
        return null;
    }
}
async function getCodeToExecute(options) {
    let code;
    let language;
    if (options.file) {
        // Read code from file
        const filePath = path.resolve(options.file);
        if (!(await fs.pathExists(filePath))) {
            throw new Error(`File not found: ${filePath}`);
        }
        code = await fs.readFile(filePath, 'utf8');
        language = options.language || detectLanguageFromFile(filePath);
    }
    else if (options.code) {
        // Use provided code
        code = options.code;
        language = options.language || 'javascript';
    }
    else {
        throw new Error('Either --file or --code must be provided');
    }
    return { code, language };
}
function detectLanguageFromFile(filePath) {
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
async function checkExecutionEngine(url) {
    try {
        const response = await axios_1.default.get(`${url}/health`, { timeout: 5000 });
        return response.status === 200;
    }
    catch (error) {
        return false;
    }
}
async function getInstalledPackages(language) {
    const packages = [];
    try {
        if (language === 'javascript' || language === 'typescript') {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            if (await fs.pathExists(packageJsonPath)) {
                const packageJson = await fs.readJson(packageJsonPath);
                packages.push(...Object.keys(packageJson.dependencies || {}));
                packages.push(...Object.keys(packageJson.devDependencies || {}));
            }
        }
        else if (language === 'python') {
            const requirementsPath = path.join(process.cwd(), 'requirements.txt');
            if (await fs.pathExists(requirementsPath)) {
                const requirements = await fs.readFile(requirementsPath, 'utf8');
                packages.push(...requirements.split('\n').filter(line => line.trim()));
            }
        }
    }
    catch (error) {
        // Ignore errors in package detection
    }
    return packages;
}
function displayExecutionResult(result, options) {
    console.log(chalk_1.default.cyan('\n📊 Execution Results\n'));
    // Status
    if (result.success) {
        console.log(chalk_1.default.green('✅ Status: Success'));
    }
    else {
        console.log(chalk_1.default.red('❌ Status: Failed'));
    }
    // Timing and memory
    console.log(chalk_1.default.gray(`⏱️  Execution Time: ${result.executionTime}ms`));
    console.log(chalk_1.default.gray(`🧠 Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`));
    // Output
    if (result.output) {
        console.log(chalk_1.default.cyan('\n📤 Output:'));
        console.log(chalk_1.default.white(result.output));
    }
    // Errors
    if (result.errors && result.errors.length > 0) {
        console.log(chalk_1.default.red('\n❌ Errors:'));
        result.errors.forEach((error) => {
            console.log(chalk_1.default.red(`   ${error}`));
        });
    }
    // Test results
    if (result.testResults && result.testResults.length > 0) {
        console.log(chalk_1.default.cyan('\n🧪 Test Results:'));
        result.testResults.forEach((test) => {
            const status = test.passed ? chalk_1.default.green('✅') : chalk_1.default.red('❌');
            console.log(`   ${status} ${test.name} (${test.duration}ms)`);
            if (!test.passed && test.error) {
                console.log(chalk_1.default.red(`      ${test.error}`));
            }
        });
    }
    // Performance metrics
    if (result.performanceMetrics) {
        console.log(chalk_1.default.cyan('\n📈 Performance:'));
        console.log(chalk_1.default.gray(`   CPU Usage: ${result.performanceMetrics.cpuUsage}%`));
        console.log(chalk_1.default.gray(`   Memory Peak: ${(result.performanceMetrics.memoryPeak / 1024 / 1024).toFixed(2)}MB`));
        console.log(chalk_1.default.gray(`   I/O Operations: ${result.performanceMetrics.ioOperations}`));
    }
    // Security report
    if (result.securityReport) {
        const riskColor = result.securityReport.riskLevel === 'high' ? chalk_1.default.red :
            result.securityReport.riskLevel === 'medium' ? chalk_1.default.yellow : chalk_1.default.green;
        console.log(chalk_1.default.cyan('\n🔒 Security:'));
        console.log(`   Risk Level: ${riskColor(result.securityReport.riskLevel.toUpperCase())}`);
        if (result.securityReport.suspiciousOperations.length > 0) {
            console.log(chalk_1.default.yellow('   Suspicious Operations:'));
            result.securityReport.suspiciousOperations.forEach((op) => {
                console.log(chalk_1.default.yellow(`     - ${op}`));
            });
        }
    }
    // Improvements (if execution failed)
    if (result.improvements) {
        console.log(chalk_1.default.cyan('\n💡 Suggested Improvements:'));
        if (result.improvements.codeImprovements.length > 0) {
            console.log(chalk_1.default.yellow('   Code:'));
            result.improvements.codeImprovements.forEach((improvement) => {
                console.log(chalk_1.default.yellow(`     - ${improvement}`));
            });
        }
        if (result.improvements.performanceOptimizations.length > 0) {
            console.log(chalk_1.default.yellow('   Performance:'));
            result.improvements.performanceOptimizations.forEach((optimization) => {
                console.log(chalk_1.default.yellow(`     - ${optimization}`));
            });
        }
    }
    console.log(); // Empty line at end
}
function generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=execute.js.map