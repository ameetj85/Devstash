# Item CRUD Architecture

A unified CRUD system for all 7 item types — snippet, prompt, command, note, link, file, image.

---

## Design Principles

- **One action file** for all mutations (create, update, delete, toggle states)
- **`src/lib/db/items.ts`** extended with type-filtered queries called directly from server components
- **One dynamic route** (`/items/[type]`) handles all 7 type pages
- **Type-specific logic lives in components**, not in actions or queries
- Follows the existing pattern: `lib/db/` for reads, `src/actions/` for writes

---

## File Structure

```
src/
├── actions/
│   └── items.ts                  # All item mutations (create, update, delete, toggles)
│
├── lib/
│   └── db/
│       └── items.ts              # Extended with getItemsByType(), getItemById()
│
├── app/
│   └── items/
│       └── [type]/
│           └── page.tsx          # Dynamic route — renders for all 7 types
│
└── components/
    └── items/
        ├── item-list.tsx         # Grid/list of item cards
        ├── item-card.tsx         # Single card — adapts display by type
        ├── item-drawer.tsx       # Slide-out drawer for create/view/edit
        ├── item-form.tsx         # Unified form — conditionally renders type fields
        ├── item-type-header.tsx  # Page header with type icon, color, name, count
        └── item-actions.tsx      # Card action menu (edit, delete, favorite, pin, copy)
```

---

## Route: `/items/[type]`

**File:** `src/app/items/[type]/page.tsx`

```
/items/snippets  → type = "snippets"  → strips plural → "snippet"
/items/prompts   → type = "prompts"   → strips plural → "prompt"
/items/commands  → type = "commands"  → strips plural → "command"
/items/notes     → type = "notes"     → strips plural → "note"
/items/links     → type = "links"     → strips plural → "link"
/items/files     → type = "files"     → strips plural → "file"
/items/images    → type = "images"    → strips plural → "image"
```

The page:
1. Receives `params.type` (pluralised slug)
2. Strips the trailing `s` to get the canonical type name
3. Looks up the type config (icon, color) from the DB or a constants map
4. Calls `getItemsByType(userId, typeName)` from `src/lib/db/items.ts`
5. Renders `<ItemTypeHeader>` + `<ItemList>` as server components
6. Passes a `<ItemDrawer>` client component for create/edit interactions

**404 handling:** If the slug does not match a known type, the page calls `notFound()`.

---

## Data Fetching — `src/lib/db/items.ts` (additions)

Two new functions added to the existing file:

### `getItemsByType(userId, typeName, options?)`

Returns all items of a given type for the authenticated user.

```ts
interface GetItemsByTypeOptions {
  search?: string      // full-text filter on title/content/tags
  sortBy?: 'updatedAt' | 'createdAt' | 'title'
  order?: 'asc' | 'desc'
  favoritesOnly?: boolean
}

// Returns
interface ItemWithDetails {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  itemType: { id: string; name: string; icon: string; color: string }
  tags: { id: string; name: string }[]
  collections: { id: string; name: string }[]
}
```

Includes pinned items first (`isPinned: desc`), then sorted by `updatedAt` desc by default.

### `getItemById(userId, itemId)`

Returns a single item with full relations (type, tags, collections). Used when opening the drawer for an existing item. Returns `null` if not found or doesn't belong to the user.

---

## Mutations — `src/actions/items.ts`

Single file. All functions are Server Actions (`'use server'`). All return `{ success: boolean; data?: ...; error?: string }`.

### `createItem(input)`

```ts
interface CreateItemInput {
  title: string
  description?: string
  itemTypeId: string
  contentType: 'TEXT' | 'FILE'
  // TEXT types
  content?: string
  language?: string
  // URL type (link)
  url?: string
  // FILE types — passed after R2 upload completes
  fileUrl?: string
  fileName?: string
  fileSize?: number
  // Relations
  tagNames?: string[]          // upserted by name
  collectionIds?: string[]
}
```

Logic:
1. Validate input with Zod
2. Get `userId` from session (throws if unauthenticated)
3. Upsert tags by name, collect tag IDs
4. Create item with nested tag and collection connects
5. Revalidate the type page path via `revalidatePath`

### `updateItem(itemId, input)`

Same shape as `CreateItemInput` (all fields optional except itemId). Performs:
1. Ownership check — verify item belongs to current user
2. Diff tags: disconnect removed, upsert and connect new
3. Diff collections: disconnect removed, connect new
4. `update()` the item fields
5. `revalidatePath`

### `deleteItem(itemId)`

1. Ownership check
2. `prisma.item.delete` (cascades tags and collection links)
3. `revalidatePath`

### `toggleFavorite(itemId)`

Flips `isFavorite`. Returns updated `isFavorite` value.

### `togglePinned(itemId)`

Flips `isPinned`. Returns updated `isPinned` value.

---

## Components

