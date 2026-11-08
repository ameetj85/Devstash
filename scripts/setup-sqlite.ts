import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'
import { SYSTEM_ITEM_TYPES } from '../prisma/system-item-types'

async function main() {
  const root = resolve(__dirname, '..')
  process.chdir(root)
  const databaseUrl = process.env.SQLITE_DATABASE_URL ?? 'file:./prisma/scribbles.db'
  if (!databaseUrl.startsWith('file:') || databaseUrl.length === 'file:'.length) {
    throw new Error('SQLITE_DATABASE_URL must be a non-empty SQLite file: URL.')
  }

  execFileSync(process.execPath, [resolve(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, SQLITE_DATABASE_URL: databaseUrl },
  })

  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) })
  try {
    await prisma.$transaction(async (tx) => {
      for (const type of SYSTEM_ITEM_TYPES) {
        const existing = await tx.itemType.findFirst({
          where: { name: type.name, isSystem: true, userId: null },
        })
        if (!existing) {
          await tx.itemType.create({ data: { ...type, isSystem: true, userId: null } })
        }
      }
    })
    console.log('SQLite schema and system item types are ready. No user or demo data was created.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('SQLite setup failed:', error)
  process.exitCode = 1
})
