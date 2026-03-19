'use client'

import { useState } from 'react'
import TopBar from './top-bar'
import Sidebar from './sidebar'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithMeta } from '@/lib/db/collections'

interface DashboardUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface DashboardShellProps {
  children: React.ReactNode
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithMeta[]
  user: DashboardUser
}

export default function DashboardShell({ children, itemTypes, collections, user }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar onMobileMenuToggle={() => setIsMobileOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          onToggleCollapse={() => setIsCollapsed((v) => !v)}
          itemTypes={itemTypes}
          collections={collections}
          user={user}
        />
        {children}
      </div>
    </div>
  )
}
