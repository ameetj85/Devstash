'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Folder, ArrowUpDown } from 'lucide-react'
import { getItemIcon } from '@/lib/item-type-icons'
import ItemDrawer from '@/components/items/item-drawer'
import { sortItems, sortCollections, SORT_LABELS } from '@/lib/favorites-sort'
import type { SortOption } from '@/lib/favorites-sort'
import type { ItemWithType } from '@/lib/db/items'
import type { FavoriteCollection } from '@/lib/db/collections'

interface FavoritesListProps {
  items: ItemWithType[]
  collections: FavoriteCollection[]
  allCollections: { id: string; name: string }[]
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function FavoritesList({ items, collections, allCollections }: FavoritesListProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sort, setSort] = useState<SortOption>('date')

  const sortedItems = useMemo(() => sortItems(items, sort), [items, sort])
  const sortedCollections = useMemo(() => sortCollections(collections, sort), [collections, sort])

  function handleItemClick(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  const isEmpty = items.length === 0 && collections.length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
        <Star className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">No favorites yet.</p>
        <p className="text-muted-foreground/70 text-xs">
          Star items or collections to see them here.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-1">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex gap-1">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => setSort(option)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                sort === option
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {sortedItems.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Items ({sortedItems.length})
          </h2>
          <div className="border border-border rounded-md overflow-hidden">
            {sortedItems.map((item, i) => {
              const Icon = getItemIcon(item.itemType.icon)
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                    i > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: item.itemType.color }}
                  />
                  <span className="font-mono text-sm truncate flex-1">
                    {item.title}
                  </span>
                  <span
                    className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      color: item.itemType.color,
                      backgroundColor: `${item.itemType.color}15`,
                    }}
                  >
                    {item.itemType.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {formatDate(item.updatedAt)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {sortedCollections.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Collections ({sortedCollections.length})
          </h2>
          <div className="border border-border rounded-md overflow-hidden">
            {sortedCollections.map((col, i) => (
              <button
                key={col.id}
                onClick={() => router.push(`/collections/${col.id}`)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-sm truncate flex-1">
                  {col.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}
                </span>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {formatDate(col.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <ItemDrawer
        itemId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        allCollections={allCollections}
      />
    </>
  )
}
