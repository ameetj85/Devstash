import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getProfileData, getEditorPreferences } from '@/lib/db/profile'
import { getItemTypesWithCounts, hasFavorites } from '@/lib/db/items'
import { getCollections } from '@/lib/db/collections'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import UserAvatar from '@/components/user-avatar'
import { Layers, Folders } from 'lucide-react'
import { FREE_LIMITS } from '@/lib/stripe-config'

export const metadata: Metadata = { title: 'Profile' }

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function ProfilePage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/sign-in')

  const [profile, itemTypes, { collections }, editorPreferences, favoritesExist] = await Promise.all([
    getProfileData(userId),
    getItemTypesWithCounts(userId),
    getCollections(userId),
    getEditorPreferences(userId),
    hasFavorites(userId),
  ])
  if (!profile) redirect('/sign-in')

  const user = session.user ?? {}

  return (
    <DashboardShell
      itemTypes={itemTypes}
      collections={collections}
      user={user}
      editorPreferences={editorPreferences}
      hasFavorites={favoritesExist}
      isPro={session.user?.isPro ?? false}
    >
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">

          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>

          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Account
            </h2>
            <div className="flex items-center gap-4">
              <UserAvatar name={profile.name} image={profile.image} className="w-14 h-14 text-lg" />
              <div className="min-w-0">
                <p className="font-semibold text-lg truncate">{profile.name ?? 'No name'}</p>
                <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Member since {formatDate(profile.createdAt)}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Usage
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 shrink-0" style={{ color: '#3b82f6' }} />
                  <p className="text-3xl font-bold">
                    {profile.isPro
                      ? profile.totalItems
                      : `${profile.totalItems} / ${FREE_LIMITS.items}`}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.isPro ? 'Unlimited items' : 'Total items'}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Folders className="w-5 h-5 shrink-0" style={{ color: '#10b981' }} />
                  <p className="text-3xl font-bold">
                    {profile.isPro
                      ? profile.totalCollections
                      : `${profile.totalCollections} / ${FREE_LIMITS.collections}`}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.isPro ? 'Unlimited collections' : 'Collections'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-3">By type</p>
              <div className="grid grid-cols-3 gap-2">
                {profile.itemTypeCounts.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-sm capitalize flex-1 truncate">{t.name}s</span>
                    <span className="text-sm font-medium tabular-nums">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>
    </DashboardShell>
  )
}
