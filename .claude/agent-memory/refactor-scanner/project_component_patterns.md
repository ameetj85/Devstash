---
name: Component-level duplication patterns
description: Recurring duplication patterns found in src/components/ during April 2026 scan
type: project
---

The biggest structural patterns found in the components folder (as of 2026-04-20 scan):

1. **`item-drawer.tsx` is the largest file (816 lines)** — contains two complete render trees (view mode + edit mode) plus skeleton, types, and helpers. High-priority split candidate.

2. **`create-item-dialog.tsx` and `item-drawer.tsx` share the entire item form body** — Description+GenerateDescriptionButton, Language select, Content editor (CodeEditor/MarkdownEditor/Textarea switch), URL input, Tags+SuggestTagsButton, Collections picker — all duplicated verbatim with only minor prop differences.

3. **`useItemDrawer` hook pattern repeated 3 times** — `items-client-wrapper.tsx`, `dashboard-item-rows.tsx`, and `favorites-list.tsx` all implement `selectedId + drawerOpen + handleItemClick + <ItemDrawer />` with the same 4-line shape.

4. **Collection favorite toggle duplicated** — `collection-card-menu.tsx` and `collection-detail-actions.tsx` both implement the exact same optimistic-toggle pattern (`prev = isFavorite, setIsFavorite(!prev), call action, rollback on fail, router.refresh()`).

5. **AI button (Sparkles/Crown) header pattern duplicated** — `code-editor.tsx` lines 186–215 and `markdown-editor.tsx` lines 144–173 render the same Pro-gated AI action button (Sparkles if isPro, Crown disabled if not, Loader2 spinner while running).

6. **GitHub OAuth button duplicated** — `sign-in-form.tsx` lines 59–64 and `register-form.tsx` lines 99–104 copy the same SVG + button markup verbatim.

7. **`formatDate` helper defined twice** — `item-drawer.tsx:83-89` and `favorites-list.tsx:20-25` both define the same `formatDate` function. `item-drawer.tsx` uses long format (month/day/year), favorites uses short (month/day) — different but both candidates for `src/lib/format-date.ts`.

**Why:** These were all added incrementally feature-by-feature. The item form body in particular grew as fields were added (collections, AI buttons, language) and was copy-pasted rather than extracted.

**How to apply:** In future scans of `src/components/items/`, lead with the create-dialog/drawer form-body duplication as the highest-leverage extraction.
