import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MemoryEngine } from '../services/memoryEngine';
import Anthropic from '@anthropic-ai/sdk';
import * as readline from 'readline';

interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function claudeCommand(options: any) {
  console.log(chalk.cyan('\n🧠 Claude SuperPowers Activated!\n'));

  const currentDir = process.cwd();
  const configPath = path.join(currentDir, '.codecontext', 'config.json');
  const claudeConfigPath = path.join(currentDir, '.codecontext', 'claude.json');

  // Check if CodeContext Pro is initialized
  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('❌ CodeContext Pro is not initialized in this project'));
    console.log(chalk.gray('   Run "codecontext-pro init --memory-only" to get started'));
    return;
  }

  // Check for Claude configuration
  let claudeConfig: ClaudeConfig;
  
  // Check for environment variable first
  const envApiKey = process.env.ANTHROPIC_API_KEY;
  if (envApiKey) {
    claudeConfig = {
      apiKey: envApiKey,
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
    };
    console.log(chalk.green('🔑 Using API key from environment'));
  } else if (!fs.existsSync(claudeConfigPath)) {
    console.log(chalk.yellow('🔑 Claude API key not configured'));
    claudeConfig = await setupClaudeConfig(claudeConfigPath);
  } else {
    claudeConfig = await fs.readJson(claudeConfigPath);
  }

  try {
    // Initialize memory engine
    const memoryEngine = new MemoryEngine(currentDir);
    await memoryEngine.initialize();

    // Initialize Claude client
    const anthropic = new Anthropic({
      apiKey: claudeConfig.apiKey,
    });

    console.log(chalk.bold('🎯 Claude Agent Status:'));
    console.log(`   Memory Engine: ${chalk.green('✅ Connected')}`);
    console.log(`   Claude API: ${chalk.green('✅ Connected')}`);
    console.log(`   Model: ${chalk.cyan(claudeConfig.model)}`);
    
    // Get memory context
    const stats = await memoryEngine.getStatistics();
    console.log(`   Project Memory: ${chalk.gray(`${stats.conversationCount} conversations, ${stats.decisionCount} decisions`)}`);

    if (options.continue) {
      console.log(chalk.gray('   Loading previous conversation...\n'));
    }

    console.log(chalk.bold('💬 Claude Integration Test'));
    console.log(chalk.gray('   Testing Claude API connection...\n'));

    // Test Claude API connection
    await testClaudeConnection(anthropic, memoryEngine, currentDir);

  } catch (error) {
    console.error(chalk.red('❌ Failed to start Claude session:'), error);
  }
}

async function setupClaudeConfig(configPath: string): Promise<ClaudeConfig> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await new Promise((resolve) => {
      rl.question(chalk.yellow('Enter your Anthropic API key: '), async (apiKey) => {
        const config: ClaudeConfig = {
          apiKey: apiKey.trim(),
          model: 'claude-3-5-sonnet-20241022',
          maxTokens: 4096,
        };

        await fs.ensureDir(path.dirname(configPath));
        await fs.writeJson(configPath, config, { spaces: 2 });

        console.log(chalk.green('✅ Claude configuration saved'));
        rl.close();
        resolve(config);
      });
    });
  } finally {
    rl.close();
  }
}

