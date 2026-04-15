import Link from 'next/link'
import {
  Star,
  Layers,
  FolderOpen,
  Heart,
} from 'lucide-react'
import type { CollectionWithMeta } from '@/lib/db/collections'
import type { ItemWithType, ItemStats } from '@/lib/db/items'
import CollectionCard from '@/components/collections/collection-card'
import DashboardItemRows from './dashboard-item-rows'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MainContentProps {
  collections: CollectionWithMeta[]
  pinnedItems: ItemWithType[]
  recentItems: ItemWithType[]
  itemStats: ItemStats
  isPro?: boolean
}

export default function MainContent({
  collections,
  pinnedItems,
  recentItems,
  itemStats,
  isPro = false,
}: MainContentProps) {
  const totalCollections = collections.length
  const favoriteCollections = collections.filter((c) => c.isFavorite).length

  const stats = [
    { label: 'Total Items', value: itemStats.totalItems, icon: Layers },
    { label: 'Collections', value: totalCollections, icon: FolderOpen },
    { label: 'Favorite Items', value: itemStats.favoriteItems, icon: Heart },
    { label: 'Favorite Collections', value: favoriteCollections, icon: Star },
  ]

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your developer knowledge hub
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </section>

      <DashboardItemRows
        pinnedItems={pinnedItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          isFavorite: item.isFavorite,
          isPinned: item.isPinned,
          updatedAtFormatted: formatDate(item.updatedAt),
          tags: item.tags,
          itemType: item.itemType,
        }))}
        recentItems={recentItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          isFavorite: item.isFavorite,
          isPinned: item.isPinned,
          updatedAtFormatted: formatDate(item.updatedAt),
          tags: item.tags,
          itemType: item.itemType,
        }))}
        collections={collections.map((c) => ({ id: c.id, name: c.name }))}
        isPro={isPro}
      />
    </main>
  )
}
