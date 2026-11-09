# Cloudflare R2 to SQLite File Storage

## Implementation and migration record

Files and images now use the `ItemFile` SQLite table and authenticated `/api/files/[key]` endpoint. New uploads retain the two-step upload flow; uploads left unattached for more than 24 hours are removed when that user next uploads. Existing item links and uploaded files are deleted together. Images bypass the Next.js optimizer so the browser sends its session cookie.

On 2026-11-08, the configured SQLite database had no file-item references. All six objects in the configured R2 bucket (2,545,464 bytes total) had prefixes matching local users. They were copied to `ItemFile` with their original object keys in `sourceKey`, verified against the source with SHA-256, and checked again by rerunning the migration. They remain unlinked because there were no item records to associate with them; they are preserved, not displayed as items or automatically expired. Their original filenames cannot be reconstructed if they were not stored as item metadata. The R2 originals were not deleted.

`npm run migrate-r2-files` is retained for other databases. Back up the target database, apply migrations with `npx prisma migrate deploy`, and configure the five `R2_*` variables before running it. It refuses to proceed when object owners, item references, or R2-backed avatars cannot be matched safely. It can be rerun and verifies already copied object bytes. It does not delete R2 objects. A database on persistent storage is required, and backups now include file bytes.

The remainder of this document is the **historical pre-implementation analysis**, not a description of current behavior. In particular, file uploads are not currently Pro-gated; R2 credentials and the S3 SDK remain solely for migration and compatibility, not normal uploads.

## Historical analysis

## 1. Where R2 is used today

R2 stored the bytes of **`file` and `image` item types**. The `Item` row held only metadata (`fileUrl`, `fileName`, `fileSize`). Object key format: `<userId>/<uuid>.<ext>`.

| File | R2 role |
| --- | --- |
| `src/lib/r2.ts` | S3 client (`@aws-sdk/client-s3`) for `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`; `deleteR2Object()`; `keyFromUrl()` (public URL → key via `R2_PUBLIC_URL`) |
| `src/app/api/upload/route.ts` | `PutObjectCommand`. Auth, MIME allow-list, size limits (image 5 MB, file 10 MB). Returns `{ fileUrl, fileName, fileSize, key }`, where `fileUrl = R2_PUBLIC_URL/<key>` |
| `src/app/api/files/[key]/route.ts` | `GetObjectCommand` proxy used for downloads (avoids CORS). Checks ownership by key prefix or by an `Item.fileUrl` lookup. Buffers the stream and returns it with `Content-Disposition: attachment` |
| `src/actions/items.ts` | `createItem`: deletes the uploaded object if the DB insert fails. `deleteItem`: deletes the R2 object after the row is removed |
| `src/lib/file-utils.ts` | `extractFileKey(fileUrl)` builds the download key for `/api/files/...` |
| `src/lib/image-hosts.ts` and `next.config.ts` | The `pub-…r2.dev` hostname is in `IMAGE_HOSTNAMES`, so `next/image` can render R2 URLs. It is also used by `isAllowedImageUrl` in `admin-users.ts`, which validates avatar URLs |
| `src/components/items/file-upload.tsx` | XHR POST to `/api/upload` with progress. Previews the image from `value.fileUrl` |
| `src/components/items/create-item-dialog.tsx` | Sends `fileUrl` from the upload result into `createItem` |
| `src/components/items/item-drawer-view.tsx`, `file-list-row.tsx`, `image-thumbnail-card.tsx` | Render `item.fileUrl` directly for images (`next/image`). Downloads go to `/api/files/<encoded key>?name=...` |
| `src/lib/db/items.ts` | `fileUrl` is carried through `ItemWithType`, `ItemDetail`, create, update and `deleteItem` (returns `fileUrl` so the caller can delete the object) |
| `.env` / `.env.example` | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| Tests | `lib/__tests__/r2.test.ts`, `app/api/upload/__tests__/route.test.ts`, `actions/__tests__/delete-item.test.ts`, `actions/__tests__/create-item.test.ts`, `lib/db/__tests__/create-item.test.ts`, `lib/__tests__/image-hosts.test.ts` |

Existing gaps in the current R2 design:

- **Account deletion** (`DELETE /api/profile/delete-account`) does not remove R2 objects, so they are orphaned. I found no R2 cleanup there.
- **Public bucket:** images are served from a public R2 URL. Anyone with the URL can fetch the file, without authentication. Only `/api/files/*` is auth-checked.
- **Cleanup is only partly covered:** an upload that is never attached to an item is also orphaned, because `createItem` cleans up only when its DB call returns null.

## 2. Can SQLite tables replace R2?

**Yes.** Limits are small (5 MB images, 10 MB files), so BLOBs in SQLite are workable. Prisma supports this through the `Bytes` type, which maps to a SQLite `BLOB`.

Caveats:

- **Deployment:** this works for a local or self-hosted app with a persistent disk. If it is ever deployed to a serverless host with an ephemeral filesystem (for example Vercel), the SQLite file itself cannot persist either, so the question is moot there.
- **Database growth:** the DB file grows with every upload, so backups get larger. The free tier allows 50 items and Pro is unlimited, so storage is bounded only by the upload limits.
- **Memory:** Prisma loads the full blob into memory on read. The current proxy already buffers whole files, so this is no worse.
- **Image optimization:** `next/image` would fetch an authenticated, session-cookie-protected local URL. Use `unoptimized` (or a plain `<img>`) for these, or verify that the optimizer forwards cookies. Next 16 also restricts local image URLs with query strings unless `images.localPatterns` allows them.
- **Public serving:** the public R2 URL goes away. Everything would be served through an authenticated route. That is arguably better for privacy, but the bytes now flow through the Node process.

