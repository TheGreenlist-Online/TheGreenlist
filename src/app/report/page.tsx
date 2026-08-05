import { redirect } from 'next/navigation'

// `/report` was a static, near-duplicate concept of the real Reports Bureau at
// `/reports`. Redirect here instead of maintaining a second static page.
export default function ReportIssuePage() {
  redirect('/reports')
}
