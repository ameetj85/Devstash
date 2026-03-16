// Mock data for dashboard UI — replace with DB queries when auth/db is wired up

export const mockUser = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  image: null,
  isPro: false,
};

export const mockItemTypes = [
  { id: "type_snippet", name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { id: "type_prompt", name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { id: "type_command", name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { id: "type_note", name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { id: "type_link", name: "link", icon: "Link", color: "#10b981", isSystem: true },
  { id: "type_file", name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { id: "type_image", name: "image", icon: "Image", color: "#ec4899", isSystem: true },
];

export const mockCollections = [
  {
    id: "col_1",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemCount: 12,
  },
  {
    id: "col_2",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemCount: 8,
  },
  {
    id: "col_3",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemCount: 5,
  },
  {
    id: "col_4",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemCount: 24,
  },
  {
    id: "col_5",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemCount: 15,
  },
  {
    id: "col_6",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemCount: 18,
  },
];

export const mockItems = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "TEXT" as const,
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthP...')
  }
  return context
}`,
    url: null,
    language: "typescript",
    isFavorite: true,
    isPinned: true,
    itemTypeId: "type_snippet",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_1"],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "TEXT" as const,
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
    url: null,
    language: "typescript",
    isFavorite: false,
    isPinned: true,
    itemTypeId: "type_snippet",
    tags: ["fetch", "error-handling", "typescript"],
    collectionIds: ["col_1"],
    createdAt: "2024-01-12T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z",
  },
  {
    id: "item_3",
    title: "Git Stash Workflow",
    description: "Frequently used git stash commands",
    contentType: "TEXT" as const,
    content: `git stash          # stash changes
git stash pop      # restore latest stash
git stash list     # list all stashes
git stash drop     # delete latest stash`,
    url: null,
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_command",
    tags: ["git", "workflow"],
    collectionIds: ["col_5"],
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "item_4",
    title: "Code Review Prompt",
    description: "Prompt for AI-assisted code review",
    contentType: "TEXT" as const,
    content: `Review the following code for:
- Security vulnerabilities
- Performance issues
- Code style and readability
- Edge cases not handled

Code: [paste code here]`,
    url: null,
    language: null,
    isFavorite: true,
    isPinned: false,
    itemTypeId: "type_prompt",
    tags: ["code-review", "ai", "productivity"],
    collectionIds: ["col_6"],
    createdAt: "2024-01-08T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z",
  },
  {
    id: "item_5",
    title: "Tailwind CSS Cheatsheet",
    description: "Useful Tailwind utility class reference",
    contentType: "TEXT" as const,
    content: `flex items-center justify-between
grid grid-cols-3 gap-4
text-sm font-medium text-muted-foreground
rounded-lg border bg-card p-4 shadow-sm`,
    url: null,
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_note",
    tags: ["tailwind", "css", "reference"],
    collectionIds: ["col_1"],
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "item_6",
    title: "Next.js Docs",
    description: "Official Next.js documentation",
    contentType: "TEXT" as const,
    content: null,
    url: "https://nextjs.org/docs",
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_link",
    tags: ["nextjs", "docs"],
    collectionIds: ["col_1"],
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
  },
];

// Sidebar counts by type name
export const mockTypeCounts: Record<string, number> = {
  snippet: 24,
  prompt: 18,
  command: 15,
  note: 12,
  file: 5,
  image: 3,
  link: 8,
};
