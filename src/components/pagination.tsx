import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  /** Extra query params to preserve (e.g. { item: '123' }) */
  searchParams?: Record<string, string>
}

export default function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams)
    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  // Build page numbers to show: always show first, last, current, and neighbors
  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  const isFirst = currentPage <= 1
  const isLast = currentPage >= totalPages

  return (
    <nav className="flex items-center justify-center gap-1 pt-6" aria-label="Pagination">
      {isFirst ? (
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground/40 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage - 1)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}

      {pages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="inline-flex items-center justify-center w-9 h-9 text-muted-foreground text-sm">
            ...
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            aria-current="page"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {page}
          </Link>
        )
      )}

      {isLast ? (
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground/40 cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage + 1)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </nav>
  )
}
