# Stripe Integration Phase 1: Core Infrastructure

## Overview

Set up the Stripe library, configuration, session `isPro` exposure, checkout/portal API routes, and the subscription gating utility with unit tests. This phase produces all the backend plumbing needed before wiring up webhooks or UI.

## Requirements

- Install `stripe` npm package
- Fix `.env.example` typos (`SRPE_` -> `STRIPE_`)
- Create Stripe client singleton and plan/limit constants
- Expose `isPro` on the NextAuth session via JWT callback
- Create Checkout and Billing Portal API routes
- Create subscription gating utility functions with unit tests

## Environment Variables

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
```

## Implementation

### 1. Install & Config

- `npm install stripe`
- Fix `.env.example`: rename `SRPE_PRICE_ID_MONTHLY` -> `STRIPE_PRICE_ID_MONTHLY`, `SRPE_PRICE_ID_YEARLY` -> `STRIPE_PRICE_ID_YEARLY`
- Create `src/lib/stripe.ts` — Stripe client singleton using `process.env.STRIPE_SECRET_KEY`
- Create `src/lib/stripe-config.ts` — `STRIPE_PLANS` (monthly/yearly with priceId, price, interval) and `FREE_LIMITS` ({ items: 50, collections: 3 })

### 2. Session — Expose `isPro`

- Update `src/types/next-auth.d.ts` — add `isPro: boolean` to Session user type
- Update `src/auth.ts` — add `jwt` callback that queries `prisma.user.findUnique({ select: { isPro: true } })` on every token refresh, sets `token.isPro`
- Update existing `session` callback to set `session.user.isPro` from `token.isPro`

> This adds one small DB query per session validation but guarantees the session stays in sync after Stripe webhook updates.

### 3. Checkout API Route

**New file: `src/app/api/stripe/checkout/route.ts`**

- `POST` handler, auth-protected
- Accepts `{ plan: 'monthly' | 'yearly' }` in request body
- Validates plan against `STRIPE_PLANS`
- Reuses existing `stripeCustomerId` or creates new Stripe customer (with `metadata.userId`)
- Saves `stripeCustomerId` to user record if newly created
- Creates `stripe.checkout.sessions.create()` with subscription mode
- Returns `{ url }` for client redirect
- Success URL: `/settings?checkout=success`, Cancel URL: `/settings?checkout=cancelled`

### 4. Billing Portal API Route

**New file: `src/app/api/stripe/portal/route.ts`**

- `POST` handler, auth-protected
- Looks up user's `stripeCustomerId`
- Returns 400 if no billing account
- Creates `stripe.billingPortal.sessions.create()` with return URL `/settings`
- Returns `{ url }` for client redirect

### 5. Subscription Gating Utility

**New file: `src/lib/subscription.ts`**

| Function | Logic |
|----------|-------|
| `canCreateItem(userId, isPro)` | Pro -> true; else count items < 50 |
| `canCreateCollection(userId, isPro)` | Pro -> true; else count collections < 3 |
| `canUseFileUpload(isPro)` | Returns `isPro` |

### 6. Unit Tests

**New file: `src/lib/__tests__/subscription.test.ts`**

Test cases for each gating function:
- `canCreateItem`: Pro user always returns true
- `canCreateItem`: Free user under limit returns true
- `canCreateItem`: Free user at limit (50) returns false
- `canCreateCollection`: Pro user always returns true
- `canCreateCollection`: Free user under limit returns true
- `canCreateCollection`: Free user at limit (3) returns false
- `canUseFileUpload`: Pro user returns true
- `canUseFileUpload`: Free user returns false

Mock `@/lib/prisma` for count queries. These tests run with `npm test` — no Stripe CLI or real DB needed.

## Files

### New Files (6)

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe client singleton |
| `src/lib/stripe-config.ts` | Plan prices, free tier limits |
| `src/lib/subscription.ts` | Gating utility functions |
| `src/app/api/stripe/checkout/route.ts` | Create Stripe Checkout session |
| `src/app/api/stripe/portal/route.ts` | Create Stripe Billing Portal session |
| `src/lib/__tests__/subscription.test.ts` | Unit tests for gating functions |

### Modified Files (3)

| File | Changes |
|------|---------|
| `.env.example` | Fix `SRPE_` -> `STRIPE_` typos |
| `src/auth.ts` | Add `jwt` callback to sync `isPro` from DB |
| `src/types/next-auth.d.ts` | Add `isPro: boolean` to Session type |

## Notes

- Use the latest Stripe API version available at implementation time
- `FREE_LIMITS` constants will also be imported by Phase 2 for error messages
- Checkout/portal routes can be manually tested with Stripe test mode keys but full flow validation happens in Phase 2 with the webhook
