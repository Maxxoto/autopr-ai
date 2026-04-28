import { Command } from 'commander';
import pc from 'picocolors';
import { loginWithToken, logout, getAuthStatus } from '../lib/github/auth.js';
import { askInput, askConfirm } from '../lib/ui/prompts.js';
import { createSpinner, spinnerSucceed, spinnerFail } from '../lib/ui/spinner.js';

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage GitHub authentication');

  auth
    .command('login')
    .description('Authenticate with GitHub using a Personal Access Token')
    .option('--token <token>', 'Personal Access Token (non-interactive mode)')
    .action(async (options: { token?: string }) => {
      try {
        let token = options.token;

        if (!token) {
          console.log(pc.cyan('Enter your GitHub Personal Access Token'));
          console.log(pc.gray('(Create one at https://github.com/settings/tokens)'));
          token = await askInput('Token:', '');
        }

        const spinner = createSpinner('Verifying token...');

        try {
          const { username } = await loginWithToken(token);
          spinnerSucceed(spinner, pc.green(`Authenticated as ${username}`));
        } catch {
          spinnerFail(spinner, pc.red('Invalid token or network error'));
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(pc.red(`Error: ${message}`));
        process.exit(1);
      }
    });

  auth
    .command('logout')
    .description('Remove stored GitHub credentials')
    .action(async () => {
      try {
        const confirmed = await askConfirm('Are you sure you want to logout?');
        if (!confirmed) {
          console.log(pc.gray('Logout cancelled'));
          return;
        }

        logout();
        console.log(pc.green('Logged out successfully'));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(pc.red(`Error: ${message}`));
        process.exit(1);
      }
    });

  auth
    .command('status')
    .description('Show current authentication status')
    .action(() => {
      const status = getAuthStatus();

      if (status.authenticated) {
        console.log(pc.green('✓ Authenticated'));
        console.log(`  Username: ${status.username}`);
        console.log(`  Hostname: ${status.hostname}`);
      } else {
        console.log(pc.red('✗ Not authenticated'));
        console.log(pc.gray('Run `autopr auth login` to authenticate'));
      }
    });
}
