'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LayoutGrid, LayoutList } from 'lucide-react'
import ItemCard from './item-card'
import ImageThumbnailCard from './image-thumbnail-card'
import FileListRow from './file-list-row'
import ItemDrawer from './item-drawer'
import { useItemDrawer } from '@/hooks/use-item-drawer'
import type { ItemWithType } from '@/lib/db/items'

interface ItemsClientWrapperProps {
  items: ItemWithType[]
  layout?: 'grid' | 'gallery' | 'list'
  collections?: { id: string; name: string }[]
  isPro?: boolean
}

export default function ItemsClientWrapper({ items, layout: initialLayout = 'grid', collections = [], isPro = false }: ItemsClientWrapperProps) {
  const searchParams = useSearchParams()
  const { selectedId, drawerOpen, openDrawer, closeDrawer } = useItemDrawer()
  const [layout, setLayout] = useState(initialLayout)

  // Auto-open drawer from ?item= query param (e.g. from command palette)
  useEffect(() => {
    const itemId = searchParams.get('item')
    if (itemId) {
      openDrawer(itemId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <>
      {initialLayout === 'gallery' && (
        <div className="flex justify-end">
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            <button
              onClick={() => setLayout('gallery')}
              className="p-1.5 rounded transition-colors"
              style={layout === 'gallery' ? { backgroundColor: 'var(--muted)' } : undefined}
              title="Thumbnail view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('grid')}
              className="p-1.5 rounded transition-colors"
              style={layout === 'grid' ? { backgroundColor: 'var(--muted)' } : undefined}
              title="Card view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {layout === 'list' ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileListRow
              key={item.id}
              item={item}
              onClick={() => openDrawer(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) =>
            layout === 'gallery' ? (
              <ImageThumbnailCard
                key={item.id}
                item={item}
                onClick={() => openDrawer(item.id)}
              />
            ) : (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => openDrawer(item.id)}
              />
            )
          )}
        </div>
      )}

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
