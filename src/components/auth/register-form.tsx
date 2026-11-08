'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import GitHubSignInButton from './github-sign-in-button'

interface RegisterFormProps {
  socialLoginsEnabled: boolean
  invitation: { email: string; token: string }
}

export default function RegisterForm({ socialLoginsEnabled, invitation }: RegisterFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: invitation.email,
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          token: invitation.token,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.')
        return
      }
      toast.success('Account created! You can now sign in.')
      router.push('/sign-in')
    } catch (error) {
      console.error('Registration request failed', error)
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">Start saving your developer knowledge</p>
      </div>

      {socialLoginsEnabled && (
        <>
          <GitHubSignInButton label="Sign up with GitHub" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Brad Traversy"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            readOnly
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={8}
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      {/* Sign in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
