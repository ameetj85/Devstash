import { describe, expect, it } from 'vitest'
import { isAllowedImageUrl } from '@/lib/image-hosts'

describe('isAllowedImageUrl', () => {
  it.each([
    ['https://avatars.githubusercontent.com/u/123', true],
    ['https://pub-8f096ef8fd4845ec899196fba35f7096.r2.dev/image.png', true],
    ['http://avatars.githubusercontent.com/u/123', false],
    ['https://avatars.githubusercontent.com.example.org/u/123', false],
    ['https://avatars.githubusercontent.com:8443/u/123', false],
    ['https://user@avatars.githubusercontent.com/u/123', false],
    ['not a url', false],
  ])('validates %s', (url, allowed) => {
    expect(isAllowedImageUrl(url)).toBe(allowed)
  })
})
