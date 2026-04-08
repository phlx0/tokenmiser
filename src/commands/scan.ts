import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { scanRepo } from '../core/scanner'
import { formatTokens, estimateTokens, savingsPercent } from '../core/tokenEstimator'
import { analyzeClaudeMd } from '../core/claudemdOptimizer'
import { log } from '../utils/logger'

export async function scanCommand(options: { dir: string }): Promise<void> {
  const rootDir = path.resolve(options.dir)

  log.header('tokenmiser scan')
  log.info(`Directory: ${rootDir}`)
  log.blank()

  const { files, totalTokens, detectedLanguages } = await scanRepo(rootDir)

  if (files.length === 0) {
    log.warn('No source files found — check your .claudeignore or current directory')
    return
  }

  const sorted = [...files].sort((a, b) => b.estimatedTokens - a.estimatedTokens)
  const maxTokens = sorted[0]?.estimatedTokens ?? 1
  const topFiles = sorted.filter((f) => f.estimatedTokens > 0).slice(0, 20)

  console.log(chalk.bold('  Token heatmap  ') + chalk.dim('(top files)'))
  console.log()

  for (const file of topFiles) {
    const pct = file.estimatedTokens / maxTokens
    const barLen = Math.max(1, Math.round(pct * 24))
    const bar = chalk.red('█'.repeat(barLen)) + chalk.dim('░'.repeat(24 - barLen))
    const tokenStr = formatTokens(file.estimatedTokens).padStart(6)
    const pathStr = file.relativePath.length > 48
      ? '…' + file.relativePath.slice(-47)
      : file.relativePath
    console.log(`  ${chalk.dim(pathStr.padEnd(50))}${chalk.yellow(tokenStr)}  ${bar}`)
  }

  if (sorted.length > 20) {
    log.info(`… and ${sorted.length - 20} more files`)
  }

  log.blank()
  log.divider()

  log.stat('Files scanned', files.length.toString())
  log.stat('Languages detected', detectedLanguages.join(', ') || 'unknown')
  log.stat('Total tokens (all files)', `~${formatTokens(totalTokens)}`)

  const indexPath = path.join(rootDir, 'CODEBASE_INDEX.md')
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8')
    const indexTokens = estimateTokens(indexContent)
    const savings = savingsPercent(totalTokens, indexTokens)
    log.stat(
      'CODEBASE_INDEX.md',
      `~${formatTokens(indexTokens)} tokens  (saves ~${savings}% vs full read)`,
      true,
    )
  } else {
    log.warn('No CODEBASE_INDEX.md — run `tokenmiser init` to generate one')
  }

  const { exists, tokens: claudeTokens, hasIndexRef, suggestions } = analyzeClaudeMd(rootDir)
  if (exists) {
    log.stat(
      'CLAUDE.md (per-session cost)',
      `~${formatTokens(claudeTokens)} tokens${hasIndexRef ? '' : '  ⚠ no index reference'}`,
      hasIndexRef,
    )
  } else {
    log.warn('No CLAUDE.md — run `tokenmiser init` to generate one')
  }

  const dirTokens = new Map<string, number>()
  for (const f of files) {
    const parts = f.relativePath.split('/')
    const topDir = parts.length > 1 ? parts[0] : '(root)'
    dirTokens.set(topDir, (dirTokens.get(topDir) ?? 0) + f.estimatedTokens)
  }

  const hotDirs = [...dirTokens.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, t]) => t / totalTokens > 0.2)

  if (hotDirs.length > 0) {
    log.blank()
    console.log(chalk.bold('  Heavy directories:'))
    for (const [dir, tokens] of hotDirs) {
      const pct = Math.round((tokens / totalTokens) * 100)
      const isIgnorable = ['generated', 'gen', '__generated__', 'fixtures', 'mocks', 'snapshots'].some(
        (k) => dir.includes(k),
      )
      const hint = isIgnorable ? chalk.yellow(' ← consider adding to .claudeignore') : ''
      console.log(`  ${chalk.cyan(dir.padEnd(30))} ${chalk.yellow(formatTokens(tokens).padStart(6))}  ${chalk.dim(pct + '%')}${hint}`)
    }
  }

  if (suggestions.length > 0) {
    log.blank()
    console.log(chalk.bold('  Suggestions:'))
    for (const s of suggestions) {
      console.log(chalk.yellow('  • ') + chalk.dim(s))
    }
  }

  log.divider()
  log.blank()
}
