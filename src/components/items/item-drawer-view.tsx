'use client'

import {
  File,
  Star,
  Pin,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { LANGUAGE_TYPES, MARKDOWN_TYPES, FILE_TYPES } from '@/lib/item-type-config'
import { extractFileKey } from '@/lib/file-utils'
import type { ItemDetailResponse } from './item-drawer-types'
import { formatDate } from './item-drawer-types'

interface ItemDrawerViewProps {
  item: ItemDetailResponse
  isPro: boolean
  deleting: boolean
  onEdit: () => void
  onFavorite: () => void
  onPin: () => void
  onDelete: () => void
  onOptimizedPromptAccept: (optimized: string) => Promise<void>
}

export default function ItemDrawerView({
  item,
  isPro,
  deleting,
  onEdit,
  onFavorite,
  onPin,
  onDelete,
  onOptimizedPromptAccept,
}: ItemDrawerViewProps) {
  const typeName = item.itemType.name

  function handleCopy() {
    const text = item.content ?? item.url ?? item.fileUrl ?? item.title
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <>
      {/* View action bar */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onFavorite}>
          <Star
            className="w-3.5 h-3.5"
            style={item.isFavorite ? { fill: '#facc15', color: '#facc15' } : {}}
          />
          Favorite
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onPin}>
          <Pin
            className="w-3.5 h-3.5"
            style={item.isPinned ? { fill: '#3b82f6', color: '#3b82f6' } : {}}
          />
          {item.isPinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
          <Copy className="w-3.5 h-3.5" />
          Copy
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
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
                onClick={onDelete}
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
          <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>
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
              explain={{
                typeName: typeName as 'snippet' | 'command',
                title: item.title,
                isPro,
              }}
            />
          ) : MARKDOWN_TYPES.includes(typeName) ? (
            <MarkdownEditor
              value={item.content}
              readonly
              optimize={typeName === 'prompt' ? {
                typeName: 'prompt',
                title: item.title,
                isPro,
                onAccept: onOptimizedPromptAccept,
              } : undefined}
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
                href={`/api/files/${encodeURIComponent(extractFileKey(item.fileUrl))}?name=${encodeURIComponent(item.fileName ?? 'download')}`}
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
              href={`/api/files/${encodeURIComponent(extractFileKey(item.fileUrl))}?name=${encodeURIComponent(item.fileName)}`}
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
  )
}
