import type { Metadata } from 'next'
import RegisterForm from '@/components/auth/register-form'
import RegistrationClosed from '@/components/auth/registration-closed'
import { Navbar } from '@/components/homepage/navbar'
import { getValidInvitation } from '@/lib/invitations'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Register' }
export const dynamic = 'force-dynamic'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams
  const invitation = typeof token === 'string' ? await getValidInvitation(token) : null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        {invitation && typeof token === 'string' ? (
          <RegisterForm socialLoginsEnabled={false} invitation={{ email: invitation.email, token }} />
        ) : token ? (
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
            <h1 className="text-xl font-semibold">Invitation unavailable</h1>
            <p className="mt-3 text-sm text-muted-foreground">This invitation is invalid, expired, or already used. Please request a new invitation.</p>
            <Link href="/sign-in" className="mt-4 inline-block text-sm underline">Sign in</Link>
          </div>
        ) : <RegistrationClosed />}
      </div>
    </>
  )
}
