import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export function SearchBar({
  placeholder = 'Search forums, businesses, reports...',
  className = '',
  ariaLabel = 'Search forums, businesses, reports',
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/70" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-11 w-full rounded-lg border border-white/10 bg-white/[.035] pl-11 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
      />
    </div>
  )
}
