import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])

const FILE_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/x-yaml',
  'text/yaml',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/toml',
])

const IMAGE_MAX_BYTES = 5 * 1024 * 1024   // 5 MB
const FILE_MAX_BYTES  = 10 * 1024 * 1024  // 10 MB

// ─── POST /api/upload ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  const itemType = formData.get('itemType') as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!itemType || !['file', 'image'].includes(itemType)) {
    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
  }

  const isImage = itemType === 'image'
  const allowedMimes = isImage ? IMAGE_MIME_TYPES : FILE_MIME_TYPES
  const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES

  if (!allowedMimes.has(file.type)) {
    return NextResponse.json({ error: `File type "${file.type}" is not allowed` }, { status: 400 })
  }

  if (file.size > maxBytes) {
    const limit = isImage ? '5 MB' : '10 MB'
    return NextResponse.json({ error: `File exceeds ${limit} limit` }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  await prisma.itemFile.deleteMany({
    where: {
      userId: session.user.id,
      itemId: null,
      sourceKey: null,
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })
  const stored = await prisma.itemFile.create({
    data: {
      userId: session.user.id,
      itemType,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      data: buffer,
    },
    select: { id: true },
  })

  return NextResponse.json({ fileUrl: `/api/files/${stored.id}`, fileName: file.name, fileSize: file.size, key: stored.id })
}
