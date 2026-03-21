'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { updateItem as updateItemQuery } from '@/lib/db/items'

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
