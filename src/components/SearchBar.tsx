import { GlobalSearch } from '@/components/shell/GlobalSearch'

type SearchBarProps = {
  placeholder?: string
  className?: string
  ariaLabel?: string
  defaultValue?: string
}

/** Thin wrapper kept for existing call sites; renders the shared global search. */
export function SearchBar({ placeholder, className = '', defaultValue }: SearchBarProps) {
  return <GlobalSearch className={className} placeholder={placeholder} defaultValue={defaultValue} />
}
