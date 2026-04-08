# Codebase Index
> 2026-04-08 · 36 files · ~22.6k tokens total
>
> **How to use:** Read this file first. Navigate to the exact file you need,
> then read only that file. Do not read entire directories.

## Source

**src/**
- `index.ts`

**src/commands/**
- `hookRead.ts` — Called by the PreToolUse hook before every Read tool call. · hookReadCommand
- `init.ts` — initCommand
- `scan.ts` — scanCommand
- `update.ts` — updateCommand

**src/core/**
- `claudemdOptimizer.ts` — analyzeClaudeMd, ensureIndexInstruction, ClaudeMdAnalysis
- `hookGenerator.ts` — installHooks, printHookSnippet, HookInstallResult
- `ignoreGenerator.ts` — buildClaudeIgnore, writeClaudeIgnore
- `indexGenerator.ts` — generateIndex, IndexResult
- `scanner.ts` — scanRepo, ScannedFile, ScanResult
- `symbolExtractor.ts` — extractSymbols, extractSymbolsFromContent, FileSymbols
- `tokenEstimator.ts` — estimateTokens, estimateTokensFromBytes, formatTokens, savingsPercent

**src/utils/**
- `cache.ts` — SymbolCache
- `logger.ts` — log

**tests/**
- `ignoreGenerator.test.ts`
- `symbolExtractor.test.ts` — login, logout
- `tokenEstimator.test.ts`

## Config
- `.github/dependabot.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/publish.yml`
- `package.json`
- `tsconfig.json`

## Docs
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `CHANGELOG.md`
- `CLAUDE.md`
- `CODE_OF_CONDUCT.md`
- `CODEBASE_INDEX.md`
- `CONTRIBUTING.md`
- `README.md`
- `SECURITY.md`

---
*Index: ~433 tokens · Full codebase: ~22.6k tokens · Saves ~98%*
