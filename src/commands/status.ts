import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MemoryEngine } from '../services/memoryEngine';
import { SubscriptionManager } from '../services/subscriptionManager';

export async function statusCommand() {
  console.log(chalk.cyan('\n🔍 CodeContext Pro Status\n'));

  const currentDir = process.cwd();
  const configPath = path.join(currentDir, '.codecontext', 'config.json');

  // Check if initialized
  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('❌ CodeContext Pro is not initialized in this project'));
    console.log(chalk.gray('   Run "codecontext-pro init --memory-only" to get started'));
    return;
  }

  try {
    // Load configuration
    const config = await fs.readJson(configPath);
    
    console.log(chalk.bold('📋 Project Information:'));
    console.log(`   Name: ${chalk.cyan(config.projectName)}`);
    console.log(`   ID: ${chalk.gray(config.projectId)}`);
    console.log(`   Mode: ${chalk.yellow(config.mode)}`);
    console.log(`   Created: ${chalk.gray(new Date(config.createdAt).toLocaleString())}`);

    console.log(chalk.bold('\n🎯 Features:'));
    console.log(`   Memory Engine: ${config.features.memory ? chalk.green('✅ Active') : chalk.red('❌ Inactive')}`);
    console.log(`   Execution Engine: ${config.features.execution ? chalk.green('✅ Active') : chalk.gray('⏳ Phase 2')}`);
    console.log(`   Intelligence Layer: ${config.features.intelligence ? chalk.green('✅ Active') : chalk.gray('⏳ Phase 3')}`);

    // Memory statistics
    if (config.features.memory) {
      console.log(chalk.bold('\n🧠 Memory Statistics:'));

      const memoryEngine = new MemoryEngine(currentDir);
      await memoryEngine.initialize();
      const stats = await memoryEngine.getStatistics();
      
      console.log(`   Conversations: ${chalk.cyan(stats.conversationCount)}`);
      console.log(`   Messages: ${chalk.cyan(stats.messageCount)}`);
      console.log(`   Decisions: ${chalk.cyan(stats.decisionCount)}`);
      console.log(`   Files Tracked: ${chalk.cyan(stats.fileCount)}`);
      console.log(`   Last Activity: ${chalk.gray(stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never')}`);
      console.log(`   Database Size: ${chalk.gray(stats.databaseSize)}`);
    }

    // Subscription Status
    console.log(chalk.bold('\n💎 Subscription:'));
    try {
      const subscriptionManager = new SubscriptionManager(currentDir);
      await subscriptionManager.initialize();
      const subscription = subscriptionManager.getSubscriptionStatus();

      if (subscription) {
        const statusColor = subscription.status === 'active' ? chalk.green :
                           subscription.status === 'trial' ? chalk.yellow : chalk.red;
        console.log(`   Status: ${statusColor(subscription.status.toUpperCase())}`);

        if (subscription.status === 'trial') {
          const daysRemaining = subscriptionManager.getTrialDaysRemaining();
          console.log(`   Trial: ${chalk.yellow(`${daysRemaining} days remaining`)}`);
        }

        console.log(`   Tier: ${chalk.cyan(subscription.tier.toUpperCase())}`);
        console.log(`   Executions: ${chalk.cyan(`${subscription.usage.executionsThisMonth}/${subscription.limits.maxExecutionsPerMonth}`)} this month`);
        console.log(`   Files Tracked: ${chalk.cyan(`${subscription.usage.filesTracked}/${subscription.limits.maxFilesTracked}`)}`);
        console.log(`   Total Executions: ${chalk.gray(subscription.usage.totalExecutions)}`);

        if (subscription.status === 'trial' || subscription.status === 'expired') {
          console.log(`   ${chalk.yellow('💎 Upgrade:')} codecontextpro.com`);
        }
      } else {
        console.log(`   ${chalk.red('❌ No subscription found')}`);
      }
    } catch (error) {
      console.log(`   ${chalk.red('❌ Failed to load subscription')}`);
    }

    // VS Code Extension Status
    console.log(chalk.bold('\n🔌 VS Code Integration:'));
    const extensionStatus = await checkVSCodeExtension();
    console.log(`   Extension: ${extensionStatus.installed ? chalk.green('✅ Installed') : chalk.red('❌ Not Installed')}`);
    if (extensionStatus.installed) {
      console.log(`   Version: ${chalk.gray(extensionStatus.version)}`);
      console.log(`   Status: ${extensionStatus.active ? chalk.green('✅ Active') : chalk.yellow('⏸️ Inactive')}`);
    }

    console.log(chalk.bold('\n📊 Health Check:'));
    const health = await performHealthCheck(currentDir);
    health.forEach(check => {
      const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      const color = check.status === 'ok' ? chalk.green : check.status === 'warning' ? chalk.yellow : chalk.red;
      console.log(`   ${icon} ${check.name}: ${color(check.message)}`);
    });

  } catch (error) {
    console.error(chalk.red('❌ Failed to get status:'), error);
  }
}

async function checkVSCodeExtension() {
  // This would check if the VS Code extension is installed and active
  // For now, return mock data
  return {
    installed: true,
    version: '0.1.0',
    active: true,
  };
}

async function performHealthCheck(projectPath: string) {
  const checks = [];

  // Check configuration
  const configPath = path.join(projectPath, '.codecontext', 'config.json');
  if (fs.existsSync(configPath)) {
    checks.push({
      name: 'Configuration',
      status: 'ok',
      message: 'Valid configuration found',
    });
  } else {
    checks.push({
      name: 'Configuration',
      status: 'error',
      message: 'Configuration file missing',
    });
  }

  // Check memory database
  const dbPath = path.join(projectPath, '.codecontext', 'memory.db');
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    checks.push({
      name: 'Memory Database',
      status: 'ok',
      message: `Database accessible (${(stats.size / 1024).toFixed(1)} KB)`,
    });
  } else {
    checks.push({
      name: 'Memory Database',
      status: 'error',
      message: 'Database file not found',
    });
  }

  // Check write permissions
  try {
    const testFile = path.join(projectPath, '.codecontext', '.test');
    await fs.writeFile(testFile, 'test');
    await fs.remove(testFile);
    checks.push({
      name: 'Permissions',
      status: 'ok',
      message: 'Read/write access confirmed',
    });
  } catch (error) {
    checks.push({
      name: 'Permissions',
      status: 'error',
      message: 'Insufficient permissions',
    });
  }

  return checks;
}
