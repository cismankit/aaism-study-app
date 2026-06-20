# Security Notes — AAISM Study App

This document summarizes the security posture of this static SPA and fixes applied.

## Architecture

- **Static SPA** — no backend; all data stays in the browser (localStorage) except LLM/RSS/proxy calls initiated from the client.
- **No secrets in repo** — `.env*` files are gitignored; no API keys are committed.
- **Central policy** — `src/data/securityPolicy.ts` defines URL validation, rate limits, forbidden prompt patterns, and secret-handling rules. `src/data/platformRegistry.ts` re-exports policy + kill-switch hooks for app-wide use.

## Fixes Applied

### Content Security Policy (`index.html`)
- CSP blocks `object-src`, restricts `frame-ancestors`, sets `base-uri` and `form-action` to `'self'`.
- `connect-src` allows known LLM hosts, RSS proxies (`api.rss2json.com`, `api.allorigins.win`), Ollama localhost, and `https:` for user-configured Supabase.
- `upgrade-insecure-requests` nudges mixed content to HTTPS.
- **Remaining risk:** `script-src 'unsafe-inline'` is required for the GitHub Pages SPA redirect bootstrap script.

### XSS Prevention
- No `dangerouslySetInnerHTML` except GitHub README preview in Content Studio — content is escaped via `escapeHtml()` before markdown rendering.
- RSS feed summaries strip `<script>`, `<style>`, and HTML tags via `stripHtml()`.
- User-edited Content Studio previews for LinkedIn, YouTube, Shorts, and Twitter render as plain text.

### Fetch URL Validation
- **`isSafeFetchUrl()`** — public RSS/proxy fetches only (`http:`/`https:`, blocks localhost and private IP ranges).
- **`isAllowedOllamaUrl()`** — Ollama calls restricted to `localhost` / `127.0.0.1` over `http:` or `https:`.
- **`isAllowedHttpsUrl()`** — Supabase and integration endpoints must use HTTPS.
- **`isAllowedCloudAiBaseUrl()`** — Groq, Anthropic, OpenAI base URLs must be HTTPS to known provider hosts.
- Validators run in `connectorRegistry`, `aiService`, `ollamaAppService`, `rssFeedService`, `integrationsConfigService`, `memoryService`, and `careerIntelService`.

### AI Service Hardening
- **Rate limits** — Groq (30/min), OpenAI (20/min), Claude (20/min) via rolling window in `securityPolicy.ts`.
- **Kill switch** — `killSwitchService.ts` halts in-flight runs and blocks new `chat()` calls; wired through `aiService` with abort signals.
- **Prompt guard** — basic injection patterns blocked via `findForbiddenTerm()` before outbound LLM calls.
- **Error sanitization** — `sanitizeSecretsInMessage()` strips API keys, Bearer tokens, and JWTs from error strings; config is never logged.

### API Keys in localStorage
- Keys stored in `aaism-ai-config` / `aegis-connectors-config` as JSON.
- **Not encrypted** — any script on the origin can read browser storage.
- Settings page warns users; `saveAIConfig` / `loadAIConfig` avoid logging config contents.
- Service role keys and payment secrets are rejected on save (`integrationsConfigService.sanitizeIntegrationsConfig`).

### External Links
- All `target="_blank"` links include `rel="noopener noreferrer"`.

### RSS / CORS Proxies
- Feeds fetched via **rss2json.com** and **allorigins.win** — third-party proxies see feed URLs.
- Curated feed URLs defined in `src/data/rssSources.ts` — not user-supplied at runtime.

### Open Redirect
- No user-controlled redirect URLs in routing; React Router paths are static.

### Dependency Audit
- **Fixed (HIGH):** Vite upgraded to 6.4.3 — addresses path traversal / `server.fs.deny` bypass (dev server only).
- **Remaining (LOW/MODERATE):** `@babel/core` (low, dev-only), transitive `esbuild` advisories tied to dev tooling — no production runtime exposure in this static SPA deploy.

## User Responsibilities

1. Use Ollama locally when privacy is critical.
2. Do not enter API keys on shared or untrusted machines.
3. Keep Ollama and browser updated.
4. Review third-party proxy trust before enabling live RSS feeds on sensitive networks.
5. Use the emergency kill switch (Command Center) if an agent run needs immediate halt.

## Reporting

Report security issues via the in-app Support page or GitHub Issues.
