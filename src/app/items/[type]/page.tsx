import { notFound, redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import ItemsClientWrapper from '@/components/items/items-client-wrapper'
import { auth } from '@/auth'
import { getItemsByType, getItemTypesWithCounts } from '@/lib/db/items'
import { getCollections } from '@/lib/db/collections'

interface ItemsPageProps {
  params: Promise<{ type: string }>
}

export default async function ItemsPage({ params }: ItemsPageProps) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const { type: typeSlug } = await params
  // sidebar links as `${name}s` — strip the trailing 's' to get the DB name
  const typeName = typeSlug.endsWith('s') ? typeSlug.slice(0, -1) : typeSlug

  const [{ items, itemType }, itemTypes, collections] = await Promise.all([
    getItemsByType(userId, typeName),
    getItemTypesWithCounts(userId),
    getCollections(userId),
  ])

  if (!itemType) notFound()

  const user = session.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user}>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">{typeSlug}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-sm">No {typeSlug} yet.</p>
          </div>
        ) : (
          <ItemsClientWrapper items={items} />
        )}
      </main>
    </DashboardShell>
  )
}
