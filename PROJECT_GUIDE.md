# Scribbles Project Guide

Scribbles is a developer knowledge hub for saving code snippets, prompts, notes,
commands, links, files, and images. This guide describes the application as it is
implemented in this repository, including how to run it locally.

## At a glance

| Area | Technology |
| --- | --- |
| Web framework | Next.js 16.1.6 App Router |
| UI | React 19.2.3, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI) |
| Database | Local SQLite file (`prisma/scribbles.db` by default) |
| ORM and database driver | Prisma 7.5 with the `prisma-client` generator and `better-sqlite3` adapter |
| Authentication | Auth.js / NextAuth 5 beta, Prisma adapter, JWT sessions |
| Tests | Vitest 4 |
| File and image storage | Cloudflare R2 via the AWS S3-compatible SDK |
| Email | Resend |
| Rate limiting | Upstash Redis and `@upstash/ratelimit` |
| Payments | Stripe subscriptions and webhooks |
| AI | OpenAI Responses API (`gpt-5-nano`) |

The package versions above are the versions declared in `package.json`; the
lockfile determines the exact installed dependency versions.

## Run locally

### Requirements

- Node.js and npm. Next.js 16 requires Node.js 20.9 or newer.
- A local SQLite database file, created by Prisma migrations.
- Git, if cloning the repository.

### 1. Install dependencies

From the repository root:

```powershell
npm ci
```

The package's `postinstall` script runs `prisma generate`, generating the
TypeScript Prisma client under `src/generated/prisma`.

### 2. Configure environment variables

Copy the example file and edit the copy:

```powershell
Copy-Item .env.example .env
```

At minimum, configure these entries in `.env`:

```dotenv
SQLITE_DATABASE_URL="file:./prisma/scribbles.db"
AUTH_SECRET="your-generated-random-secret"
NEXTAUTH_URL="http://localhost:3000"
REGISTRATION_ENABLED="true"
EMAIL_VERIFICATION_ENABLED="false"
```

Generate a suitable `AUTH_SECRET` with Node.js, then paste the output into
`.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Prisma loads `.env` through `prisma.config.ts`; both the Prisma CLI and
application use `SQLITE_DATABASE_URL`. Never commit `.env` or put real
credentials in documentation.

`REGISTRATION_ENABLED` is false unless explicitly set to the string `true`.
Enable it for local account creation. With `EMAIL_VERIFICATION_ENABLED=false`,
new password accounts are immediately verified; the default in
`.env.example` is false.

### 3. Apply migrations and optionally seed sample data

Apply the migrations checked into `prisma/migrations`:

```powershell
npx prisma migrate deploy
```

To load the development/demo records:

```powershell
npx prisma db seed
```

The Prisma seed command is configured in `prisma.config.ts` and runs
`prisma/seed.ts`. It creates or updates the demo account
`demo@Scribbles.io` with password `12345678`, system item types, collections,
items, tags, and collection links. This is predictable demo data: do not run the
seed against a production database.

The current schema is SQLite. Make schema changes through migrations, not
`prisma db push`:

```powershell
npx prisma migrate dev --name describe_the_change
```

Use `npx prisma migrate deploy` to apply committed migrations in a deployment.

### 4. Start the development server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with an account
created through registration or with the demo credentials above after seeding.

### Minimal versus integrated local setup

The database and Auth.js secret are needed for the core signed-in application.
Other providers are only needed when using their corresponding features:

- GitHub OAuth needs GitHub OAuth credentials.
- Email verification and password-reset email delivery need Resend.
- File and image uploads/downloads need Cloudflare R2.
- AI actions need an OpenAI API key.
- Stripe checkout, billing portal, and webhook handling need Stripe settings.
- Upstash credentials enable shared rate limiting. If they are absent or
  unavailable, the current rate-limit helper fails open (requests are allowed).

Some provider clients are imported by their respective route modules and Stripe
is initialized from `STRIPE_SECRET_KEY` at module load. Configure the relevant
provider before exercising its routes; do not assume an empty placeholder value
is a valid provider credential.

## Environment variables

`.env.example` is a template, not a fully provisioned local configuration.
Replace placeholders with values from the relevant provider. The application
does not validate all settings centrally at startup.

| Variable | Used for | When needed |
| --- | --- | --- |
| `SQLITE_DATABASE_URL` | SQLite file URL; defaults to `file:./prisma/scribbles.db` | Required for database-backed pages, auth, migrations, and seed |
| `AUTH_SECRET` | Auth.js token/session signing | Required for authentication |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID | GitHub sign-in/registration |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret | GitHub sign-in/registration |
| `NEXTAUTH_URL` | Base URL used to construct email links; defaults to `http://localhost:3000` in the email helper | Set to the local or deployed canonical app URL, especially for email flows |
| `REGISTRATION_ENABLED` | Opens/closes the registration page and registration API | Set to `true` to allow sign-ups; otherwise registration is closed |
| `EMAIL_VERIFICATION_ENABLED` | Requires verified email before credentials sign-in | Set to `true` to enable the verification flow |
| `RESEND_API_KEY` | Sends verification and password-reset messages | Email verification or password reset |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | Shared rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Shared rate limiting |
| `R2_ACCOUNT_ID` | Cloudflare account identifier used to construct the S3-compatible endpoint | File/image storage |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key | File/image storage |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible secret key | File/image storage |
| `R2_BUCKET_NAME` | Bucket for uploaded objects | File/image storage |
| `R2_PUBLIC_URL` | Public base URL used to form stored file URLs | Upload display and file URL/key handling |
| `OPENAI_API_KEY` | OpenAI API key | AI auto-tagging, descriptions, code explanations, and prompt optimization |
| `STRIPE_SECRET_KEY` | Stripe server API key | Checkout, billing portal, and Stripe webhook routes |
| `STRIPE_WEBHOOK_SECRET` | Stripe signature verification secret | Stripe webhook route |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe monthly subscription price ID | Monthly checkout |
| `STRIPE_PRICE_ID_YEARLY` | Stripe yearly subscription price ID | Yearly checkout |
| `STRIPE_PUBLISHABLE_KEY` | Present in `.env.example`, but not referenced by current application source | Not currently used by the app code |

