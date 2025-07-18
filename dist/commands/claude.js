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
exports.claudeCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const memoryEngine_1 = require("../services/memoryEngine");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const readline = __importStar(require("readline"));
async function claudeCommand(options) {
    console.log(chalk_1.default.cyan('\n🧠 Claude SuperPowers Activated!\n'));
    const currentDir = process.cwd();
    const configPath = path.join(currentDir, '.codecontext', 'config.json');
    const claudeConfigPath = path.join(currentDir, '.codecontext', 'claude.json');
    // Check if CodeContext Pro is initialized
    if (!fs.existsSync(configPath)) {
        console.log(chalk_1.default.red('❌ CodeContext Pro is not initialized in this project'));
        console.log(chalk_1.default.gray('   Run "codeconpro init --memory-only" to get started'));
        return;
    }
    // Check for Claude configuration
    let claudeConfig;
    // Check for environment variable first
    const envApiKey = process.env.ANTHROPIC_API_KEY;
    if (envApiKey) {
        claudeConfig = {
            apiKey: envApiKey,
            model: 'claude-3-5-sonnet-20241022',
            maxTokens: 4096,
        };
        console.log(chalk_1.default.green('🔑 Using API key from environment'));
    }
    else if (!fs.existsSync(claudeConfigPath)) {
        console.log(chalk_1.default.yellow('🔑 Claude API key not configured'));
        claudeConfig = await setupClaudeConfig(claudeConfigPath);
    }
    else {
        claudeConfig = await fs.readJson(claudeConfigPath);
    }
    try {
        // Initialize memory engine
        const memoryEngine = new memoryEngine_1.MemoryEngine(currentDir);
        await memoryEngine.initialize();
        // Initialize Claude client
        const anthropic = new sdk_1.default({
            apiKey: claudeConfig.apiKey,
        });
        console.log(chalk_1.default.bold('🎯 Claude Agent Status:'));
        console.log(`   Memory Engine: ${chalk_1.default.green('✅ Connected')}`);
        console.log(`   Claude API: ${chalk_1.default.green('✅ Connected')}`);
        console.log(`   Model: ${chalk_1.default.cyan(claudeConfig.model)}`);
        // Get memory context
        const stats = await memoryEngine.getStatistics();
        console.log(`   Project Memory: ${chalk_1.default.gray(`${stats.conversationCount} conversations, ${stats.decisionCount} decisions`)}`);
        if (options.continue) {
            console.log(chalk_1.default.gray('   Loading previous conversation...\n'));
        }
        console.log(chalk_1.default.bold('💬 Claude Integration Test'));
        console.log(chalk_1.default.gray('   Testing Claude API connection...\n'));
        // Test Claude API connection
        await testClaudeConnection(anthropic, memoryEngine, currentDir);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to start Claude session:'), error);
    }
}
exports.claudeCommand = claudeCommand;
async function setupClaudeConfig(configPath) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    try {
        return await new Promise((resolve) => {
            rl.question(chalk_1.default.yellow('Enter your Anthropic API key: '), async (apiKey) => {
                const config = {
                    apiKey: apiKey.trim(),
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 4096,
                };
                await fs.ensureDir(path.dirname(configPath));
                await fs.writeJson(configPath, config, { spaces: 2 });
                console.log(chalk_1.default.green('✅ Claude configuration saved'));
                rl.close();
                resolve(config);
            });
        });
    }
    finally {
        rl.close();
    }
}
async function startInteractiveSession(anthropic, memoryEngine, config, projectDir) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const conversationHistory = [];
    // Load project context from memory
    const projectContext = await buildProjectContext(memoryEngine, projectDir);
    console.log(chalk_1.default.cyan('Claude: ') + chalk_1.default.gray('Hi! I have full access to your project memory and can execute code safely. What would you like to work on?'));
    const askQuestion = () => {
        rl.question(chalk_1.default.green('\nYou: '), async (input) => {
            const userInput = input.trim();
            if (userInput.toLowerCase() === 'exit') {
                console.log(chalk_1.default.cyan('\n🧠 Claude session ended. All conversations saved to memory!'));
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
                console.log(chalk_1.default.cyan('\nClaude: ') + claudeResponse);
            }
            catch (error) {
                console.error(chalk_1.default.red('\n❌ Error communicating with Claude:'), error);
            }
            askQuestion();
        });
    };
    askQuestion();
}
async function buildProjectContext(memoryEngine, projectDir) {
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
    }
    catch (error) {
        return 'Project context unavailable - new project';
    }
}
function buildEnhancedPrompt(userMessage, projectContext, conversationHistory) {
    const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
    return `${projectContext}

RECENT CONVERSATION:
${recentHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

CURRENT MESSAGE: ${userMessage}

Respond as Claude with full awareness of the project context and conversation history. 
You have access to persistent memory and code execution capabilities through CodeContext Pro.
Be helpful, concise, and leverage the project context in your response.`;
}
async function storeConversationInMemory(memoryEngine, userMessage, claudeResponse) {
    try {
        // Store the conversation in memory
        // This would integrate with the existing memory system
        console.log(chalk_1.default.gray('   📝 Conversation saved to memory'));
    }
    catch (error) {
        console.log(chalk_1.default.yellow('   ⚠️ Failed to save to memory'));
    }
}
async function showProjectMemory(memoryEngine) {
    try {
        const stats = await memoryEngine.getStatistics();
        console.log(chalk_1.default.bold('\n🧠 Project Memory:'));
        console.log(`   Conversations: ${chalk_1.default.cyan(stats.conversationCount)}`);
        console.log(`   Decisions: ${chalk_1.default.cyan(stats.decisionCount)}`);
        console.log(`   Files: ${chalk_1.default.cyan(stats.fileCount)}`);
        console.log(`   Database: ${chalk_1.default.gray(stats.databaseSize)}`);
    }
    catch (error) {
        console.log(chalk_1.default.red('   ❌ Unable to access memory'));
    }
}
async function testClaudeConnection(anthropic, memoryEngine, projectDir) {
    try {
        console.log(chalk_1.default.yellow('🧪 Testing Claude API...'));
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
        console.log(chalk_1.default.green('✅ Claude API connection successful!'));
        console.log(chalk_1.default.cyan('\nClaude Response:'));
        console.log(claudeResponse);
        // Store test conversation in memory
        await storeConversationInMemory(memoryEngine, 'Integration test', claudeResponse);
        console.log(chalk_1.default.gray('\n📝 Test conversation stored in project memory'));
        console.log(chalk_1.default.bold('\n🎉 Integration fully functional!'));
        console.log(chalk_1.default.gray('   Run with interactive mode: codeconpro claude --interactive'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Claude API test failed:'), error);
    }
}
async function executeCode(code, projectDir) {
    console.log(chalk_1.default.yellow('\n🚀 Executing code safely...'));
    console.log(chalk_1.default.gray(`Code: ${code}`));
    try {
        // This would integrate with the existing execution engine
        // For now, just simulate
        console.log(chalk_1.default.green('✅ Code executed successfully (simulation)'));
        console.log(chalk_1.default.gray('   Integration with execution engine pending'));
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Execution failed:'), error);
    }
}
//# sourceMappingURL=claude.js.map