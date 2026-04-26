---
name: Scribbles Architecture Overview
description: Key architectural decisions, file locations, and current state of the Scribbles codebase (March 2026 — post-auth/items/uploads scan)
type: project
---

Scribbles is a fully auth-gated developer knowledge hub. As of March 2026, the app has: full auth (NextAuth v5, GitHub OAuth + credentials, email verification, rate limiting), items CRUD with a drawer UI, file/image upload via Cloudflare R2, and a dashboard. Collections and search pages are not yet built (sidebar links go to /collections/* which 404).

**Why:** Active course project built incrementally. Auth, items, and file upload are fully implemented. Collections/search are next.
**How to apply:** Do not flag missing collection/search pages as issues — they are planned but not yet implemented.

## Key file locations
- Auth config: `src/auth.ts` (full, with Prisma adapter + bcrypt), `src/auth.config.ts` (edge-safe providers-only)
- Route protection: `src/proxy.ts` (middleware protecting /dashboard, /profile, /items)
- DB queries: `src/lib/db/items.ts`, `src/lib/db/collections.ts`, `src/lib/db/profile.ts`
- Server actions: `src/actions/items.ts` (createItem, updateItem, deleteItem with Zod validation + auth)
- API routes: `src/app/api/` — auth (register, verify-email, forgot-password, reset-password), items/[id] (GET), upload (POST), files/[key] (GET proxy), profile/change-password, profile/delete-account
- R2 utilities: `src/lib/r2.ts` (S3Client, deleteR2Object, keyFromUrl)
- Rate limiting: `src/lib/rate-limit.ts` (Upstash Redis, sliding window, fails open)
- Email: `src/lib/email.ts` (Resend, sendVerificationEmail, sendPasswordResetEmail)
- Tokens: `src/lib/tokens.ts` (UUID v4, stored in VerificationToken; reset tokens use `reset:<email>` identifier prefix)
- Mock data: `src/lib/mock-data.ts` — exists but no longer imported anywhere (dead code)

## Auth strategy
- JWT sessions (not database sessions)
- Email verification gated by EMAIL_VERIFICATION_ENABLED env var (off by default in dev)
- Login rate limiting done inside NextAuth authorize callback (cannot set Retry-After header from there)

## File storage
- R2 keys are `userId/uuid.ext`
- Download proxied through `/api/files/[key]` with ownership check (userId prefix match OR DB lookup)
- Images served directly from R2 public URL for next/image; `next.config.ts` has remotePatterns for R2 hostname
- `keyFromUrl()` in `src/lib/r2.ts` is the canonical way to extract a key from a public URL — used server-side only
