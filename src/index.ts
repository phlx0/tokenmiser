#!/usr/bin/env node

import { Command } from 'commander'
import { initCommand } from './commands/init'
import { scanCommand } from './commands/scan'
import { updateCommand } from './commands/update'
import { hookReadCommand } from './commands/hookRead'

const program = new Command()

program
  .name('tokenmiser')
  .description('Slash Claude Code token usage by 40–70%')
  .version('1.0.0', '-v, --version')

program
  .command('init')
  .description('Analyse repo, generate CODEBASE_INDEX.md, .claudeignore, and optimise CLAUDE.md')
  .option('-d, --dir <path>', 'repository root', '.')
  .option('--hooks', 'install Claude Code hooks for live index updates (default: true)')
  .option('--no-hooks', 'skip hook installation')
  .action(initCommand)

program
  .command('scan')
  .description('Show a token usage breakdown for the current repository')
  .option('-d, --dir <path>', 'repository root', '.')
  .action(scanCommand)

program
  .command('update')
  .description('Regenerate CODEBASE_INDEX.md after code changes (fast — uses cache)')
  .option('-d, --dir <path>', 'repository root', '.')
  .option('-q, --quiet', 'suppress output (for use in hooks)')
  .action(updateCommand)

// Internal command invoked by the PreToolUse hook — not shown in help
program
  .command('hook-read', { hidden: true })
  .description('PreToolUse hook: warn Claude before reading very large files')
  .action(hookReadCommand)

program.parse()
