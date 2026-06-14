# Security Notes — AAISM Study App

This document summarizes the security posture of this static SPA and fixes applied.

## Architecture

- **Static SPA** — no backend; all data stays in the browser (localStorage) except LLM/RSS proxy calls.
- **No secrets in repo** — `.env*` files are gitignored; no API keys are committed.

## Fixes Applied

### XSS Prevention
- No `dangerouslySetInnerHTML` in user-facing content paths except GitHub README preview in Content Studio, which escapes HTML via `escapeHtml()` before rendering.
- RSS feed summaries strip `<script>`, `<style>`, and HTML tags via `stripHtml()`.
- User-edited Content Studio preview renders as plain text (LinkedIn, YouTube, Shorts, Twitter) — not raw HTML.

### External Links
- All `target="_blank"` links include `rel="noopener noreferrer"` (fixed missing instance in Profile.tsx).

### RSS / CORS Proxies
- Feeds are fetched via **rss2json.com** and **allorigins.win** — third-party proxies that see feed URLs.
- `isSafeFetchUrl()` validates source URLs before proxy fetch: only `http:`/`https:`, blocks localhost and private IP ranges.
- Curated feed URLs are defined in `src/data/rssSources.ts` — not user-supplied.

### API Keys in localStorage
- Keys stored in `aaism-ai-config` localStorage key as JSON.
- **Not encrypted** — browser storage is readable by any script on the origin.
- Settings page warns users; `saveAIConfig` / `loadAIConfig` avoid logging config contents.

### Open Redirect
- No user-controlled redirect URLs in routing; React Router paths are static.

### Dependency Audit
- Run `npm audit` periodically; high/critical issues addressed when safe upgrades exist.

## User Responsibilities

1. Use Ollama locally when privacy is critical.
2. Do not enter API keys on shared or untrusted machines.
3. Keep Ollama and browser updated.
4. Review third-party proxy trust before enabling live RSS feeds on sensitive networks.

## Reporting

Report security issues via the in-app Support page or GitHub Issues.
