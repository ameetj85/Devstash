'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Star } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useCollectionFavoriteToggle } from '@/hooks/use-collection-favorite-toggle'
import EditCollectionDialog from './edit-collection-dialog'
import DeleteCollectionDialog from './delete-collection-dialog'

interface CollectionCardMenuProps {
  collection: {
    id: string
    name: string
    description: string | null
    isFavorite: boolean
  }
}

export default function CollectionCardMenu({ collection }: CollectionCardMenuProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { isFavorite, toggle: handleFavorite } = useCollectionFavoriteToggle(
    collection.id,
    collection.isFavorite,
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            />
          }
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFavorite}>
            <Star
              className="w-3.5 h-3.5 mr-2"
              style={isFavorite ? { fill: '#facc15', color: '#facc15' } : {}}
            />
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div onClick={(e) => e.stopPropagation()}>
        <EditCollectionDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          collection={collection}
        />

        <DeleteCollectionDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          collection={collection}
        />
      </div>
    </>
  )
}
