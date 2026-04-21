'use client'

import { useState } from 'react'

export function useItemDrawer() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function openDrawer(id: string) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
  }

  return { selectedId, setSelectedId, drawerOpen, setDrawerOpen, openDrawer, closeDrawer }
}
