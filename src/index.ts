#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import { registerAuthCommand } from './commands/auth.js';
import { registerCommitCommand } from './commands/commit.js';
import { registerCreateCommand } from './commands/create.js';
import { registerReviewCommand } from './commands/review.js';
import { registerWatchCommand } from './commands/watch.js';

const program = new Command();

program
  .name('autopr')
  .description('CLI tool for automated PR review, smart commits, and PR creation')
  .version('0.1.0');

registerAuthCommand(program);
registerCommitCommand(program);
registerCreateCommand(program);
registerReviewCommand(program);
registerWatchCommand(program);

program.exitOverride();

process.on('uncaughtException', (error: Error) => {
  console.error(pc.red(`Error: ${error.message}`));
  process.exit(1);
});

program.parse(process.argv);
