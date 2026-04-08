import fs from 'fs'
import path from 'path'
import { FileSymbols } from '../core/symbolExtractor'

const CACHE_VERSION = '1'

interface CacheEntry {
  mtime: number
  size: number
  symbols: FileSymbols
}

interface CacheFile {
  version: string
  generatedAt: string
  entries: Record<string, CacheEntry>
}

export class SymbolCache {
  private cachePath: string
  private data: CacheFile
  private dirty = false

  constructor(rootDir: string) {
    const cacheDir = path.join(rootDir, '.tokenmiser')
    this.cachePath = path.join(cacheDir, 'cache.json')
    this.data = this.load(cacheDir)
  }

  private load(cacheDir: string): CacheFile {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8')) as CacheFile
        if (raw.version === CACHE_VERSION) return raw
      }
    } catch {
      // corrupt cache — start fresh
    }
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
    return { version: CACHE_VERSION, generatedAt: new Date().toISOString(), entries: {} }
  }

  get(absolutePath: string): FileSymbols | null {
    const entry = this.data.entries[absolutePath]
    if (!entry) return null
    try {
      const stat = fs.statSync(absolutePath)
      if (stat.mtimeMs === entry.mtime && stat.size === entry.size) {
        return entry.symbols
      }
    } catch {
      // file gone
    }
    return null
  }

  set(absolutePath: string, symbols: FileSymbols): void {
    try {
      const stat = fs.statSync(absolutePath)
      this.data.entries[absolutePath] = { mtime: stat.mtimeMs, size: stat.size, symbols }
      this.dirty = true
    } catch {
      // ignore
    }
  }

  save(): void {
    if (!this.dirty) return
    this.data.generatedAt = new Date().toISOString()
    const dir = path.dirname(this.cachePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.cachePath, JSON.stringify(this.data, null, 2), 'utf-8')
    this.dirty = false
  }

  prune(activeAbsolutePaths: Set<string>): void {
    for (const key of Object.keys(this.data.entries)) {
      if (!activeAbsolutePaths.has(key)) {
        delete this.data.entries[key]
        this.dirty = true
      }
    }
  }
}
