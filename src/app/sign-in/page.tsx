import type { Metadata } from 'next'
import SignInForm from '@/components/auth/sign-in-form'
import { Navbar } from '@/components/homepage/navbar'

export const metadata: Metadata = { title: 'Sign In' }

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        <SignInForm />
      </div>
    </>
  )
}
