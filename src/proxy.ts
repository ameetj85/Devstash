import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)

export const proxy = auth(function proxy(req) {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isDashboard = nextUrl.pathname.startsWith('/dashboard')

  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL('/sign-in', nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
