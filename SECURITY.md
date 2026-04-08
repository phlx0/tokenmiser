# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x | ✅ |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report them privately via [GitHub's private vulnerability reporting](https://github.com/phlx0/tokenmiser/security/advisories/new).

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

You'll receive a response within 72 hours. If the vulnerability is confirmed,
a patch will be released as soon as possible.

## Scope

tokenmiser runs entirely locally — it makes no network requests and sends no
data to external services. The main attack surface is the hook scripts it
installs into `.claude/settings.json`, which execute shell commands when
Claude Code triggers them.
