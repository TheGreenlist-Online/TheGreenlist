# Read-only audit: Supabase project "Blacklist" (`hdqxilnjhcqalrgaykst`)

Date: 2026-10-03. Method: catalog queries only (`pg_class`, `pg_proc`,
`pg_trigger`, `pg_indexes`, `information_schema`, row counts). **Nothing was
created, altered, dropped, or inserted in this project**, in this session or
in the earlier part of today's work. Everything below is observation.

---

## 1. Bottom line

- The project named **Blacklist** contains a complete **Green List records
  ingestion schema** (nine objects) whose own table comment reads
  "Approved official source/feed configurations used by **The Greenlist**
  ingestion pipeline." It does not contain any Green List application tables
  (`profiles`, `forum_threads`, `reports`, …).
- Every table has **0 rows**. There are 0 auth users, 0 storage buckets,
  0 edge functions, 0 recorded migrations. The schema was applied directly
  (SQL editor or equivalent), not through the migration history.
- The live site **thegreenlist.online** talks to a different Supabase project:
  **`idtnlninotxwqpznbwur`** (visible in the public client bundle). That is
  the project the connector should point to, and the one the free-tier
  entitlement migration must target.
- The Blacklist GitHub repo (`That1andOnly/Blacklist`) contains only a
  README; none of this schema is tracked in source control anywhere. The
  port below (§5) puts it under the Green List repo's migration workflow.

## 2. How it got there (best reconstruction)

| When (UTC) | What |
| --- | --- |
| 2026-09-14 02:34 | A session produced a copy-paste "Supabase SQL Editor" prompt for the Green List public-records ingestion pipeline (source feeds → immutable raw versions → normalized records → detections → human-reviewed editorial drafts → audit log). |
| 2026-09-14 08:55 | Supabase project `hdqxilnjhcqalrgaykst` ("Blacklist", us-west-2) created. |
| 2026-09-14 09:12 → 09-15 02:20 | Default branch record created/updated; the ingestion schema appears to have been applied during this window. |
| 2026-09-14 12:09 | In that same session, Supabase was still "Not connected to me yet," so the agent could not have applied it through the connector at that point. |

Most likely the SQL from the prompt was run in the SQL editor of the
Blacklist project rather than the Green List project. No transcript shows
an agent applying DDL to `hdqxilnjhcqalrgaykst`.

## 3. Inventory (what exists, verbatim)

### Enums
| Name | Values |
| --- | --- |
| `record_status` | new, changed, reviewed, ignored, published, error |
| `review_status` | pending, approved, rejected, needs_verification |

### Tables (all `public`, RLS enabled, **0 policies**, 0 rows)

| Table | Purpose (from table comment) | Notable constraints |
| --- | --- | --- |
| `source_feeds` | Approved official source/feed configurations | `slug` unique; `source_type` ∈ api/rss/csv/json/html/pdf; `poll_interval_minutes ≥ 15` |
| `source_records` | Immutable raw evidence versions | FK → `source_feeds` cascade; partial unique `(feed_id, external_id) where is_current`; `raw_hash`, `content_hash` |
| `normalized_records` | Searchable cross-source records, 1:1 with a source version | `source_record_id` unique FK cascade; GIN on `to_tsvector(title‖body_text)`; GIN on `topics`; `status_lifecycle record_status` |
| `watch_rules` | Editorial relevance rules | `priority` 1–100 |
| `detections` | Why a record entered review | FK → `normalized_records` cascade, → `watch_rules` set null; unique `(normalized_record_id, coalesce(watch_rule_id, zero-uuid), change_type)`; `change_type` ∈ created/updated/attachment_added/status_changed/manual |
| `editorial_drafts` | AI-assisted drafts requiring human review | `detection_id` unique FK cascade; `review_status review_status default 'pending'`; `claims`, `source_citations` jsonb |
| `ingestion_runs` | Per-run operational log | FK → `source_feeds` set null; `status` ∈ running/success/partial/failed |
| `audit_log` | Append-oriented audit trail | `actor_type` ∈ system/editor/workflow |

### View
| Name | Definition |
| --- | --- |
| `published_records` | `normalized_records ⋈ detections ⋈ editorial_drafts where review_status = 'approved'`, exposing only non-sensitive editorial columns. Plain view (not `security_invoker`); **no grants** to `anon`/`authenticated`. |

### Functions
| Name | Kind |
| --- | --- |
| `set_updated_at()` | `BEFORE UPDATE` helper, `search_path = public` |
| `retire_previous_source_record_version()` | `BEFORE INSERT` on `source_records`: flips prior `is_current` rows to false |
| `rls_auto_enable()` | Event trigger function (`ddl_command_end`): auto-enables RLS on new `public` tables. **Supabase-managed**, not from the prompt. |

### Triggers
`source_feeds/normalized_records/watch_rules/editorial_drafts _set_updated_at`,
`source_records_retire_previous_version`. The `protect_*`, `update_objects_updated_at`,
`enforce_bucket_name_length_trigger`, `tr_check_filters` triggers are Supabase
platform triggers on `storage`/`realtime`, not part of this schema.

### Grants (as found)
`anon`, `authenticated`, and `service_role` hold **ALL** privileges
(INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) on all eight
tables. RLS with zero policies means `anon`/`authenticated` are effectively
denied at the row level, but the table-level grants are far wider than the
Green List repo's lock-down migration allows. The port corrects this.

## 4. What this means for today's work

- The spec, commercial map, and draft free-tier migration I produced earlier
  are **unaffected**: they were written against the Green List repo's
  migrations, not against this database. The only thing that referenced
  Blacklist was a "known gaps" note in the spec, now corrected to name
  `idtnlninotxwqpznbwur` as the target.
- Nothing needs to be removed from Blacklist for the Green List to proceed.
  Leave it as is, per your instruction.

## 5. Port to the Green List repo

`supabase/migrations/20261003190000_records_ingestion_pipeline.sql`
recreates the ingestion schema under the Green List conventions:

- Identical tables, enums, indexes, constraints, triggers, and view
  semantics, all `if not exists` / `create or replace` so it is safe on a
  project that has none of it.
- Functions use `set search_path = ''` (repo convention) instead of `public`.
- Grants follow the lock-down migration: `anon`/`authenticated` lose
  TRUNCATE/TRIGGER/REFERENCES; reviewer read policies via `is_reviewer()`;
  writes remain service-role-only (the ingestion route uses the admin
  client).
- `published_records` becomes the one public read surface: `select` granted
  to `anon` and `authenticated`, approved rows only, no raw payloads.
- Supabase-managed objects (`rls_auto_enable`, storage/realtime triggers)
  are **not** copied; the target project already has its own.

Apply it to a **branch of `idtnlninotxwqpznbwur`** once the connector is
switched, alongside the free-tier entitlement migration.
