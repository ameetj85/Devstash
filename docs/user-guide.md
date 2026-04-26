# Scribbles User Guide

Welcome to **Scribbles** — your fast, searchable, AI-enhanced hub for all your developer knowledge. Whether you're saving code snippets, AI prompts, terminal commands, or useful links, Scribbles keeps everything in one place so you can stop hunting through Notion, Gists, browser bookmarks, and shell history.

This guide will get you from zero to productive in about 10 minutes.

---

## Table of Contents

1. [What Is Scribbles?](#1-what-is-Scribbles)
2. [Getting Started](#2-getting-started)
   - 2.1 [Creating an Account](#21-creating-an-account)
   - 2.2 [Signing In](#22-signing-in)
   - 2.3 [Forgot Your Password?](#23-forgot-your-password)
3. [Core Concepts](#3-core-concepts)
   - 3.1 [Items](#31-items)
   - 3.2 [Item Types](#32-item-types)
   - 3.3 [Collections](#33-collections)
   - 3.4 [Tags](#34-tags)
4. [The Dashboard](#4-the-dashboard)
   - 4.1 [Top Bar](#41-top-bar)
   - 4.2 [Sidebar](#42-sidebar)
   - 4.3 [Main Area](#43-main-area)
5. [Working With Items](#5-working-with-items)
   - 5.1 [Creating an Item](#51-creating-an-item)
   - 5.2 [Viewing an Item](#52-viewing-an-item)
   - 5.3 [Editing an Item](#53-editing-an-item)
   - 5.4 [Deleting an Item](#54-deleting-an-item)
   - 5.5 [Favorites and Pinning](#55-favorites-and-pinning)
   - 5.6 [Copying and Downloading](#56-copying-and-downloading)
6. [Working With Collections](#6-working-with-collections)
   - 6.1 [Creating a Collection](#61-creating-a-collection)
   - 6.2 [Adding Items to a Collection](#62-adding-items-to-a-collection)
   - 6.3 [Editing and Deleting Collections](#63-editing-and-deleting-collections)
7. [Search & Navigation](#7-search--navigation)
   - 7.1 [Command Palette (⌘K / Ctrl+K)](#71-command-palette-k--ctrlk)
   - 7.2 [Browsing by Type](#72-browsing-by-type)
   - 7.3 [Favorites Page](#73-favorites-page)
8. [AI Features (Pro)](#8-ai-features-pro)
   - 8.1 [Auto-Tag Suggestions](#81-auto-tag-suggestions)
   - 8.2 [Description Generator](#82-description-generator)
   - 8.3 [Explain This Code](#83-explain-this-code)
   - 8.4 [Prompt Optimizer](#84-prompt-optimizer)
9. [Files & Images (Pro)](#9-files--images-pro)
10. [Settings](#10-settings)
    - 10.1 [Editor Preferences](#101-editor-preferences)
    - 10.2 [Subscription](#102-subscription)
    - 10.3 [Change Password](#103-change-password)
    - 10.4 [Delete Account](#104-delete-account)
11. [Profile](#11-profile)
12. [Free vs. Pro](#12-free-vs-pro)
13. [Tips & Best Practices](#13-tips--best-practices)
14. [Troubleshooting / FAQ](#14-troubleshooting--faq)

---

## 1. What Is Scribbles?

Scribbles is a single home for the things developers constantly lose track of:

- **Code snippets** you reuse across projects
- **AI prompts** you've carefully crafted
- **Terminal commands** that took you an hour to figure out
- **Notes** on patterns, architectures, and decisions
- **Links** to docs and tools worth remembering
- **Files and images** (screenshots, design assets, context files) — *Pro*

Everything is searchable, organizable, and enhanced with AI features like auto-tagging, code explanation, and prompt optimization.

---

## 2. Getting Started

### 2.1 Creating an Account

1. Go to the homepage and click **Get Started** (or navigate to `/register`).
2. You can sign up in two ways:
   - **Email + password** — fill in your name, email, and a password (twice to confirm).
   - **GitHub** — click **Sign up with GitHub** for one-click OAuth.
3. If email verification is enabled on your instance, check your inbox for a verification link. Click it to activate your account.
4. Once verified (or right away if verification is off), sign in.

### 2.2 Signing In

Head to `/sign-in` and choose:

- **Email + password** — the same credentials you registered with.
- **GitHub OAuth** — one click, no password needed.

After signing in, you'll land on `/dashboard`.

### 2.3 Forgot Your Password?

1. On the sign-in page, click **Forgot password?** next to the password field.
2. Enter your email and submit.
3. Check your inbox for a reset link (valid for 1 hour).
4. Click the link, set a new password, and sign in.

> Password reset only works for email/password accounts. If you signed up with GitHub, sign in with GitHub — there's no password to reset.

---

## 3. Core Concepts

### 3.1 Items

An **item** is the basic unit of Scribbles. Every piece of knowledge you save — a snippet, a prompt, a link — is an item. Each item has:

- A **title** (required)
- An optional **description**
- A **type** (determines its behavior and appearance)
- **Content** (code, markdown, a URL, or a file — depends on the type)
- Optional **tags** and **collections**
- A **favorite** flag and a **pinned** flag

### 3.2 Item Types

Scribbles ships with seven built-in types. Each has its own color and icon so you can spot them at a glance.

| Type        | Color   | Best For                                      | Plan |
| ----------- | ------- | --------------------------------------------- | ---- |
| **Snippet** | Blue    | Reusable code blocks (syntax-highlighted)     | Free |
| **Prompt**  | Purple  | AI prompts and system messages (markdown)     | Free |
| **Command** | Orange  | Shell commands and one-liners                 | Free |
| **Note**    | Yellow  | Freeform markdown notes and docs              | Free |
| **Link**    | Emerald | URLs to docs, tools, articles                 | Free |
| **File**    | Gray    | Any file upload (context files, PDFs, etc.)   | Pro  |
| **Image**   | Pink    | Screenshots, diagrams, design assets          | Pro  |

**Text-based types** (snippet, prompt, command, note) use the appropriate editor:

- **Snippet / Command** → Monaco code editor with syntax highlighting
- **Prompt / Note** → Markdown editor with Write/Preview tabs

### 3.3 Collections

A **collection** is a named group of items. Items can belong to **multiple collections** at the same time, so grouping is flexible.

Typical collections:

- *"React Patterns"* — snippets and notes
- *"AI Workflows"* — prompts and context files
- *"Interview Prep"* — snippets, notes, and links
- *"DevOps"* — commands and links

Each collection card shows a colored accent and type badges that reflect the mix of items inside.

### 3.4 Tags

**Tags** are free-form labels (e.g., `typescript`, `react`, `docker`). They're useful for cross-cutting themes that don't map cleanly to a single collection. Tags appear on item cards and in the drawer, and they're searchable via the command palette.

---

## 4. The Dashboard

The dashboard (`/dashboard`) is your landing page after sign-in. It has three zones.

### 4.1 Top Bar

From left to right:

- **Scribbles logo** — click to return to the dashboard.
- **Search bar** (center) — click or press **⌘K / Ctrl+K** to open the global command palette.
- **Favorites star** — yellow when you have favorites; takes you to `/favorites`.
- **New Item** button — opens a drawer to create an item.
- **New Collection** button — opens a dialog to create a collection.

On mobile, the search collapses into an icon and the two "New" buttons merge into a single "+" dropdown.

### 4.2 Sidebar

- **Item types** (Snippets, Prompts, Commands, Notes, Links, Files, Images) with live per-type counts. Click to see all items of that type.
- **Favorites** link — jumps to `/favorites`.
- **Collections** — your favorite and recent collections, plus a **View all collections** link.
- **User menu** (bottom) — your avatar, name, email, and a dropdown for **Profile**, **Settings**, and **Sign out**.

The sidebar is collapsible on desktop (icon-only) and becomes a hamburger drawer on mobile.

### 4.3 Main Area

- **Stats cards** — totals for items, collections, favorite items, and favorite collections.
- **Recent collections** — grid of your most recently updated collections.
- **Pinned items** — items you've pinned to the top (hidden if none).
- **Recent items** — your 10 most recently created/updated items.

Click any item or collection to open it.

---

## 5. Working With Items

### 5.1 Creating an Item

1. Click **New Item** in the top bar (or the "+" button on mobile).
2. Pick a **type** from the color-coded selector. You can also land on a type-specific page (e.g., `/items/snippets`) and click **New Snippet** to pre-select the type.
3. Fill in the fields:
   - **Title** — required.
   - **Description** — optional; use the **Describe** button (Pro) to auto-generate one.
   - **Language** — for snippets/commands; picks syntax highlighting.
   - **Content / URL / File** — depends on the type.
   - **Tags** — comma-separated; use **Suggest tags** (Pro) for AI suggestions.
   - **Collections** — pick one or more from the dropdown.
4. Click **Create**. You'll see a toast confirmation and the new item will appear in listings.

> Free users: you're limited to **50 items** and **3 collections**. File and image types require Pro.

### 5.2 Viewing an Item

Clicking any item opens a **right-side drawer** with the full detail view:

- Type badge and tags at the top
- An action bar (Favorite, Pin, Copy, Edit, Delete)
- Description
- Content (syntax-highlighted code, rendered markdown, link preview, image preview, or file info)
- Collections this item belongs to
- Created / updated timestamps

Close the drawer with the **X** or by clicking outside it.

### 5.3 Editing an Item

1. Open the item drawer.
2. Click the **pencil (Edit)** icon in the action bar.
3. The drawer switches to edit mode with all fields editable inline.
4. Click **Save** to persist, or **Cancel** to discard changes.

### 5.4 Deleting an Item

1. Open the item drawer.
2. Click the **trash (Delete)** icon.
3. Confirm in the dialog. Deletion is permanent — tag and collection links are removed automatically; uploaded files are deleted from storage.

### 5.5 Favorites and Pinning

- **Favorite (star)** — surface important items on `/favorites` and in the sidebar/top bar indicator.
- **Pin (pin icon)** — float an item to the top of item listings and show it in the Pinned Items section on the dashboard.

Both toggles live in the item drawer's action bar and update optimistically.

### 5.6 Copying and Downloading

- **Copy** — the copy icon in the action bar (and in the editor header) puts the item's content on your clipboard.
- **Download** — available for File items via the download button on the file row.

---

## 6. Working With Collections

### 6.1 Creating a Collection

1. Click **New Collection** in the top bar.
2. Enter a **name** (required) and an optional **description**.
3. Click **Create**.

### 6.2 Adding Items to a Collection

You can assign items to collections two ways:

- **While creating/editing an item** — use the **Collections** multi-select picker in the form.
- **From the collection page** (`/collections/[id]`) — browse existing items, open them, and add the collection in edit mode.

An item can belong to any number of collections simultaneously.

### 6.3 Editing and Deleting Collections

- **Edit** — open a collection (`/collections/[id]`) and click the **pencil** icon to rename or update the description.
- **Favorite** — the **star** icon toggles collection favoriting (also available on the 3-dot menu on collection cards).
- **Delete** — the **trash** icon deletes the collection. The items inside are **not deleted**; they simply lose that collection association.

---

## 7. Search & Navigation

### 7.1 Command Palette (⌘K / Ctrl+K)

The fastest way to find anything:

- Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux) from anywhere in the app.
- Or click the search bar in the top nav.
- Type to fuzzy-search items (by title) and collections.
- Items show the type-colored icon; collections show a folder icon.
- Press **Enter** (or click) to jump directly to the item drawer or collection page.

### 7.2 Browsing by Type

Each type has a dedicated page:

- `/items/snippets`, `/items/prompts`, `/items/commands`, `/items/notes`, `/items/links`
- `/items/files` (Pro) — list view with download buttons
- `/items/images` (Pro) — toggle between gallery thumbnails and card view

Pages are paginated (21 items per page), with **pinned items** always sorted to the top.

### 7.3 Favorites Page

`/favorites` shows all starred items and collections in a compact, keyboard-friendly list. Sort by:

- **Date** (newest first — default)
- **Name** (alphabetical)
- **Type** (grouped)

---

## 8. AI Features (Pro)

All AI features require a Pro subscription and are rate-limited to **20 requests per hour** per user (shared across all AI actions).

### 8.1 Auto-Tag Suggestions

In the item create dialog or edit drawer, click **Suggest tags** (Sparkles icon) next to the tags input. The AI analyzes the title, content, and type, then proposes up to 5 relevant tags. Accept each with the check icon or reject with the X. Accepted tags are added to the tags input.

### 8.2 Description Generator

Click **Describe** (Sparkles icon) next to the description label. Works across all item types — the AI reads whatever signals are present (title, content, URL, language, tags) and writes a concise description.

### 8.3 Explain This Code

Available on **Snippet** and **Command** items in the read view of the drawer. Click the **Sparkles** icon in the code editor header. After a short moment, a tabbed view appears:

- **Code** — the original content
- **Explain** — a plain-English, markdown-formatted walkthrough

Explanations are ephemeral — they regenerate each time, so they don't take up storage.

### 8.4 Prompt Optimizer

Available on **Prompt** items. Click the **Sparkles** icon in the markdown editor header.

- If the AI decides the prompt is already solid, you'll see a toast and nothing changes.
- Otherwise, a side-by-side dialog shows the **original** and **optimized** versions with a short **rationale**.
- Click **Accept** to save the improved prompt, or **Reject** to keep the original.

---

## 9. Files & Images (Pro)

- **Files** — upload anything (context files, PDFs, zips, etc.). Stored in Cloudflare R2. File rows show a type-aware icon, name, size, and a download button.
- **Images** — upload PNG, JPG, GIF, etc. The `/items/images` page defaults to a **gallery view** with 16:9 thumbnails. Toggle to card view with the layout button.

Files and images are deleted from storage automatically when you delete the item.

---

## 10. Settings

Go to `/settings` (via the user menu in the sidebar).

### 10.1 Editor Preferences

Tweak how the code editor looks and behaves. All changes auto-save.

- **Font size** — small, medium, large
- **Tab size** — 2 or 4 spaces
- **Theme** — vs-dark (default), monokai, github-dark
- **Word wrap** — on/off
- **Minimap** — on/off

### 10.2 Subscription

- **Free users** — see your current usage (items X/50, collections X/3) and upgrade buttons for **Monthly ($8)** or **Yearly ($72)** plans. Clicking either launches Stripe Checkout.
- **Pro users** — see a crown icon and a **Manage Subscription** button that opens the Stripe Billing Portal (update card, view invoices, cancel).

### 10.3 Change Password

Available for email/password users. Enter your current password and the new password (twice). Rate-limited to 5 attempts per 15 minutes. GitHub-only users don't see this section.

### 10.4 Delete Account

Permanently deletes your user record and all associated data (items, collections, files, subscriptions). Confirm by typing **DELETE** in the dialog — the button only enables once the text matches.

---

## 11. Profile

`/profile` shows your account info at a glance:

- Avatar (GitHub image or initials)
- Name, email, and account creation date
- Total items and collections (with "X / 50" limits for free users, "Unlimited" for Pro)
- Per-item-type breakdown with counts

Account actions (password, delete) live on `/settings`.

---

## 12. Free vs. Pro

| Feature                  | Free              | Pro ($8/mo · $72/yr)    |
| ------------------------ | ----------------- | ----------------------- |
| Items                    | 50 total          | Unlimited               |
| Collections              | 3                 | Unlimited               |
| Snippets / Prompts / Commands / Notes / Links | ✓ | ✓                 |
| File & Image uploads     | —                 | ✓                       |
| AI auto-tagging          | —                 | ✓                       |
| AI description generator | —                 | ✓                       |
| AI code explanation      | —                 | ✓                       |
| AI prompt optimizer      | —                 | ✓                       |
| Priority support         | —                 | ✓                       |

Upgrade from `/settings` or the pricing section on the homepage.

---

## 13. Tips & Best Practices

- **Pin** the 3–5 items you reach for every day so they stay on your dashboard.
- **Star** anything you'll want to find again without searching.
- Use **collections** for projects or workflows; use **tags** for themes.
- For code snippets, **set the language** — you'll get syntax highlighting in the editor.
- Prompt library: use the **Prompt Optimizer** once after creating a prompt, then pin the winner.
- **⌘K** is the fastest way around. Memorize it.
- **Import** existing snippets from a file when creating an item to avoid copy-paste.
- Use **Describe** (Pro) right after creating something — descriptions make your library way easier to skim later.

---

## 14. Troubleshooting / FAQ

**I didn't get my verification email.**
Check your spam folder. If it's still missing, try registering again or contact support — the link is valid for 24 hours.

**I got "Too many requests" (429).**
Scribbles rate-limits sensitive endpoints (sign-in, registration, password reset, AI calls) to prevent abuse. Wait the time shown in the error and try again.

**I hit my free-plan limit.**
You'll see an error when creating items beyond 50 or collections beyond 3. Either delete old items or upgrade to Pro from `/settings`.

**AI features are greyed out.**
AI actions require a Pro subscription. Free users see a crown icon with a tooltip instead of the Sparkles button.

**My file upload failed.**
Check your connection and file size. File and image uploads require Pro — free users will get a 403 from the upload endpoint.

**I signed up with GitHub but want to add a password.**
Not currently supported. GitHub accounts authenticate exclusively through GitHub OAuth.

**How do I export my data?**
Export (JSON/ZIP) is a planned Pro feature.

**Can I create custom item types?**
Custom types are on the roadmap. For now, the seven system types cover the common cases.

---

Happy stashing! 🎯
