import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSocialProviders, socialLoginsEnabled } from '../social-auth'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('social login configuration', () => {
  it.each([undefined, '', 'false', 'TRUE', '1'])('disables social providers when the flag is %s', (value) => {
    vi.stubEnv('SOCIAL_LOGINS_ENABLED', value)
    expect(socialLoginsEnabled()).toBe(false)
    expect(getSocialProviders()).toEqual([])
  })

  it('enables GitHub only when explicitly configured', () => {
    vi.stubEnv('SOCIAL_LOGINS_ENABLED', 'true')
    expect(socialLoginsEnabled()).toBe(true)
    expect(getSocialProviders()).toHaveLength(1)
    expect(getSocialProviders()[0]().id).toBe('github')
  })
})
