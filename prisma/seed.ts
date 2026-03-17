import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ─── User ──────────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('12345678', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@devstash.io' },
    update: { hashedPassword, emailVerified: new Date() },
    create: {
      id: 'user_1',
      name: 'Demo User',
      email: 'demo@devstash.io',
      hashedPassword,
      emailVerified: new Date(),
      isPro: false,
    },
  })

  console.log(`✓ User: ${user.email}`)

  // ─── System item types ─────────────────────────────────────────────────────

  const itemTypes = [
    { id: 'type_snippet', name: 'snippet', icon: 'Code',       color: '#3b82f6' },
    { id: 'type_prompt',  name: 'prompt',  icon: 'Sparkles',   color: '#8b5cf6' },
    { id: 'type_command', name: 'command', icon: 'Terminal',   color: '#f97316' },
    { id: 'type_note',    name: 'note',    icon: 'StickyNote', color: '#fde047' },
    { id: 'type_file',    name: 'file',    icon: 'File',       color: '#6b7280' },
    { id: 'type_image',   name: 'image',   icon: 'Image',      color: '#ec4899' },
    { id: 'type_link',    name: 'link',    icon: 'Link',       color: '#10b981' },
  ]

  for (const t of itemTypes) {
    await prisma.itemType.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, isSystem: true, userId: null },
    })
  }

  console.log(`✓ Item types: ${itemTypes.length}`)

  // ─── Collections ───────────────────────────────────────────────────────────

  const collections = [
    { id: 'col_react',    name: 'React Patterns',    description: 'Reusable React patterns and hooks',              isFavorite: true  },
    { id: 'col_ai',       name: 'AI Workflows',       description: 'AI prompts and workflow automations',            isFavorite: true  },
    { id: 'col_devops',   name: 'DevOps',             description: 'Infrastructure and deployment resources',        isFavorite: false },
    { id: 'col_terminal', name: 'Terminal Commands',  description: 'Useful shell commands for everyday development', isFavorite: false },
    { id: 'col_design',   name: 'Design Resources',   description: 'UI/UX resources and references',                isFavorite: false },
  ]

  for (const c of collections) {
    await prisma.collection.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, userId: user.id },
    })
  }

  console.log(`✓ Collections: ${collections.length}`)

  // ─── Items ─────────────────────────────────────────────────────────────────

  const items = [
    // React Patterns — 3 snippets
    {
      id: 'item_react_1',
      title: 'useDebounce Hook',
      description: 'Delays updating a value until after a specified wait period',
      contentType: 'TEXT' as const,
      content: `import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}`,
      language: 'typescript',
      isFavorite: true,
      isPinned: true,
      itemTypeId: 'type_snippet',
      tags: ['react', 'hooks', 'performance'],
      collectionIds: ['col_react'],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
    {
      id: 'item_react_2',
      title: 'useLocalStorage Hook',
      description: 'Sync state to localStorage with automatic JSON serialization',
      contentType: 'TEXT' as const,
      content: `import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}`,
      language: 'typescript',
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_snippet',
      tags: ['react', 'hooks', 'localStorage'],
      collectionIds: ['col_react'],
      createdAt: new Date('2024-02-03'),
      updatedAt: new Date('2024-02-03'),
    },
    {
      id: 'item_react_3',
      title: 'Context Provider Pattern',
      description: 'Type-safe React context with a custom hook and provider component',
      contentType: 'TEXT' as const,
      content: `import { createContext, useContext, useState, ReactNode } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}`,
      language: 'typescript',
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_snippet',
      tags: ['react', 'context', 'typescript'],
      collectionIds: ['col_react'],
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05'),
    },

    // AI Workflows — 3 prompts
    {
      id: 'item_ai_1',
      title: 'Code Review Prompt',
      description: 'Thorough AI-assisted code review covering security, performance, and readability',
      contentType: 'TEXT' as const,
      content: `Review the following code and provide feedback on:

1. **Security** — vulnerabilities, unsafe inputs, exposed secrets
2. **Performance** — unnecessary re-renders, N+1 queries, blocking operations
3. **Readability** — naming, complexity, missing comments
4. **Edge cases** — unhandled errors, null/undefined, boundary conditions
5. **Best practices** — patterns, idiomatic usage for the language/framework

Be concise. Use bullet points. Flag critical issues first.

\`\`\`
[paste code here]
\`\`\``,
      language: null,
      isFavorite: true,
      isPinned: true,
      itemTypeId: 'type_prompt',
      tags: ['code-review', 'ai', 'quality'],
      collectionIds: ['col_ai'],
      createdAt: new Date('2024-02-08'),
      updatedAt: new Date('2024-02-08'),
    },
    {
      id: 'item_ai_2',
      title: 'Documentation Generator',
      description: 'Generate JSDoc/TSDoc comments for functions and classes',
      contentType: 'TEXT' as const,
      content: `Generate comprehensive JSDoc/TSDoc documentation for the following code.

Include:
- A one-line summary
- \`@param\` for every parameter with type and description
- \`@returns\` with type and description
- \`@throws\` for any errors that may be thrown
- A short usage example in \`@example\`

Keep descriptions clear and developer-facing. Do not over-explain obvious things.

\`\`\`
[paste function or class here]
\`\`\``,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_prompt',
      tags: ['documentation', 'ai', 'jsdoc'],
      collectionIds: ['col_ai'],
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
    },
    {
      id: 'item_ai_3',
      title: 'Refactoring Assistant',
      description: 'Improve code structure without changing behaviour',
      contentType: 'TEXT' as const,
      content: `Refactor the following code to improve its structure and maintainability.

Goals:
- Eliminate duplication (DRY)
- Simplify complex conditionals
- Break large functions into smaller, focused ones
- Improve naming clarity
- Keep the external behaviour identical

Show the refactored code only. Add a brief bullet-point summary of the changes made.

\`\`\`
[paste code here]
\`\`\``,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_prompt',
      tags: ['refactoring', 'ai', 'clean-code'],
      collectionIds: ['col_ai'],
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-12'),
    },

    // DevOps — 1 snippet, 1 command, 2 links
    {
      id: 'item_devops_1',
      title: 'Dockerfile — Node.js App',
      description: 'Multi-stage production Dockerfile for a Node.js application',
      contentType: 'TEXT' as const,
      content: `# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
      language: 'dockerfile',
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_snippet',
      tags: ['docker', 'nodejs', 'devops'],
      collectionIds: ['col_devops'],
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-15'),
    },
    {
      id: 'item_devops_2',
      title: 'Docker Compose Up & Clean',
      description: 'Start services in detached mode and clean up stopped containers',
      contentType: 'TEXT' as const,
      content: `# Start all services in detached mode
docker compose up -d --build

# Tail logs for a specific service
docker compose logs -f app

# Stop and remove containers, networks
docker compose down

# Full clean — remove volumes too
docker compose down -v --remove-orphans`,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_command',
      tags: ['docker', 'compose', 'devops'],
      collectionIds: ['col_devops'],
      createdAt: new Date('2024-02-16'),
      updatedAt: new Date('2024-02-16'),
    },
    {
      id: 'item_devops_3',
      title: 'Docker Docs',
      description: 'Official Docker documentation',
      contentType: 'TEXT' as const,
      content: null,
      url: 'https://docs.docker.com',
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_link',
      tags: ['docker', 'docs'],
      collectionIds: ['col_devops'],
      createdAt: new Date('2024-02-17'),
      updatedAt: new Date('2024-02-17'),
    },
    {
      id: 'item_devops_4',
      title: 'GitHub Actions Docs',
      description: 'Official GitHub Actions documentation for CI/CD workflows',
      contentType: 'TEXT' as const,
      content: null,
      url: 'https://docs.github.com/en/actions',
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_link',
      tags: ['github-actions', 'ci-cd', 'docs'],
      collectionIds: ['col_devops'],
      createdAt: new Date('2024-02-17'),
      updatedAt: new Date('2024-02-17'),
    },

    // Terminal Commands — 4 commands
    {
      id: 'item_cmd_1',
      title: 'Git Essentials',
      description: 'Everyday git commands for branching, stashing, and history',
      contentType: 'TEXT' as const,
      content: `# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Stash including untracked files
git stash -u

# Interactive rebase — rewrite last 3 commits
git rebase -i HEAD~3

# Show a pretty commit graph
git log --oneline --graph --decorate --all

# Find which commit introduced a bug
git bisect start && git bisect bad && git bisect good <hash>`,
      language: null,
      isFavorite: true,
      isPinned: false,
      itemTypeId: 'type_command',
      tags: ['git', 'version-control'],
      collectionIds: ['col_terminal'],
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 'item_cmd_2',
      title: 'Docker Container Commands',
      description: 'Inspect, exec into, and clean up Docker containers',
      contentType: 'TEXT' as const,
      content: `# List running containers
docker ps

# Exec into a running container
docker exec -it <container_id> sh

# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Show container resource usage
docker stats`,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_command',
      tags: ['docker', 'containers'],
      collectionIds: ['col_terminal'],
      createdAt: new Date('2024-02-21'),
      updatedAt: new Date('2024-02-21'),
    },
    {
      id: 'item_cmd_3',
      title: 'Process Management',
      description: 'Find and kill processes by port or name',
      contentType: 'TEXT' as const,
      content: `# Find process using port 3000
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# List all node processes
ps aux | grep node

# Kill all node processes
pkill -f node

# Show real-time system resource usage
top -o cpu`,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_command',
      tags: ['process', 'terminal', 'debug'],
      collectionIds: ['col_terminal'],
      createdAt: new Date('2024-02-22'),
      updatedAt: new Date('2024-02-22'),
    },
    {
      id: 'item_cmd_4',
      title: 'npm / pnpm Utilities',
      description: 'Useful package manager commands for auditing and workspace management',
      contentType: 'TEXT' as const,
      content: `# List outdated packages
npm outdated

# Audit and auto-fix vulnerabilities
npm audit fix

# Check what's using disk space in node_modules
npx cost-of-modules

# Run script in all pnpm workspaces
pnpm -r run build

# See why a package is installed
npm explain <package>`,
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_command',
      tags: ['npm', 'pnpm', 'packages'],
      collectionIds: ['col_terminal'],
      createdAt: new Date('2024-02-23'),
      updatedAt: new Date('2024-02-23'),
    },

    // Design Resources — 4 links
    {
      id: 'item_design_1',
      title: 'Tailwind CSS Docs',
      description: 'Official Tailwind CSS v4 documentation',
      contentType: 'TEXT' as const,
      content: null,
      url: 'https://tailwindcss.com/docs',
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_link',
      tags: ['tailwind', 'css', 'docs'],
      collectionIds: ['col_design'],
      createdAt: new Date('2024-02-25'),
      updatedAt: new Date('2024-02-25'),
    },
    {
      id: 'item_design_2',
      title: 'shadcn/ui',
      description: 'Re-usable accessible component library built on Radix UI and Tailwind',
      contentType: 'TEXT' as const,
      content: null,
      url: 'https://ui.shadcn.com',
      language: null,
      isFavorite: true,
      isPinned: false,
      itemTypeId: 'type_link',
      tags: ['shadcn', 'components', 'ui'],
      collectionIds: ['col_design'],
      createdAt: new Date('2024-02-25'),
      updatedAt: new Date('2024-02-25'),
    },
    {
      id: 'item_design_3',
      title: 'Radix UI Primitives',
      description: 'Unstyled, accessible UI primitives for building design systems',
      contentType: 'TEXT' as const,
      content: null,
      url: 'https://www.radix-ui.com/primitives',
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_link',
      tags: ['radix', 'accessibility', 'design-system'],
      collectionIds: ['col_design'],
      createdAt: new Date('2024-02-26'),
      updatedAt: new Date('2024-02-26'),
    },
    {
      id: 'item_design_4',
      title: 'Lucide Icons',
      description: 'Beautiful and consistent open-source icon library',
      contentType: 'TEXT' as const,
      content: null,
      url: 'https://lucide.dev',
      language: null,
      isFavorite: false,
      isPinned: false,
      itemTypeId: 'type_link',
      tags: ['icons', 'lucide', 'ui'],
      collectionIds: ['col_design'],
      createdAt: new Date('2024-02-26'),
      updatedAt: new Date('2024-02-26'),
    },
  ]

  for (const { tags, collectionIds, ...item } of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, userId: user.id },
    })

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

    for (const collectionId of collectionIds) {
      await prisma.itemCollection.upsert({
        where: { itemId_collectionId: { itemId: item.id, collectionId } },
        update: {},
        create: { itemId: item.id, collectionId },
      })
    }
  }

  console.log(`✓ Items: ${items.length}`)
  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
