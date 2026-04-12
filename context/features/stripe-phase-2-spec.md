# Stripe Integration Phase 2: Webhooks, Feature Gating & UI

## Overview

Wire up the Stripe webhook handler, enforce free-tier limits in server actions, build the settings page subscription UI, and add UI polish (badges, upgrade prompts, checkout success toast). Requires Stripe CLI for local webhook testing.

## Prerequisites

- Phase 1 complete (Stripe client, config, session `isPro`, checkout/portal routes, gating utility)
- Stripe Dashboard configured: product, prices, webhook endpoint, billing portal
- Stripe CLI installed (`brew install stripe/stripe-cli/stripe`) and logged in
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` running during development

## Implementation

### 1. Webhook Handler

**New file: `src/app/api/stripe/webhook/route.ts`**

- `POST` handler — reads raw body text and `stripe-signature` header
- Verifies signature with `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET`
- Returns 400 for missing or invalid signature
- Handles three event types:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `isPro: true`, save `stripeSubscriptionId` and `stripeCustomerId` (lookup via `metadata.userId`) |
| `customer.subscription.updated` | Set `isPro` based on status (`active`/`trialing` = true, else false), update `stripeSubscriptionId` (lookup via `stripeCustomerId`) |
| `customer.subscription.deleted` | Set `isPro: false`, clear `stripeSubscriptionId` (lookup via `stripeCustomerId`) |

- Uses `updateMany` for customer-based lookups (idempotent, safe for webhook replays)
- Returns `{ received: true }` for all events including unhandled types

> No middleware/proxy changes needed — `/api/*` routes are already excluded from the auth proxy matcher.

### 2. Feature Gating in Server Actions

#### 2.1 Gate Item Creation

**File: `src/actions/items.ts`** — update `createItem()`:

- Add Pro gate: if type is `file` or `image` and `!session.user.isPro`, return error
- Add free limit check: call `canCreateItem(userId, isPro)`, return error with upgrade prompt if false
- Error messages should mention the limit and suggest upgrading

#### 2.2 Gate Collection Creation

**File: `src/actions/collections.ts`** — update `createCollection()`:

- Add free limit check: call `canCreateCollection(userId, isPro)`, return error with upgrade prompt if false

#### 2.3 Gate File Uploads

**File: `src/app/api/upload/route.ts`** — update `POST` handler:

- Add `isPro` check after auth — return 403 if not Pro

### 3. Settings Page — Subscription UI

#### 3.1 Subscription Section Component

**New file: `src/components/settings/subscription-section.tsx`**

Client component with two states:

**Pro user** (`isPro: true`):
- Crown icon with "Pro Plan" label
- Description of Pro benefits
- "Manage Subscription" button -> calls `POST /api/stripe/portal` -> redirects to Stripe Billing Portal

**Free user** (`isPro: false`):
- "You're on the Free plan" message with upgrade pitch
- Two buttons: "$8/mo - Monthly" and "$72/yr - Save 25%"
- Each calls `POST /api/stripe/checkout` with the plan -> redirects to Stripe Checkout
- Loading states prevent double-clicks

#### 3.2 Wire Into Settings Page

**File: `src/app/settings/page.tsx`**:

- Import and render `SubscriptionSection` above Editor Preferences
- Pass `isPro` and `hasSubscription` (from `stripeSubscriptionId`) as props
- Read `?checkout=success` query param and show welcome toast on successful checkout

#### 3.3 Update ProfileData

**File: `src/lib/db/profile.ts`**:

- Add `isPro` and `stripeSubscriptionId` to the `select` query and `ProfileData` type

### 4. UI Polish

#### 4.1 Checkout Success Toast

**File: `src/app/settings/page.tsx`** — client-side effect reads `?checkout=success` from URL and shows a congratulatory toast.

#### 4.2 Usage Limits on Profile

**File: `src/app/profile/page.tsx`**:

- Free users see "12 / 50 items", "2 / 3 collections"
- Pro users see "Unlimited" for both

#### 4.3 Upgrade Prompts in Error Toasts

When free users hit limits (create item/collection, upload file), the error toast text should include "Upgrade to Pro" with a link to `/settings`.

#### 4.4 Homepage Pricing Buttons

**File: `src/components/homepage/pricing-section.tsx`**:

- Logged-in users: "Upgrade to Pro" links to `/settings`
- Anonymous users: links to `/register` (existing behavior)

## Files

### New Files (2)

| File | Purpose |
|------|---------|
| `src/app/api/stripe/webhook/route.ts` | Handle Stripe webhook events |
| `src/components/settings/subscription-section.tsx` | Subscription management UI |

### Modified Files (7)

| File | Changes |
|------|---------|
| `src/actions/items.ts` | Add free limit + file type Pro gate |
| `src/actions/collections.ts` | Add free collection limit gate |
| `src/app/api/upload/route.ts` | Add `isPro` check for file uploads |
| `src/app/settings/page.tsx` | Add SubscriptionSection, checkout success toast |
| `src/lib/db/profile.ts` | Add `isPro`, `stripeSubscriptionId` to ProfileData |
| `src/app/profile/page.tsx` | Show usage limits (X / 50 items, X / 3 collections) |
| `src/components/homepage/pricing-section.tsx` | Conditional upgrade link for logged-in users |

## Testing

Requires Stripe CLI running locally (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).

### Checkout Flow
- [ ] Free user sees upgrade options on Settings page
- [ ] Monthly button redirects to Stripe Checkout with correct price
- [ ] Yearly button redirects to Stripe Checkout with correct price
- [ ] Successful checkout redirects to `/settings?checkout=success` with toast
- [ ] After checkout, `isPro` is true in session (page reload)

### Billing Portal
- [ ] Pro user sees "Manage Subscription" button
- [ ] Button opens Stripe Billing Portal
- [ ] Can switch monthly <-> yearly
- [ ] Can cancel subscription
- [ ] Return URL goes back to `/settings`

### Webhook Events
- [ ] `checkout.session.completed` sets `isPro=true`, saves IDs
- [ ] `customer.subscription.updated` (active) keeps `isPro=true`
- [ ] `customer.subscription.updated` (canceled) sets `isPro=false`
- [ ] `customer.subscription.deleted` sets `isPro=false`, clears subscription ID
- [ ] Invalid/missing signature returns 400

### Feature Gating
- [ ] Free user: create up to 50 items, 51st returns error
- [ ] Free user: create up to 3 collections, 4th returns error
- [ ] Free user: cannot create file/image items
- [ ] Free user: cannot upload files (403)
- [ ] Pro user: unlimited items, collections, file uploads
- [ ] After cancellation: existing data preserved, limits re-enforced

### Edge Cases
- [ ] GitHub OAuth user with null email — Stripe customer creation handles it
- [ ] Existing `stripeCustomerId` reused (no duplicate customers)
- [ ] Double-click prevention via loading state
- [ ] Webhook replay/retry — idempotent via `updateMany`

## Notes

- Webhook route must read the raw request body (not parsed JSON) for signature verification
- `updateMany` is used for customer-based lookups because `stripeCustomerId` could theoretically be null — safer than `update` with a unique constraint
- After webhook updates `isPro` in DB, the JWT callback in Phase 1 picks it up on next session validation — a page reload is sufficient
