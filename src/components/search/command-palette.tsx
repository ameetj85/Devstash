'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { getItemIcon } from '@/lib/item-type-icons'
import type { SearchItem } from '@/lib/db/items'
import type { SearchCollection } from '@/lib/db/collections'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchData {
  items: SearchItem[]
  collections: SearchCollection[]
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [data, setData] = useState<SearchData | null>(null)
  const router = useRouter()

  // Fetch search data when palette first opens
  const fetchData = useCallback(async () => {
    if (data) return
    try {
      const res = await fetch('/api/search')
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      // fail silently
    }
  }, [data])

  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  function handleSelectItem(item: SearchItem) {
    onOpenChange(false)
    router.push(`/items/${item.typeName}s?item=${item.id}`)
  }

  function handleSelectCollection(collection: SearchCollection) {
    onOpenChange(false)
    router.push(`/collections/${collection.id}`)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search items and collections">
      <Command shouldFilter>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {data && data.items.length > 0 && (
            <CommandGroup heading="Items">
              {data.items.map((item) => {
                const Icon = getItemIcon(item.typeIcon)
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.typeName}`}
                    onSelect={() => handleSelectItem(item)}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: item.typeColor }} />
                    <span className="truncate">{item.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">{item.typeName}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {data && data.items.length > 0 && data.collections.length > 0 && (
            <CommandSeparator />
          )}

          {data && data.collections.length > 0 && (
            <CommandGroup heading="Collections">
              {data.collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.name}
                  onSelect={() => handleSelectCollection(collection)}
                >
                  <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{collection.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
