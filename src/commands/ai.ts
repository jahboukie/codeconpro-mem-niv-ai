/**
 * AI Command - The Ultimate Developer Experience
 * Combines Claude/GPT with Memory + Execution = CURSOR KILLER
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import AIProviderManager, { EnhancedAIRequest } from '../services/aiProviderManager';
import { MemoryEngine } from '../services/memoryEngine';
import { ExecutionEngine } from '../services/mockExecutionEngine';
import * as fs from 'fs-extra';
import * as path from 'path';

export class AICommand {
  private aiManager: AIProviderManager;
  private memoryEngine: MemoryEngine;
  private executionEngine: ExecutionEngine;

  constructor() {
    this.memoryEngine = new MemoryEngine(process.cwd());
    this.executionEngine = new ExecutionEngine('./sandbox');
    this.aiManager = new AIProviderManager(this.memoryEngine, this.executionEngine);
  }

  /**
   * Register AI commands
   */
  register(program: Command): void {
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
  private async handleChat(message: string, options: any): Promise<void> {
    try {
      await this.ensureInitialized();

      // Get message if not provided
      if (!message) {
        const response = await inquirer.prompt([
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
      let codeContext: string[] = [];
      if (options.file) {
        codeContext = await this.getFileContext(options.file);
      }

      // Build request
      const request: EnhancedAIRequest = {
        message,
        projectContext,
        codeContext,
        executionRequired: options.execute,
        memoryRetrieval: true
      };

      console.log(chalk.cyan('🧠 CodeContext Pro - AI Assistant with Superpowers\n'));

      if (options.compare) {
        await this.handleCompareProviders(request);
      } else {
        await this.handleSingleProvider(request, options.provider);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
    }
  }

  /**
   * Handle single provider response
   */
  private async handleSingleProvider(request: EnhancedAIRequest, provider: string): Promise<void> {
    const spinner = ora(`🤖 ${provider.toUpperCase()} is thinking with full memory and execution...`).start();

    try {
      const response = await this.aiManager.enhancedChat(request);
      spinner.stop();

      // Display response
      console.log(chalk.green('🤖 AI Response:'));
      console.log(chalk.white(response.response));

      // Display code blocks
      if (response.code && response.code.length > 0) {
        console.log(chalk.yellow('\n💻 Generated Code:'));
        response.code.forEach((codeBlock, index) => {
          console.log(chalk.cyan(`\n📄 ${codeBlock.description} (${codeBlock.language}):`));
          console.log(chalk.gray('```' + codeBlock.language));
          console.log(codeBlock.code);
          console.log(chalk.gray('```'));
        });
      }

      // Display execution results
      if (response.executionResults && response.executionResults.length > 0) {
        console.log(chalk.magenta('\n🚀 Execution Results:'));
        response.executionResults.forEach((result, index) => {
          if (result.success) {
            console.log(chalk.green(`✅ Code block ${index + 1}: SUCCESS`));
            if (result.output) {
              console.log(chalk.gray('Output:'), result.output);
            }
          } else {
            console.log(chalk.red(`❌ Code block ${index + 1}: FAILED`));
            if (result.errors.length > 0) {
              console.log(chalk.red('Errors:'), result.errors.join(', '));
            }
          }
        });
      }

      // Display memory updates
      if (response.memoryUpdates && response.memoryUpdates.length > 0) {
        console.log(chalk.blue('\n🧠 Memory Updates:'));
        response.memoryUpdates.forEach(update => {
          console.log(chalk.blue(`📝 ${update.content}`));
        });
      }

      // Display confidence and reasoning
      console.log(chalk.gray(`\n📊 Confidence: ${(response.confidence * 100).toFixed(1)}%`));
      console.log(chalk.gray(`🎯 Reasoning: ${response.reasoning}`));

    } catch (error) {
      spinner.fail('Failed to get AI response');
      throw error;
    }
  }

  /**
   * Handle provider comparison
   */
  private async handleCompareProviders(request: EnhancedAIRequest): Promise<void> {
    const spinner = ora('🔄 Comparing Claude vs GPT responses...').start();

    try {
      const comparison = await this.aiManager.compareProviders(request);
      spinner.stop();

      console.log(chalk.yellow('\n🥊 AI PROVIDER COMPARISON\n'));

      if (comparison.claude) {
        console.log(chalk.green('🟢 CLAUDE RESPONSE:'));
        console.log(chalk.white(comparison.claude.response));
        console.log(chalk.gray(`Confidence: ${(comparison.claude.confidence * 100).toFixed(1)}%\n`));
      }

      if (comparison.gpt) {
        console.log(chalk.blue('🔵 GPT RESPONSE:'));
        console.log(chalk.white(comparison.gpt.response));
        console.log(chalk.gray(`Confidence: ${(comparison.gpt.confidence * 100).toFixed(1)}%\n`));
      }

      console.log(chalk.cyan(`🏆 RECOMMENDATION: ${comparison.recommendation.toUpperCase()}`));
      console.log(chalk.gray(`📊 ${comparison.reasoning}`));

    } catch (error) {
      spinner.fail('Failed to compare providers');
      throw error;
    }
  }

  /**
   * Handle setup command
   */
  private async handleSetup(): Promise<void> {
    console.log(chalk.cyan('🔧 Setting up AI providers...\n'));

    // First, ask which providers they want to set up
    const providerChoice = await inquirer.prompt([
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
        validate: (input: string) => input.trim().length > 0 || 'API key required'
      });
    }

    if (providerChoice.providers.includes('gpt')) {
      questions.push({
        type: 'input',
        name: 'openaiKey',
        message: '🤖 Enter your OpenAI API key (for GPT):',
        validate: (input: string) => input.trim().length > 0 || 'API key required'
      });
    }

    // Add default provider question
    questions.push({
      type: 'list',
      name: 'defaultProvider',
      message: '🎯 Choose default AI provider:',
      choices: providerChoice.providers.map((p: string) => ({
        name: p === 'claude' ? '🧠 Claude (Anthropic) - Best for coding' : '🎯 GPT (OpenAI) - Great for creative tasks',
        value: p
      })),
      default: providerChoice.providers[0]
    });

    const answers = await inquirer.prompt(questions);

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

    console.log(chalk.green('✅ AI providers configured successfully!'));
    console.log(chalk.yellow('🚀 You can now use: codecontext ai chat "your message"'));
  }

  /**
   * Handle switch provider command
   */
  private async handleSwitchProvider(provider: string): Promise<void> {
    if (!['claude', 'gpt'].includes(provider)) {
      throw new Error('Invalid provider. Use "claude" or "gpt"');
    }

    await this.ensureInitialized();
    await this.aiManager.switchProvider(provider as 'claude' | 'gpt');
    
    console.log(chalk.green(`✅ Switched to ${provider.toUpperCase()}`));
  }

  /**
   * Handle status command
   */
  private async handleStatus(): Promise<void> {
    console.log(chalk.cyan('📊 CodeContext Pro - AI Status\n'));

    try {
      // Try to load config
      const configPath = path.join(process.cwd(), '.codecontext', 'ai-config.json');
      
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        
        console.log(chalk.green('✅ Configuration found'));
        console.log(chalk.gray(`Default provider: ${config.defaultProvider}`));
        console.log(chalk.gray(`Claude: ${config.anthropicKey ? 'Configured' : 'Not configured'}`));
        console.log(chalk.gray(`GPT: ${config.openaiKey ? 'Configured' : 'Not configured'}`));
        
        console.log(chalk.yellow('\n🚀 Available Features:'));
        console.log(chalk.white('• Persistent memory across sessions'));
        console.log(chalk.white('• Code execution and verification'));
        console.log(chalk.white('• Multi-provider comparison'));
        console.log(chalk.white('• Project context awareness'));
        console.log(chalk.white('• Interactive chat mode'));
        
      } else {
        console.log(chalk.red('❌ Not configured'));
        console.log(chalk.yellow('Run: codecontext ai setup'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Error reading configuration'));
    }
  }

  /**
   * Handle interactive mode with enhanced chat window
   */
  private async handleInteractiveMode(options: any): Promise<void> {
    await this.ensureInitialized();
    
    // Clear screen and show welcome
    console.clear();
    console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.yellow('                🎮 CodeContext AI Chat Window                ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('        AI Assistant with Memory + Execution Powers        ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
    console.log(chalk.gray('\nCommands: "exit" to quit | "switch" to change provider | "clear" to clear\n'));

    let messageCount = 0;

    while (true) {
      try {
        const { message } = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: chalk.cyan('💬 You:'),
            validate: (input) => input.trim().length > 0 || 'Please enter a message'
          }
        ]);

        if (message.toLowerCase() === 'exit') {
          console.log(chalk.green('\n👋 Chat session ended. All conversations saved to memory!'));
          break;
        }

        if (message.toLowerCase() === 'clear') {
          console.clear();
          console.log(chalk.cyan('🧹 Chat cleared\n'));
          continue;
        }

        if (message.toLowerCase() === 'switch') {
          const { provider } = await inquirer.prompt([
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
          console.log(chalk.green(`✅ Switched to ${provider.toUpperCase()}\n`));
          continue;
        }

        messageCount++;
        console.log(chalk.gray(`\n─── Message ${messageCount} ───`));

        // Process message with enhanced capabilities awareness
        const projectContext = await this.getProjectContext();
        const request: EnhancedAIRequest = {
          message,
          projectContext,
          executionRequired: true,
          memoryRetrieval: true
        };

        await this.handleSingleProvider(request, options.provider);
        console.log(); // Add spacing

      } catch (error) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      }
    }
  }

  /**
   * Ensure AI providers are initialized
   */
  private async ensureInitialized(): Promise<void> {
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
  private async getProjectContext(): Promise<any> {
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Get file context
   */
  private async getFileContext(filePath: string): Promise<string[]> {
    try {
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8');
        return [`File: ${filePath}\n${content}`];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Infer tech stack from package.json
   */
  private inferTechStack(packageJson: any): string[] {
    const techStack: string[] = [];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.react) techStack.push('React');
    if (deps.vue) techStack.push('Vue');
    if (deps.angular) techStack.push('Angular');
    if (deps.express) techStack.push('Express');
    if (deps.nestjs) techStack.push('NestJS');
    if (deps.typescript) techStack.push('TypeScript');
    if (deps.tailwindcss) techStack.push('Tailwind CSS');
    if (deps.next) techStack.push('Next.js');
    if (deps.nuxt) techStack.push('Nuxt.js');

    return techStack;
  }
}

export default AICommand;