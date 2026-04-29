import { Command } from 'commander';
import pc from 'picocolors';
import open from 'open';
import password from '@inquirer/password';
import { select, confirm } from '@inquirer/prompts';
import { loginWithToken, getAuthStatus } from '../lib/github/auth.js';
import { setGitHubToken, setGitHubUser, setAIConfig, isConfigured } from '../lib/config/store.js';
import { createSpinner, spinnerSucceed, spinnerFail } from '../lib/ui/spinner.js';
import { PROVIDER_DEFAULTS, type AIProvider } from '../types/index.js';

function maskApiKey(key: string): string {
  if (key.length < 8) return '***';
  return `${key.slice(0, 3)}...${key.slice(-4)}`;
}

export function registerOnboardCommand(program: Command): void {
  program
    .command('onboard')
    .description('Guided first-time setup: GitHub auth + AI provider')
    .action(async () => {
      try {
        // ── Step 1: Welcome banner ──
        console.log('');
        console.log(pc.bold('  Welcome to autopr! Let\'s get you set up.'));
        console.log(pc.dim('  ════════════════════════════════════════'));
        console.log('');

        // ── Step 2: GitHub Authentication ──
        const authStatus = getAuthStatus();

        if (authStatus.authenticated && authStatus.username) {
          console.log(pc.green(`  ✔ Already authenticated as ${pc.bold(authStatus.username)}`));
          console.log('');
        } else {
          console.log(pc.bold('  GitHub Authentication'));
          console.log(pc.dim('  ─────────────────────'));
          console.log('');
          console.log(`  You'll need a ${pc.cyan('Personal Access Token')} with these scopes:`);
          console.log(`    ${pc.green('✓')} repo   ${pc.dim('(full control of repositories)')}`);
          console.log(`    ${pc.green('✓')} read:org ${pc.dim('(read org membership)')}`);
          console.log('');

          const openBrowser = await confirm({
            message: 'Open GitHub token page in browser?',
            default: true,
          });

          if (openBrowser) {
            await open('https://github.com/settings/tokens/new?description=autopr-cli&scopes=repo,read:org');
            console.log(pc.dim('  Opening browser...'));
          }

          console.log('');
          const token = await password({
            message: 'Paste your token:',
            mask: '*',
          });

          if (!token || token.trim().length === 0) {
            console.log(pc.red('  No token provided. Aborting.'));
            process.exit(1);
          }

          const spinner = createSpinner('Verifying token...');

          try {
            const { username } = await loginWithToken(token.trim());
            spinnerSucceed(spinner, pc.green(`Authenticated as ${pc.bold(username)}`));
          } catch {
            spinnerFail(spinner, pc.red('Invalid token or network error'));
            console.log('');
            console.log(pc.dim('  Make sure your token has the "repo" and "read:org" scopes.'));
            console.log(pc.dim('  Create one at: https://github.com/settings/tokens/new'));
            process.exit(1);
          }

          console.log('');
        }

        // ── Step 3: AI Provider Setup ──
        const { isAIConfigured } = await import('../lib/config/store.js');

        if (isAIConfigured()) {
          console.log(pc.green('  ✔ AI provider already configured'));
          console.log('');
        } else {
          console.log(pc.bold('  AI Provider Setup'));
          console.log(pc.dim('  ──────────────────'));
          console.log('');

          console.log(pc.dim(`  ${pc.yellow('💡 Tip:')} Groq offers a free tier — great for getting started!`));
          console.log('');

          const choices = Object.entries(PROVIDER_DEFAULTS).map(([key, val]) => ({
            name: `${val.label} — ${val.costTier}`,
            value: key as AIProvider,
          }));

          const provider = await select<AIProvider>({
            message: 'Choose your AI provider:',
            choices,
          });

          const defaults = PROVIDER_DEFAULTS[provider];
          let apiKey = '';
          let model = defaults.model;
          let baseURL: string | undefined;

          if (defaults.needsBaseURL) {
            // OpenAI-compatible provider needs base URL
            baseURL = await password({
              message: 'Enter your base URL (e.g. http://localhost:11434/v1):',
            });

            apiKey = await password({
              message: 'Enter API key (press Enter to skip if not needed):',
            });

            const useDefaultModel = await confirm({
              message: `Use default model (${defaults.model})?`,
              default: true,
            });

            if (!useDefaultModel) {
              const customModel = await password({
                message: 'Enter model name:',
              });
              model = customModel || defaults.model;
            }
          } else {
            // Standard provider — just needs API key
            apiKey = await password({
              message: `Enter your ${defaults.label} API key:`,
              mask: '*',
            });

            const useDefaultModel = await confirm({
              message: `Use default model (${defaults.model})?`,
              default: true,
            });

            if (!useDefaultModel) {
              const customModel = await password({
                message: 'Enter model name:',
              });
              model = customModel || defaults.model;
            }
          }

          const configToSave: Record<string, string | undefined> = {
            provider,
            apiKey,
            model,
          };
          if (baseURL) {
            configToSave.baseURL = baseURL;
          }

          setAIConfig(configToSave);
          console.log('');
        }

        // ── Step 4: Summary ──
        const finalAuth = getAuthStatus();
        const { getAIConfig } = await import('../lib/config/store.js');
        const aiConfig = getAIConfig();
        const aiDefaults = PROVIDER_DEFAULTS[aiConfig.provider as AIProvider];

        console.log(pc.dim('  ────────────────────────────────'));
        console.log(pc.green('  ✔ Setup complete!'));
        console.log('');
        console.log('  Configuration summary:');
        console.log(`    GitHub:  ${finalAuth.username ?? 'unknown'} @ github.com`);
        console.log(`    AI:      ${aiDefaults?.label ?? aiConfig.provider} — ${aiConfig.model} — ${maskApiKey(aiConfig.apiKey)}`);
        console.log('');
        console.log('  Try these commands:');
        console.log(`    ${pc.cyan('autopr cm')}      — smart commits`);
        console.log(`    ${pc.cyan('autopr cr')}      — create PRs`);
        console.log(`    ${pc.cyan('autopr review')}  — AI code review`);
        console.log(`    ${pc.cyan('autopr watch')}   — watch for reviews`);
        console.log('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(pc.red(`Error: ${message}`));
        process.exit(1);
      }
    });
}
