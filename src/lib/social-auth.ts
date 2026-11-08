import GitHub from 'next-auth/providers/github'

export function socialLoginsEnabled(): boolean {
  return process.env.SOCIAL_LOGINS_ENABLED === 'true'
}

export function getSocialProviders() {
  return socialLoginsEnabled() ? [GitHub] : []
}
