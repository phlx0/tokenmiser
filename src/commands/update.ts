import fs from 'fs'
import path from 'path'
import { scanRepo } from '../core/scanner'
import { generateIndex } from '../core/indexGenerator'
import { SymbolCache } from '../utils/cache'
import { formatTokens, savingsPercent } from '../core/tokenEstimator'
import { log } from '../utils/logger'

export async function updateCommand(options: { dir: string; quiet?: boolean }): Promise<void> {
  const rootDir = path.resolve(options.dir)
  const quiet = options.quiet ?? false

  if (!fs.existsSync(path.join(rootDir, 'CODEBASE_INDEX.md'))) {
    if (!quiet) log.warn('No CODEBASE_INDEX.md found — run `tokenmiser init` first')
    process.exit(1)
  }

  const cache = new SymbolCache(rootDir)
  const { files, totalTokens } = await scanRepo(rootDir)
  cache.prune(new Set(files.map((f) => f.absolutePath)))

  const { content, indexTokens, filesIndexed, fromCache } = await generateIndex(files, rootDir, cache)

  fs.writeFileSync(path.join(rootDir, 'CODEBASE_INDEX.md'), content, 'utf-8')
  cache.save()

  if (!quiet) {
    const savings = savingsPercent(totalTokens, indexTokens)
    log.success(
      `CODEBASE_INDEX.md updated — ${filesIndexed} files · ~${formatTokens(indexTokens)} tokens (saves ~${savings}%)` +
        (fromCache > 0 ? `  ${fromCache} from cache` : ''),
    )
  }
}
