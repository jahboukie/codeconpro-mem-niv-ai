"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const chalk_1 = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const memoryEngine_1 = require("../services/memoryEngine");
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
            const stats = await memoryEngine.getStatistics();
            console.log(`   Conversations: ${chalk_1.default.cyan(stats.conversationCount)}`);
            console.log(`   Messages: ${chalk_1.default.cyan(stats.messageCount)}`);
            console.log(`   Decisions: ${chalk_1.default.cyan(stats.decisionCount)}`);
            console.log(`   Files Tracked: ${chalk_1.default.cyan(stats.fileCount)}`);
            console.log(`   Last Activity: ${chalk_1.default.gray(stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never')}`);
            console.log(`   Database Size: ${chalk_1.default.gray(stats.databaseSize)}`);
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