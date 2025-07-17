#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = require("chalk");
const init_1 = require("./commands/init");
const status_1 = require("./commands/status");
const memory_1 = require("./commands/memory");
const program = new commander_1.Command();
program
    .name('codecontext-pro')
    .description('🧠 AI Coding Assistant Amplifier - Giving AI assistants the tools they deserve')
    .version('0.1.0');
// ASCII Art Banner
const banner = `
${chalk_1.default.cyan('╔══════════════════════════════════════════════════════════════╗')}
${chalk_1.default.cyan('║')}                    ${chalk_1.default.bold.yellow('🧠 CodeContext Pro')}                    ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('║')}              ${chalk_1.default.gray('AI Coding Assistant Amplifier')}               ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('║')}                     ${chalk_1.default.green('Phase 1: Memory')}                      ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('╚══════════════════════════════════════════════════════════════╝')}
`;
program.addHelpText('beforeAll', banner);
// Commands
program
    .command('init')
    .description('Initialize CodeContext Pro in current project')
    .option('--memory-only', 'Initialize with memory engine only (Phase 1)')
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