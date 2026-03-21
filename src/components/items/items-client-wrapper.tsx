'use client'

import { useState } from 'react'
import ItemCard from './item-card'
import ItemDrawer from './item-drawer'
import type { ItemWithType } from '@/lib/db/items'

interface ItemsClientWrapperProps {
  items: ItemWithType[]
}

export default function ItemsClientWrapper({ items }: ItemsClientWrapperProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleItemClick(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>
      <ItemDrawer
        itemId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
