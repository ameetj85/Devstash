'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { sendInvitation } from '@/actions/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SendInvites() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    try {
      const result = await sendInvitation(email)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Invitation sent')
      setEmail('')
    } catch (error) {
      console.error('Failed to send invitation', error)
      toast.error('Could not send invitation. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Send Invites</h2>
        <p className="text-sm text-muted-foreground">Invite someone to create an account. Links expire after 7 days and can be used once. Sending another invitation replaces the previous link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email address</Label>
          <Input id="invite-email" type="email" autoComplete="email" maxLength={255} required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send invitation'}</Button>
      </form>
    </div>
  )
}
