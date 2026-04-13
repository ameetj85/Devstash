import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)

export const proxy = auth(function proxy(req) {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isProtected =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/profile') ||
    nextUrl.pathname.startsWith('/items') ||
    nextUrl.pathname.startsWith('/collections') ||
    nextUrl.pathname.startsWith('/settings') ||
    nextUrl.pathname.startsWith('/favorites') ||
    nextUrl.pathname.startsWith('/upgrade')

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL('/sign-in', nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
