import notifier from 'node-notifier';
import open from 'open';
import { select } from '@inquirer/prompts';
import type { PRInfo } from '../../types/index.js';

export function sendReviewNotification(pr: {
  title: string;
  html_url: string;
  author: string;
  repo: string;
}): void {
  notifier.notify({
    title: 'PR Review Requested',
    message: `${pr.author} requested your review on ${pr.title} (${pr.repo})`,
    sound: true,
  });
}

export async function openInBrowser(url: string): Promise<void> {
  await open(url);
}

export async function showReviewMenu(pr: PRInfo): Promise<'browser' | 'ai' | 'dismiss'> {
  const choice = await select({
    message: `PR #${pr.number}: ${pr.title}`,
    choices: [
      { name: 'Open in browser', value: 'browser' },
      { name: 'AI Review Assist', value: 'ai' },
      { name: 'Dismiss', value: 'dismiss' },
    ],
  });

  return choice as 'browser' | 'ai' | 'dismiss';
}
