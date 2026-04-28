import { Command } from 'commander';
import pc from 'picocolors';
import { requireAuth, getAuthStatus } from '../lib/github/auth.js';
import { getReviewRequests, generateAIReview } from '../lib/github/reviews.js';
import { getPRDiff } from '../lib/github/pr.js';
import { sendReviewNotification, showReviewMenu, openInBrowser } from '../lib/ui/notify.js';
import { createSpinner, spinnerSucceed } from '../lib/ui/spinner.js';
import { displayReview } from '../lib/ui/review-box.js';
import { promptReviewAction } from '../lib/ui/review-action.js';
import { getWatchInterval } from '../lib/config/store.js';
import type { PRInfo } from '../types/index.js';

function extractOwnerRepo(htmlUrl: string): { owner: string; repo: string } {
  const match = htmlUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  return {
    owner: match?.[1] ?? '',
    repo: match?.[2] ?? '',
  };
}

export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('Watch for PR review assignments and notify')
    .option('--interval <seconds>', 'Polling interval in seconds')
    .action(async (opts: { interval?: string }) => {
      try {
        await requireAuth();
      } catch {
        process.stderr.write(pc.red('Run `autopr auth login` first\n'));
        process.exit(1);
      }

      const authStatus = getAuthStatus();
      if (!authStatus.username) {
        process.stderr.write(pc.red('Could not get authenticated username\n'));
        process.exit(1);
      }
      const username = authStatus.username;

      const intervalSeconds = opts.interval
        ? parseInt(opts.interval, 10)
        : getWatchInterval();

      if (isNaN(intervalSeconds) || intervalSeconds < 1) {
        process.stderr.write(pc.red('Error: Interval must be a positive number\n'));
        process.exit(1);
      }

      const intervalMs = intervalSeconds * 1000;

      process.stdout.write(pc.bold('Watching for review requests...') + '\n');
      process.stdout.write(
        pc.dim(`Polling every ${intervalSeconds}s for user ${username}\n\n`),
      );

      const knownPRs = new Set<string>();

      let polling = false;

      const poll = async (): Promise<void> => {
        if (polling) return;
        polling = true;

        try {
          const prs = await getReviewRequests(username);

          let processedAny = false;

          for (const pr of prs) {
            if (knownPRs.has(pr.html_url)) continue;
            knownPRs.add(pr.html_url);
            processedAny = true;

            const { owner, repo } = extractOwnerRepo(pr.html_url);

            try {
              sendReviewNotification({
                title: pr.title,
                html_url: pr.html_url,
                author: pr.author,
                repo: `${owner}/${repo}`,
              });

              process.stdout.write(
                pc.yellow('New review request: ') + `${pr.title}\n`,
              );

              const choice = await showReviewMenu(pr);

              if (choice === 'browser') {
                await openInBrowser(pr.html_url);
              } else if (choice === 'ai') {
                const fetchSpinner = createSpinner('Fetching PR diff...');
                const diff = await getPRDiff({
                  owner,
                  repo,
                  pullNumber: pr.number,
                });
                spinnerSucceed(fetchSpinner, 'Diff fetched');

                const aiSpinner = createSpinner('Generating AI review...');
                const review = await generateAIReview(diff, pr.title);
                spinnerSucceed(aiSpinner, 'Review complete');

                displayReview(pr.number, pr.title, review);
                await promptReviewAction({ owner, repo, pullNumber: pr.number, review });
                console.log('');
              }

              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
              process.stderr.write(
                pc.yellow(`Warning: Error processing PR #${pr.number}, continuing...\n`),
              );
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          if (processedAny) {
            process.stdout.write(
              pc.dim(`\nStill watching... (polling every ${intervalSeconds}s)\n\n`),
            );
          }
        } catch {
          process.stderr.write(
            pc.yellow('Warning: Failed to fetch review requests, will retry\n'),
          );
        } finally {
          polling = false;
        }
      };

      // Poll immediately on start, then at interval
      poll();
      const timer = setInterval(poll, intervalMs);

      const cleanup = (): void => {
        clearInterval(timer);
        process.stdout.write(pc.dim('\nStopped watching.\n'));
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    });
}
