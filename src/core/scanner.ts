import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import ignore, { Ignore } from 'ignore'
import { estimateTokensFromBytes } from './tokenEstimator'

export interface ScannedFile {
  relativePath: string
  absolutePath: string
  ext: string
  sizeBytes: number
  estimatedTokens: number
}

export interface ScanResult {
  files: ScannedFile[]
  totalTokens: number
  detectedLanguages: string[]
  rootDir: string
}

const HARD_IGNORE = [
  'node_modules/**',
  '.git/**',
  '.tokenmiser/**',
  'dist/**',
  'build/**',
  'out/**',
  '.next/**',
  '.nuxt/**',
  '.output/**',
  '__pycache__/**',
  '*.pyc',
  '*.pyo',
  '*.class',
  '*.o',
  '*.a',
  '*.so',
  '*.dylib',
  '*.dll',
  '*.exe',
  '*.bin',
  '*.min.js',
  '*.min.css',
  '*.map',
  '*.jpg',
  '*.jpeg',
  '*.png',
  '*.gif',
  '*.ico',
  '*.webp',
  '*.svg',
  '*.pdf',
  '*.zip',
  '*.tar',
  '*.gz',
  '*.wasm',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Gemfile.lock',
  'poetry.lock',
  'Cargo.lock',
  'go.sum',
]

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.swift',
  '.rb',
  '.php',
  '.cpp',
  '.c',
  '.h',
  '.cc',
  '.cxx',
  '.cs',
  '.scala',
  '.clj',
  '.ex',
  '.exs',
  '.ml',
  '.md',
  '.mdx',
  '.txt',
  '.rst',
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
  '.toml',
  '.ini',
  '.env',
  '.env.example',
  '.env.sample',
  '.html',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.sql',
  '.graphql',
  '.gql',
  '.proto',
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
  '.dockerfile',
  '.conf',
  '.config',
  '.xml',
  '.vue',
  '.svelte',
  '.astro',
])

const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  python: ['.py'],
  go: ['.go'],
  rust: ['.rs'],
  java: ['.java', '.kt'],
  ruby: ['.rb'],
  php: ['.php'],
  cpp: ['.cpp', '.c', '.h', '.cc', '.cxx'],
  csharp: ['.cs'],
}

function buildIgnore(rootDir: string): Ignore {
  const ig = ignore()
  ig.add(HARD_IGNORE)

  for (const name of ['.gitignore', '.claudeignore']) {
    const p = path.join(rootDir, name)
    if (fs.existsSync(p)) {
      try {
        ig.add(fs.readFileSync(p, 'utf-8'))
      } catch {}
    }
  }

  return ig
}

function detectLanguages(files: ScannedFile[]): string[] {
  const extCounts = new Map<string, number>()
  for (const f of files) {
    extCounts.set(f.ext, (extCounts.get(f.ext) ?? 0) + 1)
  }

  const detected: string[] = []
  for (const [lang, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
    const count = exts.reduce((sum, e) => sum + (extCounts.get(e) ?? 0), 0)
    if (count > 0) detected.push(lang)
  }

  return detected
}

export async function scanRepo(rootDir: string): Promise<ScanResult> {
  const ig = buildIgnore(rootDir)

  const allPaths = await glob('**/*', {
    cwd: rootDir,
    nodir: true,
    dot: true,
    absolute: false,
  })

  const files: ScannedFile[] = []

  for (const relativePath of allPaths) {
    if (ig.ignores(relativePath)) continue

    const ext = path.extname(relativePath).toLowerCase()
    if (!TEXT_EXTENSIONS.has(ext) && ext !== '') continue

    const absolutePath = path.join(rootDir, relativePath)
    let sizeBytes = 0
    try {
      sizeBytes = fs.statSync(absolutePath).size
    } catch {
      continue
    }

    if (sizeBytes > 2_000_000) continue

    files.push({
      relativePath,
      absolutePath,
      ext,
      sizeBytes,
      estimatedTokens: estimateTokensFromBytes(sizeBytes),
    })
  }

  const totalTokens = files.reduce((sum, f) => sum + f.estimatedTokens, 0)
  const detectedLanguages = detectLanguages(files)

  return { files, totalTokens, detectedLanguages, rootDir }
}
