# Creating a SQLite Database

This guide creates a Scribbles SQLite database using the scripts in this
repository. Run all commands from the repository root.

## What the setup script does

`npm run setup-sqlite` runs `scripts/setup-sqlite.ts`. It creates the configured
SQLite database if it does not exist, applies the committed Prisma migrations,
and creates any missing system item types. The migrations create the current
schema, including users, invitations, items, collections, and the `ItemFile`
table used to store uploaded files and images.

The script does **not** create a user, load demo content, or copy data from an
existing database or R2 bucket.

## 1. Prepare the application

Install Node.js and npm. The installed Prisma version requires Node.js
20.19 or later on the 20.x line, 22.12 or later on the 22.x line, or
24.x or later. Check your versions:

```powershell
node --version
npm --version
```

Install the project's dependencies, including development dependencies:

```powershell
npm ci
```

This also generates the Prisma client through the `postinstall` script. The
setup command needs the Prisma CLI and `tsx`, so do not omit development
dependencies when installing.

If you do not already have a `.env` file, create one:

```powershell
Copy-Item .env.example .env
```

Do not overwrite an existing `.env`: it may contain your current database
location and credentials.

## 2. Choose the database location

Set the following in `.env`, or keep this default:

```dotenv
SQLITE_DATABASE_URL="file:./prisma/scribbles.db"
```

The default path is relative to the repository root. To create a separate
database, change the filename or use an absolute SQLite `file:` URL. Ensure
the parent directory already exists and is writable by the setup script and
the application. For a deployed app, use persistent storage and back up the
database file, which also contains uploaded file bytes.

**Check the path before continuing.** If the database already exists, setup
uses it and applies pending migrations; it does not create a second empty
database. Back up existing data before running migrations. An environment
variable already set in your shell can override the value in `.env`:

```powershell
$env:SQLITE_DATABASE_URL
```

For the application, also set a unique `AUTH_SECRET` in `.env` and set
`NEXTAUTH_URL` to the application's URL. To generate a secret locally, run
the following and paste its output into `.env`; do not commit or share it:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

## 3. Create and initialize the database

```powershell
npm run setup-sqlite
```

On success, the script reports:

```text
SQLite schema and system item types are ready. No user or demo data was created.
```

It is safe to rerun against a Prisma-managed database to apply pending
migrations and add missing system item types. Back up the database first:
pending migrations can change its schema. Use Prisma migrations for schema
changes; do not use `prisma db push`.

## 4. Verify the setup

Check that all migrations are applied:

```powershell
npx prisma migrate status
```

Optionally, check the connection and record counts:

```powershell
npx tsx scripts/test-db.ts
```

For a fresh database, expect seven item types and zero users, collections, and
items. You can also inspect the database with Prisma Studio:

```powershell
npm run studio
```

## 5. Add a development account (optional)

For a **local development database only**, load sample users and content:

```powershell
npx prisma db seed
```

The seed creates or updates the demo account `demo@Scribbles.io` with password
`12345678`, along with sample collections, items, and tags. It resets that
account's password when rerun. Do not run it on production or on a database
whose existing demo data must be preserved.

Start the app:

```powershell
npm run dev
```

Open `http://localhost:3000` and sign in with the demo account. New accounts
require an administrator's invitation. For local development, you can use
Prisma Studio to set the demo user's `isAdmin` field to `true`, then configure
SMTP and `NEXTAUTH_URL` to send invitations. Production requires a securely
provisioned initial administrator; the setup script does not create one. Do
not use the demo account to bootstrap production.

## Existing data and R2 files

Creating a fresh database does not transfer your existing users, items, or
uploads. To preserve an existing SQLite installation, take a consistent SQLite
backup and restore it to the configured path before running setup. Do not copy
an actively written database file without a SQLite-consistent backup method.

If migrating legacy R2 files, first restore or migrate the corresponding users
and items into SQLite, back up the database, and configure the R2 variables.
See [Cloudflare R2 to SQLite File Storage](./r2-to-sqlite-file-storage.md)
before running `npm run migrate-r2-files`. That script does not delete the R2
objects.

## Troubleshooting

- **Invalid `SQLITE_DATABASE_URL`:** The value must start with `file:` and
  contain a path.
- **Cannot create or open the database:** Check that the parent directory
  exists and that the process has permission to write to it.
- **Wrong database selected:** Check both `.env` and `$env:SQLITE_DATABASE_URL`,
  then confirm the database path printed by the setup command.
- **Migration failed or status is not current:** Read the Prisma error, verify
  the target database and permissions, and restore or resolve migration
  problems before retrying. Do not delete the database to make setup pass.
- **No account after setup:** This is expected. Use the optional development
  seed above, or provision an administrator securely for production.
