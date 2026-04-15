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
import CodeEditor from '@/components/items/code-editor'
import MarkdownEditor from '@/components/items/markdown-editor'
import LanguageSelect from '@/components/items/language-select'
import FileUpload, { type UploadedFile } from '@/components/items/file-upload'
import CollectionPicker from '@/components/items/collection-picker'
import SuggestTagsButton from '@/components/items/suggest-tags-button'

// ─── Types ────────────────────────────────────────────────────────────────────

const ITEM_TYPES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const
type ItemType = (typeof ITEM_TYPES)[number]

const TYPE_COLORS: Record<ItemType, string> = {
  snippet: '#3b82f6',
  prompt: '#8b5cf6',
  command: '#f97316',
  note: '#fde047',
  link: '#10b981',
  file: '#6b7280',
  image: '#ec4899',
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

import { CONTENT_TYPES, LANGUAGE_TYPES, MARKDOWN_TYPES, FILE_TYPES } from '@/lib/item-type-config'

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateItemDialogProps {
  defaultType?: string
  collections?: { id: string; name: string }[]
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
  isPro?: boolean
}

export default function CreateItemDialog({ defaultType, collections = [], externalOpen, onExternalOpenChange, isPro = false }: CreateItemDialogProps) {
  const router = useRouter()
  const initialType: ItemType =
    defaultType && (ITEM_TYPES as readonly string[]).includes(defaultType)
      ? (defaultType as ItemType)
      : 'snippet'
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? (v: boolean) => onExternalOpenChange?.(v) : setInternalOpen
  const [selectedType, setSelectedType] = useState<ItemType>(initialType)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setForm(EMPTY_FORM)
      setSelectedType(initialType)
      setSelectedCollections([])
      setUploadedFile(null)
    }
  }

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return

    const isFile = FILE_TYPES.includes(selectedType)
    if (isFile && !uploadedFile) {
      toast.error('Please upload a file first')
      return
    }

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
      collectionIds: selectedCollections,
      fileUrl: uploadedFile?.fileUrl ?? null,
      fileName: uploadedFile?.fileName ?? null,
      fileSize: uploadedFile?.fileSize ?? null,
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
  const showFile = FILE_TYPES.includes(selectedType)
  const color = TYPE_COLORS[selectedType]

  const isSubmitDisabled =
    saving ||
    uploading ||
    !form.title.trim() ||
    (showUrl && !form.url.trim()) ||
    (showFile && !uploadedFile)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Item</span>
        </Button>
      )}

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
                onClick={() => {
                  setSelectedType(type)
                  setUploadedFile(null)
                }}
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

          {/* File / Image upload */}
          {showFile && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {selectedType === 'image' ? 'Image' : 'File'} <span style={{ color }}>*</span>
              </Label>
              <FileUpload
                itemType={selectedType as 'file' | 'image'}
                value={uploadedFile}
                onChange={setUploadedFile}
                onUploadStart={() => setUploading(true)}
                onUploadEnd={() => setUploading(false)}
              />
            </div>
          )}

          {/* Language (above content for immediate highlighting) */}
          {showLanguage && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Language
              </Label>
              <LanguageSelect
                value={form.language}
                onChange={(v) => setForm((f) => ({ ...f, language: v }))}
              />
            </div>
          )}

          {/* Content */}
          {showContent && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Content
              </Label>
              {showLanguage ? (
                <CodeEditor
                  value={form.content}
                  onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                  language={form.language}
                />
              ) : MARKDOWN_TYPES.includes(selectedType) ? (
                <MarkdownEditor
                  value={form.content}
                  onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                />
              ) : (
                <Textarea
                  value={form.content}
                  onChange={field('content')}
                  placeholder="Content"
                  className="text-xs font-mono resize-none"
                  rows={6}
                />
              )}
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-xs text-muted-foreground">Comma-separated</p>
              <SuggestTagsButton
                title={form.title}
                content={form.content}
                typeName={selectedType}
                isPro={isPro}
                onAcceptTag={(tag) => {
                  setForm((f) => {
                    const existing = f.tags.split(',').map((t) => t.trim()).filter(Boolean)
                    if (existing.includes(tag)) return f
                    return { ...f, tags: existing.length > 0 ? `${f.tags}, ${tag}` : tag }
                  })
                }}
              />
            </div>
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Collections
              </Label>
              <CollectionPicker
                collections={collections}
                selected={selectedCollections}
                onChange={setSelectedCollections}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {uploading ? 'Uploading…' : saving ? 'Creating…' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
