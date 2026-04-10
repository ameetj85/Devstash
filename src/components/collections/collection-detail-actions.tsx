'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleCollectionFavorite } from '@/actions/collections'
import EditCollectionDialog from './edit-collection-dialog'
import DeleteCollectionDialog from './delete-collection-dialog'

interface CollectionDetailActionsProps {
  collection: {
    id: string
    name: string
    description: string | null
    isFavorite: boolean
  }
}

export default function CollectionDetailActions({ collection }: CollectionDetailActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite)

  async function handleFavorite() {
    const prev = isFavorite
    setIsFavorite(!prev)
    const result = await toggleCollectionFavorite(collection.id)
    if (!result.success) {
      setIsFavorite(prev)
      toast.error(result.error || 'Failed to update favorite')
      return
    }
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditOpen(true)}
          title="Edit collection"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDeleteOpen(true)}
          title="Delete collection"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleFavorite}
          title={isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star
            className="w-4 h-4"
            style={isFavorite ? { fill: '#facc15', color: '#facc15' } : {}}
          />
        </Button>
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />

      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        redirectOnDelete="/collections"
      />
    </>
  )
}
