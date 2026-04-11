# Homepage

## Overview

Convert the static HTML/CSS/JS mockup in `prototypes/homepage/` (on `feature/homepage-mockup` branch) into the real Next.js homepage at `src/app/page.tsx`. This replaces the current placeholder `<h1>Devstash</h1>`.

## Reference

- `prototypes/homepage/index.html` — full markup
- `prototypes/homepage/styles.css` — all styles (translate to Tailwind)
- `prototypes/homepage/script.js` — chaos animation, scroll fade-in, pricing toggle, navbar scroll

## Sections

The page has 7 sections, top to bottom:

1. **Navbar** — fixed top, blurred backdrop, logo + "Features" / "Pricing" anchor links + "Sign In" (→ `/sign-in`) and "Get Started" (→ `/register`) buttons. Becomes more opaque on scroll.
2. **Hero** — badge, gradient headline, subtitle, two CTAs ("Get Started" → `/register`, "See How It Works" → `#features`), and the chaos-to-order visual.
3. **Features** — 6 feature cards in a 3-col grid (1-col mobile, 2-col tablet): Code Snippets, AI Prompts, Instant Search, Commands, Files & Docs, Collections. Each card has a colored icon, title, and description.
4. **AI Section** — two-column layout: left has "Pro Feature" badge, heading, description, 4-item checklist; right has a faux code editor with syntax-highlighted `useDebounce.ts` snippet and "AI Generated Tags" row.
5. **Pricing** — monthly/yearly toggle, two cards (Free / Pro). Pro card highlighted with "Most Popular" badge. Yearly shows `$6/mo`, monthly shows `$8/mo`. Free "Get Started" → `/register`, Pro "Upgrade to Pro" → `/register`.
6. **Bottom CTA** — heading, subtitle, "Get Started" button → `/register`.
7. **Footer** — logo + tagline, 3 link columns (Product, Resources, Company), copyright with dynamic year.

## Component Breakdown

### Server Components (no `'use client'`)

- `src/app/page.tsx` — page shell, composes all sections
- `src/components/homepage/hero-section.tsx` — hero text, CTAs, wraps the chaos visual
- `src/components/homepage/features-section.tsx` — features heading + grid of 6 cards
- `src/components/homepage/ai-section.tsx` — AI two-column layout with code editor mockup
- `src/components/homepage/bottom-cta.tsx` — bottom call-to-action
- `src/components/homepage/footer.tsx` — footer grid + copyright

### Client Components (`'use client'`)

- `src/components/homepage/navbar.tsx` — needs `scroll` event listener for background opacity
- `src/components/homepage/chaos-visual.tsx` — `requestAnimationFrame` animation loop, mouse tracking, canvas or DOM-based floating icons
- `src/components/homepage/pricing-section.tsx` — billing toggle state (monthly/yearly) updates price display

## Styling

- All Tailwind — no custom CSS file for the homepage (small one-offs use inline Tailwind or a few utility classes in `globals.css` if truly needed)
- Use existing shadcn `Button` component for all buttons (variants: `default`, `outline`, `ghost`)
- Dark theme by default — colors should match the mockup's palette (background `#0a0a0f`, card `#1a1a25`, border `#2a2a3a`, etc.) using Tailwind arbitrary values or CSS variables already in `globals.css`
- Gradient headline: `bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent`
- Item type colors from project spec (`#3b82f6`, `#8b5cf6`, `#f97316`, `#fde047`, `#6b7280`, `#ec4899`, `#10b981`)

## Animations

- **Chaos icons**: 8 floating icon boxes inside a container. Each drifts with random velocity, bounces off walls, repels from mouse cursor. Use `requestAnimationFrame`. Icons: Notion, GitHub, Slack, VS Code, Browser, Terminal, File, Bookmark (use Lucide icons or inline SVGs from the mockup).
- **Scroll fade-in**: `IntersectionObserver` — elements start with `opacity-0 translate-y-6` and transition to visible. Apply to section headings and cards with staggered delays on the feature cards.
- **Navbar scroll**: toggle a `scrolled` class (or state) when `scrollY > 50` to go from transparent to opaque background.
- **Arrow pulse**: CSS animation on the transform arrow between chaos and order boxes.

## Responsive

- **Mobile (< 768px)**: nav links hidden, hero CTAs stack vertically, chaos/arrow/order stack vertically (arrow rotates 90deg), feature grid 1-col, AI section 1-col, pricing cards 1-col, footer 2-col.
- **Tablet (768–1024px)**: feature grid 2-col, everything else similar to desktop.
- **Desktop (> 1024px)**: full layout as mockup.

## Links & Navigation

| Element | Destination |
|---------|------------|
| Logo | `/` (scroll to top) |
| Features nav link | `#features` (smooth scroll) |
| Pricing nav link | `#pricing` (smooth scroll) |
| Sign In button | `/sign-in` |
| Get Started (all instances) | `/register` |
| See How It Works | `#features` (smooth scroll) |
| Upgrade to Pro | `/register` |
| Footer: Features | `#features` |
| Footer: Pricing | `#pricing` |
| Footer: other links | `#` (placeholder) |

## Requirements

- Use `next/link` for internal routes (`/sign-in`, `/register`, `/dashboard`)
- Use anchor `<a href="#section">` for same-page smooth scroll links
- Lucide icons for feature card icons (already installed in project)
- No external dependencies beyond what's already installed
- Keep the dashboard preview in the "order" box simple — static colored dots for sidebar, placeholder cards with colored top borders
- Dynamic copyright year in footer
- Page should be publicly accessible (not behind auth)
