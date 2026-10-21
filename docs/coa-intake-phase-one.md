# Private COA intake: phase one

Implements the first slice of [the merged COA specification](coa-intake-specification.md) from PR #45. This is working submission code behind a disabled server flag, not a claim that intake is live.

## Flow and boundaries

Homepage → `/coa` explanation → `/coa/submit` → sign-in with return URL → `POST /api/coa` → private receipt at `/coa/submissions/[id]` → owner-only download at `/api/coa/[id]/source`.

The homepage shows the submission action only when `COA_INTAKE_ENABLED=true`. Otherwise it links to an explanation that explicitly says submissions are not open. Availability pages render dynamically so the runtime gate and link agree. The upload API and source download independently enforce that gate.

One original PDF up to 3 MiB is accepted. The full multipart body is streamed with a 3 MiB + 64 KiB bound before parsing; the deployment ingress must also impose body and timeout limits. Both declared MIME and PDF header/end-marker are checked. This is an envelope check, **not** a full PDF parser, malware scan, or authenticity assessment. No rendering, embedded-link retrieval, decompression, text extraction, OCR, or provider processing occurs. PDFs are retained unchanged, including possible embedded metadata/personal information. Original filenames are not stored or used as object paths.

Server-validated Supabase authentication (excluding anonymous accounts) and same-origin requests are required. A privileged server client writes the object only after reserving a row. Its service key is never sent to the browser. Database users have owner-only SELECT and no mutations. All client Storage access to `coa-sources` is denied by restrictive policies, even if another permissive policy is broad. The bucket is private with MIME/size limits. Source download first checks ownership and submitted status with the session client, then fetches using the privileged client, verifies SHA-256, and returns a forced attachment with private/no-store, sandbox, and nosniff headers. No signed or public URLs are issued.

The original file has a generated owner/submission path and is never upserted. A client-generated UUID is an idempotency reference, not evidence of authorization. Replaying a completed submission for the same owner, fingerprint and descriptions returns the existing receipt. A changed or incomplete submission returns a conflict, without confirming another account's document. Fingerprints are not globally deduplicated or publicly searchable.

## Minimal model and reuse decision

`coa_reports` holds one submission and its original source metadata: submitter, optional raw product and batch/package descriptions, bucket/path, SHA-256, byte count, receipt timestamp and independent statuses. Identifiers remain text; unknown descriptions remain null. It does not create a misconduct report, business, product, canonical batch, analytical result or verified laboratory claim.

For this single-document phase, source identity is embedded in the submission row. A separate `coa_documents` bridge, additional labels/business sources, product/batch matching and measurements belong to subsequent migrations. They must preserve this original source rather than copying uploaded bytes. No extracted or transcribed values are created here. The two supplied product-page examples inform the “View COA” instructions only; they are not imported as authenticated laboratory data.

Existing Supabase session/admin clients, page shell, shared controls, notices, tokens and sign-in return behavior are reused. Existing report-bound evidence Storage and `evidence_files` permissions are **not** reused: that would widen access and entangle a neutral submission with a report. No existing evidence/business upload policy is modified.

The only receipt transitions are `upload_pending` → `submitted` or `upload_failed`. Submitted source identity and receipts cannot be edited. Extraction is fixed at `not_started`, human review at `not_reviewed`, authenticity at `unverified`, publication at `private`. A future independently reviewed migration is required to introduce review or publication transitions. No ordinary reviewer/administrator gains access merely from a profile label; staff review tooling is deferred. Operational service access remains privileged.

## Failure handling and limits

A database advisory lock serializes each owner's reservation count. Five attempts in a rolling 24 hours and 50 total reservations are allowed, including failed/interrupted attempts. These conservative initial limits bound document storage, not all traffic; deployment-level request/rate limits remain necessary. No billing or paid AI work occurs.

Storage failures trigger best-effort object cleanup and a conditional failure transition. A receipt is only marked submitted after Storage reports upload success. A lost receipt-update response does not delete the original: its completion may already have committed. Only pending rows may be marked failed, so a committed receipt is not downgraded. The UI asks users to check their submissions after ambiguous errors. A pending/failed reservation cannot be downloaded through the site and must be retried with a new reference. A browser reload or changed file starts a new reference.

If cleanup/finalization is interrupted, operations must inspect old pending/failed rows and the corresponding exact private paths. Do not bulk-delete objects based only on prefix or age; verify that no submitted receipt references them. This PR adds no automatic retention/deletion job. Correction/removal requests go through support. Account removal requires coordinated source cleanup; the owner foreign key intentionally prevents silently orphaning an original. The existing account export workflow is not extended in this slice; operational access/removal handling must include COA records before broader rollout.

## Validation performed

- `npm test`: route tests execute the actual compiled route handlers with mocked Supabase transports; PDF/body limits, origin/auth checks, consent, field spoofing, receipt transitions, retries, quota denial, download scoping and byte identity.
- The database test applies the actual migration in an isolated PGlite PostgreSQL engine with minimal auth/Storage schemas. It exercises anonymous, owner, non-owner/claimed reviewer and anonymous-sign-in users; direct inserts/updates/deletes, forged review/publication, restrictive Storage policies in the presence of permissive policies, private bucket protection, immutable receipts and quotas.
- Production HTTP smoke: homepage explanation and closed-intake notice render; disabled POST returns 503; `/coa/submit` emits the Next.js streaming redirect to `/coa` and renders no upload form.
- Browser rendering/visual mobile checks could not run: the browser executable was absent and the browser download failed. These remain staging requirements.
- TypeScript, targeted ESLint and production build. No real credentials, production queries/writes, uploaded user PDF, extraction provider, or production deployment are needed.

The isolated fixture does not reproduce the existing production schema or the Supabase Storage HTTP service. It is not proof of production-policy parity or a live end-to-end upload.

## Required before enabling

Keep `COA_INTAKE_ENABLED=false` until the following pass in an isolated Supabase staging project with the current main migrations and production-equivalent Auth/Storage settings:

1. Review and apply the new migration in staging only. Inspect effective table grants, RLS, bucket privacy, Storage policies and security advisors. Confirm no public view/RPC exposes COA rows or source paths.
2. Using two real staging accounts and anonymous requests, submit a real original PDF, obtain its receipt, download it, and compare bytes/SHA-256. Confirm another user/claimed reviewer cannot read its receipt or original. Confirm direct table writes and Storage upload/list/get/update/delete/sign requests fail, including a request to make the bucket public.
3. Exercise exact-origin checks on the preview hostname and custom hostname; missing/foreign origins, expired sessions, missing service key/schema, malformed/oversized/chunked requests, duplicate clicks, lost responses and forced Storage failures must fail without a false receipt.
4. Run parallel reservations to confirm the rolling/lifetime quota, and check orphan cleanup/recovery. Establish operational access/removal/retention responsibilities and ingress request limits.
5. Verify keyboard navigation, error focus, live status, authentication return, and no horizontal scrolling at narrow mobile widths. Verify private routes are not indexed/cached. Then explicitly enable the server flag in the intended validated environment.

Extraction automation requires its own format fixtures (including scans), provenance schema, page/decompression bounds, privacy authorization and cost/retry controls. Human review, authenticity decisions and public projection require their own authorization, audit/correction and privacy checks. Production migration/deployment is a separate operation and is not performed by this PR.