When email verification is enabled, configure a valid Resend key and ensure the
email links point to the correct `NEXTAUTH_URL`. Rate limits are maintained in
Upstash when configured; without it, the application deliberately fails open.

## What the application contains

### Main user-facing areas

- `/` — public marketing homepage.
- `/sign-in`, `/register`, `/forgot-password`, `/reset-password`, and
  `/verify-email` — authentication and account recovery flows.
- `/dashboard` — recent collections, pinned items, statistics, and navigation.
- `/items/[type]` — items filtered by type, including snippets, prompts,
  commands, notes, links, files, and images.
- `/collections` and `/collections/[id]` — collection list and detail pages.
- `/favorites` — favorited items and collections.
- `/profile` — profile and usage information.
- `/settings` — subscription, editor preferences, password, and account settings.
- `/upgrade` — subscription/upgrade information.

The `src/proxy.ts` Auth.js proxy protects dashboard, item, collection, profile,
settings, favorites, and upgrade routes. API handlers and server actions also
perform their own authentication/ownership checks where appropriate.

### Core capabilities

- Create, edit, delete, favorite, pin, tag, and organize items.
- Add an item to multiple collections.
- Search items and collections using the command palette (`Ctrl+K` / `Cmd+K`).
- Edit snippets and commands with Monaco; write and preview prompt/note Markdown.
- Upload files/images to R2 for Pro users.
- Generate tags/descriptions, explain code, and optimize prompts with OpenAI for
  Pro users.
- Manage monthly/yearly Stripe subscriptions.
- Configure Monaco editor preferences per user.

Free accounts are limited to 50 items and 3 collections; file/image uploads and
AI features are Pro-gated in the application.

## Architecture and source map

The Next.js App Router renders server pages and client-side interactive
components. Server components fetch directly through Prisma. Mutations are
implemented mainly as server actions; API routes are used for authentication,
uploads, file downloads, search, billing, and webhooks.

