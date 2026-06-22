# MVP — next round blockers

Do not fake these in UI. Ship only when backend + legal are ready.

## Stripe & payments

- Live Stripe Checkout or Payment Element (not URL-only config)
- Webhook endpoint for `checkout.session.completed` (and Razorpay/PayPal equivalents)
- Idempotent payment confirmation → entitlements store
- Donate success page must only claim "Payment received" when webhook/session param is verified server-side

## Entitlements & Pro tier

- Server-side entitlement model (not mission-count / localStorage unlock)
- Map Stripe customer/subscription → feature flags
- Replace Explorer-tier engagement gate with real free vs paid matrix
- Pro waitlist → paid checkout flow

## Legal & trust

- Terms of Service
- Privacy policy review for paid accounts (if cloud sync expands)
- Refund / cancellation policy for donations and feature requests

## App Store / distribution

- Mac App Store metadata, review, and sandbox IAP (if selling in-app)
- `docs/APP_STORE.md` checklist completion
- Release signing and notarization pipeline for production `.app`

## Ops

- Hosted webhook receiver (not GitHub Pages static only)
- Payment misconfig alerts wired to real config state
- Feature-request paid tiers tied to fulfillment workflow
