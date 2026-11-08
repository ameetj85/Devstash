import { afterEach, describe, expect, it, vi } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

import { sendInvitationEmail } from '@/lib/email'

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

describe('sendInvitationEmail', () => {
  it('sends an invitation link and reports provider rejection', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('NEXTAUTH_URL', 'https://scribbles.example')
    send.mockResolvedValueOnce({ error: null })
    await sendInvitationEmail('user@example.test', 'a'.repeat(43))
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.test',
      html: expect.stringContaining(`https://scribbles.example/register?token=${'a'.repeat(43)}`),
    }))
    send.mockResolvedValueOnce({ error: { message: 'rejected' } })
    await expect(sendInvitationEmail('user@example.test', 'a'.repeat(43))).rejects.toThrow('rejected')
  })

  it('fails explicitly when email configuration is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('NEXTAUTH_URL', '')
    await expect(sendInvitationEmail('user@example.test', 'a'.repeat(43))).rejects.toThrow('must be configured')
    expect(send).not.toHaveBeenCalled()
  })
})
