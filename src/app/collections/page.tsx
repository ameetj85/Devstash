import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import CreateCollectionDialog from '@/components/collections/create-collection-dialog'
import CollectionCard from '@/components/collections/collection-card'
import Pagination from '@/components/pagination'
import { auth } from '@/auth'
import { getCollections } from '@/lib/db/collections'
import { getItemTypesWithCounts, hasFavorites as checkHasFavorites } from '@/lib/db/items'
import { getEditorPreferences } from '@/lib/db/profile'
import { COLLECTIONS_PER_PAGE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Collections' }

interface CollectionsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const [{ collections, totalCount }, itemTypes, editorPreferences, userHasFavorites] = await Promise.all([
    getCollections(userId, { page: currentPage, perPage: COLLECTIONS_PER_PAGE }),
    getItemTypesWithCounts(userId),
    getEditorPreferences(userId),
    checkHasFavorites(userId),
  ])

  const totalPages = Math.ceil(totalCount / COLLECTIONS_PER_PAGE)
  const user = session.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user} editorPreferences={editorPreferences} hasFavorites={userHasFavorites}>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} {totalCount === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          <CreateCollectionDialog />
        </div>

        {collections.length === 0 && currentPage === 1 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-muted-foreground text-sm">No collections yet.</p>
            <CreateCollectionDialog />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {collections.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/collections"
            />
          </>
        )}
      </main>
    </DashboardShell>
  )
}
