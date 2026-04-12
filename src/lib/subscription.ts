import { prisma } from '@/lib/prisma'
import { FREE_LIMITS } from '@/lib/stripe-config'

export async function canCreateItem(
  userId: string,
  isPro: boolean
): Promise<boolean> {
  if (isPro) return true
  const count = await prisma.item.count({ where: { userId } })
  return count < FREE_LIMITS.items
}

export async function canCreateCollection(
  userId: string,
  isPro: boolean
): Promise<boolean> {
  if (isPro) return true
  const count = await prisma.collection.count({ where: { userId } })
  return count < FREE_LIMITS.collections
}

export function canUseFileUpload(isPro: boolean): boolean {
  return isPro
}
