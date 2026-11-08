'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createAdminUser } from '@/actions/admin-users'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface CreateUserDialogProps {
  onClose: () => void
}

export default function CreateUserDialog({ onClose }: CreateUserDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    emailVerified: false,
    isPro: false,
    isAdmin: false,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const result = await createAdminUser(form)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('User created')
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Failed to create user', error)
      toast.error('Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>Create an account directly. No invitation or verification email will be sent.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-user-name">Name</Label>
            <Input id="create-user-name" autoComplete="name" maxLength={255} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-user-email">Email</Label>
            <Input id="create-user-email" type="email" autoComplete="off" maxLength={255} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-user-password">Password</Label>
            <Input id="create-user-password" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-user-confirm">Confirm password</Label>
            <Input id="create-user-confirm" type="password" autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">Passwords must be at least 8 characters and at most 72 UTF-8 bytes.</p>
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-4"><Label htmlFor="create-user-verified">Email verified</Label><Switch id="create-user-verified" checked={form.emailVerified} onCheckedChange={(checked) => setForm({ ...form, emailVerified: checked })} /></div>
            <div className="flex items-center justify-between gap-4"><Label htmlFor="create-user-pro">Pro</Label><Switch id="create-user-pro" checked={form.isPro} onCheckedChange={(checked) => setForm({ ...form, isPro: checked })} /></div>
            <div className="flex items-center justify-between gap-4"><Label htmlFor="create-user-admin">Administrator</Label><Switch id="create-user-admin" checked={form.isAdmin} onCheckedChange={(checked) => setForm({ ...form, isAdmin: checked })} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create user'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
