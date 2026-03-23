'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { createCollection as createCollectionQuery } from '@/lib/db/collections'

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().max(2000).nullable().optional(),
})

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

  const created = await createCollectionQuery(session.user.id, {
    name,
    description: description ?? null,
  })

  return { success: true as const, data: created }
}
