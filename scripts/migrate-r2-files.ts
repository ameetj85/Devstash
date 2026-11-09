import 'dotenv/config'
import { createHash } from 'node:crypto'
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { prisma } from '../src/lib/prisma'
import { r2, R2_BUCKET_NAME, keyFromUrl } from '../src/lib/r2'

function hash(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex')
}

async function main() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    throw new Error('All R2 environment variables are required for migration')
  }

  const keys: string[] = []
  let token: string | undefined
  do {
    const page = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, ContinuationToken: token }))
    for (const object of page.Contents ?? []) {
      if (object.Key) keys.push(object.Key)
    }
    token = page.NextContinuationToken
  } while (token)

  const users = await prisma.user.findMany({ select: { id: true, image: true } })
  const userIds = new Set(users.map((user) => user.id))
  if (users.some((user) => user.image && keyFromUrl(user.image))) {
    throw new Error('R2-backed user avatars require a separate migration before proceeding')
  }
  if (keys.some((key) => !userIds.has(key.split('/')[0]))) {
    throw new Error('Some R2 objects do not belong to a user in this SQLite database; migration stopped')
  }

  const items = await prisma.item.findMany({
    where: { fileUrl: { not: null } },
    select: { id: true, userId: true, fileUrl: true, fileName: true, updatedAt: true, itemType: { select: { name: true } } },
  })
  const keysSet = new Set(keys)
  for (const item of items) {
    if (item.fileUrl?.startsWith('/api/files/')) continue
    const key = item.fileUrl && keyFromUrl(item.fileUrl)
    if (!key || !keysSet.has(key) || key.split('/')[0] !== item.userId) {
      throw new Error('An existing file reference cannot be safely matched to an owned R2 object; migration stopped')
    }
  }

  let linked = 0
  for (const key of keys) {
    const response = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
    if (!response.Body) throw new Error('An R2 object has no body; migration stopped')
    const bytes = new Uint8Array(await response.Body.transformToByteArray())
    if (response.ContentLength !== undefined && response.ContentLength !== bytes.length) {
      throw new Error('An R2 object length did not match; migration stopped')
    }
    const userId = key.split('/')[0]
    const matchingItems = items.filter((item) => item.fileUrl && keyFromUrl(item.fileUrl) === key)
    const mimeType = response.ContentType || 'application/octet-stream'
    const fileName = matchingItems[0]?.fileName || key.split('/').pop() || 'download'

    await prisma.$transaction(async (tx) => {
      let stored = await tx.itemFile.findUnique({ where: { sourceKey: key } })
      if (stored) {
        if (stored.userId !== userId || stored.size !== bytes.length || hash(stored.data) !== hash(bytes)) {
          throw new Error('Previously migrated R2 object does not match the source; migration stopped')
        }
      } else {
        stored = await tx.itemFile.create({
          data: {
            userId, sourceKey: key, fileName, mimeType, size: bytes.length, data: bytes,
            itemType: mimeType.startsWith('image/') ? 'image' : 'file',
          },
        })
      }

      let attached = stored.itemId !== null
      for (const item of matchingItems) {
        const file = !attached
          ? await tx.itemFile.update({
              where: { id: stored.id },
              data: { itemId: item.id, itemType: item.itemType.name, fileName: item.fileName || fileName },
            })
          : await tx.itemFile.create({
              data: {
                userId, itemId: item.id, fileName: item.fileName || fileName,
                itemType: item.itemType.name, mimeType, size: bytes.length, data: bytes,
              },
            })
        attached = true
        await tx.item.update({
          where: { id: item.id, userId },
          data: { fileUrl: `/api/files/${file.id}`, fileSize: bytes.length, updatedAt: item.updatedAt },
        })
        linked++
      }
      const verified = await tx.itemFile.findUniqueOrThrow({ where: { sourceKey: key } })
      if (hash(verified.data) !== hash(bytes)) throw new Error('SQLite verification failed; migration stopped')
    })
  }
  console.log(`Migrated and verified ${keys.length} R2 objects; linked ${linked} item references. R2 objects were not deleted.`)
}

main()
  .catch((error: unknown) => {
    console.error('R2 migration failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
