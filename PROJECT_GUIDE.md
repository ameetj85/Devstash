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

### 3. Initialize the database and optionally seed sample data

Create the SQLite file if needed, apply the migrations checked into
`prisma/migrations`, and add the seven required system item types:

```powershell
npm run setup-sqlite
```

The setup script does not add accounts or sample content. It can be rerun on an
existing Prisma-managed database; back up existing data before applying pending
migrations. `npx prisma migrate deploy` applies the schema alone and does not
initialize the system item types.

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

- GitHub OAuth is disabled by default; enabling it requires GitHub OAuth credentials.
- Email verification and password-reset email delivery need Resend.
- File and image uploads/downloads need Cloudflare R2.
- AI actions need an OpenAI API key.
- Upstash credentials enable shared rate limiting. If they are absent or
  unavailable, the current rate-limit helper fails open (requests are allowed).

Configure the relevant provider before exercising its routes; do not assume an
empty placeholder value is a valid provider credential.

## Environment variables

`.env.example` is a template, not a fully provisioned local configuration.
Replace placeholders with values from the relevant provider. The application
does not validate all settings centrally at startup.

| Variable | Used for | When needed |
| --- | --- | --- |
| `SQLITE_DATABASE_URL` | SQLite file URL; defaults to `file:./prisma/scribbles.db` | Required for database-backed pages, auth, migrations, and seed |
| `AUTH_SECRET` | Auth.js token/session signing | Required for authentication |
| `SOCIAL_LOGINS_ENABLED` | Enables the retained GitHub provider and sign-in buttons when exactly `true` | Defaults to disabled |
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

When email verification is enabled, configure a valid Resend key and ensure the
email links point to the correct `NEXTAUTH_URL`. Rate limits are maintained in
Upstash when configured; without it, the application deliberately fails open.

Social-only accounts have no password to reset and cannot sign in while social
login is disabled. Existing sessions are not revoked by this setting. To restore
GitHub login, configure its credentials and callback URL, set
`SOCIAL_LOGINS_ENABLED="true"`, and restart the app. When enabled, GitHub OAuth
can create accounts independently of the `REGISTRATION_ENABLED` registration
form/API setting; review that behavior before enabling it.

## Recent changes: SQLite, payments, and social login

### PostgreSQL-to-SQLite migration

- Prisma now uses the SQLite provider and `@prisma/adapter-better-sqlite3`.
  `SQLITE_DATABASE_URL` identifies the database, defaulting to
  `file:./prisma/scribbles.db`; relative paths are resolved from the project
  directory. The active migration history is under `prisma/migrations/`.
- The existing PostgreSQL data was copied into the local SQLite database. The
  source was left unchanged, and the previous PostgreSQL migration history was
  retained under `prisma/migrations-postgresql-archive/` for reference. It is
  not part of the active SQLite migration history.
- The SQLite database and `.env` are Git-ignored. Cloning or deploying this
  repository does **not** copy existing users or content. Back up the database
  consistently and transfer it separately if the deployed instance needs the
  existing data. The migration and verification record is documented in
  [SQLITE_MIGRATION_PLAN.md](./SQLITE_MIGRATION_PLAN.md).
- `scripts/setup-sqlite.ts`, invoked by `npm run setup-sqlite`, applies
  committed migrations and adds missing system item types without creating
  demo users or copying data. The setup command requires development
  dependencies, including Prisma and `tsx`.

### Payments and feature access

- Stripe checkout, the billing portal, webhook processing, pricing UI,
  subscription settings, upgrade links, and Pro badges are no longer active.
  The Stripe package and Stripe environment settings were removed. The retained
  `POST /api/stripe/checkout`, `POST /api/stripe/portal`, and
  `POST /api/webhooks/stripe` endpoints return HTTP 410; `/upgrade` redirects
  to `/settings`.
- All authenticated users can create items and collections without the former
  50-item and 3-collection tier limits, use file and image types, and use AI
  actions. Authentication, ownership checks, validation, and operational limits
  remain. Uploads require R2 configuration and are limited to 10 MiB for files
  and 5 MiB for images with allowed MIME types; AI requires OpenAI configuration
  and retains the shared 20-requests-per-hour user limit when rate limiting is
  configured.
- The `User.isPro`, `User.stripeCustomerId`, and
  `User.stripeSubscriptionId` database fields remain unchanged for
  reversibility but no longer grant or restrict feature access. No schema
  migration or account-data deletion was performed for this change.
- Retiring the application integration **does not cancel existing Stripe
  subscriptions or stop charges**. Manage existing subscriptions and disable
  the old webhook separately at the payment provider before deployment.
  Retained payment-related source files no longer implement payment processing;
  restoring the integration would require code changes, not just configuration.

### Social sign-in

