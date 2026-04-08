const CHARS_PER_TOKEN = 3.5

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function estimateTokensFromBytes(bytes: number): number {
  return Math.ceil(bytes / CHARS_PER_TOKEN)
}

export function formatTokens(n: number): string {
  if (n >= 100_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

export function savingsPercent(before: number, after: number): number {
  if (before === 0) return 0
  return Math.round((1 - after / before) * 100)
}
