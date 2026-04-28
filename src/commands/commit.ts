import { Command } from 'commander';
import pc from 'picocolors';
import { isGitRepo, getGitClient } from '../lib/git/client.js';
import { getRepoContext } from '../lib/git/status.js';
import { getStagedDiff, getRecentCommits } from '../lib/git/diff.js';
import { generateCommitMessage, formatCommitMessage } from '../lib/ai/commit.js';
import { createSpinner, spinnerSucceed, spinnerFail } from '../lib/ui/spinner.js';
import { askInput, askConfirm } from '../lib/ui/prompts.js';

export function registerCommitCommand(program: Command): void {
  program
    .command('commit')
    .alias('cm')
    .description('Generate a conventional commit message from staged changes')
    .option('--no-verify', 'Skip git hooks')
    .action(async (opts: { verify: boolean }) => {
      try {
        if (!(await isGitRepo())) {
          process.stderr.write(pc.red('Error: Not a git repository\n'));
          process.exit(1);
        }

        const repoContext = await getRepoContext();

        if (repoContext.staged.length === 0) {
          process.stderr.write(
            pc.red('Error: No staged changes. Stage files with `git add` first.\n'),
          );
          process.exit(1);
        }

        const diff = await getStagedDiff();
        const recentCommits = await getRecentCommits(5);

        const spinner = createSpinner('Analyzing changes...');

        try {
          const commit = await generateCommitMessage(diff, recentCommits);
          const message = formatCommitMessage(commit);

          spinnerSucceed(spinner, 'Commit message generated');

          const scopePart = commit.scope ? pc.cyan(`(${commit.scope})`) : '';
          const breakingPart = commit.breaking ? '!' : '';
          process.stdout.write(
            `\n  ${pc.green(commit.type)}${scopePart}${breakingPart}: ${pc.white(commit.description)}\n\n`,
          );

          const useGenerated = await askConfirm('Use this commit message?');

          let finalMessage: string;

          if (useGenerated) {
            finalMessage = message;
          } else {
            finalMessage = await askInput('Enter commit message:');
          }

          const git = getGitClient();
          if (!opts.verify) {
            await git.commit(finalMessage, { '--no-verify': null });
          } else {
            await git.commit(finalMessage);
          }

          const firstLine = finalMessage.split('\n')[0] ?? finalMessage;
          process.stdout.write(pc.green(`✓ Committed: ${firstLine}\n`));
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
