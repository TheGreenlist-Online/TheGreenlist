# Greenlist Integration, Route, and Upload Roadmap

**Status date:** July 24, 2026  
**Repository:** `TheGreenlist-Online/TheGreenlist`  
**Production branch:** `main`  
**Primary domain:** `https://thegreenlist.online`  
**Secondary domain:** `https://greenlist.online`

## Purpose

This document consolidates the current project state and defines the safest execution order for making GitHub, Vercel, and Supabase work as one reliable delivery system. It then prioritizes route integrity, upload workflows, role-specific dashboards, and placeholder completion.

The Green List remains a cannabis transparency, accountability, reporting, education, news, forum, and community-trust platform. It must not provide cannabis sales, ordering, delivery, checkout, payments, inventory menus, product ordering, or marketplace functionality.

## Current project state

### Completed or operational

- [x] GitHub source is `TheGreenlist-Online/TheGreenlist`.
- [x] Production work deploys from `main`.
- [x] Vercel project `the-greenlist` is connected to the correct GitHub organization and repository.
- [x] Latest inspected production deployment is `READY` and matches commit `ea45d335907a9832a42b7d44e452534d413ab33d`.
- [x] `thegreenlist.online` and `greenlist.online` are assigned to the Vercel project.
- [x] NextAuth has been removed from the active authentication flow.
- [x] Supabase Auth and PostgreSQL are the primary identity and data systems.
- [x] Supabase project `TheGreenlist` is `ACTIVE_HEALTHY`.
- [x] Role permissions are centralized.
- [x] Platform-owner authority is protected above ordinary administrators.
- [x] Database protections prevent unauthorized role changes.
- [x] AI is not authorized to delete accounts, alter profiles, or change roles.
- [x] Role-based dashboard actions have been added.
- [x] The evidence center and evidence upload routes have been added.
- [x] Authenticated evidence upload handling has been repaired.
- [x] All inspected public tables have RLS enabled.
- [x] The unified district shell and Green List Town foundation are present.
- [x] Standard and Town interfaces use the same platform and data model.

### Live data confirmed

| Resource | Rows |
|---|---:|
| Profiles | 3 |
| Reports | 1 |
| Evidence files | 2 |
| User roles | 1 |

Forums, forum threads, forum posts, business profiles, moderation queues, support tickets, notifications, audit logs, and education resources are structurally present but currently empty.

### Remaining risks

- [ ] GitHub Actions is not fully aligned with Vercel's native deployment flow.
- [ ] Recent CI test/build stages reportedly succeeded while the Actions deployment stage failed.
- [ ] Supabase leaked-password protection is disabled.
- [ ] `greenlist.online` needs renewed DNS and Vercel configuration verification after a domain warning.
- [ ] RLS policy behavior still requires role-by-role testing; enabling RLS alone is not proof that policies are correct.
- [ ] Evidence uploads require full storage, database, visibility, download, replacement, and review testing.
- [ ] Draft PRs #7 and #9 appear obsolete or conflicting and require review before closure.
- [ ] Issue #12 remains the long-term Green List Town epic.
- [ ] Placeholder content and incomplete destinations remain to be audited.

# Priority 1 — Seamless GitHub, Vercel, and Supabase delivery

## 1. Establish one production deployment authority

- [ ] Keep GitHub Actions responsible for tests, linting, type checking, security checks, and production builds.
- [ ] Use Vercel's GitHub integration as the production deployment authority for pushes to `main`.
- [ ] Remove or disable any duplicate GitHub Actions deployment step unless it is intentionally required.
- [ ] Require successful verification checks before changes enter `main`.
- [ ] Confirm the deployed Vercel Git SHA matches the GitHub `main` SHA after every production release.
- [ ] Document rollback procedures using Vercel's previous READY deployment.

### Acceptance criteria

- One merge to `main` produces one production deployment.
- CI status clearly distinguishes verification failures from deployment failures.
- Vercel production metadata identifies the correct repository, branch, and commit.
- Failed checks do not silently produce a production release.

## 2. Audit Vercel project configuration