## 3. Recommended design

Store blobs in a **separate table** so list queries on `Item` never load binary data.

```prisma
model ItemFile {
  id        String   @id @default(cuid())
  itemId    String?  @unique        // null until linked to an item (if two-step upload is kept)
  userId    String
  data      Bytes
  mimeType  String
  size      Int
  createdAt DateTime @default(now())

  item Item? @relation(fields: [itemId], references: [id], onDelete: Cascade)
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

- `Item.fileUrl` can stay as an app-relative URL such as `/api/files/<ItemFile.id>`. That keeps `ItemWithType` and every component that reads it unchanged. Alternatively, drop it and derive the URL from `itemId`.
- `onDelete: Cascade` removes blobs automatically when an item or user is deleted. This also fixes the orphan-on-account-delete gap.
- Needs a Prisma migration (`npx prisma migrate dev --name add_item_file`). Never use `db push`.

## 4. Code changes this would entail

**Schema and migration**

1. Add the `ItemFile` model plus back-relations on `Item` and `User` in `prisma/schema.prisma`. Create a migration.

**Upload (`src/app/api/upload/route.ts`)**

2. Keep auth, MIME and size checks. Replace `PutObjectCommand` with `prisma.itemFile.create({ data: { userId, data: buffer, mimeType, size } })`. Return `{ fileUrl: '/api/files/<id>', fileName, fileSize, fileId }`.
3. Decide how upload relates to item creation:
   - **Keep two steps** (the current XHR progress UI works). `ItemFile` rows exist with `itemId = null` until `createItem` links them. This needs a periodic sweeper for unlinked rows, which replaces the "delete if createItem failed" logic.
   - **Single step:** upload with the item form and create both rows in one `prisma.$transaction`. This removes the orphan problem but requires reworking `file-upload.tsx` and `create-item-dialog.tsx`.

**Download and serving (`src/app/api/files/[key]/route.ts` → `[id]`)**

4. Look up `ItemFile` by `id` and `userId` (ownership check in the query itself, so the key-prefix logic goes away). Return the `Uint8Array` with the stored `Content-Type`.
5. Use `Content-Disposition: attachment` only when `?name=` or `?download=1` is present and `inline` for image previews. The current route always forces attachment.
6. Add `ETag` or `Cache-Control: private` and conditional-request support, since DB reads are costlier than CDN hits.

**Items and actions**

7. `src/actions/items.ts`: `createItem` links the `ItemFile` (or creates it) and drops `deleteR2Object` and `keyFromUrl`. `deleteItem` drops the R2 cleanup (cascade handles it). The "clean up on failed insert" block becomes the sweeper or the transaction.
8. `src/lib/db/items.ts`: the `fileUrl` plumbing can stay. Add an ownership check that the `fileUrl` or `fileId` belongs to the user before linking. Never select `data` in list or detail queries.
9. `src/lib/file-utils.ts`: `extractFileKey` is replaced by an id, or removed if `fileUrl` is already `/api/files/<id>`. Update the three callers (`file-list-row.tsx`, `item-drawer-view.tsx`, and the upload preview).

**Frontend**

10. `image-thumbnail-card.tsx`, `item-drawer-view.tsx`, and the preview in `file-upload.tsx`: use `unoptimized` or a plain `<img>` for `/api/files/...` URLs. Update the relative-URL handling if you keep `next/image`.

**Config and cleanup**

11. `src/lib/image-hosts.ts`: remove the `pub-…r2.dev` hostname, keeping `avatars.githubusercontent.com`. Update `image-hosts.test.ts`. Note that `admin-users.ts` avatar validation uses this list.
12. Delete `src/lib/r2.ts` and `lib/__tests__/r2.test.ts`. Remove `@aws-sdk/client-s3` from `package.json`.
13. Remove the five `R2_*` variables from `.env`, `.env.example` and docs (`CLAUDE.md`, `README.md`, `PROJECT_GUIDE.md`, `context/*`).
14. Update the tests listed in section 1: upload route (mock Prisma instead of `r2.send`), delete-item and create-item actions, and the DB create-item test.

**Data migration for existing uploads**

15. One-off script (similar to `scripts/setup-sqlite.ts`): for each `Item` with an R2 `fileUrl`, download the object (via the S3 client or public URL), insert an `ItemFile` row, rewrite `Item.fileUrl`, then retire the bucket after verifying. Run it before removing the R2 code and env vars.

**Optional hardening while here**

16. Use a magic-byte check in addition to the browser-supplied MIME type (SVG uploads can carry scripts, so serve SVG with `Content-Security-Policy: sandbox` or as attachment only).

## 5. Effort and risk summary

| Area | Size |
| --- | --- |
| Schema + migration | Small |
| Upload / download routes | Medium |
| Action + DB query changes | Small–Medium |
| Frontend `next/image` handling | Small, but needs browser verification |
| Orphan strategy (two-step vs single-step) | The main design decision |
| Data migration of existing R2 files | Small script, run once |
| Tests | Rewrite 4–5 test files |

**Trade-off:** you remove an external dependency, five secrets and the public bucket, and gain cascade deletes, simple local backups and one source of truth. In exchange, the DB grows, file bytes pass through Node on every view, and it only fits a persistent-disk deployment.
