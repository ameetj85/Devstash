import NextAuth, { CredentialsSignin } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

class EmailNotVerified extends CredentialsSignin {
  code = 'email_not_verified'
}

class RateLimited extends CredentialsSignin {
  code = 'rate_limited'
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token }) {
      if (!token.sub) return token
      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { isPro: true },
      })
      token.isPro = user?.isPro ?? false
      return token
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      session.user.isPro = (token.isPro as boolean) ?? false
      return session
    },
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const { email, password } = credentials as {
          email: string
          password: string
        }
        if (!email || !password) return null

        const ip = getIp(request as Request)
        const { allowed } = await checkRateLimit('login', `${ip}:${email}`)
        // NOTE: Retry-After header cannot be set here because NextAuth credentials
        // flow does not expose response headers from the authorize callback.
        // The frontend shows a static "15 minutes" message to match the window config.
        if (!allowed) throw new RateLimited()

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.hashedPassword) return null

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword)
        if (!passwordMatch) return null

        if (process.env.EMAIL_VERIFICATION_ENABLED === 'true' && !user.emailVerified) {
          throw new EmailNotVerified()
        }

        return user
      },
    }),
  ],
})
