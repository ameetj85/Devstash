'use client'

import { useState } from 'react'
import { Search, Menu } from 'lucide-react'
import CreateItemDialog from '@/components/items/create-item-dialog'
import CreateCollectionDialog from '@/components/collections/create-collection-dialog'
import CommandPalette from '@/components/search/command-palette'

interface TopBarProps {
  onMobileMenuToggle?: () => void
  collections?: { id: string; name: string }[]
}

export default function TopBar({ onMobileMenuToggle, collections = [] }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <header className="flex items-center gap-4 px-4 h-14 border-b border-border shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 w-48 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground text-sm font-bold">
          S
        </div>
        <span className="font-semibold text-sm">DevStash</span>
      </div>

      <button
        onClick={() => setPaletteOpen(true)}
        className="flex-1 max-w-xl relative flex items-center h-9 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
      >
        <Search className="w-4 h-4 mr-2 shrink-0" />
        <span>Search items...</span>
        <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </button>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <div className="flex items-center gap-2 ml-auto">
        <CreateCollectionDialog />
        <CreateItemDialog collections={collections} />
      </div>
    </header>
  )
}
