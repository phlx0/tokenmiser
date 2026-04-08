# Contributing to tokenmiser

Pull requests are welcome. For significant changes, open an issue first.

## Setup

```bash
git clone https://github.com/phlx0/tokenmiser
cd tokenmiser
npm install
npm run build
```

## Development

```bash
# Run without building
npm run dev -- init

# Build and run
npm run build && node dist/index.js init

# Typecheck
npm run typecheck
```

## Where things live

```
src/
  commands/     # CLI commands (init, scan, update, hook-read)
  core/         # Business logic
    scanner.ts          # File discovery + .gitignore/.claudeignore filtering
    symbolExtractor.ts  # Per-language export extraction (regex-based)
    indexGenerator.ts   # Builds CODEBASE_INDEX.md
    ignoreGenerator.ts  # Builds .claudeignore
    claudemdOptimizer.ts # CLAUDE.md injection
    hookGenerator.ts    # Claude Code hooks + settings.json
    tokenEstimator.ts   # Token count estimation
  utils/
    cache.ts    # mtime-based symbol cache (.tokenmiser/cache.json)
    logger.ts   # Terminal output helpers
```

## Adding a language

Edit `src/core/symbolExtractor.ts`:
1. Add the file extension to the `switch` in `extractSymbols`
2. Write an `extractXxx(content: string): FileSymbols` function
3. Extract exported symbols using regex — cap at 10 with `dedup()`
4. Add the extension to `TEXT_EXTENSIONS` in `src/core/scanner.ts`

## Principles

- No external API calls — everything is local and offline
- Fast: 32KB read cap per file, mtime cache for incremental updates
- Conservative: never modify user files without asking, never block reads unless the file is truly massive (>1,500 lines)
- The index must stay compact — if the index itself gets large, it defeats the purpose

## Testing

```bash
# Run on this repo
node dist/index.js init
node dist/index.js scan
node dist/index.js update
```

There's no automated test suite yet — contributions welcome.
