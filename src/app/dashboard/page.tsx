import DashboardShell from '@/components/dashboard/dashboard-shell'
import MainContent from '@/components/dashboard/main-content'
import { getCollections } from '@/lib/db/collections'
import { getPinnedItems, getRecentItems, getItemStats, getItemTypesWithCounts } from '@/lib/db/items'

export default async function DashboardPage() {
  const [collections, pinnedItems, recentItems, itemStats, itemTypes] = await Promise.all([
    getCollections(),
    getPinnedItems(),
    getRecentItems(),
    getItemStats(),
    getItemTypesWithCounts(),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections}>
      <MainContent
        collections={collections}
        pinnedItems={pinnedItems}
        recentItems={recentItems}
        itemStats={itemStats}
      />
    </DashboardShell>
  )
}
