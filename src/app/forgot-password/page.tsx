import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/forgot-password-form'

export const metadata: Metadata = { title: 'Forgot Password' }

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  )
}
