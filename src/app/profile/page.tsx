import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getProfileData } from '@/lib/db/profile'
import UserAvatar from '@/components/user-avatar'
import ChangePasswordForm from '@/components/profile/change-password-form'
import DeleteAccountDialog from '@/components/profile/delete-account-dialog'
import { Layers, Folders } from 'lucide-react'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function ProfilePage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/sign-in')

  const profile = await getProfileData(userId)
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
          <h1 className="text-2xl font-bold mt-4">Profile</h1>
        </div>

        {/* User Info */}
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

        {/* Usage Stats */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Usage
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 shrink-0" style={{ color: '#3b82f6' }} />
                <p className="text-3xl font-bold">{profile.totalItems}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total items</p>
            </div>
            <div className="rounded-md bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <Folders className="w-5 h-5 shrink-0" style={{ color: '#10b981' }} />
                <p className="text-3xl font-bold">{profile.totalCollections}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Collections</p>
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
