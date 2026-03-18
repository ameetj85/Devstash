---
name: DevStash Architecture Overview
description: Key architectural decisions, file locations, and patterns found during initial codebase scan (March 2026)
type: project
---

DevStash is a developer knowledge hub (Next.js 16 / React 19 / Prisma 7 / Neon PostgreSQL). As of March 2026 the app has a dashboard UI, Prisma schema, and seed data — but no auth (NextAuth v5 not yet wired up), no API routes, and no mutation UI.

**Why:** Early-stage project; all data fetching is unauthenticated server components reading from a shared demo DB.
**How to apply:** Do not flag missing auth on routes as a security issue until auth is implemented. Focus audits on DB query patterns, component design, and TypeScript correctness.

Key file locations:
- DB queries: `src/lib/db/collections.ts`, `src/lib/db/items.ts`
- Prisma singleton: `src/lib/prisma.ts` (uses PrismaNeon adapter)
- Dashboard page (async server component): `src/app/dashboard/page.tsx`
- Dashboard shell (client, manages sidebar state): `src/components/dashboard/dashboard-shell.tsx`
- Sidebar (client): `src/components/dashboard/sidebar.tsx`
- Main content (server component, no 'use client'): `src/components/dashboard/main-content.tsx`
- Mock data (unused): `src/lib/mock-data.ts`
- Seed: `prisma/seed.ts`
- Prisma config: `prisma.config.ts`
- Generated client: `src/generated/prisma/` (gitignored)
