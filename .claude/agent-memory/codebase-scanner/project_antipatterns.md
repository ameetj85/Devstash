---
name: Scribbles Recurring Antipatterns
description: Recurring code quality issues and antipatterns found during March 2026 scan (updated after full auth+items+uploads audit)
type: project
---

Updated 2026-03-23 after full audit of implemented features:

1. **Duplicated iconMap** — The `iconMap` (Lucide icon name → component) is copy-pasted into 5 files: main-content.tsx, dashboard-item-rows.tsx, sidebar.tsx, item-drawer.tsx, item-card.tsx. Should be extracted to `src/lib/item-type-icons.ts`.

2. **Duplicated type-classification arrays** — `CONTENT_TYPES`, `LANGUAGE_TYPES`, `MARKDOWN_TYPES`, `FILE_TYPES` are defined identically in both `item-drawer.tsx` and `create-item-dialog.tsx`. Should be shared constants.

3. **Duplicated formatDate helper** — Defined independently in item-card.tsx, file-list-row.tsx, main-content.tsx, and item-drawer.tsx.

4. **Unsafe file key extraction repeated client-side** — `item.fileUrl.split('/').slice(-2).join('/')` appears in item-drawer.tsx (lines 629, 640) and file-list-row.tsx handleDownload. `keyFromUrl()` from `src/lib/r2.ts` is the canonical utility but it is server-only. A shared client-safe version of key extraction should be created.

5. **Dead file** — `src/lib/mock-data.ts` is no longer imported anywhere. Should be deleted.

6. **Two-query pattern in updateItem** — `src/lib/db/items.ts` updateItem() does a findFirst to check ownership then a separate update. These can be merged by including userId in the update's where clause and checking the result count.

7. **No max-length validation on text inputs** — createItem/updateItem Zod schemas validate title min(1) but no max. Content field has no size cap in the schema (only file size is capped at the upload layer). Could cause oversized DB writes.

8. **Fragile slug-to-type-name mapping** — `src/app/items/[type]/page.tsx` line 21 strips trailing 's' to get DB type name. Works for current types but will break for any future type with an irregular plural or one that naturally ends in 's'.

9. **prisma/schema.prisma datasource has no url field** — Relies on prisma.config.ts to supply DATABASE_URL. Running bare `prisma` CLI commands without the config file will fail with a confusing error.
