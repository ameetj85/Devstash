# Scribbles — Project Overview

> **One fast, searchable, AI-enhanced hub for all your developer knowledge & resources.**

---

## Table of Contents

- [Problem](#problem)
- [Target Users](#target-users)
- [Features](#features)
- [Data Models](#data-models)
- [Tech Stack](#tech-stack)
- [Monetization](#monetization)
- [UI / UX](#ui--ux)
- [Architecture Diagram](#architecture-diagram)
- [Key Links & Resources](#key-links--resources)

---

## Problem

Developers keep their essentials scattered across too many places:

| What                   | Where it ends up               |
| ---------------------- | ------------------------------ |
| Code snippets          | VS Code, Notion, GitHub Gists  |
| AI prompts             | Chat histories                 |
| Context files          | Buried in project directories  |
| Useful links           | Browser bookmarks              |
| Docs & notes           | Random folders                 |
| Terminal commands       | `.bash_history`, `.txt` files  |
| Project templates      | GitHub Gists, boilerplate repos|

**Result:** Context switching, lost knowledge, inconsistent workflows.

**Scribbles** solves this by providing a single, fast, searchable, AI-enhanced hub for all developer knowledge and resources.

---

## Target Users

| Persona                       | Core Need                                              |
| ----------------------------- | ------------------------------------------------------ |
| **Everyday Developer**        | Fast access to snippets, prompts, commands, and links  |
| **AI-First Developer**        | Save prompts, contexts, workflows, system messages     |
| **Content Creator / Educator**| Store code blocks, explanations, course notes          |
| **Full-Stack Builder**        | Collect patterns, boilerplates, API examples            |

---

## Features

### A. Items & Item Types

Items are the core unit of Scribbles. Each item has a **type** that determines its behavior and appearance. Users will eventually be able to create custom types, but the app ships with these **system types** (non-editable):

| Type        | Content Mode | Color                       | Icon         |
| ----------- | ------------ | --------------------------- | ------------ |
| `snippet`   | Text         | `#3b82f6` (Blue)            | `Code`       |
| `prompt`    | Text         | `#8b5cf6` (Purple)          | `Sparkles`   |
| `note`      | Text         | `#fde047` (Yellow)          | `StickyNote` |
| `command`   | Text         | `#f97316` (Orange)          | `Terminal`   |
| `link`      | URL          | `#10b981` (Emerald)         | `Link`       |
| `file`      | File         | `#6b7280` (Gray)            | `File`       |
| `image`     | File         | `#ec4899` (Pink)            | `Image`      |

> **Routing:** Type-based pages follow the pattern `/items/snippets`, `/items/prompts`, etc.
>
> **Creation:** Items open in a quick-access **drawer** for fast creation and editing.

### B. Collections

Users can organize items into named collections. An item can belong to **multiple collections** (many-to-many).

**Example collections:**
- "React Patterns" — snippets, notes
- "Context Files" — files
- "Interview Prep" — snippets, prompts, links

### C. Search

Full-text search across:
- Content body
- Titles
- Tags
- Item types

### D. Authentication

- Email / password sign-in
- GitHub OAuth sign-in is retained but disabled by default
- Powered by **NextAuth v5** (Auth.js)

### E. Core Features

- Collection and item **favorites**
- Item **pin to top**
- **Recently used** items
- **Import code** from a file
- **Markdown editor** for text-based types
- **File upload** for file/image types (Cloudflare R2)
- **Export data** as JSON / ZIP
- **Dark mode** by default, light mode optional
- Add/remove items to/from **multiple collections**
- View which collections an item belongs to

### F. AI Features

- **AI auto-tag suggestions** — Suggest relevant tags on save
- **AI summaries** — Generate a summary of any item
- **AI "Explain This Code"** — Plain-English explanation of a snippet
- **Prompt optimizer** — Improve and refine AI prompts

---

## Data Models

### Entity Relationship Overview

```
┌──────────┐       ┌────────────┐       ┌──────────────┐
│   User   │──1:N──│    Item     │──M:N──│  Collection  │
└──────────┘       └────────────┘       └──────────────┘
                     │       │
                     │  1:N  │ M:N
                     ▼       ▼
               ┌──────────┐ ┌─────┐
               │ ItemType │ │ Tag │
               └──────────┘ └─────┘
```

**Join tables:** `ItemCollection` (items ↔ collections), `ItemTag` (items ↔ tags)

### Prisma Schema (Prisma 7)

> **Prisma 7** uses the new `prisma-client` provider (Rust-free, TypeScript-native). Generated client output must be explicitly set. See the [Prisma 7 upgrade guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) for details.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
}

// The URL is configured in prisma.config.ts via SQLITE_DATABASE_URL.

// ─── User ────────────────────────────────────────────
// Extends NextAuth User model

model User {
  id                    String    @id @default(cuid())
  name                  String?
  email                 String?   @unique
  emailVerified         DateTime?
  image                 String?
  hashedPassword        String?
  isPro                 Boolean   @default(false)
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?   @unique

  accounts   Account[]
  sessions   Session[]
  items      Item[]
  itemTypes  ItemType[]
  collections Collection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Item Types ──────────────────────────────────────

model ItemType {
  id       String  @id @default(cuid())
  name     String                         // "snippet", "prompt", etc.
  icon     String                         // Lucide icon name
  color    String                         // Hex color
  isSystem Boolean @default(false)         // true = non-editable system type

  userId String?                           // null for system types
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items Item[]

  @@unique([name, userId])
}

// ─── Items ───────────────────────────────────────────

model Item {
  id          String   @id @default(cuid())
  title       String
  description String?
  contentType ContentType                  // TEXT or FILE
  content     String?                      // Text body (null if file)
  fileUrl     String?                      // R2 URL (null if text)
  fileName    String?                      // Original filename
  fileSize    Int?                         // Bytes
  url         String?                      // For link types
  language    String?                      // Programming language (optional)
  isFavorite  Boolean  @default(false)
  isPinned    Boolean  @default(false)

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  itemTypeId String
  itemType   ItemType @relation(fields: [itemTypeId], references: [id])

  collections ItemCollection[]
  tags        ItemTag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

enum ContentType {
  TEXT
  FILE
}

// ─── Collections ─────────────────────────────────────

model Collection {
  id            String  @id @default(cuid())
  name          String                     // "React Hooks", "Context Files"
  description   String?
  isFavorite    Boolean @default(false)
  defaultTypeId String?                    // Default item type for new items

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items ItemCollection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// ─── Join Tables ─────────────────────────────────────

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item       Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
}

// ─── Tags ────────────────────────────────────────────

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  items ItemTag[]
}

model ItemTag {
  itemId String
  tagId  String

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
}
```

### Migration Rules

> **IMPORTANT:** Never use `prisma db push` or directly modify the database structure. All schema changes must go through Prisma migrations:
>
> ```bash
> # Create a migration (development)
> npx prisma migrate dev --name <migration_name>
>
> # Apply migrations (production)
> npx prisma migrate deploy
> ```

---

## Tech Stack

### Core

| Layer            | Technology                 | Notes                                                                 |
| ---------------- | -------------------------- | --------------------------------------------------------------------- |
| **Framework**    | Next.js 16 / React 19     | App Router, SSR, Cache Components, Turbopack (default bundler)        |
| **Language**     | TypeScript                 | Strict mode                                                           |
| **Database**     | SQLite                     | Local database file at `prisma/scribbles.db` by default               |
| **ORM**          | Prisma 7                   | `prisma-client` generator with the `better-sqlite3` driver adapter     |
| **Auth**         | NextAuth v5 (Auth.js)      | Email/password; GitHub OAuth disabled by default                      |
| **File Storage** | Cloudflare R2              | S3-compatible object storage for file/image uploads                   |
| **AI**           | OpenAI `gpt-5-nano`        | Auto-tagging, summaries, code explanation, prompt optimization        |
| **Styling**      | Tailwind CSS v4 + shadcn/ui| Utility-first CSS with pre-built accessible components                |

### Key Stack Notes

**Next.js 16** — Released October 2025. Turbopack is now the stable default bundler. Middleware has been renamed to `proxy.ts`. Cache Components replace PPR with explicit `use cache` directives. React 19.2 with View Transitions and React Compiler support.

**Prisma 7** — Uses the `prisma-client` generator (not `prisma-client-js`) with an explicit output path. This project uses `@prisma/adapter-better-sqlite3` and the `SQLITE_DATABASE_URL` setting.

**NextAuth v5** — The stable release of Auth.js for Next.js. Supports the App Router natively, edge-compatible sessions, and database adapters via Prisma.

---

## Monetization

All users have access to implemented features without a subscription.
External services still require configuration and applicable operational limits
continue to apply. Legacy subscription fields are retained for reversibility.

---

## UI / UX

### Design Principles

- Modern, minimal, **developer-focused**
- **Dark mode** by default, light mode optional
- Clean typography, generous whitespace, subtle borders and shadows
- Syntax highlighting for code blocks
- **Reference:** Notion, Linear, Raycast

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────────────────────────────────┐ │
│  │          │  │  Main Content                        │ │
│  │ Sidebar  │  │                                      │ │
│  │          │  │  ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │ Types    │  │  │Collection│Collection│Collection│  │ │
│  │ ─────── │  │  │  Card   │ │  Card  │ │  Card   │  │ │
│  │ Snippets │  │  └────────┘ └────────┘ └────────┘   │ │
│  │ Prompts  │  │                                      │ │
│  │ Commands │  │  ┌──────┐ ┌──────┐ ┌──────┐         │ │
│  │ Notes    │  │  │ Item │ │ Item │ │ Item │         │ │
│  │ Links    │  │  │ Card │ │ Card │ │ Card │         │ │
│  │ Files    │  │  └──────┘ └──────┘ └──────┘         │ │
│  │ Images   │  │                                      │ │
│  │          │  │               ┌─────────────────┐    │ │
│  │ ─────── │  │               │   Item Drawer    │   │ │
│  │ Recent   │  │               │   (quick view)   │   │ │
│  │ Collctns │  │               └─────────────────┘    │ │
│  └──────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Sidebar** (collapsible, becomes a drawer on mobile):
- Item types with links (`/items/snippets`, `/items/commands`, etc.)
- Latest/favorite collections

**Main area:**
- Grid of **collection cards** — background color derived from the most common item type
- Grid of **item cards** — border color matches item type
- Individual items open in a **slide-out drawer**

### Type Color & Icon Reference

| Type     | Color     | Hex       | Lucide Icon  |
| -------- | --------- | --------- | ------------ |
| Snippet  | Blue      | `#3b82f6` | `Code`       |
| Prompt   | Purple    | `#8b5cf6` | `Sparkles`   |
| Command  | Orange    | `#f97316` | `Terminal`   |
| Note     | Yellow    | `#fde047` | `StickyNote` |
| File     | Gray      | `#6b7280` | `File`       |
| Image    | Pink      | `#ec4899` | `Image`      |
| Link     | Emerald   | `#10b981` | `Link`       |

> Icons sourced from [Lucide Icons](https://lucide.dev) — the icon library used by shadcn/ui.

### Responsive Behavior

- **Desktop-first** but mobile-usable
- Sidebar collapses into a hamburger drawer on mobile

### Micro-Interactions

- Smooth transitions on navigation and state changes
- Hover states on cards
- Toast notifications for actions (create, delete, copy, etc.)
- Loading skeletons during data fetches

---

## Architecture Diagram

```
                        ┌─────────────────┐
                        │    Client        │
                        │  (Next.js SSR +  │
                        │   React 19 SPA)  │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Next.js 16    │
                        │   App Router    │
                        │   + API Routes  │
                        └──┬────┬────┬────┘
                           │    │    │
              ┌────────────┘    │    └────────────┐
              │                 │                  │
     ┌────────▼───────┐ ┌──────▼──────┐  ┌───────▼───────┐
     │     SQLite      │ │ Cloudflare  │  │   OpenAI      │
     │  (via Prisma 7) │ │     R2      │  │  gpt-5-nano   │
     │                 │ │ File Storage│  │               │
     └─────────────────┘ └─────────────┘  └───────────────┘
```

---

## Key Links & Resources

### Framework & Libraries

| Resource                   | URL                                                   |
| -------------------------- | ----------------------------------------------------- |
| Next.js 16 Docs            | https://nextjs.org/docs                               |
| Next.js 16 Release Blog    | https://nextjs.org/blog/next-16                       |
| React 19 Docs              | https://react.dev                                     |
| Prisma 7 Docs              | https://www.prisma.io/docs                            |
| Prisma 7 Upgrade Guide     | https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7 |
| NextAuth v5 (Auth.js)      | https://authjs.dev                                    |
| Tailwind CSS v4            | https://tailwindcss.com/docs                          |
| shadcn/ui                  | https://ui.shadcn.com                                 |
| Lucide Icons               | https://lucide.dev                                    |

### Infrastructure

| Resource                   | URL                                                   |
| -------------------------- | ----------------------------------------------------- |
| Cloudflare R2              | https://developers.cloudflare.com/r2                  |
| OpenAI API                 | https://platform.openai.com/docs                      |

### Design References

| App      | What to reference                        |
| -------- | ---------------------------------------- |
| Notion   | Clean layout, sidebar UX, dark mode      |
| Linear   | Minimal UI, keyboard shortcuts, speed    |
| Raycast  | Quick-access patterns, command palette   |

### Screenshots

Refer to the screenshots below as a base for the dashboard ui. It does not have to be exact. Use it as a reference.

- @context/screenshots/dashboard-ui-main.png
- @context/screenshots/dashboard-ui-drawer.png