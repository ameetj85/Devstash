'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toggleCollectionFavorite } from '@/actions/collections'
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
