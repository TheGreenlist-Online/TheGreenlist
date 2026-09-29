# Role-based access control

The Green List uses compact RBAC for broad platform capabilities and row-level
security for ownership and record-specific decisions. The canonical application
mapping lives in `src/lib/roles.ts`; guards must use it instead of comparing
role strings directly.

| Role | Granted capabilities |
| --- | --- |
| `USER` | Standard authenticated features |
| `BUSINESS` | Manage an associated business profile |
| `DISTRIBUTOR` | Manage an associated business profile |
| `CULTIVATOR` | Manage an associated business profile |
| `MODERATOR` | Review and moderate content |
| `ADMIN` | Moderate content, manage forums and businesses, use admin tools |

`platform_owner` is a protected claim in Supabase `app_metadata`, not another
assignable role. It supersedes the permission map, while database triggers
prevent other accounts and service-role clients from assigning roles or
demoting the owner. `roles:manage` is intentionally granted only by the owner
override and is not included in `ADMIN`.

Authorization rules:

- Never read authority from `user_metadata` or client input.
- Use RBAC to decide whether a principal may attempt an action.
- Use RLS to decide which rows that principal may read or change.
- Require a human owner action for role assignment; AI may recommend but never
  execute role or profile lifecycle changes.
- Keep service-role credentials out of browsers, AI routes, and n8n workflows.
- Require MFA/AAL2 before implementing any role-management endpoint.

## Dashboard-only launch controls

These Supabase Auth settings are not migrations and must be verified in the
project dashboard before launch:

- Leaked-password protection enabled
- Email confirmation enabled and anonymous sign-in disabled
- TOTP MFA enabled; AAL2 required by any future privileged mutation
- CAPTCHA configured for signup, sign-in, and password recovery
- Production Site URL and exact redirect allowlist configured
- Custom SMTP and security-notification templates configured
- Session and rate-limit values reviewed

Do not mark an item complete without checking the live dashboard or the Auth
security advisor.
