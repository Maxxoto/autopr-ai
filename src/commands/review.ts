import { Command } from 'commander';
import pc from 'picocolors';
import { isGitRepo } from '../lib/git/client.js';
import { getRepoContext } from '../lib/git/status.js';
import { requireAuth } from '../lib/github/auth.js';
import { getPR, findPRForBranch, getPRDiff } from '../lib/github/pr.js';
import { generateAIReview } from '../lib/github/reviews.js';
import { createSpinner, spinnerSucceed } from '../lib/ui/spinner.js';
import { displayReview } from '../lib/ui/review-box.js';
import { promptReviewAction } from '../lib/ui/review-action.js';
import type { PRInfo } from '../types/index.js';

export function registerReviewCommand(program: Command): void {
  program
    .command('review')
    .description('AI-powered code review for a pull request')
    .argument('[pr-number]', 'PR number to review')
    .option('--repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (prNumber: string | undefined, opts: { repo?: string }) => {
      try {
        try {
          await requireAuth();
        } catch {
          process.stderr.write(pc.red('Run `autopr auth login` first\n'));
          process.exit(1);
        }

        let owner: string;
        let repo: string;

        if (opts.repo) {
          const [parsedOwner, parsedRepo] = opts.repo.split('/');
          if (!parsedOwner || !parsedRepo) {
            process.stderr.write(
              pc.red('Error: --repo must be in owner/repo format\n'),
            );
            process.exit(1);
          }
          owner = parsedOwner;
          repo = parsedRepo;
        } else {
          if (!(await isGitRepo())) {
            process.stderr.write(pc.red('Error: Not a git repository\n'));
            process.exit(1);
          }
          const ctx = await getRepoContext();
          owner = ctx.owner;
          repo = ctx.repo;
        }

        let pr: PRInfo;

        if (prNumber) {
          const pullNumber = parseInt(prNumber, 10);
          if (isNaN(pullNumber)) {
            process.stderr.write(pc.red('Error: PR number must be a number\n'));
            process.exit(1);
          }
          pr = await getPR({ owner, repo, pullNumber });
        } else {
          const ctx = await getRepoContext();
          const found = await findPRForBranch({
            owner: ctx.owner,
            repo: ctx.repo,
            branch: ctx.branch,
          });
          if (!found) {
            process.stderr.write(
              pc.red('No open PR found for current branch\n'),
            );
            process.exit(1);
          }
          pr = found;
        }

        const fetchSpinner = createSpinner('Fetching PR diff...');
        const diff = await getPRDiff({
          owner,
          repo,
          pullNumber: pr.number,
        });
        spinnerSucceed(fetchSpinner, 'Diff fetched');

        const aiSpinner = createSpinner('Analyzing with AI...');
        const review = await generateAIReview(diff, pr.title);
        spinnerSucceed(aiSpinner, 'Review complete');

        displayReview(pr.number, pr.title, review);
        await promptReviewAction({ owner, repo, pullNumber: pr.number, review });
        console.log('');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        process.stderr.write(pc.red(`Error: ${error.message}\n`));
        process.exit(1);
      }
    });
}
