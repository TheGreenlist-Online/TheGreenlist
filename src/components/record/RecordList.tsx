import Link from 'next/link'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RecordRowProps = {
  title: ReactNode
  href?: string
  body?: ReactNode
  /** Monospace metadata under the body: type, jurisdiction, dates. */
  meta?: ReactNode
  /** Status labels or counts, right-aligned on desktop. */
  aside?: ReactNode
  className?: string
}

/** One row in a record list. Every list on the site — records, reports, resources, discussions, news — uses this. */
export function RecordRow({ title, href, body, meta, aside, className }: RecordRowProps) {
  const inner = (
    <>
      <div className="min-w-0">
        <h3 className="gl-row__title">{href ? <Link href={href}>{title}</Link> : title}</h3>
        {body ? <p className="gl-row__body">{body}</p> : null}
        {meta ? <div className="gl-meta gl-row__meta">{meta}</div> : null}
      </div>
      {aside ? <div className="gl-row__aside">{aside}</div> : null}
    </>
  )
  return <div className={cn('gl-row', aside && 'gl-row--split', href && 'gl-row--link', className)}>{inner}</div>
}

/** Container for RecordRows. */
export function RecordList({ children, className, ariaLabel }: { children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <div className={cn('gl-rows', className)} role="list" aria-label={ariaLabel}>
      {children}
    </div>
  )
}

/** Pagination used under every list. */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null
  return (
    <nav className="gl-pagination" aria-label="Pagination">
      <Link href={hrefFor(Math.max(1, page - 1))} aria-disabled={page <= 1} className="greenlist-quiet-button">
        Previous
      </Link>
      <span className="gl-meta">
        Page {page} of {totalPages}
      </span>
      <Link href={hrefFor(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} className="greenlist-quiet-button">
        Next
      </Link>
    </nav>
  )
}
