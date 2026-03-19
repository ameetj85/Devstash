'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
        } else {
          setStatus('success')
          setMessage(data.message)
          setTimeout(() => router.push('/sign-in'), 3000)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [token, router])

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      {status === 'loading' && (
        <>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying your email…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="text-4xl">✓</div>
          <h1 className="text-2xl font-bold">Email verified!</h1>
          <p className="text-muted-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
          <Link
            href="/sign-in"
            className="block w-full text-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Sign in now
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="text-4xl">✕</div>
          <h1 className="text-2xl font-bold">Verification failed</h1>
          <p className="text-muted-foreground">{message}</p>
          <Link
            href="/sign-in"
            className="block w-full text-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Back to sign in
          </Link>
        </>
      )}
    </div>
  )
}
