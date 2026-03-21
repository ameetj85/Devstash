'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
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
import { createItem } from '@/actions/items'

// ─── Types ────────────────────────────────────────────────────────────────────

const ITEM_TYPES = ['snippet', 'prompt', 'command', 'note', 'link'] as const
type ItemType = (typeof ITEM_TYPES)[number]

const TYPE_COLORS: Record<ItemType, string> = {
  snippet: '#3b82f6',
  prompt: '#8b5cf6',
  command: '#f97316',
  note: '#fde047',
  link: '#10b981',
}

type FormState = {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  content: '',
  url: '',
  language: '',
  tags: '',
}

const CONTENT_TYPES: ItemType[] = ['snippet', 'prompt', 'command', 'note']
const LANGUAGE_TYPES: ItemType[] = ['snippet', 'command']

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateItemDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ItemType>('snippet')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setForm(EMPTY_FORM)
      setSelectedType('snippet')
    }
  }

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const result = await createItem({
      title: form.title.trim(),
      typeName: selectedType,
      description: form.description.trim() || null,
      content: form.content || null,
      url: form.url.trim() || null,
      language: form.language.trim() || null,
      tags,
    })

    setSaving(false)

    if (!result.success) {
      const errorMsg =
        typeof result.error === 'string'
          ? result.error
          : Object.values(result.error as Record<string, string[]>)
              .flat()
              .join(', ')
      toast.error(errorMsg || 'Failed to create item')
      return
    }

    toast.success('Item created')
    handleOpenChange(false)
    router.refresh()
  }

  const showContent = CONTENT_TYPES.includes(selectedType)
  const showLanguage = LANGUAGE_TYPES.includes(selectedType)
  const showUrl = selectedType === 'link'
  const color = TYPE_COLORS[selectedType]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">New Item</span>
      </Button>

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type selector */}
          <div className="flex flex-wrap gap-1.5">
            {ITEM_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className="px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors border"
                style={
                  selectedType === type
                    ? { backgroundColor: TYPE_COLORS[type] + '22', color: TYPE_COLORS[type], borderColor: TYPE_COLORS[type] + '66' }
                    : { borderColor: 'transparent', color: 'var(--muted-foreground)' }
                }
              >
                {type}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Title <span style={{ color }}>*</span>
            </Label>
            <Input
              value={form.title}
              onChange={field('title')}
              placeholder={`${selectedType} title`}
              className="text-sm"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </Label>
            <Textarea
              value={form.description}
              onChange={field('description')}
              placeholder="Optional description"
              className="text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Content */}
          {showContent && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Content
              </Label>
              <Textarea
                value={form.content}
                onChange={field('content')}
                placeholder="Content"
                className="text-xs font-mono resize-none"
                rows={6}
              />
            </div>
          )}

          {/* Language */}
          {showLanguage && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Language
              </Label>
              <Input
                value={form.language}
                onChange={field('language')}
                placeholder="e.g. typescript"
                className="text-sm"
              />
            </div>
          )}

          {/* URL */}
          {showUrl && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                URL <span style={{ color }}>*</span>
              </Label>
              <Input
                value={form.url}
                onChange={field('url')}
                placeholder="https://..."
                className="text-sm"
                type="url"
                required={showUrl}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tags
            </Label>
            <Input
              value={form.tags}
              onChange={field('tags')}
              placeholder="react, typescript, hooks"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
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
            <Button
              type="submit"
              disabled={saving || !form.title.trim() || (showUrl && !form.url.trim())}
            >
              {saving ? 'Creating…' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
