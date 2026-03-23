import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/auth'
import { r2, R2_BUCKET_NAME } from '@/lib/r2'
import { prisma } from '@/lib/prisma'
import { Readable } from 'stream'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params

  // The key is stored as userId/uuid.ext — verify the userId prefix matches
  if (!key.startsWith(session.user.id + '/')) {
    // Also allow if item is found in DB owned by this user
    const fileUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`
    const item = await prisma.item.findFirst({
      where: { fileUrl, userId: session.user.id },
    })
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
  const response = await r2.send(command)

  if (!response.Body) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const stream = response.Body as Readable
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const body = Buffer.concat(chunks)

  const fileName = req.nextUrl.searchParams.get('name') ?? key.split('/').pop() ?? 'download'
  const contentType = response.ContentType ?? 'application/octet-stream'

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
