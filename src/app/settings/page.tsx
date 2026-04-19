import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getProfileData, getEditorPreferences } from '@/lib/db/profile'
import { getItemTypesWithCounts, hasFavorites } from '@/lib/db/items'
import { getCollections } from '@/lib/db/collections'
import DashboardShell from '@/components/dashboard/dashboard-shell'
import ChangePasswordForm from '@/components/profile/change-password-form'
import DeleteAccountDialog from '@/components/profile/delete-account-dialog'
import EditorPreferencesForm from '@/components/settings/editor-preferences-form'
import SubscriptionSection from '@/components/settings/subscription-section'
import CheckoutSuccessToast from '@/components/settings/checkout-success-toast'
import { EditorPreferencesProvider } from '@/contexts/editor-preferences-context'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/sign-in')

  const [profile, editorPreferences, itemTypes, { collections }, favoritesExist, params] = await Promise.all([
    getProfileData(userId),
    getEditorPreferences(userId),
    getItemTypesWithCounts(userId),
    getCollections(userId),
    hasFavorites(userId),
    searchParams,
  ])
  if (!profile) redirect('/sign-in')

  const checkoutSuccess = params.checkout === 'success'
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

          {checkoutSuccess && <CheckoutSuccessToast />}

          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <SubscriptionSection
            isPro={profile.isPro}
            hasSubscription={!!profile.stripeSubscriptionId}
            totalItems={profile.totalItems}
            totalCollections={profile.totalCollections}
          />

          <EditorPreferencesProvider initialPreferences={editorPreferences}>
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Editor Preferences
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize the code editor appearance. Changes are saved automatically.
              </p>
              <EditorPreferencesForm />
            </section>
          </EditorPreferencesProvider>

          {profile.hasPassword && (
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Change Password
              </h2>
              <ChangePasswordForm />
            </section>
          )}

          <section className="rounded-lg border border-destructive/40 bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <DeleteAccountDialog />
          </section>

        </div>
      </main>
    </DashboardShell>
  )
}
