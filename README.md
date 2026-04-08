# tokenmiser

[![npm version](https://img.shields.io/npm/v/tokenmiser.svg)](https://www.npmjs.com/package/tokenmiser)
[![CI](https://github.com/phlx0/tokenmiser/actions/workflows/ci.yml/badge.svg)](https://github.com/phlx0/tokenmiser/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**Slash Claude Code token usage by 40–98%.** Generates a compact codebase index, smart ignore rules, and an optimized `CLAUDE.md` — so Claude navigates straight to the right file instead of reading your entire project.

```
$ npx tokenmiser init

  tokenmiser — slash Claude Code token usage

  ✔ Scanned 134 files · ~180k tokens  (typescript)

  → .claudeignore         created
  ✔ CODEBASE_INDEX.md     112 files indexed · ~1.8k tokens
  → CLAUDE.md             updated — index reference added
  → Claude Code hooks     configured (.claude/settings.json)

  Files in repo               134
  Tokens without index        ~180k
  CODEBASE_INDEX.md           ~1.8k tokens
  CLAUDE.md overhead          ~420 tokens/session
  Estimated token savings     ~99%
```

---

## Why tokens get wasted

Claude Code burns tokens in three predictable ways:

1. **Blind file reading** — Claude doesn't know what's in a file without opening it, so it reads 5–10 files to find the right one. At ~1,500 tokens per file, that's 7k–15k tokens per lookup.
2. **Irrelevant content** — `node_modules`, build artifacts, lock files, generated code. None of this helps; all of it costs.
3. **Bloated `CLAUDE.md`** — Loaded at session start. A 3,000-token `CLAUDE.md` burns 3,000 tokens before Claude types a single character.

## How tokenmiser fixes it

### 1. `CODEBASE_INDEX.md` — the core fix

A compact map of your entire codebase that Claude reads once instead of reading files blindly:

```markdown
# Codebase Index
> 2026-04-08 · 134 files · ~180k tokens total
> Always read this file first. Navigate to exact files rather than exploring.

## Source

**src/auth/**
- `service.ts` — User authentication · AuthService, login, logout, validateToken, refreshToken
- `middleware.ts` — authenticate, requireRole, optionalAuth

**src/api/**
- `routes.ts` — UserRouter, ProductRouter, OrderRouter
- `controllers/userController.ts` — getUser, createUser, updateUser, deleteUser
```

Instead of reading 10 files to find a function, Claude reads this index (~1,800 tokens) and goes directly to the right file. **One read instead of ten.**

### 2. `.claudeignore` — stop reading junk

Automatically excludes build artifacts, lock files, coverage reports, generated code, binaries, and media files. Language-aware: detects TypeScript, Python, Go, Rust, Java, Ruby, PHP, and adds the right patterns.

### 3. `CLAUDE.md` optimisation

Injects an instruction that tells Claude to always consult `CODEBASE_INDEX.md` before reading any source file. If no `CLAUDE.md` exists, creates a minimal, well-structured template.

### 4. Live index updates via hooks

Installs Claude Code hooks that automatically regenerate `CODEBASE_INDEX.md` after every `Write` or `Edit` call — the index stays current without you doing anything.

A `PreToolUse` hook on `Read` **blocks** full reads of files over ~1,500 lines and tells Claude to use `offset`/`limit` for targeted reads instead.

---

## Real numbers

Measured on actual projects:

| Project | Language | Files | Without tokenmiser | With tokenmiser | Savings |
|---|---|---|---|---|---|
| Go CLI (ghscope) | Go | 60 | ~40.9k tokens | ~758 tokens | **98%** |
| Next.js website | TypeScript | 37 | ~28.8k tokens | ~541 tokens | **98%** |
| TUI app (snip) | Python | 51 | ~40.5k tokens | ~566 tokens | **99%** |
| tokenmiser itself | TypeScript | 23 | ~17.7k tokens | ~349 tokens | **98%** |

*Token counts estimated at ~3.5 chars/token (standard Claude approximation). Actual savings depend on how many files Claude reads per session.*

---

## Install

```bash
# Run directly (no install needed)
npx tokenmiser init

# Or install globally
npm install -g tokenmiser
tokenmiser init
```

**Requirements:** Node.js 18+

---

## Commands

### `tokenmiser init`

One-time setup for a project. Run this first.

```bash
tokenmiser init [options]

Options:
  -d, --dir <path>   Repository root (default: current directory)
  --hooks            Install Claude Code hooks for live updates (default)
  --no-hooks         Skip hook installation
```

Generates:
- `.claudeignore` with language-aware patterns
- `CODEBASE_INDEX.md` with exports and purpose for every source file
- Injects an index reference into `CLAUDE.md` (or creates one)
- Optionally installs hooks in `.claude/settings.json`

### `tokenmiser scan`

Read-only analysis. See where your tokens are going.

```bash
tokenmiser scan [-d <path>]
```

Shows a token heatmap, directory breakdown, index vs. full-read cost, and CLAUDE.md overhead per session.

### `tokenmiser update`

Regenerates `CODEBASE_INDEX.md` after code changes. Fast — uses a file mtime cache so only changed files are re-processed.

```bash
tokenmiser update [-d <path>] [--quiet]
```

Wire it to a git hook or npm script:

```json
{ "scripts": { "postbuild": "tokenmiser update" } }
```

---

## What gets installed

```
your-project/
├── CODEBASE_INDEX.md         ← commit this
├── .claudeignore             ← commit this
├── CLAUDE.md                 ← updated with index instruction
├── .claude/
│   └── settings.json         ← hook config
└── .tokenmiser/
    └── cache.json            ← add to .gitignore
```

Add `.tokenmiser/` to your `.gitignore`. Commit everything else.

---

## Claude Code hooks

**PostToolUse on Write/Edit** — runs `tokenmiser update --quiet` after every file Claude writes or edits. The index stays current throughout the session automatically.

**PreToolUse on Read** — for files over ~1,500 lines (~21k tokens), blocks the full read and outputs:
```
[tokenmiser] Blocked full read of src/generated/schema.ts (~2,847 lines, ~12k tokens).
Check CODEBASE_INDEX.md for the file map, then read only the section you need using offset/limit.
If you need the full file, re-issue the Read tool call with an explicit offset of 0.
```
Claude can still read large files in sections using `offset`/`limit`, or fully by re-issuing with `offset: 0`.

---

## How the index is built

For each source file, tokenmiser reads the first 32KB and extracts:
- **Purpose** — first JSDoc comment, docstring, or leading comment
- **Exports** — functions, classes, interfaces, types, constants (capped at 10 per file)

Supported languages: TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Ruby, PHP, C/C++.

On `tokenmiser update`, a file mtime cache means only changed files are re-processed — fast even on 1,000+ file codebases.

---

## Tips

**Commit `CODEBASE_INDEX.md`** — it doubles as useful documentation and is immediately available to Claude without any scanning.

**Add generated dirs to `.claudeignore`** — if you have a `src/generated/` directory, add it. Generated code is typically the single biggest source of token waste (often 60–80% of all tokens in a project).

**Keep `CLAUDE.md` short** — under 80 lines, under 1,500 tokens. Move detailed docs to separate files that Claude reads on demand.

**Large monorepos** — run `tokenmiser init` in each service directory. Each service gets its own focused index rather than one massive one.

---


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome — especially new language extractors.

## License

MIT © [phlx0](https://github.com/phlx0)
