/**
 * Extracts the R2 object key from a public file URL.
 * Safe to use in client components — no env vars required.
 * Example: "https://pub-xxx.r2.dev/userId/file.pdf" → "userId/file.pdf"
 */
export function extractFileKey(fileUrl: string): string {
  try {
    return new URL(fileUrl).pathname.slice(1)
  } catch {
    return fileUrl.split('/').slice(-2).join('/')
  }
}
