import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MemoryEngine } from '../services/memoryEngine';
import { VSCodeExtensionManager } from '../services/vscodeManager';

interface InitOptions {
  memoryOnly?: boolean;
  execution?: boolean;
  force?: boolean;
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.cyan('\n🧠 Initializing CodeContext Pro...\n'));

  const currentDir = process.cwd();
  const projectName = path.basename(currentDir);

  // Check if already initialized
  const configPath = path.join(currentDir, '.codecontext');
  if (fs.existsSync(configPath) && !options.force) {
    console.log(chalk.yellow('⚠️  CodeContext Pro is already initialized in this project.'));
    console.log(chalk.gray('   Use --force to reinitialize.'));
    return;
  }

  // Confirm initialization
  if (!options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Initialize CodeContext Pro in "${chalk.cyan(projectName)}"?`,
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.gray('Initialization cancelled.'));
      return;
    }
  }

  try {
    // Phase 1: Memory-Only Mode
    if (options.memoryOnly) {
      await initializeMemoryOnly(currentDir, projectName);
    } else if (options.execution) {
      // Phase 2: Memory + Execution Mode
      await initializeWithExecution(currentDir, projectName);
    } else {
      // Default to memory + execution (Phase 2)
      console.log(chalk.cyan('🚀 Initializing with Memory + Execution Engine (Phase 2)'));
      await initializeWithExecution(currentDir, projectName);
    }

    console.log(chalk.green('\n✅ CodeContext Pro initialized successfully!'));
    console.log(chalk.cyan('\n🎯 Next steps:'));
    console.log(chalk.gray('   1. Open VS Code in this project'));
    console.log(chalk.gray('   2. The CodeContext Pro extension will activate automatically'));
    console.log(chalk.gray('   3. Start coding - your AI assistant will now remember everything!'));
    console.log(chalk.gray('\n   Run "codecontext-pro status" to check memory status'));

  } catch (error) {
    console.error(chalk.red('\n❌ Initialization failed:'), error);
    process.exit(1);
  }
}

async function initializeWithExecution(projectPath: string, projectName: string) {
  const spinner = ora('Setting up Memory + Execution Engine...').start();

  try {
    // 1. Create project configuration
    spinner.text = 'Creating project configuration...';
    const configDir = path.join(projectPath, '.codecontext');
    await fs.ensureDir(configDir);

    const config = {
      version: '0.2.0',
      mode: 'memory-execution',
      projectId: generateProjectId(projectPath),
      projectName,
      createdAt: new Date().toISOString(),
      features: {
        memory: true,
        execution: true,
        intelligence: false,
      },
      executionEngine: {
        port: 3001,
        sandboxDir: path.join(configDir, 'sandbox'),
        supportedLanguages: ['javascript', 'typescript', 'python', 'go', 'rust']
      }
    };

    await fs.writeJson(path.join(configDir, 'config.json'), config, { spaces: 2 });
    spinner.succeed('Project configuration created');

    // 2. Initialize memory database
    spinner.start('Initializing memory database...');
    const memoryEngine = new MemoryEngine(projectPath);
    await memoryEngine.initialize();
    spinner.succeed('Memory database initialized');

    // 3. Set up execution engine
    spinner.start('Setting up execution engine...');
    await setupExecutionEngine(projectPath, configDir);
    spinner.succeed('Execution engine configured');

    // 4. Set up VS Code extension
    spinner.start('Setting up VS Code extension...');
    const vscodeManager = new VSCodeExtensionManager();
    await vscodeManager.ensureExtensionInstalled();
    await vscodeManager.configureForProject(projectPath);
    spinner.succeed('VS Code extension configured');

    // 5. Create initial project scan
    spinner.start('Scanning project structure...');
    await memoryEngine.performInitialScan();
    spinner.succeed('Initial project scan completed');

    // 6. Create .gitignore entry
    const gitignorePath = path.join(projectPath, '.gitignore');
    const gitignoreEntry = '\n# CodeContext Pro\n.codecontext/memory.db\n.codecontext/logs/\n.codecontext/sandbox/\n';

    if (await fs.pathExists(gitignorePath)) {
      const content = await fs.readFile(gitignorePath, 'utf8');
      if (!content.includes('.codecontext')) {
        await fs.appendFile(gitignorePath, gitignoreEntry);
      }
    } else {
      await fs.writeFile(gitignorePath, gitignoreEntry);
    }

  } catch (error) {
    spinner.fail('Memory + Execution initialization failed');
    throw error;
  }
}

async function initializeMemoryOnly(projectPath: string, projectName: string) {
  const spinner = ora('Setting up memory engine...').start();

  try {
    // 1. Create project configuration
    spinner.text = 'Creating project configuration...';
    const configDir = path.join(projectPath, '.codecontext');
    await fs.ensureDir(configDir);

    const config = {
      version: '0.1.0',
      mode: 'memory-only',
      projectId: generateProjectId(projectPath),
      projectName,
      createdAt: new Date().toISOString(),
      features: {
        memory: true,
        execution: false,
        intelligence: false,
      },
    };

    await fs.writeJson(path.join(configDir, 'config.json'), config, { spaces: 2 });
    spinner.succeed('Project configuration created');

    // 2. Initialize memory database
    spinner.start('Initializing memory database...');
    const memoryEngine = new MemoryEngine(projectPath);
    await memoryEngine.initialize();
    spinner.succeed('Memory database initialized');

    // 3. Set up VS Code extension
    spinner.start('Setting up VS Code extension...');
    const vscodeManager = new VSCodeExtensionManager();
    await vscodeManager.ensureExtensionInstalled();
    await vscodeManager.configureForProject(projectPath);
    spinner.succeed('VS Code extension configured');

    // 4. Create initial project scan
    spinner.start('Scanning project structure...');
    await memoryEngine.performInitialScan();
    spinner.succeed('Initial project scan completed');

    // 5. Create .gitignore entry
    const gitignorePath = path.join(projectPath, '.gitignore');
    const gitignoreEntry = '\n# CodeContext Pro\n.codecontext/memory.db\n.codecontext/logs/\n';
    
    if (await fs.pathExists(gitignorePath)) {
      const content = await fs.readFile(gitignorePath, 'utf8');
      if (!content.includes('.codecontext')) {
        await fs.appendFile(gitignorePath, gitignoreEntry);
      }
    } else {
      await fs.writeFile(gitignorePath, gitignoreEntry);
    }

  } catch (error) {
    spinner.fail('Memory initialization failed');
    throw error;
  }
}

async function setupExecutionEngine(projectPath: string, configDir: string): Promise<void> {
  // Create sandbox directory
  const sandboxDir = path.join(configDir, 'sandbox');
  await fs.ensureDir(sandboxDir);

  // Create execution engine startup script
  const startupScript = `#!/usr/bin/env node
const { app } = require('../../execution-engine/dist/index.js');
const path = require('path');

// Set project path for memory integration
process.env.PROJECT_PATH = '${projectPath}';
process.env.SANDBOX_DIR = '${sandboxDir}';

console.log('🚀 Starting CodeContext Pro Execution Engine...');
console.log('📁 Project:', '${projectPath}');
console.log('🏗️  Sandbox:', '${sandboxDir}');
`;

  await fs.writeFile(path.join(configDir, 'start-execution-engine.js'), startupScript);

  // Create Docker setup if Docker is available
  try {
    const { execSync } = require('child_process');
    execSync('docker --version', { stdio: 'ignore' });

    // Create Dockerfile for execution environments
    const dockerfile = `# Multi-stage Dockerfile for CodeContext Pro execution environments
FROM node:18-alpine as node-env
RUN npm install -g typescript ts-node

FROM python:3.11-alpine as python-env
RUN pip install --no-cache-dir pytest requests numpy

FROM golang:1.20-alpine as go-env
RUN apk add --no-cache git

FROM rust:1.70-alpine as rust-env
RUN apk add --no-cache musl-dev

# Final execution environment
FROM alpine:latest
RUN apk add --no-cache nodejs npm python3 py3-pip go rust cargo
WORKDIR /workspace
CMD ["sh"]
`;

    await fs.writeFile(path.join(configDir, 'Dockerfile'), dockerfile);

  } catch (error) {
    console.warn('Docker not available - execution will use local environment');
  }
}

function generateProjectId(projectPath: string): string {
  // Create a deterministic project ID based on path
  const crypto = require('crypto');
  return crypto.createHash('md5').update(projectPath).digest('hex').substring(0, 16);
}
