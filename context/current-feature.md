# Current Feature

## Status

Completed

## Goals

None

## Notes

None

## History

- 2026-03-16: Initial Next.js and Tailwind setup. Removed default boilerplate, added project context files (CLAUDE.md, project-overview.md).
- 2026-03-16: Dashboard UI Phase 1 — shadcn/ui setup, /dashboard route, dark mode, top bar with search and action buttons, sidebar and main placeholders as separate components.
- 2026-03-16: Dashboard UI Phase 2 — collapsible sidebar (icon-only on desktop, overlay drawer on mobile), item types with colored icons and counts linking to /items/[type]s, favorite collections, recent collections, user avatar area at bottom. DashboardShell client component added to manage sidebar state.
- 2026-03-16: Dashboard UI Phase 3 — 4 stats cards (total items, collections, favorite items, favorite collections), recent collections grid with type color indicators, pinned items section, 10 most recent items list. All powered by mock data.
- 2026-03-17: Prisma + Neon PostgreSQL setup — installed Prisma 7.5.0 (`prisma-client` provider, TypeScript-native, Rust-free), Neon serverless driver (`@neondatabase/serverless`) and adapter (`@prisma/adapter-neon`). Created full schema (`prisma/schema.prisma`) with all data models: User, Account, Session, VerificationToken, ItemType, Item, Collection, ItemCollection, Tag, ItemTag. Created `prisma.config.ts` with `defineConfig` for datasource and seed command. Created `src/lib/prisma.ts` singleton using `PrismaNeon` adapter. Ran initial migration (`20260317130653_init`). Seeded database with demo user, 7 system item types, 6 collections, and 6 items with tags and collection links.
