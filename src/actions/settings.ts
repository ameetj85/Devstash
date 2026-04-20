'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/action-helpers'

const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(10).max(24),
  tabSize: z.number().int().min(2).max(8),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(['vs-dark', 'monokai', 'github-dark']),
})

export async function updateEditorPreferences(data: z.infer<typeof editorPreferencesSchema>) {
  const session = await requireAuth()
  if ('success' in session) return session

  const parsed = editorPreferencesSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Invalid preferences' }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { editorPreferences: parsed.data },
  })

  return { success: true as const }
}
