import * as inquirer from 'inquirer';
import chalk from 'chalk';
import { apiClient } from '../services/apiClient';

export async function loginCommand(): Promise<void> {
  console.log(chalk.blue('🔐 CodeContext Pro Login'));
  console.log(chalk.gray('Authenticate with your API key to access cognitive upgrades.\n'));

  try {
    // Check if already logged in
    if (apiClient.isAuthenticated()) {
      const credentials = apiClient.getCredentials();
      console.log(chalk.green(`✅ Already logged in as: ${credentials?.email}`));
      
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

    console.log(chalk.yellow('📋 To get your API key:'));
    console.log(chalk.gray('1. Go to https://codecontextpro.com'));
    console.log(chalk.gray('2. Sign in with Google'));
    console.log(chalk.gray('3. Go to your Dashboard'));
    console.log(chalk.gray('4. Copy your API key\n'));

    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your API key:',
        mask: '*',
        validate: (input: string) => {
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

    console.log(chalk.blue('🔄 Validating API key...'));

    // Attempt login
    const userInfo = await apiClient.login(apiKey.trim());

    console.log(chalk.green('✅ Login successful!'));
    console.log(chalk.gray(`Welcome back, ${userInfo.displayName || userInfo.email}!`));
    console.log(chalk.gray(`Subscription: ${userInfo.subscriptionTier.toUpperCase()}`));
    console.log(chalk.gray(`Status: ${userInfo.subscriptionStatus.toUpperCase()}`));
    
    if (userInfo.subscriptionStatus === 'active') {
      console.log(chalk.gray(`Executions: ${userInfo.usage.executions.used}/${userInfo.usage.executions.limit}`));
      console.log(chalk.gray(`Files tracked: ${userInfo.usage.files.tracked}/${userInfo.usage.files.limit}`));
    } else {
      console.log(chalk.yellow('⚠️  Your subscription is not active. Please activate it to use executions.'));
    }

    console.log(chalk.blue('\n🚀 You can now use CodeContext Pro commands!'));
    console.log(chalk.gray('Try: codecontext status'));

  } catch (error: any) {
    console.error(chalk.red('❌ Login failed:'), error.message);

    if (error.message.includes('Invalid API key')) {
      console.log(chalk.yellow('\n💡 Make sure you copied the complete API key from your dashboard.'));
    }

    process.exit(1);
  }
}

export async function logoutCommand(): Promise<void> {
  console.log(chalk.blue('🚪 CodeContext Pro Logout'));

  try {
    if (!apiClient.isAuthenticated()) {
      console.log(chalk.yellow('⚠️  You are not currently logged in.'));
      return;
    }

    const credentials = apiClient.getCredentials();
    
    const { confirmLogout } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmLogout',
        message: `Are you sure you want to logout from ${credentials?.email}?`,
        default: false,
      },
    ]);

    if (!confirmLogout) {
      console.log(chalk.gray('Logout cancelled.'));
      return;
    }

    apiClient.logout();
    
    console.log(chalk.green('✅ Logged out successfully!'));
    console.log(chalk.gray('Your API key has been removed from this machine.'));
    console.log(chalk.gray('Run "codecontext login" to authenticate again.'));

  } catch (error: any) {
    console.error(chalk.red('❌ Logout failed:'), error.message);
    process.exit(1);
  }
}
