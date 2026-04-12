'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
} from '@/lib/db/collections'
import { canCreateCollection } from '@/lib/subscription'
import { FREE_LIMITS } from '@/lib/stripe-config'

const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().max(2000).nullable().optional(),
})

const createCollectionSchema = collectionSchema

type CreateCollectionInput = z.infer<typeof createCollectionSchema>

export async function createCollection(data: CreateCollectionInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const parsed = createCollectionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const { name, description } = parsed.data

  const isPro = session.user.isPro ?? false
  const allowed = await canCreateCollection(session.user.id, isPro)
  if (!allowed) {
    return { success: false as const, error: `You've reached the free limit of ${FREE_LIMITS.collections} collections. Upgrade to Pro for unlimited collections.` }
  }

  const created = await createCollectionQuery(session.user.id, {
    name,
    description: description ?? null,
  })

  return { success: true as const, data: created }
}

type UpdateCollectionInput = z.infer<typeof collectionSchema> & { id: string }

export async function updateCollection(data: UpdateCollectionInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const parsed = collectionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors }
  }

  try {
    const updated = await updateCollectionQuery(session.user.id, data.id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    return { success: true as const, data: updated }
  } catch {
    return { success: false as const, error: 'Collection not found' }
  }
}

export async function deleteCollection(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  try {
    await deleteCollectionQuery(session.user.id, id)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Collection not found' }
  }
}

export async function toggleCollectionFavorite(collectionId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const result = await toggleCollectionFavoriteQuery(session.user.id, collectionId)
  if (!result) {
    return { success: false as const, error: 'Collection not found or access denied' }
  }

  return { success: true as const, data: result }
}
