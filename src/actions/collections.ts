'use server'

import { z } from 'zod'
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
} from '@/lib/db/collections'
import { canCreateCollection } from '@/lib/subscription'
import { FREE_LIMITS } from '@/lib/stripe-config'
import { requireAuth, parseOrFail } from '@/lib/action-helpers'

const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().max(2000).nullable().optional(),
})

const createCollectionSchema = collectionSchema

type CreateCollectionInput = z.infer<typeof createCollectionSchema>

export async function createCollection(data: CreateCollectionInput) {
  const session = await requireAuth()
  if ('success' in session) return session

  const parsed = parseOrFail(createCollectionSchema, data)
  if (!parsed.success) return parsed

  const { name, description } = parsed.data

  const allowed = await canCreateCollection(session.userId, session.isPro)
  if (!allowed) {
    return { success: false as const, error: `You've reached the free limit of ${FREE_LIMITS.collections} collections. Upgrade to Pro for unlimited collections.` }
  }

  const created = await createCollectionQuery(session.userId, {
    name,
    description: description ?? null,
  })

  return { success: true as const, data: created }
}

type UpdateCollectionInput = z.infer<typeof collectionSchema> & { id: string }

export async function updateCollection(data: UpdateCollectionInput) {
  const session = await requireAuth()
  if ('success' in session) return session

  const parsed = parseOrFail(collectionSchema, data)
  if (!parsed.success) return parsed

  try {
    const updated = await updateCollectionQuery(session.userId, data.id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    return { success: true as const, data: updated }
  } catch {
    return { success: false as const, error: 'Collection not found' }
  }
}

export async function deleteCollection(id: string) {
  const session = await requireAuth()
  if ('success' in session) return session

  try {
    await deleteCollectionQuery(session.userId, id)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Collection not found' }
  }
}

export async function toggleCollectionFavorite(collectionId: string) {
  const session = await requireAuth()
  if ('success' in session) return session

  const result = await toggleCollectionFavoriteQuery(session.userId, collectionId)
  if (!result) {
    return { success: false as const, error: 'Collection not found or access denied' }
  }

  return { success: true as const, data: result }
}
