import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import CreateCollectionDialog from '@/components/collections/create-collection-dialog'
import { auth } from '@/auth'
import { getCollections } from '@/lib/db/collections'
import { getItemTypesWithCounts } from '@/lib/db/items'
import { getItemIcon } from '@/lib/item-type-icons'

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
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group rounded-lg border bg-card p-4 hover:bg-card/80 transition-colors"
                style={{ borderColor: col.dominantColor + '55' }}
              >
                <div
                  className="w-full h-0.5 rounded-full mb-3 opacity-60"
                  style={{ backgroundColor: col.dominantColor }}
                />
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm leading-snug">
                    {col.name}
                  </span>
                  {col.isFavorite && (
                    <Star className="w-3.5 h-3.5 shrink-0 fill-yellow-400 text-yellow-400 mt-0.5" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {col.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {col.typeIcons.length > 0 ? (
                      col.typeIcons.slice(0, 4).map(({ icon, color, name }) => {
                        const Icon = getItemIcon(icon)
                        return (
                          <span
                            key={name}
                            className="w-5 h-5 rounded flex items-center justify-center"
                            style={{ backgroundColor: color + '22' }}
                          >
                            <Icon className="w-3 h-3" style={{ color }} />
                          </span>
                        )
                      })
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </DashboardShell>
  )
}
