import type { Metadata } from 'next'
import { Suspense } from 'react'
import ResetPasswordForm from '@/components/auth/reset-password-form'

export const metadata: Metadata = { title: 'Reset Password' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
