import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import ora from 'ora'
import { scanRepo } from '../core/scanner'
import { generateIndex } from '../core/indexGenerator'
import { writeClaudeIgnore } from '../core/ignoreGenerator'
import { analyzeClaudeMd, ensureIndexInstruction } from '../core/claudemdOptimizer'
import { installHooks } from '../core/hookGenerator'
import { SymbolCache } from '../utils/cache'
import { formatTokens, savingsPercent } from '../core/tokenEstimator'
import { log } from '../utils/logger'

export async function initCommand(options: {
  dir: string
  hooks?: boolean
  noHooks?: boolean
}): Promise<void> {
  const rootDir = path.resolve(options.dir)
  const installHooksFlag = options.hooks === true || options.noHooks !== true

  console.log()
  console.log(chalk.bold.white('  tokenmiser') + chalk.dim(' — slash Claude Code token usage'))
  console.log()

  const spinner = ora({ text: 'Scanning repository…', prefixText: '  ' }).start()
  let scanResult
  try {
    scanResult = await scanRepo(rootDir)
    spinner.succeed(
      `Scanned ${scanResult.files.length} files · ~${formatTokens(scanResult.totalTokens)} tokens` +
        (scanResult.detectedLanguages.length > 0
          ? `  (${scanResult.detectedLanguages.join(', ')})`
          : ''),
    )
  } catch (err) {
    spinner.fail('Scan failed: ' + String(err))
    process.exit(1)
  }

  const { files, totalTokens, detectedLanguages } = scanResult
  log.blank()

  log.step('.claudeignore')
  const ignoreAction = writeClaudeIgnore(rootDir, detectedLanguages)
  log.stepDone(ignoreAction === 'created' ? 'created' : 'updated')

  const indexSpinner = ora({ text: 'Building codebase index…', prefixText: '  ' }).start()
  let indexTokens: number
  let filesIndexed: number
  let fromCache: number
  try {
    const cache = new SymbolCache(rootDir)
    const result = await generateIndex(files, rootDir, cache)
    indexTokens = result.indexTokens
    filesIndexed = result.filesIndexed
    fromCache = result.fromCache
    fs.writeFileSync(path.join(rootDir, 'CODEBASE_INDEX.md'), result.content, 'utf-8')
    cache.save()
    indexSpinner.succeed(
      `CODEBASE_INDEX.md — ${filesIndexed} files indexed · ~${formatTokens(indexTokens)} tokens`,
    )
  } catch (err) {
    indexSpinner.fail('Index generation failed: ' + String(err))
    process.exit(1)
  }

  log.step('CLAUDE.md')
  const action = ensureIndexInstruction(rootDir)
  const claudeMdLabel: Record<typeof action, string> = {
    created: 'created with index reference',
    injected: 'updated — index reference added',
    already_present: 'already has index reference',
  }
  log.stepDone(claudeMdLabel[action])

  if (installHooksFlag) {
    log.step('Claude Code hooks')
    const hookResult = installHooks(rootDir)
    const hookLabel: Record<typeof hookResult.action, string> = {
      created: `configured (${path.relative(rootDir, hookResult.settingsPath)})`,
      merged: `merged into existing settings.json`,
      already_configured: 'already configured',
      skipped: 'skipped',
    }
    log.stepDone(hookLabel[hookResult.action])
  }

  const savings = savingsPercent(totalTokens, indexTokens)
  const { tokens: claudeMdTokens } = analyzeClaudeMd(rootDir)

  log.blank()
  log.divider()
  console.log()
  console.log(chalk.bold('  Results'))
  console.log()
  log.stat('Files in repo', `${files.length}`)
  log.stat('Tokens without index', `~${formatTokens(totalTokens)}`)
  log.stat('CODEBASE_INDEX.md', `~${formatTokens(indexTokens)} tokens`, true)
  log.stat('CLAUDE.md overhead', `~${formatTokens(claudeMdTokens)} tokens/session`)
  log.stat('Estimated token savings', `~${savings}%`, savings >= 50)
  console.log()
  log.divider()
  console.log()

  console.log(chalk.bold('  Next steps'))
  console.log()
  console.log(
    chalk.dim('  1.') +
      ' Review ' +
      chalk.cyan('CODEBASE_INDEX.md') +
      ' — commit it or add to .gitignore',
  )
  console.log(
    chalk.dim('  2.') +
      ' Review ' +
      chalk.cyan('.claudeignore') +
      ' — add project-specific directories',
  )
  console.log(
    chalk.dim('  3.') +
      ' Fill in ' +
      chalk.cyan('CLAUDE.md') +
      ' with your project commands and conventions',
  )
  console.log(
    chalk.dim('  4.') +
      ' After code changes, run ' +
      chalk.white('tokenmiser update') +
      ' to refresh the index',
  )
  console.log()

  if (!installHooksFlag) {
    console.log(
      chalk.dim(
        '  Tip: run with --hooks to auto-configure Claude Code hooks for live index updates',
      ),
    )
    console.log()
  }

  const { suggestions } = analyzeClaudeMd(rootDir)
  if (suggestions.length > 0) {
    console.log(chalk.bold('  Suggestions:'))
    for (const s of suggestions) {
      console.log(chalk.yellow('  • ') + chalk.dim(s))
    }
    console.log()
  }
}
