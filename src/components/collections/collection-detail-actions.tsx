'use client'

import { useState } from 'react'
import { Pencil, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCollectionFavoriteToggle } from '@/hooks/use-collection-favorite-toggle'
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
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { isFavorite, toggle: handleFavorite } = useCollectionFavoriteToggle(
    collection.id,
    collection.isFavorite,
  )

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
