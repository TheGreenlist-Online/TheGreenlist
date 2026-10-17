import { ReactNode } from 'react'
import { SiteHeader } from '@/components/SiteHeader'

/**
 * The persistent application shell: header stack, content, footer.
 *
 * The frame is a server component. The header is the only client boundary
 * (it needs the pathname and auth state), so `children` and `footer` stay
 * server-rendered and out of the client bundle on every route.
 */
export function SiteFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="site-frame">
      <SiteHeader />
      <div id="main-content" className="site-frame__content" tabIndex={-1}>
        {children}
      </div>
      {footer}
    </div>
  )
}
