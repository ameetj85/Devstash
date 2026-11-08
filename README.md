# Scribbles

Scribbles is a developer knowledge hub for saving code snippets, prompts, notes,
commands, links, files, and images.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 and shadcn/ui
- Prisma 7 with a local SQLite database
- Auth.js / NextAuth 5
- Optional integrations: GitHub OAuth, Cloudflare R2, Resend, Upstash Redis,
  Stripe, and OpenAI

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```powershell
npm ci
Copy-Item .env.example .env
```

Set `AUTH_SECRET` in `.env`. The database defaults to
`file:./prisma/scribbles.db`; change `SQLITE_DATABASE_URL` only if you want to
store it elsewhere. The SQLite file is created by the migration command:

```powershell
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set
`REGISTRATION_ENABLED="true"` in `.env` to allow account creation. Other
third-party keys are only required for their corresponding integrations.

To load the development/demo records into the SQLite database:

```powershell
npx prisma db seed
```

The demo account is `demo@Scribbles.io` with password `12345678`. Do not run
the seed command against a database containing data you want to preserve; it
creates or updates demo records.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server after building |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run studio` | Open Prisma Studio for the configured SQLite database |
| `npx prisma migrate dev --name <name>` | Create and apply a development migration |
| `npx prisma migrate deploy` | Apply committed migrations |

Database schema changes must use Prisma migrations, not `prisma db push`.

## Database

The SQLite database path is configured with `SQLITE_DATABASE_URL` in `.env`.
The default is `file:./prisma/scribbles.db`. The active SQLite migration history
is in `prisma/migrations/`; the original PostgreSQL migrations are retained in
`prisma/migrations-postgresql-archive/` for historical reference and are not
used by the app.

For detailed architecture and setup information, see
[PROJECT_GUIDE.md](./PROJECT_GUIDE.md). The source data transfer and validation
record is in [SQLITE_MIGRATION_PLAN.md](./SQLITE_MIGRATION_PLAN.md).

## Set up SQLite on a VPS

From the project directory on the VPS, install dependencies (including dev
dependencies), create `.env` from `.env.example`, and set `AUTH_SECRET` and
`SQLITE_DATABASE_URL`. The database defaults to `file:./prisma/scribbles.db`;
relative paths are resolved from the project directory. Make sure the parent
directory exists and is writable by both the setup command and the app.

```sh
npm ci
cp .env.example .env
# Edit .env before continuing.
npm run setup-sqlite
```

The script creates the database if needed, applies committed Prisma migrations,
and adds any missing system item types. It can be rerun on an existing
Prisma-managed SQLite database; pending migrations may change its schema, so
back it up before updating. It does not create user accounts, add demo data,
or transfer your existing local database. To use existing data, separately
copy a consistent SQLite backup to the configured path before starting the app.
Configure registration or another sign-in method to create your first account.