### `ItemTypeHeader`

**Server component.** Props: `typeName`, `typeColor`, `typeIcon`, `itemCount`.

Renders:
- Colored icon matching the type
- Type name as page heading
- Item count badge
- "New [type]" button that opens the drawer (passes an `openDrawer` client trigger)

### `ItemList`

**Server component.** Props: `items: ItemWithDetails[]`, `typeName`.

Renders a responsive grid of `<ItemCard>` components. Shows an empty state when `items.length === 0`.

### `ItemCard`

**Client component** (needs hover state, copy-to-clipboard, action menu). Props: `item: ItemWithDetails`.

Display adapts by `item.itemType.name`:

| Type | Content shown on card |
|------|----------------------|
| snippet | First ~10 lines of `content`, syntax-highlighted; `language` label |
| prompt | First ~3 lines of `content` as plain text |
| command | First ~5 lines of `content` in monospace |
| note | First ~3 lines of markdown-rendered `content` |
| link | `url` as a styled anchor; domain shown as subtitle |
| file | `fileName` + formatted `fileSize`; download button |
| image | Thumbnail from `fileUrl`; `fileName` below |

All cards share: type-colored left border, title, description, tag chips, favorite/pin indicators, `<ItemActions>` menu.

### `ItemDrawer`

**Client component.** A slide-out sheet (shadcn `Sheet`) that handles both create and edit modes.

- **Create mode:** Opens empty form pre-configured for the current type
- **Edit mode:** Populates form with existing item data (fetched via `getItemById` or passed as prop)
- On submit calls `createItem` or `updateItem` Server Action
- Closes on success; shows toast

### `ItemForm`

**Client component** inside `ItemDrawer`. Renders fields conditionally based on `typeName`:

| Field | snippet | prompt | command | note | link | file | image |
|-------|---------|--------|---------|------|------|------|-------|
| `title` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `description` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `content` (markdown editor) | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `language` selector | ✓ | — | — | — | — | — | — |
| `url` input | — | — | — | — | ✓ | — | — |
| file upload | — | — | — | — | — | ✓ | ✓ |
| `tags` multi-input | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `collections` picker | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### `ItemActions`

**Client component.** A `DropdownMenu` attached to each card. Actions:
- Copy content / URL to clipboard
- Edit (opens `ItemDrawer` in edit mode)
- Toggle favorite
- Toggle pin
- Delete (opens confirmation dialog)

Calls the appropriate Server Action directly.

---

## Type-specific logic: where it lives

| Concern | Location |
|---------|----------|
| Display format per type | `ItemCard` — switch on `item.itemType.name` |
| Form fields per type | `ItemForm` — conditional rendering based on `typeName` prop |
| Content validation per type | `createItem` / `updateItem` Zod schema — `contentType` enum drives which fields are required |
| Icon and color | Looked up from DB (`ItemType` record) or a constants map; passed as props |
| File upload to R2 | Separate upload route or client-side presigned URL — file types handle this before calling `createItem` |
| Pro gate | `ItemForm` and the "New [type]" button check `session.user.isPro` before allowing file/image creation |

**Actions stay type-agnostic.** `createItem` does not branch on type name — it stores whatever fields are provided. The form is responsible for sending the right fields.

---

## Data Flow Summary

```
User opens /items/snippets
  └── [type]/page.tsx (server)
        ├── getItemsByType(userId, "snippet")  ← lib/db/items.ts
        ├── <ItemTypeHeader />                 ← server component
        └── <ItemList items={...} />           ← server component
              └── <ItemCard /> × N             ← client component

User clicks "New Snippet"
  └── <ItemDrawer> opens (client)
        └── <ItemForm typeName="snippet">
              └── User submits
                    └── createItem(input)      ← Server Action
                          └── revalidatePath("/items/snippets")
                                └── Page re-renders with new item
```

---

## Constants map (future `src/lib/constants.tsx`)

A static map keyed by type name avoids extra DB round-trips for icon/color on every page load:

```ts
export const ITEM_TYPE_CONFIG = {
  snippet: { icon: 'Code',       color: '#3b82f6', label: 'Snippets', pro: false },
  prompt:  { icon: 'Sparkles',   color: '#8b5cf6', label: 'Prompts',  pro: false },
  command: { icon: 'Terminal',   color: '#f97316', label: 'Commands', pro: false },
  note:    { icon: 'StickyNote', color: '#fde047', label: 'Notes',    pro: false },
  link:    { icon: 'Link',       color: '#10b981', label: 'Links',    pro: false },
  file:    { icon: 'File',       color: '#6b7280', label: 'Files',    pro: true  },
  image:   { icon: 'Image',      color: '#ec4899', label: 'Images',   pro: true  },
} as const

export type ItemTypeName = keyof typeof ITEM_TYPE_CONFIG
```

This is the source of truth for routing validation, header rendering, and sidebar counts.
