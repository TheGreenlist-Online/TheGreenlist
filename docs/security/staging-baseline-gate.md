# Staging baseline gate
This workflow is intentionally fail-closed. It **does not** restore a schema, run migrations, alter production, or activate COA intake.

- R1 verifies repository migration file structure and connects only to the explicitly approved staging host.
- An empty public schema fails R1.
- A public table lacking RLS fails R3.
- Other gates (R2/R4-R8, semantic schema parity, Auth/Storage policies, JWT API tests, recovery) are **not implemented** and therefore cannot be claimed as passed.
- Until those gates are implemented and the schema-only baseline is restored, the workflow ends in BLOCKED.

Configure GitHub Actions secret `STAGING_DATABASE_URL` with a **dedicated least-privileged read-only staging connection** to `db.otmaxtjstvbfckpgbwdi.supabase.co`. Do not use a production URL, service-role key, or application runtime secret. Prefer a database user with only the catalog visibility needed by these queries. Secret contents are never printed.

This gate runs on PRs targeting main and manual dispatch. It should not be made a required status check until the team agrees on the intentional initial failure and completion plan. Production promotion is a separate approval process.
