import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MemoryEngine } from '../services/memoryEngine';

interface MemoryOptions {
  show?: boolean;
  clear?: boolean;
  export?: string;
}

export async function memoryCommand(options: MemoryOptions) {
  const currentDir = process.cwd();
  const configPath = path.join(currentDir, '.codecontext', 'config.json');

  // Check if initialized
  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('❌ CodeContext Pro is not initialized in this project'));
    return;
  }

  const memoryEngine = new MemoryEngine(currentDir);
  await memoryEngine.initialize();

  try {
    if (options.show) {
      await showMemorySummary(memoryEngine);
    } else if (options.clear) {
      await clearMemory(memoryEngine);
    } else if (options.export) {
      await exportMemory(memoryEngine, options.export);
    } else {
      // Interactive mode
      await interactiveMemoryMode(memoryEngine);
    }
  } catch (error) {
    console.error(chalk.red('❌ Memory operation failed:'), error);
  }
}

async function showMemorySummary(memoryEngine: MemoryEngine) {
  console.log(chalk.cyan('\n🧠 Project Memory Summary\n'));

  const memory = await memoryEngine.getProjectMemory();
  
  console.log(chalk.bold('📊 Overview:'));
  console.log(`   Project: ${chalk.cyan(memory.name)}`);
  console.log(`   Created: ${chalk.gray(memory.createdAt.toLocaleString())}`);
  console.log(`   Last Active: ${chalk.gray(memory.lastActive.toLocaleString())}`);

  console.log(chalk.bold('\n💬 Recent Conversations:'));
  const recentConversations = memory.conversations.slice(-5);
  if (recentConversations.length === 0) {
    console.log(chalk.gray('   No conversations recorded yet'));
  } else {
    recentConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${chalk.cyan(conv.aiAssistant)} - ${chalk.gray(conv.timestamp.toLocaleString())}`);
      console.log(`      ${chalk.gray(conv.messages.length)} messages`);
    });
  }

  console.log(chalk.bold('\n🏗️ Architectural Decisions:'));
  if (memory.decisions.length === 0) {
    console.log(chalk.gray('   No architectural decisions recorded yet'));
  } else {
    memory.decisions.slice(-3).forEach((decision, index) => {
      console.log(`   ${index + 1}. ${chalk.yellow(decision.decision)}`);
      console.log(`      ${chalk.gray(decision.rationale)}`);
      console.log(`      ${chalk.gray(decision.timestamp.toLocaleString())}`);
    });
  }

  console.log(chalk.bold('\n📁 File Activity:'));
  const recentFiles = memory.fileHistory.slice(-10);
  if (recentFiles.length === 0) {
    console.log(chalk.gray('   No file changes tracked yet'));
  } else {
    recentFiles.forEach((file, index) => {
      const icon = file.changeType === 'created' ? '➕' : file.changeType === 'modified' ? '✏️' : '❌';
      console.log(`   ${icon} ${chalk.cyan(file.filePath)} - ${chalk.gray(file.timestamp.toLocaleString())}`);
    });
  }
}

async function clearMemory(memoryEngine: MemoryEngine) {
  console.log(chalk.yellow('\n⚠️  Clear Project Memory\n'));
  console.log(chalk.red('This will permanently delete all stored conversations, decisions, and file history.'));
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to clear all memory?',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('Memory clear cancelled.'));
    return;
  }

  const { doubleConfirm } = await inquirer.prompt([
    {
      type: 'input',
      name: 'doubleConfirm',
      message: 'Type "CLEAR MEMORY" to confirm:',
      validate: (input) => input === 'CLEAR MEMORY' || 'Please type "CLEAR MEMORY" exactly',
    },
  ]);

  if (doubleConfirm === 'CLEAR MEMORY') {
    await memoryEngine.clearAllMemory();
    console.log(chalk.green('✅ Memory cleared successfully'));
  } else {
    console.log(chalk.gray('Memory clear cancelled.'));
  }
}

async function exportMemory(memoryEngine: MemoryEngine, exportPath: string) {
  console.log(chalk.cyan(`\n📤 Exporting memory to ${exportPath}...\n`));

  const memory = await memoryEngine.getProjectMemory();
  const exportData = {
    exportedAt: new Date().toISOString(),
    project: {
      name: memory.name,
      id: memory.id,
      createdAt: memory.createdAt,
    },
    conversations: memory.conversations,
    decisions: memory.decisions,
    fileHistory: memory.fileHistory,
    patterns: memory.patterns,
    preferences: memory.preferences,
  };

  await fs.writeJson(exportPath, exportData, { spaces: 2 });
  console.log(chalk.green(`✅ Memory exported to ${exportPath}`));
}

async function interactiveMemoryMode(memoryEngine: MemoryEngine) {
  console.log(chalk.cyan('\n🧠 Interactive Memory Mode\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '📊 Show memory summary', value: 'show' },
        { name: '🔍 Search conversations', value: 'search' },
        { name: '📝 Add architectural decision', value: 'decision' },
        { name: '📤 Export memory', value: 'export' },
        { name: '🗑️  Clear memory', value: 'clear' },
        { name: '❌ Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'show':
      await showMemorySummary(memoryEngine);
      break;
    case 'search':
      await searchConversations(memoryEngine);
      break;
    case 'decision':
      await addArchitecturalDecision(memoryEngine);
      break;
    case 'export':
      const { exportPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'exportPath',
          message: 'Export file path:',
          default: 'memory-export.json',
        },
      ]);
      await exportMemory(memoryEngine, exportPath);
      break;
    case 'clear':
      await clearMemory(memoryEngine);
      break;
    case 'exit':
      console.log(chalk.gray('Goodbye!'));
      break;
  }
}

async function searchConversations(memoryEngine: MemoryEngine) {
  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: 'Search conversations:',
    },
  ]);

  const results = await memoryEngine.searchConversations(query);
  
  if (results.length === 0) {
    console.log(chalk.gray('No conversations found matching your query.'));
  } else {
    console.log(chalk.cyan(`\n🔍 Found ${results.length} conversation(s):\n`));
    results.forEach((conv, index) => {
      console.log(`${index + 1}. ${chalk.cyan(conv.aiAssistant)} - ${chalk.gray(conv.timestamp.toLocaleString())}`);
      console.log(`   ${chalk.gray(conv.messages.length)} messages`);
    });
  }
}

async function addArchitecturalDecision(memoryEngine: MemoryEngine) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'decision',
      message: 'Decision made:',
    },
    {
      type: 'input',
      name: 'rationale',
      message: 'Rationale:',
    },
    {
      type: 'input',
      name: 'alternatives',
      message: 'Alternatives considered (comma-separated):',
    },
  ]);

  await memoryEngine.recordArchitecturalDecision({
    decision: answers.decision,
    rationale: answers.rationale,
    alternatives: answers.alternatives.split(',').map((alt: string) => alt.trim()),
    impact: [],
    filesAffected: [],
  });

  console.log(chalk.green('✅ Architectural decision recorded'));
}
