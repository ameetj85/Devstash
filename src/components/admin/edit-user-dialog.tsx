'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateAdminUser } from '@/actions/admin-users'
import type { AdminUser } from '@/lib/db/admin'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface EditUserDialogProps {
  user: AdminUser
  currentUserId: string
  onClose: () => void
}

export default function EditUserDialog({ user, currentUserId, onClose }: EditUserDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: user.name ?? '',
    email: user.email ?? '',
    image: user.image ?? '',
    emailVerified: !!user.emailVerified,
    isAdmin: user.isAdmin,
    isPro: user.isPro,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const result = await updateAdminUser({
        ...form,
        id: user.id,
        name: form.name.trim() || null,
        email: form.email.trim() || null,
        image: form.image.trim() || null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('User updated')
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Failed to update user', error)
      toast.error('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update profile and access settings. The user ID cannot be changed.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="edit-user-id">User ID</Label><Input id="edit-user-id" value={user.id} readOnly /></div>
          <div className="space-y-1.5"><Label htmlFor="edit-user-name">Name</Label><Input id="edit-user-name" maxLength={255} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="edit-user-email">Email</Label><Input id="edit-user-email" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="edit-user-image">Image URL</Label><Input id="edit-user-image" type="url" maxLength={2048} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">Image URLs must use a configured image host.</p>
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-4"><Label htmlFor="edit-user-verified">Email verified</Label><Switch id="edit-user-verified" checked={form.emailVerified} onCheckedChange={(checked) => setForm({ ...form, emailVerified: checked })} /></div>
            <div className="flex items-center justify-between gap-4"><Label htmlFor="edit-user-pro">Pro</Label><Switch id="edit-user-pro" checked={form.isPro} onCheckedChange={(checked) => setForm({ ...form, isPro: checked })} /></div>
            <div className="flex items-center justify-between gap-4"><Label htmlFor="edit-user-admin">Administrator</Label><Switch id="edit-user-admin" checked={form.isAdmin} disabled={user.id === currentUserId} onCheckedChange={(checked) => setForm({ ...form, isAdmin: checked })} /></div>
            {user.id === currentUserId && <p className="text-xs text-muted-foreground">You cannot remove your own administrator access.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
