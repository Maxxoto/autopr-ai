import { Command } from 'commander';
import pc from 'picocolors';
import { isGitRepo, getGitClient } from '../lib/git/client.js';
import { getRepoContext } from '../lib/git/status.js';
import { getBranchDiff, getRecentCommits } from '../lib/git/diff.js';
import { requireAuth } from '../lib/github/auth.js';
import { createPR, findPRForBranch, getDefaultBranch } from '../lib/github/pr.js';
import { generatePRContent } from '../lib/ai/pr.js';
import { createSpinner, spinnerSucceed, spinnerFail } from '../lib/ui/spinner.js';
import { askInput, askConfirm, askEditor } from '../lib/ui/prompts.js';
import { openInBrowser } from '../lib/ui/notify.js';

export function registerCreateCommand(program: Command): void {
  program
    .command('create')
    .alias('cr')
    .description('Create a pull request with AI-generated title and description')
    .option('--base <branch>', 'Target branch (default: auto-detect)')
    .option('--draft', 'Create as draft PR')
    .option('--no-push', 'Skip pushing to remote')
    .action(async (opts: { base?: string; draft: boolean; push: boolean }) => {
      try {
        if (!(await isGitRepo())) {
          process.stderr.write(pc.red('Error: Not a git repository\n'));
          process.exit(1);
        }

        try {
          await requireAuth();
        } catch {
          process.stderr.write(pc.red('Run `autopr auth login` first\n'));
          process.exit(1);
        }

        const repoContext = await getRepoContext();

        if (repoContext.isClean) {
          process.stderr.write(pc.red('Error: No changes to create PR from\n'));
          process.exit(1);
        }

        const { owner, repo, branch } = repoContext;

        const baseBranch =
          opts.base ?? (await getDefaultBranch({ owner, repo }));

        const diff = await getBranchDiff(baseBranch);
        const commits = await getRecentCommits(20);

        const existingPR = await findPRForBranch({ owner, repo, branch });
        if (existingPR) {
          process.stdout.write(
            pc.yellow(`PR already exists: ${existingPR.html_url}\n`),
          );
          process.exit(0);
        }

        const spinner = createSpinner('Generating PR content...');

        try {
          const content = await generatePRContent(diff, commits);
          spinnerSucceed(spinner, 'PR content generated');

          process.stdout.write(`\n  ${pc.bold(content.title)}\n\n`);
          process.stdout.write(`${content.description}\n\n`);

          const shouldCreate = await askConfirm('Create this PR?');

          let title = content.title;
          let description = content.description;

          if (!shouldCreate) {
            title = await askInput('PR title:', title);
            description = await askEditor('PR description:', description);
          }

          if (opts.push) {
            const git = getGitClient();
            await git.push(['-u', 'origin', branch]);
          }

          const pr = await createPR({
            owner,
            repo,
            title,
            body: description,
            head: branch,
            base: baseBranch,
            draft: opts.draft,
          });

          process.stdout.write(pc.green(`\n✓ PR created: ${pr.html_url}\n`));

          const shouldOpen = await askConfirm('Open in browser?');
          if (shouldOpen) {
            await openInBrowser(pr.html_url);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          spinnerFail(spinner, pc.red(error.message));
          process.exit(1);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        process.stderr.write(pc.red(`Error: ${error.message}\n`));
        process.exit(1);
      }
    });
}
