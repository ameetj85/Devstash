'use client'

import { useEffect, useState } from 'react'
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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
  const [item, setItem] = useState<ItemDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !itemId) {
      setItem(null)
      return
    }

    setLoading(true)
    fetch(`/api/items/${itemId}`)
      .then((r) => r.json())
      .then((data) => setItem(data))
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
                {item.tags.slice(0, 2).map((tag) => (
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
            {item?.title ?? ''}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <DrawerSkeleton />
        ) : item ? (
          <div className="flex flex-col gap-6 p-6">
            {/* Action bar */}
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
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
                <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed font-mono">
                  {item.content}
                </pre>
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
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
