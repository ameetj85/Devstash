# Item Types

DevStash ships with 7 system item types. System types have `isSystem: true` and `userId: null` in the database — they are non-editable and shared across all users.

---

## Type Reference

### snippet

| Property | Value |
|----------|-------|
| **Icon** | `Code` (Lucide) |
| **Color** | `#3b82f6` (Blue) |
| **Content mode** | Text |
| **Pro only** | No |
| **Seed ID** | `type_snippet` |

**Purpose:** Reusable code blocks in any programming language. The primary type for developers storing patterns, hooks, helpers, and boilerplate.

**Key fields used:**
- `content` — the code body (TEXT contentType)
- `language` — programming language string (e.g. `"typescript"`, `"dockerfile"`) used for syntax highlighting
- `title`, `description`, `tags`

---

### prompt

| Property | Value |
|----------|-------|
| **Icon** | `Sparkles` (Lucide) |
| **Color** | `#8b5cf6` (Purple) |
| **Content mode** | Text |
| **Pro only** | No |
| **Seed ID** | `type_prompt` |

**Purpose:** AI prompt templates and system messages. Designed for developers who work with LLMs and want a reusable library of prompts.

**Key fields used:**
- `content` — the prompt body (TEXT contentType)
- `language` — typically `null` (prompts are plain text)
- `title`, `description`, `tags`

---

### command

| Property | Value |
|----------|-------|
| **Icon** | `Terminal` (Lucide) |
| **Color** | `#f97316` (Orange) |
| **Content mode** | Text |
| **Pro only** | No |
| **Seed ID** | `type_command` |

**Purpose:** Shell commands, CLI invocations, and terminal workflows. Similar to snippets but semantically scoped to executable commands.

**Key fields used:**
- `content` — the command(s) body (TEXT contentType)
- `language` — typically `null` (shell is implied)
- `title`, `description`, `tags`

---

### note

| Property | Value |
|----------|-------|
| **Icon** | `StickyNote` (Lucide) |
| **Color** | `#fde047` (Yellow) |
| **Content mode** | Text |
| **Pro only** | No |
| **Seed ID** | `type_note` |

**Purpose:** Free-form markdown notes, documentation drafts, and developer reference material. Supports the full markdown editor experience.

**Key fields used:**
- `content` — the markdown body (TEXT contentType)
- `language` — `null`
- `title`, `description`, `tags`

---

### link

| Property | Value |
|----------|-------|
| **Icon** | `Link` (Lucide) |
| **Color** | `#10b981` (Emerald) |
| **Content mode** | URL |
| **Pro only** | No |
| **Seed ID** | `type_link` |

**Purpose:** Bookmarks to external resources — documentation, tools, references, and articles.

**Key fields used:**
- `url` — the bookmark URL (content is `null`)
- `contentType` — stored as `TEXT` in the DB (URL mode is a UI concept, not a DB enum value)
- `title`, `description`, `tags`

---

### file

| Property | Value |
|----------|-------|
| **Icon** | `File` (Lucide) |
| **Color** | `#6b7280` (Gray) |
| **Content mode** | File upload |
| **Pro only** | Yes |
| **Seed ID** | `type_file` |

**Purpose:** Uploaded documents and binary files stored in Cloudflare R2. For context files, PDFs, config templates, etc.

**Key fields used:**
- `fileUrl` — Cloudflare R2 object URL (FILE contentType)
- `fileName` — original filename
- `fileSize` — file size in bytes
- `content` — `null`
- `title`, `description`, `tags`

---

### image

| Property | Value |
|----------|-------|
| **Icon** | `Image` (Lucide) |
| **Color** | `#ec4899` (Pink) |
| **Content mode** | File upload |
| **Pro only** | Yes |
| **Seed ID** | `type_image` |

**Purpose:** Uploaded images stored in Cloudflare R2. Screenshots, diagrams, design references.

**Key fields used:**
- `fileUrl` — Cloudflare R2 object URL (FILE contentType)
- `fileName` — original filename
- `fileSize` — file size in bytes
- `content` — `null`
- `title`, `description`, `tags`

---

## Classification Summary

### By content mode

| Mode | Types | `contentType` enum | Key storage field |
|------|-------|--------------------|-------------------|
| **Text** | snippet, prompt, command, note | `TEXT` | `content` |
| **URL** | link | `TEXT` | `url` (content is null) |
| **File** | file, image | `FILE` | `fileUrl`, `fileName`, `fileSize` |

> Note: `link` uses `contentType: TEXT` in the database. The URL distinction is a UI concern — the `url` field is populated and `content` is null.

### By access tier

| Tier | Types |
|------|-------|
| **Free** | snippet, prompt, command, note, link |
| **Pro only** | file, image |

### Shared properties (all types)

Every item regardless of type has:

| Field | Description |
|-------|-------------|
| `id` | CUID primary key |
| `title` | Required display name |
| `description` | Optional subtitle |
| `isFavorite` | User can star/favorite |
| `isPinned` | Pin to top of lists |
| `userId` | Owner |
| `itemTypeId` | FK to `ItemType` |
| `collections` | M:N via `ItemCollection` |
| `tags` | M:N via `ItemTag` |
| `createdAt` / `updatedAt` | Timestamps |

### Display differences

| Type | Sidebar badge | Card border color | Special rendering |
|------|--------------|-------------------|-------------------|
| snippet | — | Blue (`#3b82f6`) | Syntax-highlighted code block; `language` shown |
| prompt | — | Purple (`#8b5cf6`) | Markdown rendered; no language label |
| command | — | Orange (`#f97316`) | Monospace text block |
| note | — | Yellow (`#fde047`) | Markdown rendered |
| link | — | Emerald (`#10b981`) | URL displayed as clickable link |
| file | PRO badge | Gray (`#6b7280`) | File name + size shown; download action |
| image | PRO badge | Pink (`#ec4899`) | Inline image preview |

> The PRO badge in the sidebar is rendered for `file` and `image` only (the two Pro-only system types).

---

## Route pattern

Item type pages follow `/items/[type]s` — the type name pluralised:

| Type | Route |
|------|-------|
| snippet | `/items/snippets` |
| prompt | `/items/prompts` |
| command | `/items/commands` |
| note | `/items/notes` |
| link | `/items/links` |
| file | `/items/files` |
| image | `/items/images` |
