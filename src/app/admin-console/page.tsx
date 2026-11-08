import type { Metadata } from 'next'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import { requireAdmin } from '@/lib/admin-access'
import { getCollections } from '@/lib/db/collections'
import { getItemTypesWithCounts, hasFavorites } from '@/lib/db/items'
import { getEditorPreferences } from '@/lib/db/profile'
import { getAdminUsers } from '@/lib/db/admin'
import AdminConsole from '@/components/admin/admin-console'

export const metadata: Metadata = { title: 'Admin Console' }

export default async function AdminConsolePage() {
  const session = await requireAdmin()
  const userId = session.user.id
  const [itemTypes, { collections }, editorPreferences, favoritesExist, users] = await Promise.all([
    getItemTypesWithCounts(userId),
    getCollections(userId),
    getEditorPreferences(userId),
    hasFavorites(userId),
    getAdminUsers(),
  ])

  return (
    <DashboardShell
      itemTypes={itemTypes}
      collections={collections}
      user={session.user}
      editorPreferences={editorPreferences}
      hasFavorites={favoritesExist}
    >
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
          <AdminConsole users={users} currentUserId={userId} />
        </div>
      </main>
    </DashboardShell>
  )
}
