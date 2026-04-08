import fs from 'fs'
import path from 'path'

// Called by the PreToolUse hook before every Read tool call.
//
// Claude Code hook exit codes:
//   0 = allow (stdout JSON parsed for decisions, stderr ignored by Claude)
//   2 = block  (stderr is fed to Claude as context explaining the block)
//
// Strategy: allow small/medium files silently. For very large files (>1,500
// lines, ~21k+ tokens), block and tell Claude to check the index first.
// This prevents accidental reads of massive generated files.

const BLOCK_THRESHOLD_BYTES = 120_000 // ~1,500 lines × 80 chars

export async function hookReadCommand(): Promise<void> {
  const raw = await readStdin()
  if (!raw.trim()) process.exit(0)

  let payload: { tool_input?: { file_path?: string; offset?: number; limit?: number } }
  try {
    payload = JSON.parse(raw)
  } catch {
    process.exit(0) // malformed — allow
  }

  const filePath = payload?.tool_input?.file_path
  if (!filePath) process.exit(0)

  // If Claude is already using offset/limit, it's reading a specific section — allow
  if (payload?.tool_input?.offset !== undefined || payload?.tool_input?.limit !== undefined) {
    process.exit(0)
  }

  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) process.exit(0)

  let stat: fs.Stats
  try {
    stat = fs.statSync(abs)
  } catch {
    process.exit(0)
  }

  if (stat.size > BLOCK_THRESHOLD_BYTES) {
    const approxLines = Math.ceil(stat.size / 80)
    const approxTokens = Math.ceil(stat.size / 3500)

    // Exit 2 = block. stderr is shown to Claude as the reason.
    process.stderr.write(
      `[tokenmiser] Blocked full read of ${filePath} (~${approxLines} lines, ~${approxTokens}k tokens).\n` +
        `Check CODEBASE_INDEX.md for the file map, then read only the section you need using offset/limit.\n` +
        `If you need the full file, re-issue the Read tool call with an explicit offset of 0.\n`,
    )
    process.exit(2)
  }

  process.exit(0)
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    if (process.stdin.isTTY) {
      resolve('')
      return
    }
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', (chunk) => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(''))
    setTimeout(() => resolve(data), 2000)
  })
}
