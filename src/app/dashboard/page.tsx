import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import MainContent from '@/components/dashboard/main-content'
import { auth } from '@/auth'
import { getCollections } from '@/lib/db/collections'
import { getPinnedItems, getRecentItems, getItemStats, getItemTypesWithCounts, hasFavorites as checkHasFavorites } from '@/lib/db/items'
import { getEditorPreferences } from '@/lib/db/profile'
import { DASHBOARD_COLLECTIONS_LIMIT, DASHBOARD_RECENT_ITEMS_LIMIT } from '@/lib/constants'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/sign-in')

  const [{ collections }, pinnedItems, recentItems, itemStats, itemTypes, editorPreferences, userHasFavorites] = await Promise.all([
    getCollections(userId, { limit: DASHBOARD_COLLECTIONS_LIMIT }),
    getPinnedItems(userId),
    getRecentItems(userId, DASHBOARD_RECENT_ITEMS_LIMIT),
    getItemStats(userId),
    getItemTypesWithCounts(userId),
    getEditorPreferences(userId),
    checkHasFavorites(userId),
  ])

  const user = session.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user} editorPreferences={editorPreferences} hasFavorites={userHasFavorites}>
      <MainContent
        collections={collections}
        pinnedItems={pinnedItems}
        recentItems={recentItems}
        itemStats={itemStats}
      />
    </DashboardShell>
  )
}
