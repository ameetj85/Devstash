'use client'

import Link from 'next/link'
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image,
  Star,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithMeta } from '@/lib/db/collections'

const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image,
}

interface SidebarProps {
  isCollapsed: boolean
  isMobileOpen: boolean
  onClose: () => void
  onToggleCollapse: () => void
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithMeta[]
}

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onClose,
  onToggleCollapse,
  itemTypes,
  collections,
}: SidebarProps) {
  const favoriteCollections = collections.filter((c) => c.isFavorite)
  const recentCollections = collections.filter((c) => !c.isFavorite).slice(0, 3)

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          // Base
          'flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden transition-all duration-300',
          // Mobile: fixed overlay, always full width sidebar
          'fixed inset-y-0 left-0 z-50 w-56',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: relative, inline, width based on collapsed state
          'md:relative md:inset-auto md:z-auto md:translate-x-0 md:shrink-0',
          isCollapsed ? 'md:w-14' : 'md:w-56'
        )}
      >
        {/* Sidebar header with collapse toggle (desktop only) */}
        <div className="flex items-center h-14 border-b border-sidebar-border shrink-0 px-3">
          {!isCollapsed && (
            <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Types */}
          <div className="px-3">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                Types
              </p>
            )}
            <nav className="space-y-0.5">
              {itemTypes.map((type) => {
                const Icon = iconMap[type.icon] ?? File
                const href = `/items/${type.name}s`
                return (
                  <Link
                    key={type.id}
                    href={href}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    title={isCollapsed ? `${type.name}s` : undefined}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: type.color }}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 capitalize">{type.name}s</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {type.count}
                        </span>
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Collections — hidden when collapsed */}
          {!isCollapsed && (
            <div className="px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                Collections
              </p>
              <div className="space-y-4">
                {/* Favorites */}
                {favoriteCollections.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 px-2">Favorites</p>
                    <nav className="space-y-0.5">
                      {favoriteCollections.map((col) => (
                        <Link
                          key={col.id}
                          href={`/collections/${col.id}`}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        >
                          <Star className="w-3.5 h-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                          <span className="flex-1 truncate">{col.name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {col.itemCount}
                          </span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Recent */}
                {recentCollections.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 px-2">Recent</p>
                    <nav className="space-y-0.5">
                      {recentCollections.map((col) => (
                        <Link
                          key={col.id}
                          href={`/collections/${col.id}`}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: col.dominantColor }}
                          />
                          <span className="flex-1 truncate">{col.name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {col.itemCount}
                          </span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                )}

                {/* View all collections */}
                <Link
                  href="/collections"
                  className="block px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all collections →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User avatar — placeholder until auth is wired up */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div
            className={cn(
              'flex items-center gap-2.5',
              isCollapsed && 'justify-center'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
              D
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    Demo User
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    demo@devstash.io
                  </p>
                </div>
                <button className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
