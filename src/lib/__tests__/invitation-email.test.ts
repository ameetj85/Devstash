import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn()
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) }
})
vi.mock('nodemailer', () => ({ default: { createTransport } }))

import { sendInvitationEmail, sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email'

function stubSmtpEnv() {
  vi.stubEnv('SMTP_HOST', 'smtp.example.test')
  vi.stubEnv('SMTP_PORT', '587')
  vi.stubEnv('SMTP_SECURE', 'false')
  vi.stubEnv('SMTP_USER', 'user@example.test')
  vi.stubEnv('SMTP_PASS', 'secret')
  vi.stubEnv('EMAIL_FROM', 'no-reply@example.test')
  vi.stubEnv('NEXTAUTH_URL', 'https://scribbles.example')
}

beforeEach(() => {
  createTransport.mockImplementation(() => ({ sendMail }))
})

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

describe('sendInvitationEmail', () => {
  it('sends an invitation link and reports SMTP failure', async () => {
    stubSmtpEnv()
    sendMail.mockResolvedValueOnce({})
    await sendInvitationEmail('user@example.test', 'a'.repeat(43))
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.test',
      port: 587,
      secure: false,
      auth: { user: 'user@example.test', pass: 'secret' },
    })
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'no-reply@example.test',
      to: 'user@example.test',
      html: expect.stringContaining(`https://scribbles.example/register?token=${'a'.repeat(43)}`),
    }))
    sendMail.mockRejectedValueOnce(new Error('rejected'))
    await expect(sendInvitationEmail('user@example.test', 'a'.repeat(43))).rejects.toThrow('rejected')
  })

  it('fails explicitly when email configuration is missing', async () => {
    vi.stubEnv('SMTP_HOST', '')
    vi.stubEnv('NEXTAUTH_URL', 'https://scribbles.example')
    await expect(sendInvitationEmail('user@example.test', 'a'.repeat(43))).rejects.toThrow('must be configured')
    expect(sendMail).not.toHaveBeenCalled()
  })
})

describe('other emails', () => {
  it('sends password reset and verification messages', async () => {
    stubSmtpEnv()
    sendMail.mockResolvedValue({})
    await sendPasswordResetEmail('user@example.test', 'reset-token')
    await sendVerificationEmail('user@example.test', 'verify-token')
    expect(sendMail).toHaveBeenNthCalledWith(1, expect.objectContaining({
      subject: 'Reset your password',
      html: expect.stringContaining('/reset-password?token=reset-token'),
    }))
    expect(sendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({
      subject: 'Verify your email address',
      html: expect.stringContaining('/verify-email?token=verify-token'),
    }))
  })
})
