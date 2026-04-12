'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createCollection } from '@/actions/collections'

interface CreateCollectionDialogProps {
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

export default function CreateCollectionDialog({ externalOpen, onExternalOpenChange }: CreateCollectionDialogProps = {}) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? (v: boolean) => onExternalOpenChange?.(v) : setInternalOpen
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setName('')
      setDescription('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)

    const result = await createCollection({
      name: name.trim(),
      description: description.trim() || null,
    })

    setSaving(false)

    if (!result.success) {
      const errorMsg =
        typeof result.error === 'string'
          ? result.error
          : Object.values(result.error as Record<string, string[]>)
              .flat()
              .join(', ')
      toast.error(errorMsg || 'Failed to create collection')
      return
    }

    toast.success('Collection created')
    handleOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 hidden sm:flex"
          onClick={() => setOpen(true)}
        >
          <FolderPlus className="w-4 h-4" />
          New Collection
        </Button>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Name <span className="text-primary">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React Patterns"
              className="text-sm"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Creating…' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
