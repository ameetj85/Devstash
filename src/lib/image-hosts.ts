export const IMAGE_HOSTNAMES = [
  'avatars.githubusercontent.com',
  'pub-8f096ef8fd4845ec899196fba35f7096.r2.dev',
] as const

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.port && !url.username && !url.password &&
      IMAGE_HOSTNAMES.some((hostname) => hostname === url.hostname)
  } catch {
    return false
  }
}
