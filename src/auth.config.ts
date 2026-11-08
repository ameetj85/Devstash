import Credentials from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth'
import { getSocialProviders } from '@/lib/social-auth'

export default {
  trustHost: true,
  pages: {
    signIn: '/sign-in',
  },
  providers: [
    ...getSocialProviders(),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // Actual authorize logic is overridden in auth.ts with bcrypt
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig
