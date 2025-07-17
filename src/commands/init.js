"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const chalk_1 = require("chalk");
const ora_1 = require("ora");
const inquirer_1 = require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const memoryEngine_1 = require("../services/memoryEngine");
const vscodeManager_1 = require("../services/vscodeManager");
async function initCommand(options) {
    console.log(chalk_1.default.cyan('\n🧠 Initializing CodeContext Pro...\n'));
    const currentDir = process.cwd();
    const projectName = path.basename(currentDir);
    // Check if already initialized
    const configPath = path.join(currentDir, '.codecontext');
    if (fs.existsSync(configPath) && !options.force) {
        console.log(chalk_1.default.yellow('⚠️  CodeContext Pro is already initialized in this project.'));
        console.log(chalk_1.default.gray('   Use --force to reinitialize.'));
        return;
    }
    // Confirm initialization
    if (!options.force) {
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Initialize CodeContext Pro in "${chalk_1.default.cyan(projectName)}"?`,
                default: true,
            },
        ]);
        if (!confirm) {
            console.log(chalk_1.default.gray('Initialization cancelled.'));
            return;
        }
    }
    try {
        // Phase 1: Memory-Only Mode
        if (options.memoryOnly) {
            await initializeMemoryOnly(currentDir, projectName);
        }
        else {
            // Default to memory-only for now (Phase 1)
            console.log(chalk_1.default.yellow('ℹ️  Currently only --memory-only mode is available (Phase 1)'));
            await initializeMemoryOnly(currentDir, projectName);
        }
        console.log(chalk_1.default.green('\n✅ CodeContext Pro initialized successfully!'));
        console.log(chalk_1.default.cyan('\n🎯 Next steps:'));
        console.log(chalk_1.default.gray('   1. Open VS Code in this project'));
        console.log(chalk_1.default.gray('   2. The CodeContext Pro extension will activate automatically'));
        console.log(chalk_1.default.gray('   3. Start coding - your AI assistant will now remember everything!'));
        console.log(chalk_1.default.gray('\n   Run "codecontext-pro status" to check memory status'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Initialization failed:'), error);
        process.exit(1);
    }
}
exports.initCommand = initCommand;
async function initializeMemoryOnly(projectPath, projectName) {
    const spinner = (0, ora_1.default)('Setting up memory engine...').start();
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
        const memoryEngine = new memoryEngine_1.MemoryEngine(projectPath);
        await memoryEngine.initialize();
        spinner.succeed('Memory database initialized');
        // 3. Set up VS Code extension
        spinner.start('Setting up VS Code extension...');
        const vscodeManager = new vscodeManager_1.VSCodeExtensionManager();
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
        }
        else {
            await fs.writeFile(gitignorePath, gitignoreEntry);
        }
    }
    catch (error) {
        spinner.fail('Memory initialization failed');
        throw error;
    }
}
function generateProjectId(projectPath) {
    // Create a deterministic project ID based on path
    const crypto = require('crypto');
    return crypto.createHash('md5').update(projectPath).digest('hex').substring(0, 16);
}
//# sourceMappingURL=init.js.map