| Path | Responsibility |
| --- | --- |
| `src/app/` | App Router pages, layouts, and API route handlers |
| `src/components/` | Page and feature UI, including dashboard, items, collections, auth, and settings |
| `src/actions/` | Server actions for items, collections, settings, and AI |
| `src/lib/db/` | Prisma-backed query functions |
| `src/lib/` | Prisma, Auth-related helpers, rate limits, email, R2, Stripe, OpenAI, and shared utilities |
| `src/hooks/` | Reusable client-side hooks |
| `src/contexts/` | React contexts, including editor preferences |
| `src/types/` | Shared TypeScript and Auth.js type declarations |
| `prisma/schema.prisma` | Database models and relations |
| `prisma/migrations/` | Versioned database migrations |
| `prisma/seed.ts` | Idempotent demo-data seed |
| `scripts/` | Database and user-maintenance scripts |
| `context/` | Project overview, implementation history, coding standards, and feature notes |
| `docs/` | User guide, design/research documents, and audit results |
| `prototypes/homepage/` | Original static homepage prototype |

`@/*` is a TypeScript alias for `src/*`. The root `prisma.config.ts` supplies
the schema path, SQLite URL, and seed command. Prisma's generated client is
written to `src/generated/prisma` and should be regenerated by the package
postinstall script or with `npx prisma generate`. The database file is ignored
by Git.

## Database model

The Prisma schema uses SQLite and includes:

- `User` — account details, password hash, Pro status, Stripe identifiers, and
  editor preferences.
- `Account`, `Session`, and `VerificationToken` — Auth.js account linkage,
  persisted session model, and short-lived verification/reset tokens. The
  configured Auth.js session strategy is JWT.
- `ItemType` — system or user-owned type metadata (name, icon, and color).
- `Item` — title, description, text or file content metadata, URL/language,
  favorite/pinned flags, owner, and type.
- `Collection` — named user-owned grouping of items.
- `ItemCollection` — many-to-many item/collection relation.
- `Tag` and `ItemTag` — globally unique tag names and the item/tag many-to-many
  relation.

The `ContentType` enum currently has `TEXT` and `FILE`. User-owned data is
scoped by `userId`; deleting a user cascades to their owned items and
collections. Item/collection and item/tag join rows cascade when their parent
records are deleted.

## API routes and server actions

The main route handlers are:

- `/api/auth/[...nextauth]` — Auth.js sign-in and OAuth callbacks.
- `/api/auth/register`, `/api/auth/verify-email`,
  `/api/auth/forgot-password`, `/api/auth/reset-password` — account lifecycle.
- `/api/items/[id]` — fetch an item's details for the drawer.
- `/api/search` — search palette data.
- `/api/upload` and `/api/files/[key]` — R2 upload and file access.
- `/api/profile/change-password` and `/api/profile/delete-account` — account
  management.
- `/api/stripe/checkout`, `/api/stripe/portal`, and
  `/api/webhooks/stripe` — subscription checkout, portal, and webhook updates.

The `src/actions/` server actions provide item and collection CRUD/toggles,
settings updates, and AI operations. Their database queries are generally
delegated to `src/lib/db/`.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve a previously built production app |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with V8 coverage |
| `npm run studio` | Open Prisma Studio |
| `npm run delete-users` | Run `scripts/delete-users.ts` to delete non-demo users |

There is no dedicated `typecheck` script in `package.json`; run
`npx tsc --noEmit` when a standalone TypeScript check is needed.

## Deployment checklist

1. Provide production environment variables and a persistent writable SQLite
   file path via `SQLITE_DATABASE_URL`.
2. Apply checked-in database migrations with `npx prisma migrate deploy` before
   serving the app.
3. Generate the Prisma client during dependency installation/build.
4. Configure `AUTH_SECRET` and the public canonical `NEXTAUTH_URL`.
5. Configure OAuth, email, Redis, R2, OpenAI, and Stripe only for the features
   being enabled.
6. Point Stripe's webhook endpoint at `/api/webhooks/stripe` and set its
   signing secret in `STRIPE_WEBHOOK_SECRET`.
7. Keep `REGISTRATION_ENABLED` disabled unless public sign-up is intended.
8. Do not run the demo seed against production.

For production, build with `npm run build` and start with `npm run start` (or
use the hosting platform's equivalent Next.js deployment workflow). A local
SQLite file requires durable storage and is not shared automatically across
serverless or multi-instance deployments.
