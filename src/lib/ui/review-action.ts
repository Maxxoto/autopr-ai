import pc from 'picocolors';
import { select } from '@inquirer/prompts';
import { hasCriticalIssues } from './review-box.js';
import { approvePR, requestChanges, postReviewComment } from '../github/pr.js';
import { createSpinner, spinnerSucceed, spinnerFail } from './spinner.js';

type ReviewAction = 'approve' | 'request_changes' | 'comment' | 'skip';

export async function promptReviewAction(options: {
  owner: string;
  repo: string;
  pullNumber: number;
  review: string;
}): Promise<void> {
  const isCritical = hasCriticalIssues(options.review);

  if (isCritical) {
    process.stdout.write(pc.red(pc.bold('  ⚠ Critical issues detected\n\n')));
  } else {
    process.stdout.write(pc.green(pc.bold('  ✓ No critical issues detected\n\n')));
  }

  const choices = isCritical
    ? [
        { name: 'Request Changes', value: 'request_changes' as ReviewAction },
        { name: 'Comment', value: 'comment' as ReviewAction },
        { name: 'Skip', value: 'skip' as ReviewAction },
      ]
    : [
        { name: 'Approve', value: 'approve' as ReviewAction },
        { name: 'Comment', value: 'comment' as ReviewAction },
        { name: 'Skip', value: 'skip' as ReviewAction },
      ];

  const action = await select({
    message: 'What would you like to do?',
    choices,
  }) as ReviewAction;

  const reviewBody = `## 🤖 AI Review by autopr\n\n${options.review}`;

  switch (action) {
    case 'approve': {
      const spinner = createSpinner('Approving...');
      try {
        const url = await approvePR({
          owner: options.owner,
          repo: options.repo,
          pullNumber: options.pullNumber,
          body: reviewBody,
        });
        spinnerSucceed(spinner, `Approved: ${url}`);
      } catch {
        spinnerFail(spinner, 'Failed to approve, posting as comment instead');
        try {
          const url = await postReviewComment({
            owner: options.owner,
            repo: options.repo,
            pullNumber: options.pullNumber,
            body: reviewBody,
          });
          spinnerSucceed(createSpinner('Posting comment...'), `Comment posted: ${url}`);
        } catch {
          process.stdout.write(pc.yellow('  Review displayed locally (failed to post to GitHub)\n'));
        }
      }
      break;
    }
    case 'request_changes': {
      const spinner = createSpinner('Requesting changes...');
      try {
        const url = await requestChanges({
          owner: options.owner,
          repo: options.repo,
          pullNumber: options.pullNumber,
          body: reviewBody,
        });
        spinnerSucceed(spinner, `Changes requested: ${url}`);
      } catch {
        spinnerFail(spinner, 'Failed to request changes, posting as comment instead');
        try {
          const url = await postReviewComment({
            owner: options.owner,
            repo: options.repo,
            pullNumber: options.pullNumber,
            body: reviewBody,
          });
          spinnerSucceed(createSpinner('Posting comment...'), `Comment posted: ${url}`);
        } catch {
          process.stdout.write(pc.yellow('  Review displayed locally (failed to post to GitHub)\n'));
        }
      }
      break;
    }
    case 'comment': {
      try {
        const url = await postReviewComment({
          owner: options.owner,
          repo: options.repo,
          pullNumber: options.pullNumber,
          body: reviewBody,
        });
        spinnerSucceed(createSpinner('Posting comment...'), `Comment posted: ${url}`);
      } catch {
        process.stdout.write(pc.yellow('  Review displayed locally (failed to post to GitHub)\n'));
      }
      break;
    }
    case 'skip': {
      process.stdout.write(pc.dim('  Skipped — no action taken\n'));
      break;
    }
  }
}
