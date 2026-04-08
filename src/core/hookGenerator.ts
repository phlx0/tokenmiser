import fs from 'fs'
import path from 'path'

const HOOK_CONFIG = {
  hooks: {
    PostToolUse: [
      {
        matcher: 'Write|Edit',
        hooks: [
          {
            type: 'command',
            command: 'npx tokenmiser update --quiet 2>/dev/null || true',
          },
        ],
      },
    ],
    PreToolUse: [
      {
        matcher: 'Read',
        hooks: [
          {
            type: 'command',
            command: 'npx tokenmiser hook-read 2>/dev/null || true',
          },
        ],
      },
    ],
  },
}

export interface HookInstallResult {
  settingsPath: string
  action: 'created' | 'merged' | 'already_configured' | 'skipped'
}

export function installHooks(rootDir: string, dryRun = false): HookInstallResult {
  const claudeDir = path.join(rootDir, '.claude')
  const settingsPath = path.join(claudeDir, 'settings.json')

  if (dryRun) {
    return { settingsPath, action: 'skipped' }
  }

  if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true })

  let action: HookInstallResult['action']

  if (fs.existsSync(settingsPath)) {
    let existing: Record<string, unknown> = {}
    try {
      existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    } catch {
      // corrupt — overwrite
    }

    if (JSON.stringify(existing).includes('tokenmiser')) {
      action = 'already_configured'
    } else {
      const merged = deepMergeHooks(existing, HOOK_CONFIG)
      fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
      action = 'merged'
    }
  } else {
    fs.writeFileSync(settingsPath, JSON.stringify(HOOK_CONFIG, null, 2) + '\n', 'utf-8')
    action = 'created'
  }

  return { settingsPath, action }
}

function deepMergeHooks(
  target: Record<string, unknown>,
  source: { hooks: Record<string, unknown[]> },
): Record<string, unknown> {
  const result = { ...target }
  const existingHooks = (result.hooks as Record<string, unknown[]>) ?? {}
  result.hooks = { ...existingHooks }

  for (const [event, newEntries] of Object.entries(source.hooks)) {
    const existing = (result.hooks as Record<string, unknown[]>)[event] ?? []
    ;(result.hooks as Record<string, unknown[]>)[event] = [...existing, ...newEntries]
  }

  return result
}

export function printHookSnippet(): string {
  return JSON.stringify(HOOK_CONFIG, null, 2)
}
