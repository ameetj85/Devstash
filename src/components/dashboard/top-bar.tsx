'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, FolderPlus, Menu } from 'lucide-react'
import CreateItemDialog from '@/components/items/create-item-dialog'

interface TopBarProps {
  onMobileMenuToggle?: () => void
}

export default function TopBar({ onMobileMenuToggle }: TopBarProps) {
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

      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          className="pl-9 bg-muted/50 border-border h-9 text-sm"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
          <FolderPlus className="w-4 h-4" />
          New Collection
        </Button>
        <CreateItemDialog />
      </div>
    </header>
  )
}
