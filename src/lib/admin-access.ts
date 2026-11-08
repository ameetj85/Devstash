import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isUserAdmin } from '@/lib/db/admin'

export async function requireAdmin() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/sign-in')
  if (!(await isUserAdmin(userId))) redirect('/dashboard')

  return session
}
