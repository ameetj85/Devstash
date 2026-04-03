'use client'

import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { getItemIcon } from '@/lib/item-type-icons'
import type { CollectionWithMeta } from '@/lib/db/collections'
import CollectionCardMenu from './collection-card-menu'

interface CollectionCardProps {
  collection: CollectionWithMeta
}

export default function CollectionCard({ collection: col }: CollectionCardProps) {
  const router = useRouter()

  return (
    <div
      className="group rounded-lg border bg-card p-4 hover:bg-card/80 transition-colors cursor-pointer"
      style={{ borderColor: col.dominantColor + '55' }}
      onClick={() => router.push(`/collections/${col.id}`)}
    >
      <div
        className="w-full h-0.5 rounded-full mb-3 opacity-60"
        style={{ backgroundColor: col.dominantColor }}
      />
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-medium text-sm leading-snug">
          {col.name}
        </span>
        <div className="flex items-center gap-1">
          {col.isFavorite && (
            <Star className="w-3.5 h-3.5 shrink-0 fill-yellow-400 text-yellow-400 mt-0.5" />
          )}
          <CollectionCardMenu collection={col} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {col.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {col.typeIcons.length > 0 ? (
            col.typeIcons.slice(0, 4).map(({ icon, color, name }) => {
              const Icon = getItemIcon(icon)
              return (
                <span
                  key={name}
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: color + '22' }}
                >
                  <Icon className="w-3 h-3" style={{ color }} />
                </span>
              )
            })
          ) : (
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  )
}
