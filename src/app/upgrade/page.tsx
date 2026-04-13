'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  ArrowLeft,
  Crown,
  Infinity,
  FolderOpen,
  Upload,
  Sparkles,
  Download,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const FREE_FEATURES = [
  { text: '50 items', included: true },
  { text: '3 collections', included: true },
  { text: 'Text & URL types', included: true },
  { text: 'Basic search', included: true },
  { text: 'File uploads', included: false },
  { text: 'AI features', included: false },
  { text: 'Export (JSON / ZIP)', included: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited items', icon: Infinity },
  { text: 'Unlimited collections', icon: FolderOpen },
  { text: 'All item types', icon: Crown },
  { text: 'File & image uploads', icon: Upload },
  { text: 'AI auto-tagging & summaries', icon: Sparkles },
  { text: 'Export (JSON / ZIP)', icon: Download },
  { text: 'Full search', icon: Search },
]

export default function UpgradePage() {
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)

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
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-5 py-12">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Unlock the full power of DevStash
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Get unlimited items, collections, file uploads, AI features, and more.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10 text-sm text-muted-foreground">
          <span className={!yearly ? 'text-foreground font-medium' : ''}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              yearly ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200 ${
                yearly ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
          <span className={yearly ? 'text-foreground font-medium' : ''}>Yearly</span>
          <span className="text-xs font-semibold text-green-500">Save 25%</span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Free - current plan */}
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="text-sm font-medium text-muted-foreground mb-1">Current Plan</div>
            <div className="text-xl font-semibold mb-1">Free</div>
            <div className="text-3xl font-bold mb-1">$0</div>
            <div className="text-sm text-muted-foreground mb-6">Forever free</div>
            <ul className="flex flex-col gap-2.5">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f.text}
                  className={`flex items-center gap-2 text-sm ${
                    f.included ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`}
                >
                  {f.included ? (
                    <Check className="size-4 shrink-0 text-green-500" />
                  ) : (
                    <X className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative rounded-xl border-2 border-primary bg-card p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-[0.7rem] font-semibold text-primary-foreground">
              Recommended
            </div>
            <div className="text-sm font-medium text-primary mb-1">Pro</div>
            <div className="text-xl font-semibold mb-1">
              {yearly ? '$6' : '$8'}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {yearly ? '$72' : '$8'}
              <span className="text-sm font-normal text-muted-foreground">
                {yearly ? '/year' : '/month'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              {yearly ? 'Billed annually' : 'Billed monthly'}
            </div>
            <ul className="flex flex-col gap-2.5 mb-8">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f.text}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Check className="size-4 shrink-0 text-green-500" />
                  {f.text}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleCheckout(yearly ? 'yearly' : 'monthly')}
              disabled={loading !== null}
            >
              {loading ? (
                'Redirecting to checkout...'
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro — {yearly ? '$72/year' : '$8/month'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Toggle the other option */}
        <div className="text-center text-sm text-muted-foreground">
          {yearly ? (
            <span>
              Or{' '}
              <button
                onClick={() => {
                  setYearly(false)
                  handleCheckout('monthly')
                }}
                className="text-primary hover:underline"
                disabled={loading !== null}
              >
                pay $8/month
              </button>
            </span>
          ) : (
            <span>
              Or{' '}
              <button
                onClick={() => {
                  setYearly(true)
                  handleCheckout('yearly')
                }}
                className="text-primary hover:underline"
                disabled={loading !== null}
              >
                save 25% with yearly billing ($72/year)
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
