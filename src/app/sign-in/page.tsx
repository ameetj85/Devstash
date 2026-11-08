import type { Metadata } from 'next'
import SignInForm from '@/components/auth/sign-in-form'
import { Navbar } from '@/components/homepage/navbar'
import { socialLoginsEnabled } from '@/lib/social-auth'

export const metadata: Metadata = { title: 'Sign In' }
export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        <SignInForm socialLoginsEnabled={socialLoginsEnabled()} />
      </div>
    </>
  )
}
