import type { Metadata } from 'next'
import RegisterForm from '@/components/auth/register-form'
import { Navbar } from '@/components/homepage/navbar'

export const metadata: Metadata = { title: 'Register' }

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        <RegisterForm />
      </div>
    </>
  )
}
