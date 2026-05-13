# Security Policy

## Reporting a vulnerability

**Do not file a public GitHub issue for security bugs.**

Please report security issues privately via [GitHub's Private Vulnerability
Reporting](../../security/advisories/new). The maintainer will acknowledge
within a reasonable timeframe and coordinate a fix and disclosure.

Examples of issues in scope:

- Validation bypasses in the rule engine or parser integration that lead to
  crashes, incorrect rule results, or arbitrary code execution.
- Vulnerabilities in this project's bundled / vendored dependencies (in
  particular `libpg-query` and `postgresql-eslint-parser`).
- Supply-chain issues with the npm tarball we publish.

Out of scope by default:

- Pure denial-of-service from arbitrarily large SQL input (callers are expected
  to bound input themselves; ESLint already imposes practical limits).
- Concerns about the project's license itself.
- Issues that already have a public CVE upstream and where this project is
  only transitively affected — please report those upstream first; we will
  bump our pin once they release a fix.

## Supported versions

This project is pre-1.0. We patch the most recent `0.Y.x` release line; older
minors are not backported unless a maintainer explicitly says so.
