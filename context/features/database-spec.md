# Prisma + SQLite Database

## Overview

Scribbles uses Prisma ORM 7 with a local SQLite database. The default database
file is `prisma/scribbles.db`, configured by `SQLITE_DATABASE_URL`.

## Requirements

- Use SQLite with Prisma's `@prisma/adapter-better-sqlite3` adapter.
- Keep the generated client on Prisma's `prisma-client` generator.
- Include Auth.js models (`Account`, `Session`, `VerificationToken`).
- Preserve the item, collection, tag, and user relations, indexes, and cascade
  behavior in `prisma/schema.prisma`.
- Use Prisma migrations for schema changes; do not use `prisma db push`.

## Configuration and commands

`prisma.config.ts` reads `SQLITE_DATABASE_URL`, defaulting to
`file:./prisma/scribbles.db`. The same setting is used by the app, seed script,
and database utilities.

```powershell
npx prisma migrate dev --name describe_the_change
npx prisma migrate deploy
npx prisma migrate status
npx prisma studio
```

The active SQLite migration history lives in `prisma/migrations/`. The prior
PostgreSQL migration files are retained only in
`prisma/migrations-postgresql-archive/` for historical reference.

## References

- Current models: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- SQLite setup: https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite
- Prisma migration guidance: https://www.prisma.io/docs/orm/prisma-migrate
