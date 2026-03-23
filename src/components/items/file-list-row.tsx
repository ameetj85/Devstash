import {
  File,
  FileImage,
  FileCode,
  FileText,
  FileArchive,
  FileVideo,
  FileAudio,
  Download,
} from 'lucide-react'
import type { ItemWithType } from '@/lib/db/items'

function getFileIcon(fileName: string | null) {
  if (!fileName) return File
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(ext)) return FileImage
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'cs', 'php', 'swift'].includes(ext)) return FileCode
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xls', 'xlsx'].includes(ext)) return FileText
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return FileArchive
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return FileVideo
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) return FileAudio
  return File
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface FileListRowProps {
  item: ItemWithType
  onClick?: () => void
}

export default function FileListRow({ item, onClick }: FileListRowProps) {
  const FileIcon = getFileIcon(item.fileName)
  const { color } = item.itemType

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    if (!item.fileUrl) return
    const key = encodeURIComponent(item.fileUrl.split('/').slice(-2).join('/'))
    const name = encodeURIComponent(item.fileName ?? 'download')
    window.location.href = `/api/files/${key}?name=${name}`
  }

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* File icon */}
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + '22' }}
      >
        <FileIcon className="w-5 h-5" style={{ color }} />
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.fileName ?? item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        )}
      </div>

      {/* Meta — hidden on mobile, shown on sm+ */}
      <div className="hidden sm:flex items-center gap-6 shrink-0 text-xs text-muted-foreground">
        <span className="w-16 text-right">{formatFileSize(item.fileSize)}</span>
        <span className="w-28 text-right">{formatDate(item.createdAt)}</span>
      </div>

      {/* Mobile meta stacked */}
      <div className="flex sm:hidden flex-col items-end shrink-0 text-xs text-muted-foreground gap-0.5">
        <span>{formatFileSize(item.fileSize)}</span>
        <span>{formatDate(item.createdAt)}</span>
      </div>

      {/* Download button */}
      {item.fileUrl && (
        <button
          onClick={handleDownload}
          className="p-1.5 rounded hover:bg-muted transition-colors shrink-0 text-muted-foreground hover:text-foreground"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
