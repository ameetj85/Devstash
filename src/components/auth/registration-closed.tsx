'use client'

import Link from 'next/link'
import { Lock, Mail, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function RegistrationClosed() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Registration is invite-only
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            DevStash is currently in a private preview. Public sign-ups are
            paused while we polish the experience with a small group of early
            users.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Have an invite?</p>
              <p className="mt-1 text-muted-foreground">
                Use the link from your invitation email to create your account.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/sign-in"
            className={buttonVariants({ className: 'w-full' })}
          >
            Sign in to your account
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: 'ghost', className: 'w-full' })}
          >
            Back to home
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Want early access?{' '}
        <a
          href="mailto:hello@devstash.app"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Request an invite
        </a>
      </p>
    </div>
  )
}
