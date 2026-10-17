import { redirect } from 'next/navigation'

/**
 * The "Green List Town" presentation layer has been retired in favour of a
 * single records interface. The URL is preserved so existing links resolve.
 */
export default function TownPage() {
  redirect('/')
}
