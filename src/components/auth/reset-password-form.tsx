'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, confirmPassword }),
    })

    setLoading(false)

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    toast.success('Password reset! You can now sign in.')
    router.push('/sign-in')
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Invalid link</h1>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full text-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      {/* Back to sign in */}
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
