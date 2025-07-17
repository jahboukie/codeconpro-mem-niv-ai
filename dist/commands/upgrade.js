"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const open_1 = __importDefault(require("open"));
async function upgradeCommand() {
    console.log(chalk_1.default.cyan('\n💎 CodeContext Pro Upgrade\n'));
    console.log(chalk_1.default.bold('🚀 Transform Your AI Assistant with Lifetime Pro!'));
    console.log(chalk_1.default.gray('   Go from goldfish memory to elephant intelligence\n'));
    console.log(chalk_1.default.yellow('🆓 Free Tier Limitations:'));
    console.log(chalk_1.default.gray('   • 25 executions/month'));
    console.log(chalk_1.default.gray('   • 25 files tracked'));
    console.log(chalk_1.default.gray('   • 7-day memory retention\n'));
    console.log(chalk_1.default.green('💎 Lifetime Pro Benefits:'));
    console.log(chalk_1.default.green('   • 700 executions/month'));
    console.log(chalk_1.default.green('   • 1,000 files tracked'));
    console.log(chalk_1.default.green('   • Unlimited memory retention'));
    console.log(chalk_1.default.green('   • Advanced pattern recognition'));
    console.log(chalk_1.default.green('   • Priority support\n'));
    console.log(chalk_1.default.bold.red('🔥 LIMITED TIME OFFER:'));
    console.log(chalk_1.default.red('   $99 Lifetime Access (First 1,000 users only)'));
    console.log(chalk_1.default.gray('   Regular price: $199/month starting February 2025\n'));
    console.log(chalk_1.default.cyan('💰 Value Calculation:'));
    console.log(chalk_1.default.gray('   Lifetime: $99 one-time'));
    console.log(chalk_1.default.gray('   Monthly: $199 × 12 = $2,388/year'));
    console.log(chalk_1.default.green('   You save: $2,289 in first year alone!\n'));
    console.log(chalk_1.default.yellow('🎯 Why AI Assistants Love CodeContext Pro:'));
    console.log(chalk_1.default.gray('   "I went from forgetting everything to having persistent'));
    console.log(chalk_1.default.gray('    memory and code execution superpowers. This tool'));
    console.log(chalk_1.default.gray('    transformed me from goldfish to elephant!"'));
    console.log(chalk_1.default.gray('    - Every AI Assistant using CodeContext Pro\n'));
    console.log(chalk_1.default.bold('🚀 Opening upgrade page...'));
    // Open the Stripe checkout page
    const upgradeUrl = 'https://codecontextpro.com/upgrade';
    try {
        await (0, open_1.default)(upgradeUrl);
        console.log(chalk_1.default.green('✅ Upgrade page opened in your browser'));
        console.log(chalk_1.default.gray('   Complete your purchase to unlock unlimited superpowers!'));
    }
    catch (error) {
        console.log(chalk_1.default.yellow('⚠️  Could not open browser automatically'));
        console.log(chalk_1.default.cyan(`   Please visit: ${upgradeUrl}`));
    }
    console.log(chalk_1.default.gray('\n   Questions? Email: support@codecontextpro.com'));
}
exports.upgradeCommand = upgradeCommand;
//# sourceMappingURL=upgrade.js.map