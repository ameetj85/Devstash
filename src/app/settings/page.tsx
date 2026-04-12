import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getProfileData, getEditorPreferences } from '@/lib/db/profile'
import ChangePasswordForm from '@/components/profile/change-password-form'
import DeleteAccountDialog from '@/components/profile/delete-account-dialog'
import EditorPreferencesForm from '@/components/settings/editor-preferences-form'
import { EditorPreferencesProvider } from '@/contexts/editor-preferences-context'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/sign-in')

  const [profile, editorPreferences] = await Promise.all([
    getProfileData(userId),
    getEditorPreferences(userId),
  ])
  if (!profile) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        {/* Header */}
        <div>
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-4">Settings</h1>
        </div>

        {/* Editor Preferences */}
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

        {/* Change Password */}
        {profile.hasPassword && (
          <section className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Change Password
            </h2>
            <ChangePasswordForm />
          </section>
        )}

        {/* Danger Zone */}
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
    </div>
  )
}
