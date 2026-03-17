import 'dotenv/config'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Testing database connection...\n')

  const [userCount, itemTypeCount, collectionCount, itemCount, tagCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.itemType.count(),
      prisma.collection.count(),
      prisma.item.count(),
      prisma.tag.count(),
    ])

  console.log('Record counts:')
  console.log(`  Users:       ${userCount}`)
  console.log(`  Item types:  ${itemTypeCount}`)
  console.log(`  Collections: ${collectionCount}`)
  console.log(`  Items:       ${itemCount}`)
  console.log(`  Tags:        ${tagCount}`)

  const items = await prisma.item.findMany({
    include: {
      itemType: true,
      tags: { include: { tag: true } },
      collections: { include: { collection: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log('\nItems:')
  for (const item of items) {
    const tags = item.tags.map((t) => t.tag.name).join(', ')
    const cols = item.collections.map((c) => c.collection.name).join(', ')
    console.log(`  [${item.itemType.name}] ${item.title}`)
    console.log(`    tags: ${tags || 'none'}`)
    console.log(`    collections: ${cols || 'none'}`)
  }

  console.log('\nConnection OK.')
}

main()
  .catch((e) => {
    console.error('Connection failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
