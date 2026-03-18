# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

In Progress

## Goals

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up split auth config pattern for edge compatibility
- Add GitHub OAuth provider
- Protect `/dashboard/*` routes using Next.js 16 proxy
- Redirect unauthenticated users to sign-in

## Notes

### Files to Create
1. `src/auth.config.ts` - Edge-compatible config (providers only, no adapter)
2. `src/auth.ts` - Full config with Prisma adapter and JWT strategy
3. `src/app/api/auth/[...nextauth]/route.ts` - Export handlers from auth.ts
4. `src/proxy.ts` - Route protection with redirect logic
5. `src/types/next-auth.d.ts` - Extend Session type with user.id

### Key Gotchas
- Use `next-auth@beta` (not `@latest` which installs v4)
- Proxy file must be at `src/proxy.ts` (same level as `app/`)
- Use named export: `export const proxy = auth(...)` not default export
- Use `session: { strategy: 'jwt' }` with split config pattern
- Don't set custom `pages.signIn` - use NextAuth's default page
- Use Context7 to verify newest config and conventions

### Environment Variables Needed
```
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

### Testing
1. Go to `/dashboard` - should redirect to sign-in
2. Click "Sign in with GitHub"
3. Verify redirect back to `/dashboard` after auth

## History

- 2026-03-16: Initial Next.js and Tailwind setup. Removed default boilerplate, added project context files (CLAUDE.md, project-overview.md).
- 2026-03-16: Dashboard UI Phase 1 — shadcn/ui setup, /dashboard route, dark mode, top bar with search and action buttons, sidebar and main placeholders as separate components.
- 2026-03-16: Dashboard UI Phase 2 — collapsible sidebar (icon-only on desktop, overlay drawer on mobile), item types with colored icons and counts linking to /items/[type]s, favorite collections, recent collections, user avatar area at bottom. DashboardShell client component added to manage sidebar state.
- 2026-03-16: Dashboard UI Phase 3 — 4 stats cards (total items, collections, favorite items, favorite collections), recent collections grid with type color indicators, pinned items section, 10 most recent items list. All powered by mock data.
- 2026-03-17: Prisma + Neon PostgreSQL setup — installed Prisma 7.5.0 (`prisma-client` provider, TypeScript-native, Rust-free), Neon serverless driver (`@neondatabase/serverless`) and adapter (`@prisma/adapter-neon`). Created full schema (`prisma/schema.prisma`) with all data models: User, Account, Session, VerificationToken, ItemType, Item, Collection, ItemCollection, Tag, ItemTag. Created `prisma.config.ts` with `defineConfig` for datasource and seed command. Created `src/lib/prisma.ts` singleton using `PrismaNeon` adapter. Ran initial migration (`20260317130653_init`). Seeded database with demo user, 7 system item types, 6 collections, and 6 items with tags and collection links.
- 2026-03-17: Seed data — rewrote `prisma/seed.ts` with richer sample data. Installed `bcryptjs` to hash the demo user password (12 rounds) and set `emailVerified`. Created 5 collections with 18 items: React Patterns (3 TypeScript snippets), AI Workflows (3 prompts), DevOps (1 snippet, 1 command, 2 links), Terminal Commands (4 commands), Design Resources (4 Links). All upserts for idempotency.
- 2026-03-17: Dashboard collections from DB — created `src/lib/db/collections.ts` with `getCollections` query (includes items + item types, computes dominant color and type icons per collection). Refactored `DashboardShell` to accept `children`, made `DashboardPage` async to fetch and pass real collection data to `MainContent`. Collection cards now show colored accent bar, type-colored border, small icon badges for each type, and real item counts.
- 2026-03-17: Dashboard items from DB — created `src/lib/db/items.ts` with `getPinnedItems`, `getRecentItems`, and `getItemStats` queries. Updated `DashboardPage` to fetch all data in parallel. Replaced all mock item data in `MainContent` with real DB data. Stats cards (total items, favorite items) now reflect live counts. Pinned section hidden when no pinned items exist.
- 2026-03-17: Stats & sidebar from DB — added `getItemTypesWithCounts()` to `src/lib/db/items.ts`. Sidebar now shows real system item types with live per-type counts linking to `/items/[type]s`. Removed all mock data from `Sidebar`. Favorites and Recent collections grouped under a single "Collections" heading; favorites show item counts; recent collections show a colored circle based on dominant item type color. "View all collections →" link added at the bottom of the collections section. Data threaded from `DashboardPage` → `DashboardShell` → `Sidebar`.
- 2026-03-18: Pro badge in sidebar — installed shadcn/ui `Badge` component. Files and Images item types in the sidebar now display a subtle outline "PRO" badge next to their item count when the sidebar is expanded. Badge only renders for `file` and `image` types (the two Pro-only system types per spec).
