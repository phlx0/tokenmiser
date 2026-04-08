# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-08

### Added
- `tokenmiser init` — one-command setup that generates `CODEBASE_INDEX.md`,
  `.claudeignore`, and injects a navigation instruction into `CLAUDE.md`
- `tokenmiser scan` — token heatmap showing where tokens are wasted, with
  directory breakdown and per-session `CLAUDE.md` overhead
- `tokenmiser update` — fast incremental index regeneration using an mtime
  cache (only re-processes changed files)
- Symbol extraction for TypeScript, JavaScript, Python, Go, Rust, Java,
  Kotlin, Ruby, PHP, and C/C++ — reads first 32KB per file, no AST required
- Claude Code hooks via `.claude/settings.json`:
  - PostToolUse on Write/Edit: auto-regenerates index after every file change
  - PreToolUse on Read: blocks full reads of files over ~1,500 lines (exit 2
    so stderr is surfaced to Claude as context)
- Language-aware `.claudeignore` generation with patterns for each detected
  language ecosystem
- mtime-based symbol cache in `.tokenmiser/cache.json` for fast updates on
  large codebases
- `--no-hooks` flag to skip Claude Code hook installation
- `--quiet` flag on `update` for use in automated hook scripts

[Unreleased]: https://github.com/phlx0/tokenmiser/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/phlx0/tokenmiser/releases/tag/v1.0.0
