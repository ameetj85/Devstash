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
import {
  mockItems,
  mockCollections,
  mockItemTypes,
  mockTypeCounts,
} from '@/lib/mock-data'

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

// ─── Derived data ─────────────────────────────────────────────────────────────

const typeById = Object.fromEntries(mockItemTypes.map((t) => [t.id, t]))

const totalItems = Object.values(mockTypeCounts).reduce((a, b) => a + b, 0)
const totalCollections = mockCollections.length
const favoriteItems = mockItems.filter((i) => i.isFavorite).length
const favoriteCollections = mockCollections.filter((c) => c.isFavorite).length

const pinnedItems = mockItems.filter((i) => i.isPinned)
const recentItems = [...mockItems]
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 10)

const stats = [
  { label: 'Total Items', value: totalItems, icon: Layers },
  { label: 'Collections', value: totalCollections, icon: FolderOpen },
  { label: 'Favorite Items', value: favoriteItems, icon: Heart },
  { label: 'Favorite Collections', value: favoriteCollections, icon: Star },
]

function getCollectionTypeColors(collectionId: string): string[] {
  const colors = mockItems
    .filter((i) => i.collectionIds.includes(collectionId))
    .map((i) => typeById[i.itemTypeId]?.color)
    .filter((c): c is string => Boolean(c))
  return [...new Set(colors)].slice(0, 4)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MainContent() {
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
          {mockCollections.map((col) => {
            const typeColors = getCollectionTypeColors(col.id)
            return (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group rounded-lg border border-border bg-card p-4 hover:border-border/80 hover:bg-card/80 transition-colors"
              >
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
                    {typeColors.length > 0 ? (
                      typeColors.map((color) => (
                        <span
                          key={color}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {col.itemCount} items
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
              const type = typeById[item.itemTypeId]
              const Icon = type ? (iconMap[type.icon] ?? File) : File
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: type?.color + '22' }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: type?.color }}
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
            const type = typeById[item.itemTypeId]
            const Icon = type ? (iconMap[type.icon] ?? File) : File
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: type?.color + '22' }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: type?.color }}
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
