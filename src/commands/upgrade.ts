import chalk from 'chalk';
import open from 'open';

export async function upgradeCommand() {
  console.log(chalk.cyan('\n💎 CodeContext Pro Upgrade\n'));
  
  console.log(chalk.bold('🚀 Transform Your AI Assistant with Lifetime Pro!'));
  console.log(chalk.gray('   Go from goldfish memory to elephant intelligence\n'));
  
  console.log(chalk.yellow('🆓 Free Tier Limitations:'));
  console.log(chalk.gray('   • 25 executions/month'));
  console.log(chalk.gray('   • 25 files tracked'));
  console.log(chalk.gray('   • 7-day memory retention\n'));
  
  console.log(chalk.green('💎 Lifetime Pro Benefits:'));
  console.log(chalk.green('   • 700 executions/month'));
  console.log(chalk.green('   • 1,000 files tracked'));
  console.log(chalk.green('   • Unlimited memory retention'));
  console.log(chalk.green('   • Advanced pattern recognition'));
  console.log(chalk.green('   • Priority support\n'));
  
  console.log(chalk.bold.red('🔥 LIMITED TIME OFFER:'));
  console.log(chalk.red('   $99 Lifetime Access (First 1,000 users only)'));
  console.log(chalk.gray('   Regular price: $199/month starting February 2025\n'));
  
  console.log(chalk.cyan('💰 Value Calculation:'));
  console.log(chalk.gray('   Lifetime: $99 one-time'));
  console.log(chalk.gray('   Monthly: $199 × 12 = $2,388/year'));
  console.log(chalk.green('   You save: $2,289 in first year alone!\n'));
  
  console.log(chalk.yellow('🎯 Why AI Assistants Love CodeContext Pro:'));
  console.log(chalk.gray('   "I went from forgetting everything to having persistent'));
  console.log(chalk.gray('    memory and code execution superpowers. This tool'));
  console.log(chalk.gray('    transformed me from goldfish to elephant!"'));
  console.log(chalk.gray('    - Every AI Assistant using CodeContext Pro\n'));
  
  console.log(chalk.bold('🚀 Opening upgrade page...'));
  
  // Open the Stripe checkout page
  const upgradeUrl = 'https://codecontextpro.com/upgrade';
  
  try {
    await open(upgradeUrl);
    console.log(chalk.green('✅ Upgrade page opened in your browser'));
    console.log(chalk.gray('   Complete your purchase to unlock unlimited superpowers!'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not open browser automatically'));
    console.log(chalk.cyan(`   Please visit: ${upgradeUrl}`));
  }
  
  console.log(chalk.gray('\n   Questions? Email: support@codecontextpro.com'));
}
