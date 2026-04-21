'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toggleCollectionFavorite } from '@/actions/collections'

export function useCollectionFavoriteToggle(collectionId: string, initial: boolean) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initial)

  async function toggle() {
    const prev = isFavorite
    setIsFavorite(!prev)
    const result = await toggleCollectionFavorite(collectionId)
    if (!result.success) {
      setIsFavorite(prev)
      toast.error(result.error || 'Failed to update favorite')
      return
    }
    router.refresh()
  }

  return { isFavorite, toggle }
}
