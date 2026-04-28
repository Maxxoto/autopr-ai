import { Command } from 'commander';
import pc from 'picocolors';
import { requireAuth, getAuthStatus } from '../lib/github/auth.js';
import { getReviewRequests, generateAIReview } from '../lib/github/reviews.js';
import { getPRDiff, postReviewComment } from '../lib/github/pr.js';
import { sendReviewNotification, showReviewMenu, openInBrowser } from '../lib/ui/notify.js';
import { createSpinner, spinnerSucceed } from '../lib/ui/spinner.js';
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

      const timer = setInterval(async () => {
        if (polling) return;
        polling = true;

        try {
          const prs = await getReviewRequests(username);

          for (const pr of prs) {
            if (knownPRs.has(pr.html_url)) continue;
            knownPRs.add(pr.html_url);

            const { owner, repo } = extractOwnerRepo(pr.html_url);

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

              process.stdout.write('\n');
              process.stdout.write(
                pc.bold(`AI Review for PR #${pr.number}: ${pr.title}\n`),
              );
              process.stdout.write(pc.dim('─'.repeat(50)) + '\n');
              process.stdout.write(`${review}\n`);
              process.stdout.write(pc.dim('─'.repeat(50)) + '\n\n');

              const commentSpinner = createSpinner('Posting review to GitHub...');
              try {
                const reviewUrl = await postReviewComment({
                  owner,
                  repo,
                  pullNumber: pr.number,
                  body: `## 🤖 AI Review by autopr\n\n${review}`,
                });
                spinnerSucceed(commentSpinner, `Review posted: ${reviewUrl}`);
              } catch {
                spinnerSucceed(commentSpinner, pc.yellow('Review displayed locally (failed to post to GitHub)'));
              }
              console.log('');
            }
          }
        } catch {
          process.stderr.write(
            pc.yellow('Warning: Failed to fetch review requests, will retry\n'),
          );
        } finally {
          polling = false;
        }
      }, intervalMs);

      const cleanup = (): void => {
        clearInterval(timer);
        process.stdout.write(pc.dim('\nStopped watching.\n'));
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    });
}
