import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import ItemsClientWrapper from '@/components/items/items-client-wrapper'
import Pagination from '@/components/pagination'
import { auth } from '@/auth'
import { getCollections, getCollectionById, getUserCollections } from '@/lib/db/collections'
import { getItemsByCollection, getItemTypesWithCounts, hasFavorites as checkHasFavorites } from '@/lib/db/items'
import { getEditorPreferences } from '@/lib/db/profile'
import CollectionDetailActions from '@/components/collections/collection-detail-actions'
import { ITEMS_PER_PAGE } from '@/lib/constants'

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { title: 'Collection' }
  const { id } = await params
  const collection = await getCollectionById(userId, id)
  return { title: collection?.name ?? 'Collection' }
}

export default async function CollectionDetailPage({ params, searchParams }: CollectionDetailPageProps) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const { id } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const [collection, { items, totalCount }, itemTypes, { collections }, collectionOptions, editorPreferences, userHasFavorites] = await Promise.all([
    getCollectionById(userId, id),
    getItemsByCollection(userId, id, currentPage, ITEMS_PER_PAGE),
    getItemTypesWithCounts(userId),
    getCollections(userId),
    getUserCollections(userId),
    getEditorPreferences(userId),
    checkHasFavorites(userId),
  ])

  if (!collection) notFound()

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const user = session.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user} editorPreferences={editorPreferences} hasFavorites={userHasFavorites} isPro={session.user?.isPro ?? false}>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {collection.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <CollectionDetailActions collection={collection} />
        </div>

        {items.length === 0 && currentPage === 1 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-muted-foreground text-sm">No items in this collection yet.</p>
          </div>
        ) : (
          <>
            <ItemsClientWrapper items={items} collections={collectionOptions} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/collections/${id}`}
            />
          </>
        )}
      </main>
    </DashboardShell>
  )
}
