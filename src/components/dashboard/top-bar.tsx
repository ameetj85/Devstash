'use client'

import { useState } from 'react'
import { Search, Menu, Star, Plus, FolderPlus, FilePlus, FileCode2, Sparkles } from 'lucide-react'
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
  hasFavorites?: boolean
  isPro?: boolean
}

export default function TopBar({ onMobileMenuToggle, collections = [], hasFavorites = false, isPro = false }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)

  return (
    <header className="flex items-center px-4 h-14 border-b border-border shrink-0">
      {/* Left section — logo & hamburger */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <FileCode2 className="size-7 text-primary" />
          <span className="hidden sm:inline font-semibold text-sm">Scribbles</span>
        </Link>
      </div>

      {/* Center section — search bar (md+) / search icon (mobile) */}
      <div className="flex items-center justify-center shrink-0 md:flex-1 md:max-w-xl md:mx-4">
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex w-full relative items-center h-9 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 mr-2 shrink-0" />
          <span>Search items...</span>
          <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </button>
        <button
          onClick={() => setPaletteOpen(true)}
          className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Right section — actions */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        {!isPro && (
          <Link
            href="/upgrade"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade
          </Link>
        )}
        <Link
          href="/favorites"
          className={`p-2 rounded-md hover:bg-accent transition-colors ${
            hasFavorites ? 'text-yellow-400 hover:text-yellow-300' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Favorites"
        >
          <Star className={`w-4 h-4 ${hasFavorites ? 'fill-current' : ''}`} />
        </Link>

        {/* Desktop: individual buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <CreateCollectionDialog />
          <CreateItemDialog collections={collections} isPro={isPro} />
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

          <CreateItemDialog
            collections={collections}
            externalOpen={createItemOpen}
            onExternalOpenChange={setCreateItemOpen}
            isPro={isPro}
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
