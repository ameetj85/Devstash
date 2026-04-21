'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { File } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from '@/actions/items'
import { getItemIcon } from '@/lib/item-type-icons'
import type { ItemFormState } from './item-form-body'
import type { ItemDetailResponse } from './item-drawer-types'
import { itemToFormState } from './item-drawer-types'
import ItemDrawerView from './item-drawer-view'
import ItemDrawerEdit from './item-drawer-edit'

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-20 h-5 rounded bg-muted" />
        <div className="w-16 h-5 rounded bg-muted" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 h-8 rounded bg-muted" />
        <div className="w-16 h-8 rounded bg-muted" />
        <div className="w-16 h-8 rounded bg-muted" />
        <div className="w-16 h-8 rounded bg-muted ml-auto" />
      </div>
      <div className="space-y-2">
        <div className="w-24 h-4 rounded bg-muted" />
        <div className="w-full h-4 rounded bg-muted" />
        <div className="w-3/4 h-4 rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="w-20 h-4 rounded bg-muted" />
        <div className="w-full h-32 rounded bg-muted" />
      </div>
    </div>
  )
}

function normalizeDates(updated: Omit<ItemDetailResponse, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | string
  updatedAt: Date | string
}): ItemDetailResponse {
  return {
    ...updated,
    createdAt: updated.createdAt instanceof Date
      ? updated.createdAt.toISOString()
      : String(updated.createdAt),
    updatedAt: updated.updatedAt instanceof Date
      ? updated.updatedAt.toISOString()
      : String(updated.updatedAt),
  }
}

interface ItemDrawerProps {
  itemId: string | null
  open: boolean
  onClose: () => void
  allCollections?: { id: string; name: string }[]
  isPro?: boolean
}

export default function ItemDrawer({ itemId, open, onClose, allCollections = [], isPro = false }: ItemDrawerProps) {
  const router = useRouter()
  const [item, setItem] = useState<ItemDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [form, setForm] = useState<ItemFormState>({
    title: '',
    description: '',
    content: '',
    url: '',
    language: '',
    tags: '',
  })

  useEffect(() => {
    if (!open || !itemId) {
      setItem(null)
      setIsEditing(false)
      return
    }

    setLoading(true)
    fetch(`/api/items/${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        setItem(data)
        setForm(itemToFormState(data))
        setSelectedCollections(data.collections.map((c: { id: string }) => c.id))
      })
      .catch(() => toast.error('Failed to load item'))
      .finally(() => setLoading(false))
  }, [open, itemId])

  const Icon = item ? getItemIcon(item.itemType.icon) : File
  const color = item?.itemType.color ?? '#6b7280'

  function updateForm(patch: Partial<ItemFormState>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function handleEditToggle() {
    if (item) {
      setForm(itemToFormState(item))
      setSelectedCollections(item.collections.map((c) => c.id))
    }
    setIsEditing(true)
  }

  function handleCancel() {
    if (item) {
      setForm(itemToFormState(item))
      setSelectedCollections(item.collections.map((c) => c.id))
    }
    setIsEditing(false)
  }

  async function handleSave() {
    if (!item || !form.title.trim()) return
    setSaving(true)

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const result = await updateItem(item.id, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      content: form.content || null,
      url: form.url.trim() || null,
      language: form.language.trim() || null,
      tags,
      collectionIds: selectedCollections,
    })

    setSaving(false)

    if (!result.success) {
      const errorMsg =
        typeof result.error === 'string'
          ? result.error
          : Object.values(result.error as Record<string, string[]>)
              .flat()
              .join(', ')
      toast.error(errorMsg || 'Failed to save item')
      return
    }

    setItem(normalizeDates(result.data))
    setIsEditing(false)
    toast.success('Item saved')
    router.refresh()
  }

  async function handleFavorite() {
    if (!item) return
    setItem((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : prev)
    const result = await toggleItemFavorite(item.id)
    if (!result.success) {
      setItem((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : prev)
      toast.error(result.error || 'Failed to update favorite')
      return
    }
    router.refresh()
  }

  async function handlePin() {
    if (!item) return
    setItem((prev) => prev ? { ...prev, isPinned: !prev.isPinned } : prev)
    const result = await toggleItemPin(item.id)
    if (!result.success) {
      setItem((prev) => prev ? { ...prev, isPinned: !prev.isPinned } : prev)
      toast.error(result.error || 'Failed to update pin')
      return
    }
    router.refresh()
  }

  async function handleDelete() {
    if (!item) return
    setDeleting(true)
    const result = await deleteItem(item.id)
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error || 'Failed to delete item')
      return
    }
    toast.success('Item deleted')
    onClose()
    router.refresh()
  }

  async function handleOptimizedPromptAccept(optimized: string) {
    if (!item) return
    const result = await updateItem(item.id, {
      title: item.title,
      description: item.description,
      content: optimized,
      url: item.url,
      language: item.language,
      tags: item.tags,
      collectionIds: item.collections.map((c) => c.id),
    })
    if (!result.success) {
      toast.error(
        typeof result.error === 'string' ? result.error : 'Failed to apply optimized prompt'
      )
      return
    }
    setItem(normalizeDates(result.data))
    toast.success('Optimized prompt applied')
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-0 p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            {item && (
              <>
                <div
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + '22' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span
                  className="text-xs font-medium capitalize px-2 py-0.5 rounded"
                  style={{ backgroundColor: color + '22', color }}
                >
                  {item.itemType.name}
                </span>
                {!isEditing && item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
          <SheetTitle className="text-left text-base leading-snug">
            {isEditing ? (
              <Input
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                className="text-base font-semibold h-8"
                placeholder="Title"
              />
            ) : (
              item?.title ?? ''
            )}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <DrawerSkeleton />
        ) : item ? (
          <div className="flex flex-col gap-6 p-6">
            {isEditing ? (
              <ItemDrawerEdit
                item={item}
                form={form}
                onFormChange={updateForm}
                selectedCollections={selectedCollections}
                onCollectionsChange={setSelectedCollections}
                allCollections={allCollections}
                isPro={isPro}
                saving={saving}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <ItemDrawerView
                item={item}
                isPro={isPro}
                deleting={deleting}
                onEdit={handleEditToggle}
                onFavorite={handleFavorite}
                onPin={handlePin}
                onDelete={handleDelete}
                onOptimizedPromptAccept={handleOptimizedPromptAccept}
              />
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
