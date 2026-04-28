import { Command } from 'commander';
import pc from 'picocolors';
import open from 'open';
import { loginWithToken, logout, getAuthStatus } from '../lib/github/auth.js';
import { askConfirm } from '../lib/ui/prompts.js';
import { createSpinner, spinnerSucceed, spinnerFail } from '../lib/ui/spinner.js';
import password from '@inquirer/password';

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
          console.log('');
          console.log(pc.bold('  GitHub Authentication'));
          console.log(pc.dim('  ─────────────────────'));
          console.log('');
          console.log(`  You'll need a ${pc.cyan('Personal Access Token')} with these scopes:`);
          console.log(`    ${pc.green('✓')} repo   ${pc.dim('(full control of repositories)')}`);
          console.log(`    ${pc.green('✓')} read:org ${pc.dim('(read org membership)')}`);
          console.log('');

          const openBrowser = await askConfirm('Open GitHub token page in browser?', true);
          if (openBrowser) {
            await open('https://github.com/settings/tokens/new?description=autopr-cli&scopes=repo,read:org');
            console.log(pc.dim('  Opening browser...'));
          }

          console.log('');
          token = await password({
            message: 'Paste your token:',
            mask: '*',
          });
        }

        if (!token || token.trim().length === 0) {
          console.log(pc.red('  No token provided. Aborting.'));
          process.exit(1);
        }

        const spinner = createSpinner('Verifying token...');

        try {
          const { username } = await loginWithToken(token.trim());
          spinnerSucceed(spinner, pc.green(`Authenticated as ${pc.bold(username)}`));
          console.log('');
          console.log(pc.dim('  You can now use autopr commands: cm, cr, review, watch'));
        } catch {
          spinnerFail(spinner, pc.red('Invalid token or network error'));
          console.log('');
          console.log(pc.dim('  Make sure your token has the "repo" and "read:org" scopes.'));
          console.log(pc.dim('  Create one at: https://github.com/settings/tokens/new'));
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
        const status = getAuthStatus();
        if (!status.authenticated) {
          console.log(pc.yellow('Not currently authenticated.'));
          return;
        }

        console.log(`  Currently logged in as ${pc.bold(status.username)}`);
        console.log('');

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
        console.log(`  Username: ${pc.bold(status.username)}`);
        console.log(`  Hostname: ${status.hostname}`);
      } else {
        console.log(pc.red('✗ Not authenticated'));
        console.log(pc.gray('Run `autopr auth login` to authenticate'));
      }
    });
}
