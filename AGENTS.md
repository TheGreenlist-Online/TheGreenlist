# AGENTS.md

## Purpose
This file defines the architecture, security, development, and compliance standards for THEBLACKLIST.ONLINE. It is intended for maintainers, contributors, reviewers, and autonomous agents working in this repository.

## Architecture Standards
- Use a modern, scalable, modular architecture.
- Keep frontend and backend concerns separated: `src/app` for UI routes, `src/api`/`src/routes` for server APIs, `src/lib` for shared utilities.
- Prefer composition over duplication: reusable components, hooks, and API helpers.
- Design for a civic-tech transparency platform, not commerce: support news, reporting, forums, directories, moderation, and analytics.
- Data models must enforce explicit legal compliance and avoid any direct cannabis commerce or payments flow.
- Build for observability and auditability: logging, audit trails, moderation events, and analytics should be traceable.

## Naming Conventions
- Use `kebab-case` for file and folder names in React/Next apps.
- Use `PascalCase` for React components and layout files.
- Use `camelCase` for variables, function names, hooks, and object keys.
- Use `SCREAMING_SNAKE_CASE` for environment variables and feature flags.
- Prefix API route handlers with explicit domain concepts, e.g. `forum`, `reports`, `businesses`, `ads`, `admin`, `news`, `moderation`.
- Use descriptive names for Prisma models and Prisma fields; prefer `ReportStatus`, `TransparencyScore`, `WhistleblowerReport`, `BusinessProfile`, `NewsArticle`, `AdCampaign`, `AuditLog`.

## Security Rules
- Enforce server-side authorization and role checks for all protected APIs.
- Never trust client-side validation for security-critical logic.
- Use parameterized queries through Prisma and avoid raw SQL unless absolutely necessary.
- Use secure headers and CSRF protections for forms and state-changing API calls.
- Rate-limit public and authenticated endpoints to prevent abuse.
- Scrub PII and metadata from anonymous reports and uploads.
- Encrypt sensitive evidence payloads and follow secure storage practices.
- Log moderation decisions, content flags, and administrative actions for auditability.

## Moderation Philosophy
- Prioritize safety, transparency, and due process.
- Empower moderators with clear workflows and documentation.
- Treat user reports and whistleblower submissions as sensitive data.
- Use AI as an assistant, not a final decision-maker: all enforcement decisions require human review when risk is high.
- Build queues for `Pending`, `Under Review`, `Verified`, `Unverified`, `Escalated`, and `Resolved` states.
- Support appeals, audit trails, and documented review rationale.
- Avoid over-policing honest public discussion while preventing harassment, hate, doxxing, and defamatory content.

## Legal Compliance Boundaries
- The platform must not implement or imply direct cannabis sales, payments, shipping, or product checkout.
- Do not store inventory, arrange transactions, schedule deliveries, or coordinate peer-to-peer commerce.
- Do not build features that facilitate illegal interstate commerce.
- Do not allow marketplace listings or product listings that resemble storefront commerce.
- Support business profiles as transparency and trust assets only, with no shopping/cart behavior.
- Separate editorial content and sponsored/affiliate placements clearly.
- Ensure disclaimers and policies are visible across reporting, advertising, and review workflows.

## Folder Structure Conventions
- `src/app/` — Next.js routes, page components, layouts, and route-level metadata.
- `src/hooks/` — reusable React hooks and stateful data utilities.
- `src/utils/` — utility functions, validators, formatters, and helpers.
- `src/components/` — shared UI components and design system pieces.
- `src/lib/` — shared libraries, API clients, Prisma helpers, and business logic.
- `src/types/` — custom TypeScript types, enums, and domain models.
- `src/admin/` — admin dashboard, moderation tools, and legal review interfaces.
- `src/features/` — domain-specific feature modules such as forum, reports, news, business directory, ads.
- `public/` — static assets, icons, images, sitemap, robots.
- `prisma/` — schema and migrations.
- `docker/` — Docker files, compose configs, deployment helpers.
- `scripts/` — automation scripts for ingestion, maintenance, and CI utilities.

## TypeScript Standards
- Prefer strong typing everywhere; avoid `any` unless there is a clear, documented exception.
- Use discriminated unions for state and status models, e.g. `ReportStatus`, `AdStatus`.
- Define domain-safe enums in `src/types/` and re-use them across server and client boundaries.
- Avoid type widening in component props: declare explicit prop interfaces/types.
- Use `readonly` for immutable data shapes and `as const` for fixed value arrays.
- Keep strict null checks enabled; avoid optional chaining where it hides required data errors during review.
- Use `zod` or similar schema validation for incoming API payloads and persisted content.

