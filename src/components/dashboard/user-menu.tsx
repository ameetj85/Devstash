'use client'

import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import UserAvatar from '@/components/user-avatar'

interface UserMenuProps {
  name?: string | null
  email?: string | null
  image?: string | null
  isCollapsed: boolean
}

export default function UserMenu({ name, email, image, isCollapsed }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 w-full rounded-md p-1 hover:bg-sidebar-accent transition-colors',
          isCollapsed && 'justify-center'
        )}
        title={isCollapsed ? (name ?? 'Account') : undefined}
      >
        <UserAvatar name={name} image={image} />
        {!isCollapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {name ?? 'Account'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{email ?? ''}</p>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1 z-50">
          <a
            href="/profile"
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="w-4 h-4" />
            Profile
          </a>
          <a
            href="/settings"
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </a>
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-accent hover:text-destructive transition-colors"
            onClick={() => signOut({ redirectTo: '/sign-in' })}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
