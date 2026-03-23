'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image,
  Star,
  Pin,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  X,
  Download,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateItem, deleteItem } from '@/actions/items'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CodeEditor from '@/components/items/code-editor'
import MarkdownEditor from '@/components/items/markdown-editor'

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemDetailResponse = {
  id: string
  title: string
  description: string | null
  content: string | null
  contentType: string
  url: string | null
  fileUrl: string | null
  fileName: string | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  collections: { id: string; name: string }[]
  itemType: { name: string; icon: string; color: string }
}

type EditFormState = {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image,
}

const CONTENT_TYPES = ['snippet', 'prompt', 'command', 'note']
const LANGUAGE_TYPES = ['snippet', 'command']
const MARKDOWN_TYPES = ['note', 'prompt']
const FILE_TYPES = ['file', 'image']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function itemToFormState(item: ItemDetailResponse): EditFormState {
  return {
    title: item.title,
    description: item.description ?? '',
    content: item.content ?? '',
    url: item.url ?? '',
    language: item.language ?? '',
    tags: item.tags.join(', '),
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface ItemDrawerProps {
  itemId: string | null
  open: boolean
  onClose: () => void
}

export default function ItemDrawer({ itemId, open, onClose }: ItemDrawerProps) {
  const router = useRouter()
  const [item, setItem] = useState<ItemDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<EditFormState>({
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
      })
      .catch(() => toast.error('Failed to load item'))
      .finally(() => setLoading(false))
  }, [open, itemId])

  const Icon = item ? (iconMap[item.itemType.icon] ?? File) : File
  const color = item?.itemType.color ?? '#6b7280'

  function handleCopy() {
    if (!item) return
    const text = item.content ?? item.url ?? item.fileUrl ?? item.title
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  function handleEditToggle() {
    if (item) setForm(itemToFormState(item))
    setIsEditing(true)
  }

  function handleCancel() {
    if (item) setForm(itemToFormState(item))
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

    // Merge dates back as strings (server returns Date objects)
    const updated = result.data
    setItem({
      ...updated,
      createdAt: updated.createdAt instanceof Date
        ? updated.createdAt.toISOString()
        : String(updated.createdAt),
      updatedAt: updated.updatedAt instanceof Date
        ? updated.updatedAt.toISOString()
        : String(updated.updatedAt),
    })
    setIsEditing(false)
    toast.success('Item saved')
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

  const typeName = item?.itemType.name ?? ''
  const showContent = CONTENT_TYPES.includes(typeName)
  const showLanguage = LANGUAGE_TYPES.includes(typeName)
  const showUrl = typeName === 'link'

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
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
              <>
                {/* Edit action bar */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleSave}
                    disabled={saving || !form.title.trim()}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description"
                    className="text-sm resize-none"
                    rows={3}
                  />
                </div>

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
                    ) : MARKDOWN_TYPES.includes(typeName) ? (
                      <MarkdownEditor
                        value={form.content}
                        onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                      />
                    ) : (
                      <Textarea
                        value={form.content}
                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                        placeholder="Content"
                        className="text-xs font-mono resize-none"
                        rows={8}
                      />
                    )}
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
                      onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                      placeholder="e.g. typescript"
                      className="text-sm"
                    />
                  </div>
                )}

                {/* URL */}
                {showUrl && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      URL
                    </Label>
                    <Input
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://..."
                      className="text-sm"
                      type="url"
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
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="react, typescript, hooks"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated</p>
                </div>

                {/* Non-editable: Collections */}
                {item.collections.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Collections
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.collections.map((col) => (
                        <span
                          key={col.id}
                          className="text-xs px-2 py-1 rounded border border-border bg-card text-foreground/80"
                        >
                          {col.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Non-editable: Details */}
                <section>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Details
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd>{formatDate(item.createdAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Updated</dt>
                      <dd>{formatDate(item.updatedAt)}</dd>
                    </div>
                  </dl>
                </section>
              </>
            ) : (
              <>
                {/* View action bar */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                  >
                    <Star
                      className="w-3.5 h-3.5"
                      style={item.isFavorite ? { fill: '#facc15', color: '#facc15' } : {}}
                    />
                    Favorite
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Pin className="w-3.5 h-3.5" />
                    Pin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleCopy}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleEditToggle}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deleting}
                        />
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{item.title}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The item will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Description */}
                {item.description && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Description
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {item.description}
                    </p>
                  </section>
                )}

                {/* Content */}
                {item.content && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Content
                    </p>
                    {LANGUAGE_TYPES.includes(typeName) ? (
                      <CodeEditor
                        value={item.content}
                        language={item.language}
                        readonly
                      />
                    ) : MARKDOWN_TYPES.includes(typeName) ? (
                      <MarkdownEditor
                        value={item.content}
                        readonly
                      />
                    ) : (
                      <SyntaxHighlighter
                        language={item.language ?? 'text'}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          lineHeight: '1.6',
                        }}
                        wrapLongLines
                      >
                        {item.content}
                      </SyntaxHighlighter>
                    )}
                  </section>
                )}

                {/* URL */}
                {item.url && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      URL
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline break-all"
                    >
                      {item.url}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </section>
                )}

                {/* File / Image */}
                {FILE_TYPES.includes(typeName) && item.fileUrl && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {typeName === 'image' ? 'Image' : 'File'}
                    </p>
                    {typeName === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.fileUrl}
                        alt={item.fileName ?? 'Image'}
                        className="rounded-lg border border-border max-h-80 w-auto object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <File className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.fileName ?? 'File'}</p>
                        </div>
                        <a
                          href={`/api/files/${encodeURIComponent(item.fileUrl.split('/').slice(-2).join('/'))}?name=${encodeURIComponent(item.fileName ?? 'download')}`}
                          download={item.fileName ?? 'download'}
                          className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-md border border-border bg-background hover:bg-accent transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </div>
                    )}
                    {typeName === 'image' && item.fileName && (
                      <a
                        href={`/api/files/${encodeURIComponent(item.fileUrl.split('/').slice(-2).join('/'))}?name=${encodeURIComponent(item.fileName)}`}
                        download={item.fileName}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-md border border-border bg-background hover:bg-accent transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    )}
                  </section>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Collections */}
                {item.collections.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Collections
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.collections.map((col) => (
                        <span
                          key={col.id}
                          className="text-xs px-2 py-1 rounded border border-border bg-card text-foreground/80"
                        >
                          {col.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Details */}
                <section>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Details
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd>{formatDate(item.createdAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Updated</dt>
                      <dd>{formatDate(item.updatedAt)}</dd>
                    </div>
                  </dl>
                </section>
              </>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
