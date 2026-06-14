# Payment Integration — AAISM (GitHub Pages static deploy)

AAISM runs as a static SPA on GitHub Pages. Payments use **hosted checkout URLs** from payment providers — no server-side code required for basic donations.

## Setup

1. **In-app (recommended for GitHub Pages users):** Settings → Integrations — add Stripe/Razorpay hosted checkout URLs and optional Supabase config. Stored in `localStorage` only.
2. **Build-time (maintainers):** Copy `.env.example` to `.env.local`, add hosted checkout URLs, rebuild with `npm run build:pages`

In-app config overrides env vars when set.

## Supported providers

| Provider | Env var | Return URLs |
|----------|---------|-------------|
| Stripe Payment Links | `VITE_DONATE_STRIPE` | Configure success/cancel in Stripe Dashboard → `{origin}{base}/donate/success` and `/donate/cancel` |
| Razorpay Payment Links | `VITE_DONATE_RAZORPAY` | Set callback URL in Razorpay dashboard |
| PayPal.me / Ko-fi / BMC | `VITE_DONATE_*` | Provider handles receipts |

## Return routes

- `/donate/success` — shown after successful checkout redirect
- `/donate/cancel` — shown when user cancels

Base path on GitHub Pages: `/aaism-study-app/` (see `vite.config.ts`).

## Webhook stubs (future server)

For production payment confirmation beyond client redirects, add a serverless function:

```typescript
// Example: api/stripe-webhook.ts (Vercel/Netlify — NOT in static Pages deploy)
// 1. Verify Stripe signature
// 2. Log payment_intent.succeeded
// 3. Optional: update supporter ledger in Supabase
```

Static GitHub Pages cannot receive webhooks directly. Options:
- Vercel/Netlify serverless function on a subdomain
- Supabase Edge Function
- Manual reconciliation via provider dashboard

## Security

- Never commit API secrets or webhook signing keys
- Client-side env vars (`VITE_*`) are public — only use publishable keys and hosted checkout URLs
- In-app Integrations settings (`aaism-integrations-config`) stay in the user's browser — not in the public GitHub repo
- ✅ Safe: hosted checkout URLs, Stripe publishable key, Razorpay key_id
- ❌ Never: Stripe secret key (sk_…), Razorpay key_secret, webhook secrets, Supabase service role key
