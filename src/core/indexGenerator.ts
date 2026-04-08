import path from 'path'
import { ScannedFile } from './scanner'
import { extractSymbols, FileSymbols } from './symbolExtractor'
import { SymbolCache } from '../utils/cache'
import { estimateTokens, formatTokens } from './tokenEstimator'

const SOURCE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.kt', '.swift',
  '.rb', '.php', '.cpp', '.c', '.h', '.cc',
  '.cs', '.scala', '.ex', '.exs', '.vue', '.svelte',
])

const CONFIG_EXTS = new Set([
  '.json', '.jsonc', '.yaml', '.yml', '.toml', '.ini',
  '.env', '.env.example', '.env.sample', '.conf', '.config',
])

export interface IndexResult {
  content: string
  indexTokens: number
  filesIndexed: number
  fromCache: number
}

export async function generateIndex(
  files: ScannedFile[],
  rootDir: string,
  cache: SymbolCache,
): Promise<IndexResult> {
  const today = new Date().toISOString().split('T')[0]
  const totalTokens = files.reduce((sum, f) => sum + f.estimatedTokens, 0)

  const sourceFiles = files.filter((f) => SOURCE_EXTS.has(f.ext))
  const configFiles = files.filter((f) => CONFIG_EXTS.has(f.ext))
  const docFiles = files.filter((f) => f.ext === '.md' || f.ext === '.mdx')

  const grouped = groupByDir(sourceFiles)

  let fromCache = 0
  const symbolMap = new Map<string, FileSymbols>()

  for (const file of sourceFiles) {
    const cached = cache.get(file.absolutePath)
    if (cached) {
      symbolMap.set(file.relativePath, cached)
      fromCache++
    } else {
      const symbols = extractSymbols(file.absolutePath, file.ext)
      symbolMap.set(file.relativePath, symbols)
      cache.set(file.absolutePath, symbols)
    }
  }

  let out = `# Codebase Index\n`
  out += `> ${today} · ${files.length} files · ~${formatTokens(totalTokens)} tokens total\n`
  out += `>\n`
  out += `> **How to use:** Read this file first. Navigate to the exact file you need,\n`
  out += `> then read only that file. Do not read entire directories.\n`
  out += '\n'

  if (grouped.size > 0) {
    out += `## Source\n\n`
    for (const [dir, dirFiles] of [...grouped.entries()].sort()) {
      const label = dir || '(root)'
      out += `**${label}/**\n`
      for (const file of dirFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
        const sym = symbolMap.get(file.relativePath) ?? { purpose: null, exports: [], language: '' }
        const filename = path.basename(file.relativePath)
        const parts: string[] = []
        if (sym.purpose) parts.push(sym.purpose)
        if (sym.exports.length > 0) {
          const shown = sym.exports.slice(0, 8)
          const more = sym.exports.length > 8 ? ` +${sym.exports.length - 8}` : ''
          parts.push(shown.join(', ') + more)
        }
        const detail = parts.length > 0 ? ' — ' + parts.join(' · ') : ''
        out += `- \`${filename}\`${detail}\n`
      }
      out += '\n'
    }
  }

  if (configFiles.length > 0) {
    out += `## Config\n`
    for (const f of configFiles.slice(0, 30).sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
      out += `- \`${f.relativePath}\`\n`
    }
    out += '\n'
  }

  if (docFiles.length > 0) {
    out += `## Docs\n`
    for (const f of docFiles.slice(0, 15).sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
      out += `- \`${f.relativePath}\`\n`
    }
    out += '\n'
  }

  const indexTokens = estimateTokens(out)
  out += `---\n`
  out += `*Index: ~${formatTokens(indexTokens)} tokens · Full codebase: ~${formatTokens(totalTokens)} tokens · Saves ~${Math.round((1 - indexTokens / Math.max(totalTokens, 1)) * 100)}%*\n`

  return { content: out, indexTokens, filesIndexed: sourceFiles.length, fromCache }
}

function groupByDir(files: ScannedFile[]): Map<string, ScannedFile[]> {
  const map = new Map<string, ScannedFile[]>()
  for (const file of files) {
    const dir = path.dirname(file.relativePath)
    const key = dir === '.' ? '' : dir
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(file)
  }
  return map
}
