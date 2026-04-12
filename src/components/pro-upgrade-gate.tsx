'use client'

import { useState } from 'react'
import { Crown, FileIcon, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProUpgradeGateProps {
  typeName: string
}

export default function ProUpgradeGate({ typeName }: ProUpgradeGateProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const Icon = typeName === 'image' ? ImageIcon : FileIcon
  const label = typeName === 'image' ? 'Images' : 'Files'

  async function handleCheckout(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        console.error('Checkout failed:', res.status)
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6 max-w-md mx-auto">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{label} are a Pro feature</h1>
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro to upload and manage {typeName === 'image' ? 'images' : 'files'}, plus get unlimited items,
            collections, and AI features.
          </p>
        </div>
        <div className="flex items-center gap-2 text-yellow-500">
          <Crown className="w-5 h-5" />
          <span className="text-sm font-medium">Pro Plan</span>
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
      </div>
    </main>
  )
}
