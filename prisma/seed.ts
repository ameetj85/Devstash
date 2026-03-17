import 'dotenv/config'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ─── Demo user ─────────────────────────────────────────────────────────────

  const user = await prisma.user.upsert({
    where: { email: 'demo@devstash.io' },
    update: {},
    create: {
      id: 'user_1',
      name: 'John Doe',
      email: 'demo@devstash.io',
      isPro: false,
    },
  })

  console.log(`User: ${user.email}`)

  // ─── System item types ──────────────────────────────────────────────────────

  const itemTypes = [
    { id: 'type_snippet', name: 'snippet', icon: 'Code',      color: '#3b82f6' },
    { id: 'type_prompt',  name: 'prompt',  icon: 'Sparkles',  color: '#8b5cf6' },
    { id: 'type_command', name: 'command', icon: 'Terminal',  color: '#f97316' },
    { id: 'type_note',    name: 'note',    icon: 'StickyNote',color: '#fde047' },
    { id: 'type_link',    name: 'link',    icon: 'Link',      color: '#10b981' },
    { id: 'type_file',    name: 'file',    icon: 'File',      color: '#6b7280' },
    { id: 'type_image',   name: 'image',   icon: 'Image',     color: '#ec4899' },
  ]

  for (const t of itemTypes) {
    await prisma.itemType.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, isSystem: true, userId: null },
    })
  }

  console.log(`Item types: ${itemTypes.length}`)

  // ─── Collections ────────────────────────────────────────────────────────────

  const collections = [
    { id: 'col_1', name: 'React Patterns',  description: 'Common React patterns and hooks',        isFavorite: true  },
    { id: 'col_2', name: 'Python Snippets', description: 'Useful Python code snippets',            isFavorite: false },
    { id: 'col_3', name: 'Context Files',   description: 'AI context files for projects',          isFavorite: true  },
    { id: 'col_4', name: 'Interview Prep',  description: 'Technical interview preparation',        isFavorite: false },
    { id: 'col_5', name: 'Git Commands',    description: 'Frequently used git commands',           isFavorite: true  },
    { id: 'col_6', name: 'AI Prompts',      description: 'Curated AI prompts for coding',          isFavorite: false },
  ]

  for (const c of collections) {
    await prisma.collection.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, userId: user.id },
    })
  }

  console.log(`Collections: ${collections.length}`)

  // ─── Items + tags + collection links ────────────────────────────────────────

  const items = [
    {
      id: 'item_1',
      title: 'useAuth Hook',
      description: 'Custom authentication hook for React applications',
      contentType: 'TEXT' as const,
      content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}`,
      language: 'typescript',
      isFavorite: true,
      isPinned: true,
      itemTypeId: 'type_snippet',
      tags: ['react', 'auth', 'hooks'],
      collectionIds: ['col_1'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'item_2',
      title: 'API Error Handling Pattern',
      description: 'Fetch wrapper with exponential backoff retry logic',
      contentType: 'TEXT' as const,
      content: `async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      return await res.json()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 2 ** i * 1000))
    }
  }
}`,
      language: 'typescript',
      isFavorite: false,
      isPinned: true,
      itemTypeId: 'type_snippet',
      tags: ['fetch', 'error-handling', 'typescript'],
      collectionIds: ['col_1'],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
    },
    {
      id: 'item_3',
      title: 'Git Stash Workflow',
      description: 'Frequently used git stash commands',
      contentType: 'TEXT' as const,
      content: `git stash          # stash changes
git stash pop      # restore latest stash
git stash list     # list all stashes
git stash drop     # delete latest stash`,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_command',
      tags: ['git', 'workflow'],
      collectionIds: ['col_5'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'item_4',
      title: 'Code Review Prompt',
      description: 'Prompt for AI-assisted code review',
      contentType: 'TEXT' as const,
      content: `Review the following code for:
- Security vulnerabilities
- Performance issues
- Code style and readability
- Edge cases not handled

Code: [paste code here]`,
      language: null,
      isFavorite: true,
      isPinned: false,
      itemTypeId: 'type_prompt',
      tags: ['code-review', 'ai', 'productivity'],
      collectionIds: ['col_6'],
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-08'),
    },
    {
      id: 'item_5',
      title: 'Tailwind CSS Cheatsheet',
      description: 'Useful Tailwind utility class reference',
      contentType: 'TEXT' as const,
      content: `flex items-center justify-between
grid grid-cols-3 gap-4
text-sm font-medium text-muted-foreground
rounded-lg border bg-card p-4 shadow-sm`,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_note',
      tags: ['tailwind', 'css', 'reference'],
      collectionIds: ['col_1'],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05'),
    },
    {
      id: 'item_6',
      title: 'Next.js Docs',
      description: 'Official Next.js documentation',
      contentType: 'TEXT' as const,
      content: null,
      url: 'https://nextjs.org/docs',
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_link',
      tags: ['nextjs', 'docs'],
      collectionIds: ['col_1'],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ]

  for (const { tags, collectionIds, ...item } of items) {
    // Upsert item
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, userId: user.id },
    })

    // Upsert tags and link to item
    for (const tagName of tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      })
      await prisma.itemTag.upsert({
        where: { itemId_tagId: { itemId: item.id, tagId: tag.id } },
        update: {},
        create: { itemId: item.id, tagId: tag.id },
      })
    }

    // Link item to collections
    for (const collectionId of collectionIds) {
      await prisma.itemCollection.upsert({
        where: { itemId_collectionId: { itemId: item.id, collectionId } },
        update: {},
        create: { itemId: item.id, collectionId },
      })
    }
  }

  console.log(`Items: ${items.length}`)
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
