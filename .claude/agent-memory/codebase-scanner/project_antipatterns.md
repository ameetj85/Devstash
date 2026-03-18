---
name: DevStash Recurring Antipatterns
description: Recurring code quality issues and antipatterns found during March 2026 scan
type: project
---

Issues found during initial scan (2026-03-18):

1. **No user scoping on DB queries** — `getCollections`, `getPinnedItems`, `getRecentItems`, `getItemStats`, `getItemTypesWithCounts` in `src/lib/db/` have no `where: { userId }` filter. All queries return data for all users. This will be a critical security issue once auth is wired up.

2. **Duplicated iconMap** — The `iconMap` (Lucide icon name → component) is copy-pasted identically in both `src/components/dashboard/main-content.tsx` and `src/components/dashboard/sidebar.tsx`. Should be extracted to a shared module.

3. **Dead file** — `src/lib/mock-data.ts` is no longer imported anywhere. Should be deleted.

4. **Seed uses sequential awaits in a loop** — `prisma/seed.ts` lines 552-562 upsert tags one at a time inside a `for` loop. For large datasets this is slow. Acceptable for seed scripts but worth noting.

5. **URL construction for item types is fragile** — `sidebar.tsx` line 109: `` const href = `/items/${type.name}s` `` naively appends "s" to pluralize type names. "note" → "/items/notes" works, but any irregular plural (or future type whose name ends in 's') will break silently.

6. **Hard-coded PRO type check** — `sidebar.tsx` line 124 checks `type.name === 'file' || type.name === 'image'` rather than a flag on the model. The Prisma schema has no `isPro` field on `ItemType`, so this string comparison is the only gate. Fragile if type names change.

7. **`prisma/schema.prisma` has no `url` in datasource block** — The datasource relies entirely on `prisma.config.ts` overriding the URL. The schema file itself has no `url = env("DATABASE_URL")` line (line 7 is empty after `provider`). This can cause confusion when running standard `prisma` CLI commands without the config.
