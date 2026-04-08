import fs from 'fs'
import path from 'path'
import { estimateTokens, formatTokens } from './tokenEstimator'

const INDEX_INSTRUCTION = `## Codebase Navigation
**Always read \`CODEBASE_INDEX.md\` before opening any source file.**
It contains the complete file map with exports and purpose for every file.
Use it to locate the exact file you need, then read only that file.
`

const TEMPLATE = `# Project

${INDEX_INSTRUCTION}
## Commands
\`\`\`
# Add your build/test/lint commands here
# build:  npm run build
# test:   npm test
# lint:   npm run lint
\`\`\`

## Architecture
<!-- Brief description of how the project is structured -->

## Conventions
<!-- Key conventions Claude should follow in this codebase -->

## Notes
<!-- Anything else Claude should know -->
`

export interface ClaudeMdAnalysis {
  exists: boolean
  tokens: number
  hasIndexRef: boolean
  suggestions: string[]
}

export function analyzeClaudeMd(rootDir: string): ClaudeMdAnalysis {
  const p = path.join(rootDir, 'CLAUDE.md')
  if (!fs.existsSync(p)) {
    return { exists: false, tokens: 0, hasIndexRef: false, suggestions: [] }
  }

  const content = fs.readFileSync(p, 'utf-8')
  const tokens = estimateTokens(content)
  const hasIndexRef = content.includes('CODEBASE_INDEX')
  const suggestions: string[] = []

  if (tokens > 3000) {
    suggestions.push(
      `CLAUDE.md is ~${formatTokens(tokens)} tokens — trim to under 1,500 for minimum per-session overhead`,
    )
  }
  if (!hasIndexRef) {
    suggestions.push('Add CODEBASE_INDEX.md reference so Claude reads it before exploring files')
  }
  if ((content.match(/```/g) ?? []).length > 8) {
    suggestions.push('Too many code blocks — move examples to separate referenced files')
  }
  const lineCount = content.split('\n').length
  if (lineCount > 150) {
    suggestions.push(`${lineCount} lines is verbose — aim for under 80 lines`)
  }

  return { exists: true, tokens, hasIndexRef, suggestions }
}

export function ensureIndexInstruction(
  rootDir: string,
): 'injected' | 'already_present' | 'created' {
  const p = path.join(rootDir, 'CLAUDE.md')

  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, TEMPLATE, 'utf-8')
    return 'created'
  }

  const content = fs.readFileSync(p, 'utf-8')
  if (content.includes('CODEBASE_INDEX')) {
    return 'already_present'
  }

  const headingMatch = content.match(/^#[^\n]*\n/)
  let updated: string
  if (headingMatch) {
    const headingEnd = headingMatch.index! + headingMatch[0].length
    updated =
      content.slice(0, headingEnd) + '\n' + INDEX_INSTRUCTION + '\n' + content.slice(headingEnd)
  } else {
    updated = INDEX_INSTRUCTION + '\n' + content
  }

  fs.writeFileSync(p, updated, 'utf-8')
  return 'injected'
}
