import { notFound, redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import ItemsClientWrapper from '@/components/items/items-client-wrapper'
import CreateItemDialog from '@/components/items/create-item-dialog'
import Pagination from '@/components/pagination'
import { auth } from '@/auth'
import { getItemsByType, getItemTypesWithCounts } from '@/lib/db/items'
import { getCollections, getUserCollections } from '@/lib/db/collections'
import { ITEMS_PER_PAGE } from '@/lib/constants'

interface ItemsPageProps {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ItemsPage({ params, searchParams }: ItemsPageProps) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const { type: typeSlug } = await params
  const { page: pageParam } = await searchParams
  // sidebar links as `${name}s` — strip the trailing 's' to get the DB name
  const typeName = typeSlug.endsWith('s') ? typeSlug.slice(0, -1) : typeSlug
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const [{ items, itemType, totalCount }, itemTypes, { collections }, collectionOptions] = await Promise.all([
    getItemsByType(userId, typeName, currentPage, ITEMS_PER_PAGE),
    getItemTypesWithCounts(userId),
    getCollections(userId),
    getUserCollections(userId),
  ])

  if (!itemType) notFound()

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const user = session.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user}>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight capitalize">{typeSlug}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <CreateItemDialog defaultType={typeName} collections={collectionOptions} />
        </div>

        {items.length === 0 && currentPage === 1 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-muted-foreground text-sm">No {typeSlug} yet.</p>
            <CreateItemDialog defaultType={typeName} collections={collectionOptions} />
          </div>
        ) : (
          <>
            <ItemsClientWrapper
              items={items}
              layout={typeName === 'image' ? 'gallery' : typeName === 'file' ? 'list' : 'grid'}
              collections={collectionOptions}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/items/${typeSlug}`}
            />
          </>
        )}
      </main>
    </DashboardShell>
  )
}
