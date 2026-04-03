import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import CreateCollectionDialog from '@/components/collections/create-collection-dialog'
import CollectionCard from '@/components/collections/collection-card'
import { auth } from '@/auth'
import { getCollections } from '@/lib/db/collections'
import { getItemTypesWithCounts } from '@/lib/db/items'

export default async function CollectionsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const [collections, itemTypes] = await Promise.all([
    getCollections(userId),
    getItemTypesWithCounts(userId),
  ])

  const user = session.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user}>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          <CreateCollectionDialog />
        </div>

        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-muted-foreground text-sm">No collections yet.</p>
            <CreateCollectionDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
        )}
      </main>
    </DashboardShell>
  )
}
