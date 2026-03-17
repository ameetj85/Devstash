'use client'

import { useState } from 'react'
import TopBar from './top-bar'
import Sidebar from './sidebar'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
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
        />
        {children}
      </div>
    </div>
  )
}
