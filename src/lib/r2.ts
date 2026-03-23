import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export { R2_BUCKET_NAME }

export async function deleteR2Object(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
}

/** Extracts the R2 object key from a public file URL. */
export function keyFromUrl(fileUrl: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!publicUrl) return null
  const prefix = publicUrl.endsWith('/') ? publicUrl : publicUrl + '/'
  if (!fileUrl.startsWith(prefix)) return null
  return fileUrl.slice(prefix.length)
}