## UI Consistency Rules
- Follow a dark investigative newsroom aesthetic with black glassmorphism, neon green accents, and premium modern UI.
- Make interfaces mobile-first and responsive by default.
- Use consistent spacing, typography scales, and color contrast across all pages.
- Keep navigation clear: homepage, forum, reports, news, directory, admin, legal, and policy pages.
- Build UI components for recurring patterns: cards, tables, buttons, badges, tabs, alerts, modals.
- Label sponsored content clearly with strong visual indicators.
- Use design tokens or shared style utilities rather than repeated CSS values.

## Accessibility Standards
- Ensure all interactive controls have accessible labels and keyboard focus states.
- Use semantic HTML elements for headings, lists, tables, forms, and navigation.
- Ensure color contrast meets WCAG AA standards for text and UI controls.
- Provide alt text for images and attachments where applicable.
- Implement accessible form validation and error messages.
- Support screen readers in dialogs, alerts, and status updates.
- Avoid content that triggers motion sickness or inaccessible animation patterns.

## AI Moderation Policies
- Use AI for toxicity detection, spam filtering, harassment detection, legal-risk flagging, and duplicate content detection.
- Treat AI results as signals, not final decisions. Human moderators must review high-risk or ambiguous cases.
- Log AI moderation decisions and confidence scores for transparency.
- Use AI summarization for news, reports, and moderation notes with explicit citations where available.
- Build an “explainability” layer so reviewers can understand why AI flagged content.
- Do not use AI to automatically ban users without human review of the evidence.

## Deployment Workflow
- Use Docker for local development and production parity.
- Support Vercel deployment for frontend and API routes.
- Use GitHub Actions for CI/CD, linting, tests, and deployment checks.
- Include environment variable templates and secure secrets management.
- Automate RSS ingestion, AI summarization jobs, and analytics pipelines with scheduled tasks or cron workflows.
- Keep production deployment artifacts lean, with only required runtime dependencies.

## Git Conventions
- Follow feature-branch development and open branches for significant work.
- Keep commits focused and atomic when possible.
- Rebase or squash merge to keep history readable.
- Use branch names that describe the work cleanly: `feature/forum-scaffold`, `fix/admin-access-control`, `docs/legal-pages`.
- Avoid committing secrets, API keys, or locally generated environment values.

## Commit Message Standards
- Use a structured prefix: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `ci:`.
- Keep subject lines under 72 characters.
- Use imperative mood, e.g. `feat: add anonymous report submission flow`.
- Include a short body if additional context is needed.
- Reference issues, tickets, or relevant documentation when applicable.

## Testing Requirements
- Add unit tests for utility functions, business logic, and API handlers.
- Add integration tests for core workflows such as auth, forum actions, report submission, and admin moderation.
- Validate Prisma schemas with migration tests or schema checks.
- Use type-safe testing utilities and avoid brittle UI snapshots.
- Include tests for security rules, access control, and content moderation workflows.

## Affiliate Compliance Rules
- Track affiliate links and sponsored content separately from editorial or transparency content.
- Display clear FTC disclosures on all sponsored posts, banners, and affiliate-enabled placements.
- Avoid deceptive or hidden advertising practices.
- Do not promote or imply illegal claims, unverified medical claims, or direct cannabis sales.
- Require admin approval and label any paid sponsorship prominently.

## FTC Disclosure Rules
- All sponsored articles, business promotions, and affiliate links must display an explicit disclosure.
- Use plain language such as: “Sponsored content”, “Paid partnership”, “Affiliate link”, or “This article contains affiliate links.”
- Keep disclosures visible near the content, not buried in footers or small print.
- Do not make medical, health, or efficacy claims without clearly cited sources and legal review.

## Anti-Defamation Safeguards
- Treat allegations as unverified until the platform has reviewed them through editorial and legal workflows.
- Label report and post statuses clearly: `Pending Review`, `Unverified`, `Verified`, `Resolved`.
- Provide clear disclaimers on user-generated allegations and avoid publishing defamatory language as fact.
- Support moderation review, evidence evaluation, and legal escalation for high-risk claims.
- Implement a robust takedown and correction process for false or harmful statements.

## Maintenance Notes
- Keep this document aligned with the repository architecture and top-level README.
- Update `AGENTS.md` when new platform domains, legal rules, or major workflow patterns are added.
- Use this file as a single source of guidance for autonomous agents and human maintainers alike.
