# Scribbles

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Database

The app uses SQLite via Prisma. The default database is
`prisma/scribbles.db`; configure another file URL with `SQLITE_DATABASE_URL` in
`.env`. Use Prisma migrations for schema changes and never use `prisma db push`.

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

**IMPORTANT:** Do not add Claude to any commit messages.

**IMPORTANT:** When completing a feature please add information to the bottom of the Histroy section explaning what was done in this feature