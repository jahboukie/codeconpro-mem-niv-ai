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
exports.logoutCommand = exports.loginCommand = void 0;
const inquirer = __importStar(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const apiClient_1 = require("../services/apiClient");
async function loginCommand() {
    console.log(chalk_1.default.blue('🔐 CodeContext Pro Login'));
    console.log(chalk_1.default.gray('Authenticate with your API key to access cognitive upgrades.\n'));
    try {
        // Check if already logged in
        if (apiClient_1.apiClient.isAuthenticated()) {
            const credentials = apiClient_1.apiClient.getCredentials();
            console.log(chalk_1.default.green(`✅ Already logged in as: ${credentials?.email}`));
            const { continueLogin } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'continueLogin',
                    message: 'Do you want to login with a different account?',
                    default: false,
                },
            ]);
            if (!continueLogin) {
                return;
            }
        }
        console.log(chalk_1.default.yellow('📋 To get your API key:'));
        console.log(chalk_1.default.gray('1. Go to https://codecontextpro.com'));
        console.log(chalk_1.default.gray('2. Sign in with Google'));
        console.log(chalk_1.default.gray('3. Go to your Dashboard'));
        console.log(chalk_1.default.gray('4. Copy your API key\n'));
        const { apiKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: 'Enter your API key:',
                mask: '*',
                validate: (input) => {
                    if (!input || input.trim().length === 0) {
                        return 'API key is required';
                    }
                    if (!input.startsWith('ccp_')) {
                        return 'Invalid API key format. API keys should start with "ccp_"';
                    }
                    return true;
                },
            },
        ]);
        console.log(chalk_1.default.blue('🔄 Validating API key...'));
        // Attempt login
        const userInfo = await apiClient_1.apiClient.login(apiKey.trim());
        console.log(chalk_1.default.green('✅ Login successful!'));
        console.log(chalk_1.default.gray(`Welcome back, ${userInfo.displayName || userInfo.email}!`));
        console.log(chalk_1.default.gray(`Subscription: ${userInfo.subscriptionTier.toUpperCase()}`));
        console.log(chalk_1.default.gray(`Status: ${userInfo.subscriptionStatus.toUpperCase()}`));
        if (userInfo.subscriptionStatus === 'active') {
            console.log(chalk_1.default.gray(`Executions: ${userInfo.usage.executions.used}/${userInfo.usage.executions.limit}`));
            console.log(chalk_1.default.gray(`Files tracked: ${userInfo.usage.files.tracked}/${userInfo.usage.files.limit}`));
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  Your subscription is not active. Please activate it to use executions.'));
        }
        console.log(chalk_1.default.blue('\n🚀 You can now use CodeContext Pro commands!'));
        console.log(chalk_1.default.gray('Try: codecontext status'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Login failed:'), error.message);
        if (error.message.includes('Invalid API key')) {
            console.log(chalk_1.default.yellow('\n💡 Make sure you copied the complete API key from your dashboard.'));
        }
        process.exit(1);
    }
}
exports.loginCommand = loginCommand;
async function logoutCommand() {
    console.log(chalk_1.default.blue('🚪 CodeContext Pro Logout'));
    try {
        if (!apiClient_1.apiClient.isAuthenticated()) {
            console.log(chalk_1.default.yellow('⚠️  You are not currently logged in.'));
            return;
        }
        const credentials = apiClient_1.apiClient.getCredentials();
        const { confirmLogout } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmLogout',
                message: `Are you sure you want to logout from ${credentials?.email}?`,
                default: false,
            },
        ]);
        if (!confirmLogout) {
            console.log(chalk_1.default.gray('Logout cancelled.'));
            return;
        }
        apiClient_1.apiClient.logout();
        console.log(chalk_1.default.green('✅ Logged out successfully!'));
        console.log(chalk_1.default.gray('Your API key has been removed from this machine.'));
        console.log(chalk_1.default.gray('Run "codecontext login" to authenticate again.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Logout failed:'), error.message);
        process.exit(1);
    }
}
exports.logoutCommand = logoutCommand;
//# sourceMappingURL=login.js.map