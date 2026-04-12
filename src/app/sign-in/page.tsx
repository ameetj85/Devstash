import type { Metadata } from 'next'
import SignInForm from '@/components/auth/sign-in-form'

export const metadata: Metadata = { title: 'Sign In' }

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignInForm />
    </div>
  )
}
