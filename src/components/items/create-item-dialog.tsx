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
import { Label } from '@/components/ui/label'
import { createItem } from '@/actions/items'
import FileUpload, { type UploadedFile } from '@/components/items/file-upload'
import ItemFormBody, { type ItemFormState } from '@/components/items/item-form-body'
import { FILE_TYPES, TYPE_COLORS } from '@/lib/item-type-config'

const ITEM_TYPES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const
type ItemType = (typeof ITEM_TYPES)[number]

const EMPTY_FORM: ItemFormState = {
  title: '',
  description: '',
  content: '',
  url: '',
  language: '',
  tags: '',
}

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
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM)
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

  function updateForm(patch: Partial<ItemFormState>) {
    setForm((f) => ({ ...f, ...patch }))
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

  const showUrl = selectedType === 'link'
  const showFile = FILE_TYPES.includes(selectedType)
  const color = TYPE_COLORS[selectedType]

  const isSubmitDisabled =
    saving ||
    uploading ||
    !form.title.trim() ||
    (showUrl && !form.url.trim()) ||
    (showFile && !uploadedFile)

  const fileUploadSlot = showFile ? (
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
  ) : undefined

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
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder={`${selectedType} title`}
              className="text-sm"
              required
              autoFocus
            />
          </div>

          <ItemFormBody
            form={form}
            onFormChange={updateForm}
            typeName={selectedType}
            selectedCollections={selectedCollections}
            onCollectionsChange={setSelectedCollections}
            allCollections={collections}
            isPro={isPro}
            descriptionFileName={uploadedFile?.fileName}
            descriptionRows={2}
            fileUploadSlot={fileUploadSlot}
            urlRequired
            urlLabelSuffix={<span style={{ color }}>*</span>}
          />

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
