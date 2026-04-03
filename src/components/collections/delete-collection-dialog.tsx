'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteCollection } from '@/actions/collections'

interface DeleteCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: {
    id: string
    name: string
  }
  redirectOnDelete?: string
}

export default function DeleteCollectionDialog({
  open,
  onOpenChange,
  collection,
  redirectOnDelete,
}: DeleteCollectionDialogProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)

    const result = await deleteCollection(collection.id)

    setDeleting(false)

    if (!result.success) {
      toast.error(result.error || 'Failed to delete collection')
      return
    }

    toast.success('Collection deleted')
    onOpenChange(false)

    if (redirectOnDelete) {
      router.push(redirectOnDelete)
    } else {
      router.refresh()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{collection.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this collection. Items in this collection will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
