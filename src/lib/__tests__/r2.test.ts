import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { keyFromUrl } from '@/lib/r2'

describe('keyFromUrl', () => {
  const originalEnv = process.env.R2_PUBLIC_URL

  beforeEach(() => {
    process.env.R2_PUBLIC_URL = 'https://pub-abc123.r2.dev'
  })

  afterEach(() => {
    process.env.R2_PUBLIC_URL = originalEnv
  })

  it('extracts the key from a valid file URL', () => {
    const result = keyFromUrl('https://pub-abc123.r2.dev/user-1/uuid-file.pdf')
    expect(result).toBe('user-1/uuid-file.pdf')
  })

  it('handles a public URL with a trailing slash', () => {
    process.env.R2_PUBLIC_URL = 'https://pub-abc123.r2.dev/'
    const result = keyFromUrl('https://pub-abc123.r2.dev/user-1/uuid-file.pdf')
    expect(result).toBe('user-1/uuid-file.pdf')
  })

  it('returns null when URL does not match the public base URL', () => {
    const result = keyFromUrl('https://other-bucket.r2.dev/user-1/file.pdf')
    expect(result).toBeNull()
  })

  it('returns null when R2_PUBLIC_URL env var is not set', () => {
    delete process.env.R2_PUBLIC_URL
    const result = keyFromUrl('https://pub-abc123.r2.dev/user-1/file.pdf')
    expect(result).toBeNull()
  })
})
