#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import { registerAuthCommand } from './commands/auth.js';
import { registerCommitCommand } from './commands/commit.js';
import { registerCreateCommand } from './commands/create.js';
import { registerReviewCommand } from './commands/review.js';
import { registerWatchCommand } from './commands/watch.js';
import { registerOnboardCommand } from './commands/onboard.js';
import { isConfigured } from './lib/config/store.js';

const program = new Command();

program
  .name('autopr')
  .description('CLI tool for automated PR review, smart commits, and PR creation')
  .version('0.1.3');

registerAuthCommand(program);
registerCommitCommand(program);
registerCreateCommand(program);
registerReviewCommand(program);
registerWatchCommand(program);
registerOnboardCommand(program);

// Auto-redirect to onboard if no subcommand and not configured
const validCommands = ['onboard', 'auth', 'cm', 'commit', 'cr', 'create', 'review', 'watch'];
if (!process.argv[2] || (!process.argv[2].startsWith('-') && !validCommands.includes(process.argv[2]))) {
  if (!isConfigured()) {
    process.argv.splice(2, 0, 'onboard');
  }
}

program.exitOverride();

process.on('uncaughtException', (error: Error) => {
  console.error(pc.red(`Error: ${error.message}`));
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  // For watch command, just log and continue — don't kill the process
  if (process.argv[2] === 'watch') {
    console.error(pc.yellow(`Warning: ${reason}`));
    return;
  }
  console.error(pc.red(`Error: ${reason}`));
  process.exit(1);
});

program.parse(process.argv);
