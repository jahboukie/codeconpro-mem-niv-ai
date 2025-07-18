#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const init_1 = require("./commands/init");
const status_1 = require("./commands/status");
const memory_1 = require("./commands/memory");
const execute_1 = require("./commands/execute");
const upgrade_1 = require("./commands/upgrade");
const login_1 = require("./commands/login");
const claude_1 = require("./commands/claude");
const ai_1 = require("./commands/ai");
const program = new commander_1.Command();
program
    .name('codecontext')
    .description('🧠 CodeContext AI - AI assistant with persistent memory and execution superpowers')
    .version('1.2.0');
// ASCII Art Banner
const banner = `
${chalk_1.default.cyan('╔══════════════════════════════════════════════════════════════╗')}
${chalk_1.default.cyan('║')}                    ${chalk_1.default.bold.yellow('🧠 CodeContext AI')}                     ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('║')}           ${chalk_1.default.gray('AI Assistant with Persistent Memory')}            ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('║')}              ${chalk_1.default.green('Claude + Memory + Execution')}               ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('╚══════════════════════════════════════════════════════════════╝')}
`;
program.addHelpText('beforeAll', banner);
// Authentication Commands
program
    .command('login')
    .description('🔐 Login with your API key')
    .action(login_1.loginCommand);
program
    .command('logout')
    .description('🚪 Logout and remove credentials')
    .action(login_1.logoutCommand);
// Project Commands
program
    .command('init')
    .description('Initialize CodeContext Pro in current project')
    .option('--memory-only', 'Initialize with memory engine only (Phase 1)')
    .option('--execution', 'Initialize with memory + execution engine (Phase 2)')
    .option('--force', 'Force initialization even if already exists')
    .action(init_1.initCommand);
program
    .command('status')
    .description('Show current project memory status')
    .action(status_1.statusCommand);
program
    .command('memory')
    .description('Memory management commands')
    .option('--show', 'Show project memory summary')
    .option('--clear', 'Clear project memory (use with caution)')
    .option('--export <file>', 'Export memory to file')
    .action(memory_1.memoryCommand);
program.addCommand((0, execute_1.createExecuteCommand)());
program
    .command('claude')
    .description('🤖 Start interactive Claude session with persistent memory')
    .option('--continue', 'Continue previous Claude conversation')
    .option('--model <model>', 'Specify Claude model (default: claude-3-5-sonnet-20241022)')
    .action(claude_1.claudeCommand);
program
    .command('upgrade')
    .description('Upgrade to Lifetime Pro - unlimited executions and memory')
    .action(upgrade_1.upgradeCommand);
// AI Integration Commands (THE CURSOR KILLER!)
const aiCommand = new ai_1.AICommand();
aiCommand.register(program);
// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('❌ Unhandled Rejection at:'), promise, chalk_1.default.red('reason:'), reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error(chalk_1.default.red('❌ Uncaught Exception:'), error);
    process.exit(1);
});
// Parse command line arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map