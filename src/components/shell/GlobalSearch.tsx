import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type GlobalSearchProps = {
  className?: string
  placeholder?: string
  defaultValue?: string
}

/**
 * Site-wide public record search. Rendered once in the header on every page;
 * search is a primary public utility of a records platform, not a secondary
 * feature.
 */
export function GlobalSearch({
  className,
  placeholder = 'Search businesses, licences, reports, or jurisdictions',
  defaultValue,
}: GlobalSearchProps) {
  return (
    <form action="/search" method="get" role="search" className={cn('gl-search', className)}>
      <Search className="gl-search__icon" aria-hidden="true" />
      <input
        name="q"
        type="search"
        minLength={2}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label="Search public Green List records"
        className="gl-search__input"
        autoComplete="off"
      />
      <button type="submit" className="gl-search__submit">
        Search
      </button>
    </form>
  )
}
