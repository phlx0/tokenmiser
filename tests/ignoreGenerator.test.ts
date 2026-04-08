import { describe, it, expect } from 'vitest'
import { buildClaudeIgnore } from '../src/core/ignoreGenerator'

describe('buildClaudeIgnore', () => {
  it('always includes base patterns', () => {
    const result = buildClaudeIgnore([])
    expect(result).toContain('node_modules/')
    expect(result).toContain('dist/')
    expect(result).toContain('*.min.js')
    expect(result).toContain('*.log')
    expect(result).toContain('package-lock.json')
    expect(result).toContain('yarn.lock')
    expect(result).toContain('coverage/')
  })

  it('includes TypeScript-specific patterns when detected', () => {
    const result = buildClaudeIgnore(['typescript'])
    expect(result).toContain('*.js.map')
    expect(result).toContain('tsconfig.tsbuildinfo')
  })

  it('does not include TypeScript patterns when not detected', () => {
    const result = buildClaudeIgnore(['python'])
    expect(result).not.toContain('tsconfig.tsbuildinfo')
  })

  it('includes Python-specific patterns when detected', () => {
    const result = buildClaudeIgnore(['python'])
    expect(result).toContain('.mypy_cache/')
    expect(result).toContain('.ruff_cache/')
  })

  it('includes Go-specific patterns when detected', () => {
    const result = buildClaudeIgnore(['go'])
    expect(result).toContain('*.test')
  })

  it('includes Rust-specific patterns when detected', () => {
    const result = buildClaudeIgnore(['rust'])
    expect(result).toContain('target/')
  })

  it('includes Java-specific patterns when detected', () => {
    const result = buildClaudeIgnore(['java'])
    expect(result).toContain('*.class')
    expect(result).toContain('*.jar')
  })

  it('combines patterns from multiple detected languages', () => {
    const result = buildClaudeIgnore(['typescript', 'python'])
    expect(result).toContain('tsconfig.tsbuildinfo')
    expect(result).toContain('.mypy_cache/')
  })

  it('includes the tokenmiser attribution header', () => {
    const result = buildClaudeIgnore([])
    expect(result).toContain('tokenmiser')
    expect(result).toContain('github.com/phlx0/tokenmiser')
  })

  it('returns a non-empty string for any input', () => {
    expect(buildClaudeIgnore([])).toBeTruthy()
    expect(buildClaudeIgnore(['typescript', 'python', 'go', 'rust'])).toBeTruthy()
  })
})
