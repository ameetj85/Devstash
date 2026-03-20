'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong.')
        return
      }

      toast.success('Password updated successfully.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Change Password
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Current password</label>
        <Input
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">New password</label>
        <Input
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Confirm new password</label>
        <Input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          minLength={8}
          required
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save password'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
