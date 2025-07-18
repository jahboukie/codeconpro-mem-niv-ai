#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { memoryCommand } from './commands/memory';
import { createExecuteCommand } from './commands/execute';
import { upgradeCommand } from './commands/upgrade';
import { loginCommand, logoutCommand } from './commands/login';
import { claudeCommand } from './commands/claude';
import { AICommand } from './commands/ai';

const program = new Command();

program
  .name('codecontext')
  .description('🧠 CodeContext AI - AI assistant with persistent memory and execution superpowers')
  .version('1.0.0');

// ASCII Art Banner
const banner = `
${chalk.cyan('╔══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                    ${chalk.bold.yellow('🧠 CodeContext AI')}                     ${chalk.cyan('║')}
${chalk.cyan('║')}           ${chalk.gray('AI Assistant with Persistent Memory')}            ${chalk.cyan('║')}
${chalk.cyan('║')}              ${chalk.green('Claude + Memory + Execution')}               ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════════════════════╝')}
`;

program.addHelpText('beforeAll', banner);

// Authentication Commands
program
  .command('login')
  .description('🔐 Login with your API key')
  .action(loginCommand);

program
  .command('logout')
  .description('🚪 Logout and remove credentials')
  .action(logoutCommand);

// Project Commands
program
  .command('init')
  .description('Initialize CodeContext Pro in current project')
  .option('--memory-only', 'Initialize with memory engine only (Phase 1)')
  .option('--execution', 'Initialize with memory + execution engine (Phase 2)')
  .option('--force', 'Force initialization even if already exists')
  .action(initCommand);

program
  .command('status')
  .description('Show current project memory status')
  .action(statusCommand);

program
  .command('memory')
  .description('Memory management commands')
  .option('--show', 'Show project memory summary')
  .option('--clear', 'Clear project memory (use with caution)')
  .option('--export <file>', 'Export memory to file')
  .action(memoryCommand);

program.addCommand(createExecuteCommand());

program
  .command('claude')
  .description('🤖 Start interactive Claude session with persistent memory')
  .option('--continue', 'Continue previous Claude conversation')
  .option('--model <model>', 'Specify Claude model (default: claude-3-5-sonnet-20241022)')
  .action(claudeCommand);

program
  .command('upgrade')
  .description('Upgrade to Lifetime Pro - unlimited executions and memory')
  .action(upgradeCommand);

// AI Integration Commands (THE CURSOR KILLER!)
const aiCommand = new AICommand();
aiCommand.register(program);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
