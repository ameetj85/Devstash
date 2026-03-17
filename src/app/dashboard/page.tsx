import DashboardShell from '@/components/dashboard/dashboard-shell'
import MainContent from '@/components/dashboard/main-content'
import { getCollections } from '@/lib/db/collections'

export default async function DashboardPage() {
  const collections = await getCollections()
  return (
    <DashboardShell>
      <MainContent collections={collections} />
    </DashboardShell>
  )
}
