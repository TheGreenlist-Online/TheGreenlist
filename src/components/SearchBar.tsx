import { Search } from 'lucide-react'

type SearchBarProps = {
  placeholder?: string
  className?: string
}

export function SearchBar({
  placeholder = 'Search forums, businesses, reports...',
  className = '',
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`.trim()}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300/70" />
      <input
        type="search"
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-amber-300/35 bg-[#0f1512]/85 pl-12 pr-4 text-sm text-emerald-50 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
      />
    </div>
  )
}
