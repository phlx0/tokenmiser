import { describe, it, expect } from 'vitest'
import {
  estimateTokens,
  estimateTokensFromBytes,
  formatTokens,
  savingsPercent,
} from '../src/core/tokenEstimator'

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('rounds up fractional tokens', () => {
    expect(estimateTokens('hello')).toBe(2)
  })

  it('handles typical code content', () => {
    const code = 'export function foo(): void { return }'
    expect(estimateTokens(code)).toBeGreaterThan(0)
    expect(estimateTokens(code)).toBe(Math.ceil(code.length / 3.5))
  })

  it('produces more tokens for longer content', () => {
    expect(estimateTokens('abc'.repeat(100))).toBeGreaterThan(estimateTokens('abc'))
  })

  it('is consistent with byte-based estimation for ASCII', () => {
    // ASCII chars are 1 byte each, so both methods should agree
    const text = 'a'.repeat(3500)
    expect(estimateTokens(text)).toBe(estimateTokensFromBytes(3500))
  })
})

describe('estimateTokensFromBytes', () => {
  it('returns 0 for 0 bytes', () => {
    expect(estimateTokensFromBytes(0)).toBe(0)
  })

  it('estimates correctly for known sizes', () => {
    expect(estimateTokensFromBytes(3500)).toBe(1000)
    expect(estimateTokensFromBytes(7000)).toBe(2000)
  })
})

describe('formatTokens', () => {
  it('formats sub-thousand tokens as plain numbers', () => {
    expect(formatTokens(0)).toBe('0')
    expect(formatTokens(1)).toBe('1')
    expect(formatTokens(999)).toBe('999')
  })

  it('formats thousands with k suffix', () => {
    expect(formatTokens(1000)).toBe('1.0k')
    expect(formatTokens(1500)).toBe('1.5k')
    expect(formatTokens(10000)).toBe('10.0k')
    expect(formatTokens(99999)).toBe('100.0k')
  })

  it('formats numbers >= 100k with M suffix', () => {
    expect(formatTokens(100_000)).toBe('0.1M')
    expect(formatTokens(500_000)).toBe('0.5M')
    expect(formatTokens(1_000_000)).toBe('1.0M')
    expect(formatTokens(2_500_000)).toBe('2.5M')
  })
})

describe('savingsPercent', () => {
  it('returns 0 when before is 0', () => {
    expect(savingsPercent(0, 0)).toBe(0)
  })

  it('calculates 90% savings correctly', () => {
    expect(savingsPercent(1000, 100)).toBe(90)
  })

  it('calculates 98% savings correctly', () => {
    expect(savingsPercent(50000, 1000)).toBe(98)
  })

  it('returns 100 when after is 0', () => {
    expect(savingsPercent(1000, 0)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    expect(savingsPercent(1000, 333)).toBe(67)
  })
})
