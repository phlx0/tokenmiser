import fs from 'fs'
import path from 'path'

const BASE_PATTERNS = `# tokenmiser — generated .claudeignore
# https://github.com/phlx0/tokenmiser
# Prevents Claude from reading files that waste tokens without adding value.
# Edit freely — your changes are preserved between regenerations.

# ── Build artifacts ────────────────────────────────────────────────────────
dist/
build/
out/
.next/
.nuxt/
.output/
.vercel/
.netlify/
storybook-static/

# ── Dependencies ───────────────────────────────────────────────────────────
node_modules/
vendor/
.venv/
venv/
env/
__pycache__/
*.pyc
*.egg-info/

# ── Generated / compiled ───────────────────────────────────────────────────
*.min.js
*.min.css
*.map
*.d.ts.map

# ── Lock files (Claude doesn't need these) ─────────────────────────────────
package-lock.json
yarn.lock
pnpm-lock.yaml
Gemfile.lock
poetry.lock
go.sum

# ── Logs & temp ────────────────────────────────────────────────────────────
*.log
*.tmp
*.cache
.DS_Store
Thumbs.db

# ── Coverage & test artifacts ──────────────────────────────────────────────
coverage/
.nyc_output/
htmlcov/
.pytest_cache/
junit.xml

# ── IDE ────────────────────────────────────────────────────────────────────
.vscode/settings.json
.idea/
*.swp
*.swo

# ── Binary / media files ───────────────────────────────────────────────────
*.jpg
*.jpeg
*.png
*.gif
*.ico
*.webp
*.pdf
*.zip
*.tar
*.gz
*.wasm
*.mp4
*.mp3
`

const LANGUAGE_PATTERNS: Record<string, string> = {
  typescript: `
# ── TypeScript ─────────────────────────────────────────────────────────────
*.js.map
tsconfig.tsbuildinfo
`,
  python: `
# ── Python ─────────────────────────────────────────────────────────────────
*.pyo
.mypy_cache/
.ruff_cache/
.pytype/
`,
  go: `
# ── Go ─────────────────────────────────────────────────────────────────────
*.test
`,
  rust: `
# ── Rust ───────────────────────────────────────────────────────────────────
target/
`,
  java: `
# ── Java / JVM ─────────────────────────────────────────────────────────────
*.class
*.jar
*.war
target/
.gradle/
`,
  ruby: `
# ── Ruby ───────────────────────────────────────────────────────────────────
.bundle/
`,
  php: `
# ── PHP ────────────────────────────────────────────────────────────────────
composer.lock
`,
}

export function buildClaudeIgnore(detectedLanguages: string[]): string {
  let content = BASE_PATTERNS
  for (const lang of detectedLanguages) {
    if (LANGUAGE_PATTERNS[lang]) content += LANGUAGE_PATTERNS[lang]
  }
  return content
}

export function writeClaudeIgnore(rootDir: string, languages: string[]): 'created' | 'updated' | 'skipped' {
  const ignorePath = path.join(rootDir, '.claudeignore')
  const generated = buildClaudeIgnore(languages)

  if (fs.existsSync(ignorePath)) {
    const existing = fs.readFileSync(ignorePath, 'utf-8')
    if (existing.includes('tokenmiser')) {
      const userSection = extractUserSection(existing)
      const final = userSection ? generated + '\n# ── User patterns ─────────────────────────────────────────────────────────\n' + userSection : generated
      fs.writeFileSync(ignorePath, final, 'utf-8')
      return 'updated'
    } else {
      const merged = generated + '\n# ── Existing patterns ─────────────────────────────────────────────────────\n' + existing
      fs.writeFileSync(ignorePath, merged, 'utf-8')
      return 'updated'
    }
  }

  fs.writeFileSync(ignorePath, generated, 'utf-8')
  return 'created'
}

function extractUserSection(content: string): string {
  const marker = '# ── User patterns'
  const idx = content.indexOf(marker)
  return idx >= 0 ? content.slice(idx + marker.length).replace(/^[\s─]+\n/, '') : ''
}
