import Link from 'next/link'
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image,
  Star,
  Pin,
  Layers,
  FolderOpen,
  Heart,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { CollectionWithMeta } from '@/lib/db/collections'
import type { ItemWithType, ItemStats } from '@/lib/db/items'

// ─── Icon map ────────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image,
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MainContentProps {
  collections: CollectionWithMeta[]
  pinnedItems: ItemWithType[]
  recentItems: ItemWithType[]
  itemStats: ItemStats
}

export default function MainContent({
  collections,
  pinnedItems,
  recentItems,
  itemStats,
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
          {collections.map((col) => {
            return (
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
                        const Icon = iconMap[icon] ?? File
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
            )
          })}
        </div>
      </section>

      {/* Pinned items */}
      {pinnedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-3">
            <Pin className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Pinned</h2>
          </div>
          <div className="space-y-2">
            {pinnedItems.map((item) => {
              const Icon = iconMap[item.itemType.icon] ?? File
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.itemType.color + '22' }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: item.itemType.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(item.updatedAt)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent items */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent</h2>
        </div>
        <div className="space-y-2">
          {recentItems.map((item) => {
            const Icon = iconMap[item.itemType.icon] ?? File
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.itemType.color + '22' }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: item.itemType.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.isFavorite && (
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.updatedAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
