import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaBetterSqlite3({
  url: process.env.SQLITE_DATABASE_URL ?? 'file:./prisma/scribbles.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Testing database connection...\n')

  const [
    userCount,
    accountCount,
    sessionCount,
    itemTypeCount,
    collectionCount,
    itemCount,
    itemCollectionCount,
    tagCount,
    itemTagCount,
    sampleItem,
    sampleUser,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.session.count(),
    prisma.itemType.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.itemCollection.count(),
    prisma.tag.count(),
    prisma.itemTag.count(),
    prisma.item.findFirst({ select: { createdAt: true, updatedAt: true } }),
    prisma.user.findFirst({ select: { editorPreferences: true } }),
  ])

  console.log('Record counts:')
  console.log(`  Users:              ${userCount}`)
  console.log(`  Accounts:           ${accountCount}`)
  console.log(`  Sessions:           ${sessionCount}`)
  console.log(`  Item types:         ${itemTypeCount}`)
  console.log(`  Collections:        ${collectionCount}`)
  console.log(`  Items:              ${itemCount}`)
  console.log(`  Item-collection:    ${itemCollectionCount}`)
  console.log(`  Tags:               ${tagCount}`)
  console.log(`  Item-tag:           ${itemTagCount}`)
  console.log(`  DateTime values:    ${sampleItem?.createdAt instanceof Date ? 'valid' : 'no item to check'}`)
  console.log(`  JSON preferences:   ${sampleUser?.editorPreferences ? 'present' : 'none to check'}`)
  console.log('\nConnection OK.')
}

main()
  .catch((e) => {
    console.error('Connection failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
