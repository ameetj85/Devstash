import DashboardShell from '@/components/dashboard/dashboard-shell'
import MainContent from '@/components/dashboard/main-content'
import { auth } from '@/auth'
import { getCollections } from '@/lib/db/collections'
import { getPinnedItems, getRecentItems, getItemStats, getItemTypesWithCounts } from '@/lib/db/items'

export default async function DashboardPage() {
  const [session, collections, pinnedItems, recentItems, itemStats, itemTypes] = await Promise.all([
    auth(),
    getCollections(),
    getPinnedItems(),
    getRecentItems(),
    getItemStats(),
    getItemTypesWithCounts(),
  ])

  const user = session?.user ?? {}

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={user}>
      <MainContent
        collections={collections}
        pinnedItems={pinnedItems}
        recentItems={recentItems}
        itemStats={itemStats}
      />
    </DashboardShell>
  )
}