- [ ] Confirm `TheGreenlist-Online/TheGreenlist` is the only connected production repository.
- [ ] Confirm `main` is the production branch.
- [ ] Compare Development, Preview, and Production environment-variable coverage.
- [ ] Remove obsolete NextAuth variables.
- [ ] Verify the Supabase URL and publishable key are present where required.
- [ ] Keep Supabase secret/service-role keys server-only and outside all `NEXT_PUBLIC_` variables.
- [ ] Verify the intended Node.js runtime and dependency compatibility.
- [ ] Confirm authentication callback and redirect URLs use approved Green List domains.
- [ ] Ensure no secret values are committed to GitHub.

## 3. Verify domains and canonical routing

- [ ] Recheck `greenlist.online` against Vercel's required DNS records.
- [ ] Confirm `thegreenlist.online` is the canonical production domain.
- [ ] Define consistent redirects for alternate domains and `www` variants.
- [ ] Test apex, `www`, HTTPS, authentication callbacks, and deep links.
- [ ] Verify both domains resolve to the same current production deployment.
- [ ] Remove obsolete Blacklist domains or project associations if any remain.

## 4. Complete Supabase security configuration

- [ ] Enable leaked-password protection.
- [ ] Run Supabase security and performance advisors.
- [ ] Review every exposed table's RLS policies by operation and role.
- [ ] Verify owner predicates for user-scoped SELECT, INSERT, UPDATE, and DELETE operations.
- [ ] Ensure UPDATE policies include both `USING` and `WITH CHECK`.
- [ ] Confirm privileged functions are not executable by `PUBLIC`, `anon`, or ordinary authenticated users unless explicitly required.
- [ ] Prefer `SECURITY INVOKER` for exposed functions.
- [ ] Keep platform ownership and authorization data outside user-editable metadata.
- [ ] Confirm role-change audit records cannot be altered by ordinary users.
- [ ] Confirm master/platform-owner protections cannot be bypassed by administrators, moderators, application routes, or AI tools.
- [ ] Review private Storage bucket policies independently from database-table policies.

## 5. Add deployment health verification

- [ ] Verify Supabase authentication and session refresh.
- [ ] Verify database connectivity.
- [ ] Verify private Storage upload and authorized download.
- [ ] Verify signed-out dashboard redirects.
- [ ] Verify signed-in dashboard persistence.
- [ ] Verify admin and platform-owner authorization.
- [ ] Verify report and evidence creation.
- [ ] Run the health suite against the production domain after deployment.

# Priority 2 — Correct routes and upload workflows

## 6. Create a complete route inventory

Audit every link in:

- [ ] Desktop header
- [ ] Mobile navigation
- [ ] Homepage feature cards
- [ ] Dashboard action cards
- [ ] Footer
- [ ] Green List Town districts
- [ ] Legal pages
- [ ] Empty states
- [ ] Calls to action
- [ ] Authentication screens
- [ ] Admin and moderation surfaces

For each link, record:

| Field | Required value |
|---|---|
| Source | Page/component containing the link |
| Label | Visible action text |
| Destination | Canonical route |
| Authentication | Public or signed-in |
| Roles | Authorized account types |
| Expected result | Page, form, redirect, or denial |
| Status | Working, broken, missing, or placeholder |

## 7. Standardize submission destinations

| User intent | Canonical destination |
|---|---|
| Create a transparency report | `/report` |
| Manage submitted evidence | `/evidence` |
| Upload evidence | `/evidence/upload` |
| Submit education material | Dedicated education submission screen |
| Submit news | Dedicated news submission screen |
| Upload business verification documents | Business verification/document screen |
| Create forum or thread | Authorized forum/thread creation screen |

- [ ] Remove empty links and `href="#"` actions.
- [ ] Ensure landing pages provide an obvious route to the corresponding creation/upload screen.
- [ ] Do not expose upload buttons to roles that cannot complete the action.
- [ ] Display a clear explanation when an action requires approval or a different account role.

## 8. Fix authentication return behavior

- [ ] Save the intended destination when a signed-out user selects a protected action.
- [ ] Redirect the user to sign-in.
- [ ] Return the user to the original upload or creation screen after successful authentication.
- [ ] Prevent sign-in/upload redirect loops.
- [ ] Prevent signed-in users from being sent back to sign-in unnecessarily.
- [ ] Show a clear access-denied state for authenticated but unauthorized roles.
- [ ] Reject unsafe external redirect destinations.

