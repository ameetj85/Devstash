import { notFound, redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import ItemsClientWrapper from '@/components/items/items-client-wrapper'
import { auth } from '@/auth'
import { getCollections, getCollectionById, getUserCollections } from '@/lib/db/collections'
import { getItemsByCollection, getItemTypesWithCounts } from '@/lib/db/items'

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const { id } = await params

  const [collection, items, itemTypes, collections, collectionOptions] = await Promise.all([
    getCollectionById(userId, id),
    getItemsByCollection(userId, id),
    getItemTypesWithCounts(userId),
    getCollections(userId),
    getUserCollections(userId),
  ])

  if (!collection) notFound()

  const user = session.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user}>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {collection.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-muted-foreground text-sm">No items in this collection yet.</p>
          </div>
        ) : (
          <ItemsClientWrapper items={items} collections={collectionOptions} />
        )}
      </main>
    </DashboardShell>
  )
}
