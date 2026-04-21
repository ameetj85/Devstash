'use client'

import {
  Star,
  Pin,
  Clock,
} from 'lucide-react'
import ItemDrawer from '@/components/items/item-drawer'
import { useItemDrawer } from '@/hooks/use-item-drawer'
import { getItemIcon } from '@/lib/item-type-icons'

// Serializable item row (dates pre-formatted as strings by the server component)
export type DashboardItemRow = {
  id: string
  title: string
  description: string | null
  isFavorite: boolean
  isPinned: boolean
  updatedAtFormatted: string
  tags: string[]
  itemType: { name: string; icon: string; color: string }
}

interface DashboardItemRowsProps {
  pinnedItems: DashboardItemRow[]
  recentItems: DashboardItemRow[]
  collections?: { id: string; name: string }[]
  isPro?: boolean
}

export default function DashboardItemRows({ pinnedItems, recentItems, collections = [], isPro = false }: DashboardItemRowsProps) {
  const { selectedId, drawerOpen, openDrawer, closeDrawer } = useItemDrawer()

  return (
    <>
      {/* Pinned items */}
      {pinnedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-3">
            <Pin className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Pinned</h2>
          </div>
          <div className="space-y-2">
            {pinnedItems.map((item) => {
              const Icon = getItemIcon(item.itemType.icon)
              return (
                <div
                  key={item.id}
                  onClick={() => openDrawer(item.id)}
                  className="flex items-center gap-3 rounded-lg border border-l-2 border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
                  style={{ borderLeftColor: item.itemType.color }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.itemType.color + '22' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: item.itemType.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {item.tags.map((tag) => (
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
                  <span className="text-xs text-muted-foreground shrink-0">{item.updatedAtFormatted}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent items */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent</h2>
        </div>
        <div className="space-y-2">
          {recentItems.map((item) => {
            const Icon = getItemIcon(item.itemType.icon)
            return (
              <div
                key={item.id}
                onClick={() => openDrawer(item.id)}
                className="flex items-center gap-3 rounded-lg border border-l-2 border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
                style={{ borderLeftColor: item.itemType.color }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.itemType.color + '22' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: item.itemType.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.isFavorite && (
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  )}
                  <span className="text-xs text-muted-foreground">{item.updatedAtFormatted}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <ItemDrawer
        itemId={selectedId}
        open={drawerOpen}
        onClose={closeDrawer}
        allCollections={collections}
        isPro={isPro}
      />
    </>
  )
}
