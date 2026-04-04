import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSearchItems } from '@/lib/db/items'
import { getSearchCollections } from '@/lib/db/collections'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [items, collections] = await Promise.all([
    getSearchItems(session.user.id),
    getSearchCollections(session.user.id),
  ])

  return NextResponse.json({ items, collections })
}