## 9. Verify every upload end to end

Each supported upload must:

- [ ] Open the correct form.
- [ ] Enforce authentication.
- [ ] Enforce role permissions.
- [ ] Validate file type and size.
- [ ] Sanitize filenames and generate safe object paths.
- [ ] Upload into private Supabase Storage.
- [ ] Create the corresponding database record.
- [ ] Associate the object and record with the authenticated user.
- [ ] Display confirmation and review status.
- [ ] Allow the submitter to view authorized metadata.
- [ ] Allow only authorized reviewers to access the file.
- [ ] Prevent unrelated users from reading the object or record.
- [ ] Log review and status changes.
- [ ] Define safe replacement and deletion behavior.
- [ ] Avoid exposing secret or service-role credentials to the browser.

## 10. Verify role-specific dashboards

### USER

- [ ] Create and track reports.
- [ ] Manage evidence.
- [ ] Participate in forums.
- [ ] View saved content and profile settings.

### BUSINESS and approved organization roles

- [ ] Manage the business profile.
- [ ] Submit verification documents.
- [ ] Respond to reports through approved workflows.
- [ ] Manage properly scoped staff access.

### MODERATOR

- [ ] View only assigned or permitted review queues.
- [ ] Apply only approved moderation actions.
- [ ] Never grant roles, delete accounts, or override platform ownership.

### ADMIN

- [ ] Review reports, evidence, businesses, and content.
- [ ] View permitted audit information.
- [ ] Manage platform operations without superseding the platform owner.

### PLATFORM OWNER

- [ ] Access protected governance and role-management controls.
- [ ] Remain immune to demotion or removal by ordinary application flows, admins, moderators, or AI.
- [ ] Require explicit, audited human action for sensitive changes.

# Priority 3 — Placeholder and content completion

## 11. Audit unfinished content

Search for and resolve:

- [ ] Placeholder text
- [ ] Dummy cards
- [ ] Lorem ipsum
- [ ] `TODO` and `FIXME` markers
- [ ] Empty links
- [ ] `href="#"`
- [ ] Incomplete forms
- [ ] Unlabeled “coming soon” panels
- [ ] Missing legal or compliance copy
- [ ] Blacklist-era terminology or destinations

Every unfinished element must become one of:

1. Complete production content.
2. A functional empty state.
3. A clearly labeled unavailable feature.
4. A valid action or submission route.

## 12. Complete high-priority content

- [ ] DMCA policy
- [ ] FTC and sponsorship disclosures
- [ ] Terms of use
- [ ] Privacy policy
- [ ] General disclaimer
- [ ] Community rules
- [ ] Evidence and reporting instructions
- [ ] Business verification explanation
- [ ] Dashboard empty states
- [ ] Forum, news, and education submission guidance
- [ ] Clear notice that The Green List is not a dispensary, seller, ordering service, delivery coordinator, or cannabis marketplace
- [ ] Clear prohibition against attempting cannabis sales or distribution through the platform

# Recommended execution order

1. Align GitHub Actions and Vercel deployment responsibility.
2. Audit environment variables and production configuration.
3. Enable remaining Supabase security protections and verify RLS policies.
4. Repair and verify domain configuration.
5. Create the full route/action inventory.
6. Repair upload and post-authentication return flows.
7. Test USER, BUSINESS, MODERATOR, ADMIN, and PLATFORM OWNER accounts.
8. Complete legal, instructional, empty-state, and placeholder content.
9. Run end-to-end production verification.
10. Merge only after the acceptance criteria are documented and passing.

# Definition of done

This roadmap is complete when:

- GitHub, Vercel, and Supabase operate as a traceable, single delivery chain.
- The production deployment always maps to the intended `main` commit.
- Auth uses Supabase only.
- Sensitive keys never reach the client or repository.
- All user-facing links resolve to valid, appropriate destinations.
- Every upload action reaches a usable upload form or an explicit permission explanation.
- Private evidence remains private and accessible only to its submitter and authorized reviewers.
- Dashboard actions match the user's verified role.
- No administrator, moderator, application route, or AI can supersede the platform owner.
- No cannabis commerce or marketplace behavior exists.
- Legal, compliance, instructional, and empty-state content is complete.
- Production health checks pass after deployment.
