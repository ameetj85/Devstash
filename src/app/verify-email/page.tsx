import { Suspense } from 'react'
import VerifyEmailClient from '@/components/auth/verify-email-client'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
        <VerifyEmailClient />
      </Suspense>
    </div>
  )
}
