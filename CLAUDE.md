# tokenmiser

## Codebase Navigation
**Always read `CODEBASE_INDEX.md` before opening any source file.**
It contains the complete file map with exports and purpose for every file.
Use it to locate the exact file you need, then read only that file.

## Commands
```
build:     npm run build
typecheck: npm run typecheck
dev:       npm run dev -- <command>    # e.g. npm run dev -- init
smoke:     node dist/index.js init --no-hooks
```

## Architecture
- `src/commands/` — CLI entry points; thin wrappers over core
- `src/core/` — all business logic (scanner, symbolExtractor, indexGenerator, etc.)
- `src/utils/` — logger and mtime-based symbol cache
- Symbol extraction reads the first 32KB of each file, regex-based, no AST
- Cache lives in `.tokenmiser/cache.json` (gitignored)

## Conventions
- No external API calls — everything is local and offline
- Keep the index compact — `dedup()` caps exports at 10 per file deliberately
- Hook exit codes: 0 = allow silently, 2 = block and show stderr to Claude
- Never auto-modify user files without a clear opt-in
