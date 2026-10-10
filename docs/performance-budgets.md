# Public page performance and indexing budgets

These are launch budgets for public record routes, measured on mobile at the
75th percentile. Private workspaces and evidence intake must not trade privacy
or access controls for speed.

| Area | Budget |
| --- | --- |
| Core Web Vitals | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 |
| Initial JavaScript | ≤ 200 KB compressed on a public record page |
| Search | Show a useful response or explicit empty state within 1 s |
| Route loading | Render the shared loading boundary immediately while a route is pending |
| Layout | Readable and operable at 320 CSS px without horizontal page scrolling |

Public records must render useful content on the server and use canonical URLs.
Only intentionally public, reviewed records may be indexed; private dashboards,
admin pages, private submissions, and evidence intake must not expose sensitive
content in search results, metadata, or crawlable routes.

Keep route-level client code and media small, and avoid loading nonessential
scripts before interaction. Recheck these budgets on representative low-powered
mobile devices before release; the budgets are targets, not claims that current
production performance has already been measured.
