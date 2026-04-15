import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Star } from 'lucide-react'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import FavoritesList from '@/components/favorites/favorites-list'
import { auth } from '@/auth'
import { getFavoriteItems, getItemTypesWithCounts } from '@/lib/db/items'
import { getCollections, getFavoriteCollections, getUserCollections } from '@/lib/db/collections'
import { getEditorPreferences } from '@/lib/db/profile'

export const metadata: Metadata = { title: 'Favorites' }

export default async function FavoritesPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const [favoriteItems, favoriteCollections, itemTypes, { collections }, collectionOptions, editorPreferences] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
    getItemTypesWithCounts(userId),
    getCollections(userId),
    getUserCollections(userId),
    getEditorPreferences(userId),
  ])

  const user = session.user ?? {}
  const totalFavorites = favoriteItems.length + favoriteCollections.length

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user} editorPreferences={editorPreferences} hasFavorites={totalFavorites > 0} isPro={session.user?.isPro ?? false}>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalFavorites} {totalFavorites === 1 ? 'favorite' : 'favorites'}
            </p>
          </div>
        </div>

        <FavoritesList
          items={favoriteItems}
          collections={favoriteCollections}
          allCollections={collectionOptions}
          isPro={session.user?.isPro ?? false}
        />
      </main>
    </DashboardShell>
  )
}
