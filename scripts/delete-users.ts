import 'dotenv/config'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '../src/generated/prisma/client'

const KEEP_EMAIL = 'demo@devstash.io'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true },
  })

  if (users.length === 0) {
    console.log('No users to delete (only the demo user exists).')
    return
  }

  console.log(`Deleting ${users.length} user(s):`)
  for (const u of users) {
    console.log(`  ${u.email ?? u.id}`)
  }

  const userIds = users.map((u) => u.id)

  // Delete in dependency order (join tables first, then owned records, then users)
  await prisma.itemTag.deleteMany({ where: { item: { userId: { in: userIds } } } })
  await prisma.itemCollection.deleteMany({ where: { item: { userId: { in: userIds } } } })
  await prisma.item.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.collection.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.itemType.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.account.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.verificationToken.deleteMany({ where: { identifier: { in: users.map((u) => u.email!).filter(Boolean) } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })

  console.log('Non-demo users deleted.')

  // Clean demo user's data so seed can recreate it fresh
  const demoUser = await prisma.user.findUnique({ where: { email: KEEP_EMAIL }, select: { id: true } })
  if (demoUser) {
    console.log('Cleaning demo user data...')
    await prisma.itemTag.deleteMany({ where: { item: { userId: demoUser.id } } })
    await prisma.itemCollection.deleteMany({ where: { item: { userId: demoUser.id } } })
    await prisma.item.deleteMany({ where: { userId: demoUser.id } })
    await prisma.collection.deleteMany({ where: { userId: demoUser.id } })
    console.log('Demo user data cleaned.')
  }

  console.log('Done. Run `npx prisma db seed` to re-seed demo data.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
