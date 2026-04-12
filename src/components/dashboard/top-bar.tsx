'use client'

import { useState } from 'react'
import { Search, Menu, Star, Plus, FolderPlus, FilePlus, FileCode2 } from 'lucide-react'
import Link from 'next/link'
import CreateItemDialog from '@/components/items/create-item-dialog'
import CreateCollectionDialog from '@/components/collections/create-collection-dialog'
import CommandPalette from '@/components/search/command-palette'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  onMobileMenuToggle?: () => void
  collections?: { id: string; name: string }[]
}

export default function TopBar({ onMobileMenuToggle, collections = [] }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)

  return (
    <header className="flex items-center gap-2 sm:gap-4 px-4 h-14 border-b border-border shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo — icon always visible, text hidden on mobile */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <FileCode2 className="size-7 text-primary" />
        <span className="hidden sm:inline font-semibold text-sm">DevStash</span>
      </Link>

      {/* Search — full bar on md+, icon button on mobile */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden md:flex flex-1 max-w-xl relative items-center h-9 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
      >
        <Search className="w-4 h-4 mr-2 shrink-0" />
        <span>Search items...</span>
        <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setPaletteOpen(true)}
        className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-auto"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </button>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Actions — individual buttons on sm+, "+" dropdown on mobile */}
      <div className="flex items-center gap-2 md:ml-auto">
        <Link
          href="/favorites"
          className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Favorites"
        >
          <Star className="w-4 h-4" />
        </Link>

        {/* Desktop: individual buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <CreateCollectionDialog />
          <CreateItemDialog collections={collections} />
        </div>

        {/* Mobile: combined "+" dropdown */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Create new"
            >
              <Plus className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setCreateItemOpen(true)}>
                <FilePlus className="w-4 h-4 mr-2" />
                New Item
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCreateCollectionOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden dialogs triggered by dropdown */}
          <CreateItemDialog
            collections={collections}
            externalOpen={createItemOpen}
            onExternalOpenChange={setCreateItemOpen}
          />
          <CreateCollectionDialog
            externalOpen={createCollectionOpen}
            onExternalOpenChange={setCreateCollectionOpen}
          />
        </div>
      </div>
    </header>
  )
}
