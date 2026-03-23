'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { updateItem as updateItemQuery, deleteItem as deleteItemQuery, createItem as createItemQuery } from '@/lib/db/items'
import { deleteR2Object, keyFromUrl } from '@/lib/r2'

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.union([z.string().url('Must be a valid URL'), z.null()]).optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
})

type UpdateItemInput = z.infer<typeof updateItemSchema>

export async function updateItem(itemId: string, data: UpdateItemInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const parsed = updateItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const { title, description, content, url, language, tags } = parsed.data

  const updated = await updateItemQuery(session.user.id, itemId, {
    title,
    description: description ?? null,
    content: content ?? null,
    url: url ?? null,
    language: language ?? null,
    tags,
  })

  if (!updated) {
    return { success: false as const, error: 'Item not found or access denied' }
  }

  return { success: true as const, data: updated }
}

const VALID_TYPES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const

const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  typeName: z.enum(VALID_TYPES, { error: 'Invalid item type' }),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.union([z.string().url('Must be a valid URL'), z.literal(''), z.null()]).optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
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
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const parsed = createItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const { title, typeName, description, content, url, language, tags, fileUrl, fileName, fileSize } = parsed.data

  const created = await createItemQuery(session.user.id, {
    title,
    typeName,
    description: description ?? null,
    content: content ?? null,
    url: url || null,
    language: language ?? null,
    tags,
    fileUrl: fileUrl ?? null,
    fileName: fileName ?? null,
    fileSize: fileSize ?? null,
  })

  if (!created) {
    return { success: false as const, error: 'Invalid item type' }
  }

  return { success: true as const, data: created }
}

export async function deleteItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const deleted = await deleteItemQuery(session.user.id, itemId)
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
