import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { r2, R2_BUCKET_NAME } from '@/lib/r2'

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

  const ext = file.name.split('.').pop() ?? 'bin'
  const key = `${session.user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    })
  )

  const publicUrl = process.env.R2_PUBLIC_URL!
  const fileUrl = `${publicUrl.replace(/\/$/, '')}/${key}`

  return NextResponse.json({ fileUrl, fileName: file.name, key })
}
