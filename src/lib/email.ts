import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY must be configured to send email')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendInvitationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL
  if (!baseUrl || !process.env.RESEND_API_KEY) {
    throw new Error('NEXTAUTH_URL and RESEND_API_KEY must be configured to send invitations')
  }
  const url = new URL('/register', baseUrl)
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:')) {
    throw new Error('NEXTAUTH_URL must use HTTPS in production')
  }
  url.searchParams.set('token', token)

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Scribbles <onboarding@resend.dev>',
    to: email,
    subject: 'Your invitation to Scribbles',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You're invited to Scribbles</h2>
        <p>Use this link to create your account. It expires in 7 days and can be used once.</p>
        <a href="${url.toString()}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Create account</a>
        <p>If you weren't expecting this invitation, you can ignore this email.</p>
      </div>
    `,
  })
  if (error) throw new Error(`Invitation email failed: ${error.message}`)
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  await getResend().emails.send({
    from: 'Scribbles <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Click the button below to reset your Scribbles password.
          This link expires in 1 hour.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;"
        >
          Reset password
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`

  await getResend().emails.send({
    from: 'Scribbles <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Click the button below to verify your email address and activate your Scribbles account.
          This link expires in 24 hours.
        </p>
        <a
          href="${verifyUrl}"
          style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;"
        >
          Verify email
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          If you didn't create a Scribbles account, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}
