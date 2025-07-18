"use strict";
/**
 * AI Command - The Ultimate Developer Experience
 * Combines Claude/GPT with Memory + Execution = CURSOR KILLER
 */
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
exports.AICommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const aiProviderManager_1 = __importDefault(require("../services/aiProviderManager"));
const memoryEngine_1 = require("../services/memoryEngine");
const mockExecutionEngine_1 = require("../services/mockExecutionEngine");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class AICommand {
    constructor() {
        this.memoryEngine = new memoryEngine_1.MemoryEngine(process.cwd());
        this.executionEngine = new mockExecutionEngine_1.ExecutionEngine('./sandbox');
        this.aiManager = new aiProviderManager_1.default(this.memoryEngine, this.executionEngine);
    }
    /**
     * Register AI commands
     */
    register(program) {
        const aiCmd = program
            .command('ai')
            .description('🤖 AI Assistant with Memory + Execution (Cursor Killer)')
            .alias('chat');
        // Main chat command
        aiCmd
            .command('chat [message]')
            .description('💬 Chat with AI (has persistent memory)')
            .option('-p, --provider <provider>', 'AI provider (claude|gpt)', 'claude')
            .option('-e, --execute', 'Execute generated code automatically', false)
            .option('-c, --compare', 'Compare responses from multiple providers', false)
            .option('-f, --file <file>', 'Include file context')
            .action(async (message, options) => {
            await this.handleChat(message, options);
        });
        // Setup command
        aiCmd
            .command('setup')
            .description('🔧 Setup AI providers and API keys')
            .action(async () => {
            await this.handleSetup();
        });
        // Switch provider
        aiCmd
            .command('switch <provider>')
            .description('🔄 Switch AI provider (claude|gpt)')
            .action(async (provider) => {
            await this.handleSwitchProvider(provider);
        });
        // Status command
        aiCmd
            .command('status')
            .description('📊 Show AI provider status and capabilities')
            .action(async () => {
            await this.handleStatus();
        });
        // Interactive mode
        aiCmd
            .command('interactive')
            .description('🎮 Interactive AI chat mode')
            .alias('i')
            .option('-p, --provider <provider>', 'AI provider (claude|gpt)', 'claude')
            .action(async (options) => {
            await this.handleInteractiveMode(options);
        });
    }
    /**
     * Handle chat command
     */
    async handleChat(message, options) {
        try {
            await this.ensureInitialized();
            // Get message if not provided
            if (!message) {
                const response = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'message',
                        message: '💬 What would you like to ask the AI?',
                        validate: (input) => input.trim().length > 0 || 'Please enter a message'
                    }
                ]);
                message = response.message;
            }
            // Switch provider if specified
            if (options.provider) {
                await this.aiManager.switchProvider(options.provider);
            }
            // Get project context
            const projectContext = await this.getProjectContext();
            // Include file context if specified
            let codeContext = [];
            if (options.file) {
                codeContext = await this.getFileContext(options.file);
            }
            // Build request
            const request = {
                message,
                projectContext,
                codeContext,
                executionRequired: options.execute,
                memoryRetrieval: true
            };
            console.log(chalk_1.default.cyan('🧠 CodeContext Pro - AI Assistant with Superpowers\n'));
            if (options.compare) {
                await this.handleCompareProviders(request);
            }
            else {
                await this.handleSingleProvider(request, options.provider);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Error:'), error instanceof Error ? error.message : error);
        }
    }
    /**
     * Handle single provider response
     */
    async handleSingleProvider(request, provider) {
        const spinner = (0, ora_1.default)(`🤖 ${provider.toUpperCase()} is thinking with full memory and execution...`).start();
        try {
            const response = await this.aiManager.enhancedChat(request);
            spinner.stop();
            // Display response
            console.log(chalk_1.default.green('🤖 AI Response:'));
            console.log(chalk_1.default.white(response.response));
            // Display code blocks
            if (response.code && response.code.length > 0) {
                console.log(chalk_1.default.yellow('\n💻 Generated Code:'));
                response.code.forEach((codeBlock, index) => {
                    console.log(chalk_1.default.cyan(`\n📄 ${codeBlock.description} (${codeBlock.language}):`));
                    console.log(chalk_1.default.gray('```' + codeBlock.language));
                    console.log(codeBlock.code);
                    console.log(chalk_1.default.gray('```'));
                });
            }
            // Display execution results
            if (response.executionResults && response.executionResults.length > 0) {
                console.log(chalk_1.default.magenta('\n🚀 Execution Results:'));
                response.executionResults.forEach((result, index) => {
                    if (result.success) {
                        console.log(chalk_1.default.green(`✅ Code block ${index + 1}: SUCCESS`));
                        if (result.output) {
                            console.log(chalk_1.default.gray('Output:'), result.output);
                        }
                    }
                    else {
                        console.log(chalk_1.default.red(`❌ Code block ${index + 1}: FAILED`));
                        if (result.errors.length > 0) {
                            console.log(chalk_1.default.red('Errors:'), result.errors.join(', '));
                        }
                    }
                });
            }
            // Display memory updates
            if (response.memoryUpdates && response.memoryUpdates.length > 0) {
                console.log(chalk_1.default.blue('\n🧠 Memory Updates:'));
                response.memoryUpdates.forEach(update => {
                    console.log(chalk_1.default.blue(`📝 ${update.content}`));
                });
            }
            // Display confidence and reasoning
            console.log(chalk_1.default.gray(`\n📊 Confidence: ${(response.confidence * 100).toFixed(1)}%`));
            console.log(chalk_1.default.gray(`🎯 Reasoning: ${response.reasoning}`));
        }
        catch (error) {
            spinner.fail('Failed to get AI response');
            throw error;
        }
    }
    /**
     * Handle provider comparison
     */
    async handleCompareProviders(request) {
        const spinner = (0, ora_1.default)('🔄 Comparing Claude vs GPT responses...').start();
        try {
            const comparison = await this.aiManager.compareProviders(request);
            spinner.stop();
            console.log(chalk_1.default.yellow('\n🥊 AI PROVIDER COMPARISON\n'));
            if (comparison.claude) {
                console.log(chalk_1.default.green('🟢 CLAUDE RESPONSE:'));
                console.log(chalk_1.default.white(comparison.claude.response));
                console.log(chalk_1.default.gray(`Confidence: ${(comparison.claude.confidence * 100).toFixed(1)}%\n`));
            }
            if (comparison.gpt) {
                console.log(chalk_1.default.blue('🔵 GPT RESPONSE:'));
                console.log(chalk_1.default.white(comparison.gpt.response));
                console.log(chalk_1.default.gray(`Confidence: ${(comparison.gpt.confidence * 100).toFixed(1)}%\n`));
            }
            console.log(chalk_1.default.cyan(`🏆 RECOMMENDATION: ${comparison.recommendation.toUpperCase()}`));
            console.log(chalk_1.default.gray(`📊 ${comparison.reasoning}`));
        }
        catch (error) {
            spinner.fail('Failed to compare providers');
            throw error;
        }
    }
    /**
     * Handle setup command
     */
    async handleSetup() {
        console.log(chalk_1.default.cyan('🔧 Setting up AI providers...\n'));
        // First, ask which providers they want to set up
        const providerChoice = await inquirer_1.default.prompt([
            {
                type: 'checkbox',
                name: 'providers',
                message: '🎯 Which AI providers would you like to set up?',
                choices: [
                    { name: 'Claude (Anthropic) - Best for coding and analysis', value: 'claude' },
                    { name: 'GPT (OpenAI) - Great for creative tasks', value: 'gpt' }
                ],
                default: ['claude'],
                validate: (answer) => answer.length > 0 || 'Please select at least one provider'
            }
        ]);
        const questions = [];
        // Add questions based on provider selection
        if (providerChoice.providers.includes('claude')) {
            questions.push({
                type: 'input',
                name: 'anthropicKey',
                message: '🤖 Enter your Anthropic API key (for Claude):',
                validate: (input) => input.trim().length > 0 || 'API key required'
            });
        }
        if (providerChoice.providers.includes('gpt')) {
            questions.push({
                type: 'input',
                name: 'openaiKey',
                message: '🤖 Enter your OpenAI API key (for GPT):',
                validate: (input) => input.trim().length > 0 || 'API key required'
            });
        }
        // Add default provider question
        questions.push({
            type: 'list',
            name: 'defaultProvider',
            message: '🎯 Choose default AI provider:',
            choices: providerChoice.providers.map((p) => ({
                name: p === 'claude' ? '🧠 Claude (Anthropic) - Best for coding' : '🎯 GPT (OpenAI) - Great for creative tasks',
                value: p
            })),
            default: providerChoice.providers[0]
        });
        const answers = await inquirer_1.default.prompt(questions);
        // Save configuration
        const configPath = path.join(process.cwd(), '.codecontext', 'ai-config.json');
        await fs.ensureDir(path.dirname(configPath));
        await fs.writeJson(configPath, {
            anthropicKey: answers.anthropicKey,
            openaiKey: answers.openaiKey,
            defaultProvider: answers.defaultProvider
        });
        // Initialize providers
        await this.aiManager.initializeProviders({
            anthropicKey: answers.anthropicKey,
            openaiKey: answers.openaiKey,
            defaultProvider: answers.defaultProvider
        });
        console.log(chalk_1.default.green('✅ AI providers configured successfully!'));
        console.log(chalk_1.default.yellow('🚀 You can now use: codecontext ai chat "your message"'));
    }
    /**
     * Handle switch provider command
     */
    async handleSwitchProvider(provider) {
        if (!['claude', 'gpt'].includes(provider)) {
            throw new Error('Invalid provider. Use "claude" or "gpt"');
        }
        await this.ensureInitialized();
        await this.aiManager.switchProvider(provider);
        console.log(chalk_1.default.green(`✅ Switched to ${provider.toUpperCase()}`));
    }
    /**
     * Handle status command
     */
    async handleStatus() {
        console.log(chalk_1.default.cyan('📊 CodeContext Pro - AI Status\n'));
        try {
            // Try to load config
            const configPath = path.join(process.cwd(), '.codecontext', 'ai-config.json');
            if (await fs.pathExists(configPath)) {
                const config = await fs.readJson(configPath);
                console.log(chalk_1.default.green('✅ Configuration found'));
                console.log(chalk_1.default.gray(`Default provider: ${config.defaultProvider}`));
                console.log(chalk_1.default.gray(`Claude: ${config.anthropicKey ? 'Configured' : 'Not configured'}`));
                console.log(chalk_1.default.gray(`GPT: ${config.openaiKey ? 'Configured' : 'Not configured'}`));
                console.log(chalk_1.default.yellow('\n🚀 Available Features:'));
                console.log(chalk_1.default.white('• Persistent memory across sessions'));
                console.log(chalk_1.default.white('• Code execution and verification'));
                console.log(chalk_1.default.white('• Multi-provider comparison'));
                console.log(chalk_1.default.white('• Project context awareness'));
                console.log(chalk_1.default.white('• Interactive chat mode'));
            }
            else {
                console.log(chalk_1.default.red('❌ Not configured'));
                console.log(chalk_1.default.yellow('Run: codecontext ai setup'));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Error reading configuration'));
        }
    }
    /**
     * Handle interactive mode with enhanced chat window
     */
    async handleInteractiveMode(options) {
        await this.ensureInitialized();
        // Clear screen and show welcome
        console.clear();
        console.log(chalk_1.default.cyan('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.cyan('║') + chalk_1.default.bold.yellow('                🎮 CodeContext AI Chat Window                ') + chalk_1.default.cyan('║'));
        console.log(chalk_1.default.cyan('║') + chalk_1.default.gray('        AI Assistant with Memory + Execution Powers        ') + chalk_1.default.cyan('║'));
        console.log(chalk_1.default.cyan('╚══════════════════════════════════════════════════════════════╝'));
        console.log(chalk_1.default.gray('\nCommands: "exit" to quit | "switch" to change provider | "clear" to clear\n'));
        let messageCount = 0;
        while (true) {
            try {
                const { message } = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'message',
                        message: chalk_1.default.cyan('💬 You:'),
                        validate: (input) => input.trim().length > 0 || 'Please enter a message'
                    }
                ]);
                if (message.toLowerCase() === 'exit') {
                    console.log(chalk_1.default.green('\n👋 Chat session ended. All conversations saved to memory!'));
                    break;
                }
                if (message.toLowerCase() === 'clear') {
                    console.clear();
                    console.log(chalk_1.default.cyan('🧹 Chat cleared\n'));
                    continue;
                }
                if (message.toLowerCase() === 'switch') {
                    const { provider } = await inquirer_1.default.prompt([
                        {
                            type: 'list',
                            name: 'provider',
                            message: '🔄 Switch to which provider?',
                            choices: [
                                { name: '🧠 Claude (Anthropic) - Best for coding', value: 'claude' },
                                { name: '🎯 GPT (OpenAI) - Great for creative tasks', value: 'gpt' }
                            ]
                        }
                    ]);
                    await this.aiManager.switchProvider(provider);
                    console.log(chalk_1.default.green(`✅ Switched to ${provider.toUpperCase()}\n`));
                    continue;
                }
                messageCount++;
                console.log(chalk_1.default.gray(`\n─── Message ${messageCount} ───`));
                // Process message with enhanced capabilities awareness
                const projectContext = await this.getProjectContext();
                const request = {
                    message,
                    projectContext,
                    executionRequired: true,
                    memoryRetrieval: true
                };
                await this.handleSingleProvider(request, options.provider);
                console.log(); // Add spacing
            }
            catch (error) {
                console.error(chalk_1.default.red('❌ Error:'), error instanceof Error ? error.message : error);
            }
        }
    }
    /**
     * Ensure AI providers are initialized
     */
    async ensureInitialized() {
        const configPath = path.join(process.cwd(), '.codecontext', 'ai-config.json');
        if (!(await fs.pathExists(configPath))) {
            throw new Error('AI not configured. Run: codecontext ai setup');
        }
        const config = await fs.readJson(configPath);
        // Initialize memory engine
        await this.memoryEngine.initialize();
        await this.aiManager.initializeProviders(config);
    }
    /**
     * Get current project context
     */
    async getProjectContext() {
        try {
            const cwd = process.cwd();
            const packageJsonPath = path.join(cwd, 'package.json');
            if (await fs.pathExists(packageJsonPath)) {
                const packageJson = await fs.readJson(packageJsonPath);
                return {
                    projectId: path.basename(cwd),
                    workingDirectory: cwd,
                    techStack: this.inferTechStack(packageJson),
                    dependencies: packageJson.dependencies || {},
                    recentChanges: [] // TODO: Implement git integration
                };
            }
            return {
                projectId: path.basename(cwd),
                workingDirectory: cwd,
                techStack: [],
                dependencies: {},
                recentChanges: []
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get file context
     */
    async getFileContext(filePath) {
        try {
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf-8');
                return [`File: ${filePath}\n${content}`];
            }
            return [];
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Infer tech stack from package.json
     */
    inferTechStack(packageJson) {
        const techStack = [];
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps.react)
            techStack.push('React');
        if (deps.vue)
            techStack.push('Vue');
        if (deps.angular)
            techStack.push('Angular');
        if (deps.express)
            techStack.push('Express');
        if (deps.nestjs)
            techStack.push('NestJS');
        if (deps.typescript)
            techStack.push('TypeScript');
        if (deps.tailwindcss)
            techStack.push('Tailwind CSS');
        if (deps.next)
            techStack.push('Next.js');
        if (deps.nuxt)
            techStack.push('Nuxt.js');
        return techStack;
    }
}
exports.AICommand = AICommand;
exports.default = AICommand;
//# sourceMappingURL=ai.js.map