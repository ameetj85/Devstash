import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image,
  Star,
  type LucideIcon,
} from 'lucide-react'
import type { ItemWithType } from '@/lib/db/items'

const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image,
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ItemCardProps {
  item: ItemWithType
  onClick?: () => void
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const Icon = iconMap[item.itemType.icon] ?? File
  const { color } = item.itemType

  return (
    <div
      className="rounded-lg border border-l-4 border-border bg-card p-4 hover:bg-card/80 transition-colors cursor-pointer flex flex-col gap-3"
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: color + '22' }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug truncate">{item.title}</p>
            {item.isFavorite && (
              <Star className="w-3.5 h-3.5 shrink-0 fill-yellow-400 text-yellow-400 mt-0.5" />
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{formatDate(item.updatedAt)}</span>
      </div>
    </div>
  )
}
