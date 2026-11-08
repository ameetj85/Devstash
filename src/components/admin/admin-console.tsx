'use client'

import { useState } from 'react'
import { Tabs } from '@base-ui/react/tabs'
import { KeyRound, MailPlus, Pencil, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdminUser } from '@/lib/db/admin'
import EditUserDialog from './edit-user-dialog'
import ResetPasswordDialog from './reset-password-dialog'
import SendInvites from './send-invites'
import CreateUserDialog from './create-user-dialog'

const tabClassName = 'flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-active:border-primary data-active:text-foreground focus-visible:outline-2 focus-visible:outline-ring'

interface AdminConsoleProps {
  users: AdminUser[]
  currentUserId: string
}

export default function AdminConsole({ users, currentUserId }: AdminConsoleProps) {
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [resetting, setResetting] = useState<AdminUser | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your application.</p>
      </div>
      <Tabs.Root defaultValue="users">
        <Tabs.List className="flex border-b border-border" aria-label="Admin console sections">
          <Tabs.Tab value="users" className={tabClassName}>
            <Users className="size-4" /> Users
          </Tabs.Tab>
          <Tabs.Tab value="invites" className={tabClassName}>
            <MailPlus className="size-4" /> Send Invites
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="users" className="pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Users</h2>
              <p className="text-sm text-muted-foreground">{users.length} {users.length === 1 ? 'user' : 'users'}</p>
            </div>
            <Button onClick={() => setCreating(true)}><UserPlus /> Create user</Button>
          </div>
          <div className="rounded-lg border border-border bg-card">
            {users.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No users found.</p>
            ) : users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name || 'Unnamed user'}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email || 'No email'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.isAdmin ? 'Admin' : 'User'} {user.isPro ? ' · Pro' : ''} {user.emailVerified ? ' · Verified' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(user)} aria-label={`Edit ${user.name || user.email || user.id}`}>
                    <Pencil /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setResetting(user)} aria-label={`Reset password for ${user.name || user.email || user.id}`}>
                    <KeyRound /> Reset password
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="invites" className="pt-6">
          <SendInvites />
        </Tabs.Panel>
      </Tabs.Root>
      {editing && <EditUserDialog user={editing} currentUserId={currentUserId} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
    </div>
  )
}
