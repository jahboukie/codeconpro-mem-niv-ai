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
exports.statusCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const memoryEngine_1 = require("../services/memoryEngine");
const subscriptionManager_1 = require("../services/subscriptionManager");
async function statusCommand() {
    console.log(chalk_1.default.cyan('\n🔍 CodeContext Pro Status\n'));
    const currentDir = process.cwd();
    const configPath = path.join(currentDir, '.codecontext', 'config.json');
    // Check if initialized
    if (!fs.existsSync(configPath)) {
        console.log(chalk_1.default.red('❌ CodeContext Pro is not initialized in this project'));
        console.log(chalk_1.default.gray('   Run "codecontext-pro init --memory-only" to get started'));
        return;
    }
    try {
        // Load configuration
        const config = await fs.readJson(configPath);
        console.log(chalk_1.default.bold('📋 Project Information:'));
        console.log(`   Name: ${chalk_1.default.cyan(config.projectName)}`);
        console.log(`   ID: ${chalk_1.default.gray(config.projectId)}`);
        console.log(`   Mode: ${chalk_1.default.yellow(config.mode)}`);
        console.log(`   Created: ${chalk_1.default.gray(new Date(config.createdAt).toLocaleString())}`);
        console.log(chalk_1.default.bold('\n🎯 Features:'));
        console.log(`   Memory Engine: ${config.features.memory ? chalk_1.default.green('✅ Active') : chalk_1.default.red('❌ Inactive')}`);
        console.log(`   Execution Engine: ${config.features.execution ? chalk_1.default.green('✅ Active') : chalk_1.default.gray('⏳ Phase 2')}`);
        console.log(`   Intelligence Layer: ${config.features.intelligence ? chalk_1.default.green('✅ Active') : chalk_1.default.gray('⏳ Phase 3')}`);
        // Memory statistics
        if (config.features.memory) {
            console.log(chalk_1.default.bold('\n🧠 Memory Statistics:'));
            const memoryEngine = new memoryEngine_1.MemoryEngine(currentDir);
            await memoryEngine.initialize();
            const stats = await memoryEngine.getStatistics();
            console.log(`   Conversations: ${chalk_1.default.cyan(stats.conversationCount)}`);
            console.log(`   Messages: ${chalk_1.default.cyan(stats.messageCount)}`);
            console.log(`   Decisions: ${chalk_1.default.cyan(stats.decisionCount)}`);
            console.log(`   Files Tracked: ${chalk_1.default.cyan(stats.fileCount)}`);
            console.log(`   Last Activity: ${chalk_1.default.gray(stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never')}`);
            console.log(`   Database Size: ${chalk_1.default.gray(stats.databaseSize)}`);
        }
        // Subscription Status
        console.log(chalk_1.default.bold('\n💎 Subscription:'));
        try {
            const subscriptionManager = new subscriptionManager_1.SubscriptionManager(currentDir);
            await subscriptionManager.initialize();
            const subscription = subscriptionManager.getSubscriptionStatus();
            if (subscription) {
                const statusColor = subscription.status === 'active' ? chalk_1.default.green :
                    subscription.status === 'trial' ? chalk_1.default.yellow : chalk_1.default.red;
                console.log(`   Status: ${statusColor(subscription.status.toUpperCase())}`);
                if (subscription.status === 'trial') {
                    const daysRemaining = subscriptionManager.getTrialDaysRemaining();
                    console.log(`   Trial: ${chalk_1.default.yellow(`${daysRemaining} days remaining`)}`);
                }
                console.log(`   Tier: ${chalk_1.default.cyan(subscription.tier.toUpperCase())}`);
                console.log(`   Executions: ${chalk_1.default.cyan(`${subscription.usage.executionsThisMonth}/${subscription.limits.maxExecutionsPerMonth}`)} this month`);
                console.log(`   Files Tracked: ${chalk_1.default.cyan(`${subscription.usage.filesTracked}/${subscription.limits.maxFilesTracked}`)}`);
                console.log(`   Total Executions: ${chalk_1.default.gray(subscription.usage.totalExecutions)}`);
                if (subscription.status === 'trial' || subscription.status === 'expired') {
                    console.log(`   ${chalk_1.default.yellow('💎 Upgrade:')} codecontextpro.com`);
                }
            }
            else {
                console.log(`   ${chalk_1.default.red('❌ No subscription found')}`);
            }
        }
        catch (error) {
            console.log(`   ${chalk_1.default.red('❌ Failed to load subscription')}`);
        }
        // VS Code Extension Status
        console.log(chalk_1.default.bold('\n🔌 VS Code Integration:'));
        const extensionStatus = await checkVSCodeExtension();
        console.log(`   Extension: ${extensionStatus.installed ? chalk_1.default.green('✅ Installed') : chalk_1.default.red('❌ Not Installed')}`);
        if (extensionStatus.installed) {
            console.log(`   Version: ${chalk_1.default.gray(extensionStatus.version)}`);
            console.log(`   Status: ${extensionStatus.active ? chalk_1.default.green('✅ Active') : chalk_1.default.yellow('⏸️ Inactive')}`);
        }
        console.log(chalk_1.default.bold('\n📊 Health Check:'));
        const health = await performHealthCheck(currentDir);
        health.forEach(check => {
            const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
            const color = check.status === 'ok' ? chalk_1.default.green : check.status === 'warning' ? chalk_1.default.yellow : chalk_1.default.red;
            console.log(`   ${icon} ${check.name}: ${color(check.message)}`);
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to get status:'), error);
    }
}
exports.statusCommand = statusCommand;
async function checkVSCodeExtension() {
    // This would check if the VS Code extension is installed and active
    // For now, return mock data
    return {
        installed: true,
        version: '0.1.0',
        active: true,
    };
}
async function performHealthCheck(projectPath) {
    const checks = [];
    // Check configuration
    const configPath = path.join(projectPath, '.codecontext', 'config.json');
    if (fs.existsSync(configPath)) {
        checks.push({
            name: 'Configuration',
            status: 'ok',
            message: 'Valid configuration found',
        });
    }
    else {
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
    }
    else {
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
    }
    catch (error) {
        checks.push({
            name: 'Permissions',
            status: 'error',
            message: 'Insufficient permissions',
        });
    }
    return checks;
}
//# sourceMappingURL=status.js.map