/**
 * Shared Green List visual-system backdrop. The single fixed shell is
 * inherited by every district while page content remains accessible above it.
 */
export function SmokeBackground() {
  return (
    <div className="smoke-bg greenlist-shell-bg" aria-hidden="true">
      <div className="greenlist-shell-bg__art" />
      <div className="greenlist-shell-bg__veil" />
    </div>
  )
}
