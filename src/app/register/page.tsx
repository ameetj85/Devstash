import type { Metadata } from 'next'
import RegisterForm from '@/components/auth/register-form'
import RegistrationClosed from '@/components/auth/registration-closed'
import { Navbar } from '@/components/homepage/navbar'
import { socialLoginsEnabled } from '@/lib/social-auth'

export const metadata: Metadata = { title: 'Register' }
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const registrationEnabled = process.env.REGISTRATION_ENABLED === 'true'
  console.log('Registration enabled:', registrationEnabled);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        {registrationEnabled ? <RegisterForm socialLoginsEnabled={socialLoginsEnabled()} /> : <RegistrationClosed />}
      </div>
    </>
  )
}
