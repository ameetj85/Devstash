'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, File as FileIcon, Image as ImageIcon } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadedFile = {
  fileUrl: string
  fileName: string
  key: string
}

interface FileUploadProps {
  itemType: 'file' | 'image'
  value: UploadedFile | null
  onChange: (value: UploadedFile | null) => void
  onUploadStart?: () => void
  onUploadEnd?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED: Record<'file' | 'image', string> = {
  image: '.png,.jpg,.jpeg,.gif,.webp,.svg',
  file: '.pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini',
}

const MAX_SIZE: Record<'file' | 'image', number> = {
  image: 5 * 1024 * 1024,
  file: 10 * 1024 * 1024,
}

const MAX_LABEL: Record<'file' | 'image', string> = {
  image: '5 MB',
  file: '10 MB',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FileUpload({ itemType, value, onChange, onUploadStart, onUploadEnd }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE[itemType]) {
      setError(`File exceeds ${MAX_LABEL[itemType]} limit`)
      return
    }

    setError(null)
    setProgress(0)
    onUploadStart?.()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('itemType', itemType)

    // Use XMLHttpRequest for progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText) as UploadedFile
          onChange(data)
          resolve()
        } else {
          const data = JSON.parse(xhr.responseText) as { error?: string }
          reject(new Error(data.error ?? 'Upload failed'))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Upload failed')))

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    }).catch((err: Error) => {
      setError(err.message)
    })

    setProgress(null)
    onUploadEnd?.()
  }, [itemType, onChange, onUploadStart, onUploadEnd])

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    // reset so re-selecting same file triggers onChange
    e.target.value = ''
  }

  const Icon = itemType === 'image' ? ImageIcon : FileIcon

  return (
    <div className="space-y-2">
      {value ? (
        // ── Uploaded state ──────────────────────────────────────────────────
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          {itemType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.fileUrl}
              alt={value.fileName}
              className="h-16 w-16 rounded object-cover shrink-0 border border-border"
            />
          ) : (
            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center shrink-0">
              <FileIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.fileName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Uploaded</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // ── Drop zone ───────────────────────────────────────────────────────
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
            p-8 cursor-pointer transition-colors text-center select-none
            ${dragging
              ? 'border-primary/60 bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/30'
            }
          `}
        >
          <Icon className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {dragging ? 'Drop to upload' : 'Click or drag & drop'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {itemType === 'image'
                ? `PNG, JPG, GIF, WebP, SVG — max ${MAX_LABEL.image}`
                : `PDF, TXT, MD, JSON, YAML, XML, CSV — max ${MAX_LABEL.file}`
              }
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED[itemType]}
            onChange={handleChange}
            className="sr-only"
          />
        </div>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Upload icon re-export for convenience ────────────────────────────────────
export { Upload }
