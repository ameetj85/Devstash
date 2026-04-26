# Stripe Subscription Integration Plan

> Scribbles Pro: $8/mo monthly, $72/yr ($6/mo) annual

---

## Table of Contents

- [Current State Analysis](#current-state-analysis)
- [Feature Gating Analysis](#feature-gating-analysis)
- [Implementation Plan](#implementation-plan)
- [Stripe Dashboard Setup](#stripe-dashboard-setup)
- [Testing Checklist](#testing-checklist)

---

## Current State Analysis

### User Model (schema.prisma)

The schema already has the three Stripe-related fields on the `User` model:

```prisma
isPro                Boolean   @default(false)
stripeCustomerId     String?   @unique
stripeSubscriptionId String?   @unique
```

No migration needed for the User model.

### NextAuth Configuration

**`src/auth.ts`** — Uses JWT strategy with `PrismaAdapter`. The `session` callback currently only sets `session.user.id` from `token.sub`. It does **not** expose `isPro` on the session.

**`src/auth.config.ts`** — Edge-safe config with providers only (GitHub + Credentials).

**`src/types/next-auth.d.ts`** — Extends `Session` with `user.id`. Needs to also add `isPro`.

### Session Data Flow

All server pages call `await auth()` to get `session.user.id`, then query the DB directly. The `isPro` field is not currently read anywhere in the app.

### Environment Variables (.env.example)

Already has placeholders (with a typo to fix):

```
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PUBLISHABLE_KEY=""
SRPE_PRICE_ID_MONTHLY=""   # ← typo, should be STRIPE_PRICE_ID_MONTHLY
SRPE_PRICE_ID_YEARLY=""    # ← typo, should be STRIPE_PRICE_ID_YEARLY
```

### Existing Patterns

- **API routes**: `src/app/api/` — Standard `NextResponse.json()` pattern with auth checks via `await auth()`
- **Server actions**: `src/actions/` — `{ success, data, error }` return pattern with Zod validation
- **Rate limiting**: `src/lib/rate-limit.ts` — Upstash Redis with sliding window, fail-open design
- **Error handling**: Try/catch in actions, toast notifications on the client

---

## Feature Gating Analysis

### Free Tier Limits (from project spec)

| Resource    | Free Limit | Pro      |
|-------------|-----------|----------|
| Items       | 50        | Unlimited |
| Collections | 3         | Unlimited |

### Where Limits Should Be Enforced

| Action | File | Function | Gate Type |
|--------|------|----------|-----------|
| Create item | `src/actions/items.ts` | `createItem()` | Count check (50 items) |
| Create collection | `src/actions/collections.ts` | `createCollection()` | Count check (3 collections) |
| Upload file/image | `src/app/api/upload/route.ts` | `POST` handler | `isPro` check |
| Create file/image item | `src/actions/items.ts` | `createItem()` | `isPro` + type check |

### Pro-Only Features (Future — Not in This Implementation)

These features don't exist yet but should be gated when built:

| Feature | Gate |
|---------|------|
| AI auto-tagging | `isPro` check in AI action |
| AI summaries | `isPro` check in AI action |
| AI code explanation | `isPro` check in AI action |
| AI prompt optimizer | `isPro` check in AI action |
| Custom item types | `isPro` check in type creation |
| Export (JSON/ZIP) | `isPro` check in export action |
| Full search | `isPro` check (basic search for free) |

### UI Indicators Already Present

- **Sidebar**: "PRO" badge on File and Image types (`src/components/dashboard/sidebar.tsx:115-118`)
- **Homepage pricing**: Free vs Pro card comparison (`src/components/homepage/pricing-section.tsx`)

---

## Implementation Plan

### Phase 1: Stripe Library & Config

#### 1.1 Install Stripe

```bash
npm install stripe
```

#### 1.2 Fix `.env.example` typos

**File: `.env.example`**

```diff
- SRPE_PRICE_ID_MONTHLY=""
- SRPE_PRICE_ID_YEARLY=""
+ STRIPE_PRICE_ID_MONTHLY=""
+ STRIPE_PRICE_ID_YEARLY=""
```

#### 1.3 Create Stripe client singleton

**New file: `src/lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
})
```

> Use the latest API version available when implementing. Check Stripe docs for the current version.

#### 1.4 Create Stripe constants

**New file: `src/lib/stripe-config.ts`**

```typescript
export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY!,
    price: 8,
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_ID_YEARLY!,
    price: 72,
    interval: 'year' as const,
  },
}

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const
```

---

### Phase 2: Session — Expose `isPro`

#### 2.1 Update NextAuth type declaration

**File: `src/types/next-auth.d.ts`**

```typescript
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isPro: boolean
    } & DefaultSession['user']
  }
}
```

#### 2.2 Update JWT callback to sync `isPro` from DB

**File: `src/auth.ts`** — Add `jwt` callback that always reads `isPro` from the database:

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id
    }

    // Always sync isPro from database to catch webhook updates
    if (token.sub) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { isPro: true },
      })
      token.isPro = dbUser?.isPro ?? false
    }

    return token
  },
  session({ session, token }) {
    if (token.sub) {
      session.user.id = token.sub
    }
    session.user.isPro = (token.isPro as boolean) ?? false
    return session
  },
},
```

> This adds one small DB query per session validation but guarantees the session stays in sync after Stripe webhook updates. A page reload after checkout is sufficient.

---

### Phase 3: Checkout & Billing Portal

#### 3.1 Create Checkout API route

**New file: `src/app/api/stripe/checkout/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { STRIPE_PLANS } from '@/lib/stripe-config'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const plan = body.plan as 'monthly' | 'yearly'

  if (!plan || !STRIPE_PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Reuse existing Stripe customer or create new one
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: STRIPE_PLANS[plan].priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/settings?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings?checkout=cancelled`,
    metadata: { userId: session.user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
```

#### 3.2 Create Billing Portal API route

**New file: `src/app/api/stripe/portal/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
```

---

### Phase 4: Stripe Webhook

#### 4.1 Create webhook handler

**New file: `src/app/api/stripe/webhook/route.ts`**

This is the most critical file. Handles subscription lifecycle events.

```typescript
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const userId = session.metadata?.userId
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPro: true,
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
            },
          })
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const isActive = ['active', 'trialing'].includes(subscription.status)
      await prisma.user.updateMany({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          isPro: isActive,
          stripeSubscriptionId: subscription.id,
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          isPro: false,
          stripeSubscriptionId: null,
        },
      })
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }

  return NextResponse.json({ received: true })
}
```

#### 4.2 Exclude webhook from proxy auth

**File: `src/proxy.ts`** — No change needed. The proxy matcher already excludes `/api/*` routes:

```typescript
matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
```

---

### Phase 5: Feature Gating

#### 5.1 Create gating utility

**New file: `src/lib/subscription.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { FREE_LIMITS } from '@/lib/stripe-config'

export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true
  const count = await prisma.item.count({ where: { userId } })
  return count < FREE_LIMITS.items
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true
  const count = await prisma.collection.count({ where: { userId } })
  return count < FREE_LIMITS.collections
}

export function canUseFileUpload(isPro: boolean): boolean {
  return isPro
}
```

#### 5.2 Gate item creation

**File: `src/actions/items.ts`** — Add limit check to `createItem()`:

```typescript
import { canCreateItem, canUseFileUpload } from '@/lib/subscription'

export async function createItem(data: CreateItemInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  // Pro gate: file/image types
  if ((data.typeName === 'file' || data.typeName === 'image') && !session.user.isPro) {
    return { success: false as const, error: 'File and image types require a Pro subscription' }
  }

  // Free tier limit check
  if (!(await canCreateItem(session.user.id, session.user.isPro))) {
    return { success: false as const, error: 'Free plan limit reached (50 items). Upgrade to Pro for unlimited items.' }
  }

  // ... rest of existing logic
}
```

#### 5.3 Gate collection creation

**File: `src/actions/collections.ts`** — Add limit check to `createCollection()`:

```typescript
import { canCreateCollection } from '@/lib/subscription'

export async function createCollection(data: CreateCollectionInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  if (!(await canCreateCollection(session.user.id, session.user.isPro))) {
    return { success: false as const, error: 'Free plan limit reached (3 collections). Upgrade to Pro for unlimited collections.' }
  }

  // ... rest of existing logic
}
```

#### 5.4 Gate file uploads

**File: `src/app/api/upload/route.ts`** — Add `isPro` check:

```typescript
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isPro) {
    return NextResponse.json({ error: 'File uploads require a Pro subscription' }, { status: 403 })
  }

  // ... rest of existing logic
}
```

---

### Phase 6: Settings Page — Subscription Management UI

#### 6.1 Create subscription section component

**New file: `src/components/settings/subscription-section.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SubscriptionSectionProps {
  isPro: boolean
  hasSubscription: boolean
}

export default function SubscriptionSection({ isPro, hasSubscription }: SubscriptionSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to create checkout session')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to open billing portal')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  if (isPro) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Subscription
        </h2>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="font-semibold">Pro Plan</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You have access to all Pro features including unlimited items, collections, file uploads, and AI features.
        </p>
        <Button variant="outline" onClick={handlePortal} disabled={loading === 'portal'}>
          {loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Subscription
      </h2>
      <p className="text-sm text-muted-foreground">
        You&apos;re on the <strong>Free plan</strong>. Upgrade to Pro for unlimited items, collections, file uploads, and AI features.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => handleCheckout('monthly')} disabled={loading !== null}>
          {loading === 'monthly' ? 'Loading...' : '$8/mo — Monthly'}
        </Button>
        <Button variant="outline" onClick={() => handleCheckout('yearly')} disabled={loading !== null}>
          {loading === 'yearly' ? 'Loading...' : '$72/yr — Save 25%'}
        </Button>
      </div>
    </section>
  )
}
```

#### 6.2 Add subscription section to settings page

**File: `src/app/settings/page.tsx`** — Add the subscription section at the top, above Editor Preferences:

```typescript
import SubscriptionSection from '@/components/settings/subscription-section'

// In the component, after the header, before Editor Preferences:
<SubscriptionSection isPro={profile.isPro} hasSubscription={!!profile.stripeSubscriptionId} />
```

This requires adding `isPro` and `stripeSubscriptionId` to `ProfileData`.

#### 6.3 Update ProfileData to include subscription info

**File: `src/lib/db/profile.ts`** — Add to the `user` select query:

```typescript
select: {
  // ...existing fields...
  isPro: true,
  stripeSubscriptionId: true,
}
```

And add to the `ProfileData` type:

```typescript
isPro: boolean
stripeSubscriptionId: string | null
```

---

### Phase 7: UI Polish

#### 7.1 Show Pro badge in profile/settings

Display a "Pro" badge next to the user name or in the sidebar user area when `isPro` is true.

#### 7.2 Show usage limits on profile page

**File: `src/app/profile/page.tsx`** — Below the usage stats, show:
- "12 / 50 items" for free users
- "Unlimited" for Pro users

#### 7.3 Show upgrade prompts in limit error toasts

When a free user hits a limit (create item/collection, upload file), the error toast should include an "Upgrade" link to `/settings`.

#### 7.4 Checkout success toast

**File: `src/app/settings/page.tsx`** — Read `?checkout=success` query param and show a welcome toast.

#### 7.5 Update homepage pricing buttons

**File: `src/components/homepage/pricing-section.tsx`** — Change "Upgrade to Pro" link from `/register` to `/settings` for logged-in users (or keep `/register` for anonymous users and handle redirect post-login).

---

## Files Summary

### New Files (7)

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe client singleton |
| `src/lib/stripe-config.ts` | Plan prices, free tier limits |
| `src/lib/subscription.ts` | Gating utility functions |
| `src/app/api/stripe/checkout/route.ts` | Create Stripe Checkout session |
| `src/app/api/stripe/portal/route.ts` | Create Stripe Billing Portal session |
| `src/app/api/stripe/webhook/route.ts` | Handle Stripe webhook events |
| `src/components/settings/subscription-section.tsx` | Subscription management UI |

### Modified Files (9)

| File | Changes |
|------|---------|
| `.env.example` | Fix `SRPE_` → `STRIPE_` typos |
| `src/auth.ts` | Add `jwt` callback to sync `isPro` from DB |
| `src/types/next-auth.d.ts` | Add `isPro: boolean` to Session type |
| `src/actions/items.ts` | Add free limit + file type Pro gate |
| `src/actions/collections.ts` | Add free collection limit gate |
| `src/app/api/upload/route.ts` | Add `isPro` check for file uploads |
| `src/app/settings/page.tsx` | Add `SubscriptionSection` component |
| `src/lib/db/profile.ts` | Add `isPro`, `stripeSubscriptionId` to ProfileData |
| `src/lib/constants.ts` | (Optional) Move `FREE_LIMITS` here if preferred |

---

## Stripe Dashboard Setup

### 1. Create Product

- **Name**: Scribbles Pro
- **Description**: Unlimited items, collections, file uploads, AI features

### 2. Create Prices

| Price | Amount | Interval | ID → env var |
|-------|--------|----------|-------------|
| Monthly | $8.00 | month | `STRIPE_PRICE_ID_MONTHLY` |
| Yearly | $72.00 | year | `STRIPE_PRICE_ID_YEARLY` |

### 3. Configure Webhook

- **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
- **Events to listen for**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

### 4. Configure Billing Portal

In Stripe Dashboard → Settings → Billing → Customer Portal:
- Enable subscription cancellation
- Enable plan switching (monthly ↔ yearly)
- Enable invoice history
- Set return URL to `https://your-domain.com/settings`

### 5. Environment Variables (all)

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."       # For future client-side use
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
```

### 6. Local Development with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Use the webhook signing secret output by the CLI for STRIPE_WEBHOOK_SECRET
```

---

## Testing Checklist

### Checkout Flow
- [ ] Free user can see upgrade options on Settings page
- [ ] Clicking "Monthly" redirects to Stripe Checkout with correct price
- [ ] Clicking "Yearly" redirects to Stripe Checkout with correct price
- [ ] Successful checkout redirects to `/settings?checkout=success`
- [ ] After checkout, `isPro` is `true` in session (may require page reload)
- [ ] User model updated: `isPro=true`, `stripeCustomerId`, `stripeSubscriptionId`

### Billing Portal
- [ ] Pro user sees "Manage Subscription" button on Settings page
- [ ] Clicking opens Stripe Billing Portal
- [ ] User can switch between monthly and yearly
- [ ] User can cancel subscription
- [ ] Returning from portal goes back to `/settings`

### Webhook Events
- [ ] `checkout.session.completed` → sets `isPro=true`
- [ ] `customer.subscription.updated` (active) → keeps `isPro=true`
- [ ] `customer.subscription.updated` (canceled/past_due) → sets `isPro=false`
- [ ] `customer.subscription.deleted` → sets `isPro=false`, clears `stripeSubscriptionId`
- [ ] Invalid webhook signature → 400 response
- [ ] Missing signature header → 400 response

### Feature Gating
- [ ] Free user: can create up to 50 items
- [ ] Free user: 51st item returns error with upgrade prompt
- [ ] Free user: can create up to 3 collections
- [ ] Free user: 4th collection returns error with upgrade prompt
- [ ] Free user: cannot create file/image item types → error message
- [ ] Free user: cannot upload files → 403 response
- [ ] Pro user: unlimited items (no count check)
- [ ] Pro user: unlimited collections (no count check)
- [ ] Pro user: can create file/image items and upload files
- [ ] After cancellation: existing items/collections preserved, just can't create beyond limits

### Session Sync
- [ ] After webhook updates `isPro`, a page reload reflects the new status
- [ ] Session `isPro` matches DB `isPro` on every page load

### Edge Cases
- [ ] User with GitHub OAuth (no email initially) — Stripe customer creation handles `null` email
- [ ] User who already has a `stripeCustomerId` — reuses existing customer
- [ ] Double-clicking checkout button — loading state prevents duplicate sessions
- [ ] Webhook replay/retry — idempotent updates (updateMany is safe)

---

## Implementation Order

1. **Phase 1**: Stripe library, config, env fixes
2. **Phase 2**: Session — expose `isPro` via JWT callback
3. **Phase 3**: Checkout + Billing Portal API routes
4. **Phase 4**: Webhook handler
5. **Phase 5**: Feature gating in actions
6. **Phase 6**: Settings page subscription UI
7. **Phase 7**: UI polish (badges, limit indicators, upgrade prompts)

> Each phase can be tested independently. Phase 2 should be validated first since all subsequent phases depend on `isPro` being in the session.
