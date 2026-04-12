'use client'

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FREE_LIMITS } from '@/lib/stripe-config'

interface SubscriptionSectionProps {
  isPro: boolean
  hasSubscription: boolean
  totalItems: number
  totalCollections: number
}

export default function SubscriptionSection({ isPro, hasSubscription, totalItems, totalCollections }: SubscriptionSectionProps) {
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
      }
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
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
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">Pro Plan</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You have access to unlimited items, collections, file uploads, and AI features.
        </p>
        {hasSubscription && (
          <Button
            variant="outline"
            onClick={handlePortal}
            disabled={loading === 'portal'}
          >
            {loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
          </Button>
        )}
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Subscription
      </h2>
      <p className="text-sm text-muted-foreground">
        You&apos;re on the <span className="font-medium text-foreground">Free plan</span>.
        Upgrade to Pro for unlimited items, collections, file uploads, and AI features.
      </p>
      <div className="flex gap-4 text-sm">
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <span className="font-medium text-foreground">{totalItems}</span>
          <span className="text-muted-foreground"> / {FREE_LIMITS.items} items</span>
        </div>
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <span className="font-medium text-foreground">{totalCollections}</span>
          <span className="text-muted-foreground"> / {FREE_LIMITS.collections} collections</span>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => handleCheckout('monthly')}
          disabled={loading !== null}
        >
          {loading === 'monthly' ? 'Loading...' : '$8/mo — Monthly'}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleCheckout('yearly')}
          disabled={loading !== null}
        >
          {loading === 'yearly' ? 'Loading...' : '$72/yr — Save 25%'}
        </Button>
      </div>
    </section>
  )
}
