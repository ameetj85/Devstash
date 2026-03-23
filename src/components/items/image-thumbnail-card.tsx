import Image from 'next/image'
import { Star } from 'lucide-react'
import type { ItemWithType } from '@/lib/db/items'

interface ImageThumbnailCardProps {
  item: ItemWithType
  onClick?: () => void
}

export default function ImageThumbnailCard({ item, onClick }: ImageThumbnailCardProps) {
  const { color } = item.itemType

  return (
    <div
      className="rounded-lg border border-border bg-card overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {item.fileUrl ? (
          <Image
            src={item.fileUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: color + '22' }}
          >
            <span className="text-xs text-muted-foreground">No preview</span>
          </div>
        )}
        {item.isFavorite && (
          <div className="absolute top-2 right-2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 drop-shadow" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