- `SOCIAL_LOGINS_ENABLED` defaults to disabled and must equal the exact string
  `true` to enable the retained GitHub provider. The shared provider
  configuration is in `src/lib/social-auth.ts` and is used by both
  `src/auth.ts` and `src/auth.config.ts`. With the flag disabled, GitHub is not
  registered with Auth.js, direct GitHub sign-in is unavailable, and the
  sign-in and registration pages hide their social buttons.
- The GitHub button component, provider configuration, OAuth credentials in
  existing environment files, and linked account records are retained.
  Disabling the provider does not delete accounts or invalidate existing
  sessions. Users who only used GitHub have no password to reset and cannot
  initiate a new sign-in until a supported access method is restored.
- To re-enable GitHub sign-in, set `SOCIAL_LOGINS_ENABLED="true"` and configure
  `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and the appropriate GitHub OAuth
  callback URL; restart the application. Review registration policy first:
  the GitHub OAuth flow can create accounts even when `REGISTRATION_ENABLED`
  disables the email/password registration page and API.

### Verification

The latest implementation checks passed the production build and 193 Vitest
tests. Browser checks covered a non-Pro account's file/image pages and settings,
and the sign-in and registration pages with social login disabled. The Auth.js
provider endpoint was also checked in both disabled and enabled configurations.
The full lint command still reports pre-existing UI lint issues.

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
- `/settings` — editor preferences, password, and account settings.

The `src/proxy.ts` Auth.js proxy protects dashboard, item, collection, profile,
settings and favorites routes. API handlers and server actions also
perform their own authentication/ownership checks where appropriate.

### Core capabilities

- Create, edit, delete, favorite, pin, tag, and organize items.
- Add an item to multiple collections.
- Search items and collections using the command palette (`Ctrl+K` / `Cmd+K`).
- Edit snippets and commands with Monaco; write and preview prompt/note Markdown.
- Upload files/images to R2.
- Generate tags/descriptions, explain code, and optimize prompts with OpenAI.
- Configure Monaco editor preferences per user.

All users can access these features without a subscription. File uploads and AI
still require their respective provider credentials and retain their operational
limits, including file-size and AI rate limits.

## Architecture and source map

The Next.js App Router renders server pages and client-side interactive
components. Server components fetch directly through Prisma. Mutations are
implemented mainly as server actions; API routes are used for authentication,
uploads, file downloads, and search.

| Path | Responsibility |
| --- | --- |
| `src/app/` | App Router pages, layouts, and API route handlers |
| `src/components/` | Page and feature UI, including dashboard, items, collections, auth, and settings |
| `src/actions/` | Server actions for items, collections, settings, and AI |
| `src/lib/db/` | Prisma-backed query functions |
| `src/lib/` | Prisma, Auth-related helpers, rate limits, email, R2, OpenAI, and shared utilities |
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

The application uses a purple-tinted dark palette by default, with light-mode
tokens also defined in `src/app/globals.css`. Shared theme colors use Tailwind
CSS v4's CSS-based `@theme` configuration. Item-type colors remain distinct to
help users recognize their content. Interactive controls and cards use subtle
hover transitions; motion is reduced when the operating system requests it.

`@/*` is a TypeScript alias for `src/*`. The root `prisma.config.ts` supplies
the schema path, SQLite URL, and seed command. Prisma's generated client is
written to `src/generated/prisma` and should be regenerated by the package
postinstall script or with `npx prisma generate`. The database file is ignored
by Git.

## Database model

The Prisma schema uses SQLite and includes:

- `User` — account details, password hash, and editor preferences. Legacy
  subscription columns remain in the database for reversibility but are unused.
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
- The retired payment endpoints return HTTP 410 and do not process payments.

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
| `npm run setup-sqlite` | Apply SQLite migrations and initialize system item types |
| `npm run delete-users` | Run `scripts/delete-users.ts` to delete non-demo users |

There is no dedicated `typecheck` script in `package.json`; run
`npx tsc --noEmit` when a standalone TypeScript check is needed.

## Deployment checklist

1. Provide production environment variables and a persistent writable SQLite
   file path via `SQLITE_DATABASE_URL`.
2. Run `npm run setup-sqlite` before serving the app to apply migrations and
   initialize system item types. Back up an existing database first.
3. Generate the Prisma client during dependency installation/build.
4. Configure `AUTH_SECRET` and the public canonical `NEXTAUTH_URL`.
5. Configure OAuth, email, Redis, R2, and OpenAI only for the features being enabled.
6. Keep `REGISTRATION_ENABLED` disabled unless public sign-up is intended.
7. Do not run the demo seed against production.

Removing the integration does not cancel subscriptions or stop charges at the
payment provider. Handle any existing subscriptions and webhook configuration
there separately before deploying.

For production, build with `npm run build` and start with `npm run start` (or
use the hosting platform's equivalent Next.js deployment workflow). A local
SQLite file requires durable storage and is not shared automatically across
serverless or multi-instance deployments.
