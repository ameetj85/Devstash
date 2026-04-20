'use server'

import { z } from 'zod'
import { updateItem as updateItemQuery, deleteItem as deleteItemQuery, createItem as createItemQuery, toggleItemFavorite as toggleItemFavoriteQuery, toggleItemPin as toggleItemPinQuery } from '@/lib/db/items'
import { deleteR2Object, keyFromUrl } from '@/lib/r2'
import { canCreateItem, canUseFileUpload } from '@/lib/subscription'
import { FREE_LIMITS } from '@/lib/stripe-config'
import { requireAuth, parseOrFail } from '@/lib/action-helpers'

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  description: z.string().max(2000).nullable().optional(),
  content: z.string().max(500_000).nullable().optional(),
  url: z.union([z.string().url('Must be a valid URL'), z.null()]).optional(),
  language: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(50),
  collectionIds: z.array(z.string().min(1)).max(50).optional(),
})

type UpdateItemInput = z.infer<typeof updateItemSchema>

export async function updateItem(itemId: string, data: UpdateItemInput) {
  const session = await requireAuth()
  if ('success' in session) return session

  const parsed = parseOrFail(updateItemSchema, data)
  if (!parsed.success) return parsed

  const { title, description, content, url, language, tags, collectionIds } = parsed.data

  const updated = await updateItemQuery(session.userId, itemId, {
    title,
    description: description ?? null,
    content: content ?? null,
    url: url ?? null,
    language: language ?? null,
    tags,
    collectionIds: collectionIds ?? [],
  })

  if (!updated) {
    return { success: false as const, error: 'Item not found or access denied' }
  }

  return { success: true as const, data: updated }
}

const VALID_TYPES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const

const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  typeName: z.enum(VALID_TYPES, { error: 'Invalid item type' }),
  description: z.string().max(2000).nullable().optional(),
  content: z.string().max(500_000).nullable().optional(),
  url: z.union([z.string().url('Must be a valid URL'), z.literal(''), z.null()]).optional(),
  language: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(50),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  collectionIds: z.array(z.string().min(1)).max(50).optional(),
}).superRefine((data, ctx) => {
  if (data.typeName === 'link' && !data.url) {
    ctx.addIssue({ code: 'custom', message: 'URL is required for links', path: ['url'] })
  }
  if ((data.typeName === 'file' || data.typeName === 'image') && !data.fileUrl) {
    ctx.addIssue({ code: 'custom', message: 'A file must be uploaded', path: ['fileUrl'] })
  }
})

type CreateItemInput = z.infer<typeof createItemSchema>

export async function createItem(data: CreateItemInput) {
  const session = await requireAuth()
  if ('success' in session) return session

  const parsed = parseOrFail(createItemSchema, data)
  if (!parsed.success) return parsed

  const { title, typeName, description, content, url, language, tags, fileUrl, fileName, fileSize, collectionIds } = parsed.data

  if ((typeName === 'file' || typeName === 'image') && !canUseFileUpload(session.isPro)) {
    return { success: false as const, error: 'File and image types require a Pro subscription. Upgrade to Pro in Settings.' }
  }

  const allowed = await canCreateItem(session.userId, session.isPro)
  if (!allowed) {
    return { success: false as const, error: `You've reached the free limit of ${FREE_LIMITS.items} items. Upgrade to Pro for unlimited items.` }
  }

  const created = await createItemQuery(session.userId, {
    title,
    typeName,
    description: description ?? null,
    content: content ?? null,
    url: url || null,
    language: language ?? null,
    tags,
    collectionIds: collectionIds ?? [],
    fileUrl: fileUrl ?? null,
    fileName: fileName ?? null,
    fileSize: fileSize ?? null,
  })

  if (!created) {
    // Clean up the uploaded R2 file if the item record couldn't be created
    if (fileUrl) {
      const key = keyFromUrl(fileUrl)
      if (key) await deleteR2Object(key).catch(() => {})
    }
    return { success: false as const, error: 'Invalid item type' }
  }

  return { success: true as const, data: created }
}

export async function deleteItem(itemId: string) {
  const session = await requireAuth()
  if ('success' in session) return session

  const deleted = await deleteItemQuery(session.userId, itemId)
  if (!deleted) {
    return { success: false as const, error: 'Item not found or access denied' }
  }

  // Delete file from R2 if present
  if (deleted.fileUrl) {
    const key = keyFromUrl(deleted.fileUrl)
    if (key) {
      await deleteR2Object(key).catch(() => {
        // Non-fatal: log but don't fail the action
        console.error(`Failed to delete R2 object: ${key}`)
      })
    }
  }

  return { success: true as const }
}

export async function toggleItemFavorite(itemId: string) {
  const session = await requireAuth()
  if ('success' in session) return session

  const result = await toggleItemFavoriteQuery(session.userId, itemId)
  if (!result) {
    return { success: false as const, error: 'Item not found or access denied' }
  }

  return { success: true as const, data: result }
}

export async function toggleItemPin(itemId: string) {
  const session = await requireAuth()
  if ('success' in session) return session

  const result = await toggleItemPinQuery(session.userId, itemId)
  if (!result) {
    return { success: false as const, error: 'Item not found or access denied' }
  }

  return { success: true as const, data: result }
}
