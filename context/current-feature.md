# Current Feature: Email Verification Toggle Flag

## Status

In Progress

## Goals

- Add a flag (env variable or config) to enable/disable email verification on registration
- When disabled, users can register and sign in immediately without verifying their email
- When enabled, the current Resend-based email verification flow is enforced
- The toggle should be easy to switch (e.g., flip an env var) for local dev without a verified Resend domain

## Notes

- Current constraint: Resend only allows sending to verified email addresses when no custom domain is configured, so only the Resend account email can receive verification emails in dev
- Approach: `EMAIL_VERIFICATION_ENABLED=true|false` env variable in `.env` — simple, no UI needed, easy to understand
- When disabled: register API creates user with `emailVerified` set to current timestamp (so they pass the verification check), skips sending email
- When disabled: sign-in should not block unverified users (the `emailVerified` check in credentials authorize)
- Keep the existing verification flow fully intact — the flag just bypasses it

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
- 2026-03-18: Auth Setup - NextAuth v5 with GitHub OAuth — installed `next-auth@beta` and `@auth/prisma-adapter`. Split auth config for edge compatibility (`src/auth.config.ts` providers-only, `src/auth.ts` with Prisma adapter + JWT strategy). Added GitHub OAuth provider. Created `src/proxy.ts` to protect `/dashboard/*` routes and redirect unauthenticated users to sign-in. Created `src/app/api/auth/[...nextauth]/route.ts` for handlers. Extended Session type with `user.id` via `src/types/next-auth.d.ts`.
- 2026-03-19: Auth Credentials - Email/Password Provider — added Credentials provider to `auth.config.ts` (edge-safe placeholder with email/password field definitions) and `auth.ts` (bcrypt validation against `hashedPassword`). Created `POST /api/auth/register` route accepting name, email, password, confirmPassword — validates fields, checks for duplicate users, hashes password at 12 rounds, creates user. GitHub OAuth unaffected.
- 2026-03-19: Auth UI - Sign In, Register & Sign Out — custom `/sign-in` page (email/password form + GitHub OAuth button + link to register) and `/register` page (name, email, password, confirm password with client-side validation, success toast, redirect to sign-in). Reusable `UserAvatar` component (GitHub image or initials fallback). Sidebar user area replaced with `UserMenu` client component: real name, email, avatar, dropdown with Profile link and Sign out. Session user threaded from `DashboardPage` → `DashboardShell` → `Sidebar`. Sonner toast added to root layout. GitHub avatar hostname added to `next.config.ts` image remotePatterns.
- 2026-03-19: Email Verification on Register — installed `resend` and `@types/uuid`. Created `src/lib/email.ts` (Resend client, `sendVerificationEmail`), `src/lib/tokens.ts` (generate/get verification tokens via `VerificationToken` table, 24h expiry). Register API now sends a verification email instead of returning immediately. New `GET /api/auth/verify-email` route validates token, sets `emailVerified`, deletes token. New `/verify-email` page shows loading/success/error states with auto-redirect on success. Credentials sign-in blocks unverified users and throws `EmailNotVerified` error (code `email_not_verified`) so the sign-in form can show a specific error message and toast. Register form replaced success toast+redirect with a "check your email" screen. Dashboard queries (`getCollections`, `getPinnedItems`, `getRecentItems`, `getItemStats`, `getItemTypesWithCounts`) now all filter by `userId`. Added `scripts/delete-users.ts` utility to purge all non-demo users and their data.