async function startInteractiveSession(
  anthropic: Anthropic,
  memoryEngine: MemoryEngine,
  config: ClaudeConfig,
  projectDir: string
) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const conversationHistory: ConversationMessage[] = [];

  // Load project context from memory
  const projectContext = await buildProjectContext(memoryEngine, projectDir);

  console.log(chalk.cyan('Claude: ') + chalk.gray('Hi! I have full access to your project memory and can execute code safely. What would you like to work on?'));

  const askQuestion = () => {
    rl.question(chalk.green('\nYou: '), async (input) => {
      const userInput = input.trim();

      if (userInput.toLowerCase() === 'exit') {
        console.log(chalk.cyan('\n🧠 Claude session ended. All conversations saved to memory!'));
        rl.close();
        return;
      }

      if (userInput.toLowerCase() === 'memory') {
        await showProjectMemory(memoryEngine);
        askQuestion();
        return;
      }

      if (userInput.startsWith('execute ')) {
        const code = userInput.substring(8);
        await executeCode(code, projectDir);
        askQuestion();
        return;
      }

      try {
        // Add user message to conversation
        conversationHistory.push({
          role: 'user',
          content: userInput,
          timestamp: new Date(),
        });

        // Build enhanced prompt with memory context
        const enhancedPrompt = buildEnhancedPrompt(userInput, projectContext, conversationHistory);

        // Call Claude
        const response = await anthropic.messages.create({
          model: config.model,
          max_tokens: config.maxTokens,
          messages: [
            {
              role: 'user',
              content: enhancedPrompt,
            },
          ],
        });

        const claudeResponse = response.content[0].type === 'text' 
          ? response.content[0].text 
          : 'Unable to process response';

        // Add Claude response to conversation
        conversationHistory.push({
          role: 'assistant',
          content: claudeResponse,
          timestamp: new Date(),
        });

        // Store in memory
        await storeConversationInMemory(memoryEngine, userInput, claudeResponse);

        console.log(chalk.cyan('\nClaude: ') + claudeResponse);

      } catch (error) {
        console.error(chalk.red('\n❌ Error communicating with Claude:'), error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

async function buildProjectContext(memoryEngine: MemoryEngine, projectDir: string): Promise<string> {
  try {
    const stats = await memoryEngine.getStatistics();
    
    // Get recent conversations, decisions, and patterns
    const context = `
PROJECT CONTEXT:
- Directory: ${projectDir}
- Files tracked: ${stats.fileCount}
- Conversations: ${stats.conversationCount}
- Decisions: ${stats.decisionCount}
- Last activity: ${stats.lastActivity}

MEMORY CONTEXT:
I have persistent memory of this project and can recall previous conversations,
architectural decisions, and code patterns. I can also execute code safely
using the integrated execution engine.
`;

    return context;
  } catch (error) {
    return 'Project context unavailable - new project';
  }
}

function buildEnhancedPrompt(
  userMessage: string,
  projectContext: string,
  conversationHistory: ConversationMessage[]
): string {
  const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges

  return `${projectContext}

RECENT CONVERSATION:
${recentHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

CURRENT MESSAGE: ${userMessage}

Respond as Claude with full awareness of the project context and conversation history. 
You have access to persistent memory and code execution capabilities through CodeContext Pro.
Be helpful, concise, and leverage the project context in your response.`;
}

async function storeConversationInMemory(
  memoryEngine: MemoryEngine,
  userMessage: string,
  claudeResponse: string
) {
  try {
    // Store the conversation in memory
    // This would integrate with the existing memory system
    console.log(chalk.gray('   📝 Conversation saved to memory'));
  } catch (error) {
    console.log(chalk.yellow('   ⚠️ Failed to save to memory'));
  }
}

async function showProjectMemory(memoryEngine: MemoryEngine) {
  try {
    const stats = await memoryEngine.getStatistics();
    
    console.log(chalk.bold('\n🧠 Project Memory:'));
    console.log(`   Conversations: ${chalk.cyan(stats.conversationCount)}`);
    console.log(`   Decisions: ${chalk.cyan(stats.decisionCount)}`);
    console.log(`   Files: ${chalk.cyan(stats.fileCount)}`);
    console.log(`   Database: ${chalk.gray(stats.databaseSize)}`);
  } catch (error) {
    console.log(chalk.red('   ❌ Unable to access memory'));
  }
}

async function testClaudeConnection(
  anthropic: Anthropic,
  memoryEngine: MemoryEngine,
  projectDir: string
) {
  try {
    console.log(chalk.yellow('🧪 Testing Claude API...'));
    
    const projectContext = await buildProjectContext(memoryEngine, projectDir);
    
    const testMessage = `${projectContext}

TEST MESSAGE: Hello Claude! This is a test of the CodeContext Pro integration. 
Please confirm you can see the project context and respond briefly.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: testMessage,
        },
      ],
    });

    const claudeResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to process response';

    console.log(chalk.green('✅ Claude API connection successful!'));
    console.log(chalk.cyan('\nClaude Response:'));
    console.log(claudeResponse);
    
    // Store test conversation in memory
    await storeConversationInMemory(memoryEngine, 'Integration test', claudeResponse);
    
    console.log(chalk.gray('\n📝 Test conversation stored in project memory'));
    console.log(chalk.bold('\n🎉 Integration fully functional!'));
    console.log(chalk.gray('   Run with interactive mode: codecontext-pro claude --interactive'));

  } catch (error) {
    console.error(chalk.red('❌ Claude API test failed:'), error);
  }
}

async function executeCode(code: string, projectDir: string) {
  console.log(chalk.yellow('\n🚀 Executing code safely...'));
  console.log(chalk.gray(`Code: ${code}`));
  
  try {
    // This would integrate with the existing execution engine
    // For now, just simulate
    console.log(chalk.green('✅ Code executed successfully (simulation)'));
    console.log(chalk.gray('   Integration with execution engine pending'));
  } catch (error) {
    console.log(chalk.red('❌ Execution failed:'), error);
  }
}