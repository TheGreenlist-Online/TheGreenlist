-- Recovered source snapshot; local review/testing only. No user records.
set local search_path=public,extensions;
set local check_function_bodies=false;
do $$ begin
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','S'))
   or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private'))
   or exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname in ('public','private') and t.typtype in ('e','d','c')) then
   raise exception 'Restore requires an empty application schema';
 end if;
 if to_regclass('auth.users') is null or to_regclass('storage.objects') is null or to_regclass('storage.buckets') is null then
   raise exception 'Managed Auth/Storage prerequisites missing';
 end if;
end $$;
create schema if not exists private;
alter schema private owner to postgres;
create type "public"."app_role" as enum ('USER','BUSINESS','CULTIVATOR','DISTRIBUTOR','MODERATOR','ADMIN');
alter type "public"."app_role" owner to "postgres";
create type "public"."profile_visibility" as enum ('PUBLIC','PRIVATE','BUSINESS_VISIBLE','ADMIN_ONLY','ANONYMOUS_REPORTING');
alter type "public"."profile_visibility" owner to "postgres";
create type "public"."report_status" as enum ('SUBMITTED','UNDER_REVIEW','NEEDS_MORE_INFO','RESOLVED','REJECTED','ARCHIVED');
alter type "public"."report_status" owner to "postgres";
create table "private"."client_write_buckets" (
  "user_id" uuid not null,
  "action" text not null,
  "window_start" timestamp with time zone not null,
  "used" integer not null
);
alter table "private"."client_write_buckets" owner to "postgres";
create table "private"."forum_review_context" (
  "transaction_id" bigint not null,
  "actor_id" uuid not null,
  "target_table" text not null,
  "target_id" uuid not null
);
alter table "private"."forum_review_context" owner to "postgres";
create table "public"."ai_audit_logs" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid,
  "feature" text not null,
  "model" text not null,
  "request_id" uuid not null,
  "input_classification" text not null,
  "records_accessed" jsonb default '[]'::jsonb not null,
  "tool_names" text[] default ARRAY[]::text[] not null,
  "output_classification" text not null,
  "human_review_required" boolean default false not null,
  "latency_ms" integer default 0 not null,
  "token_usage" jsonb,
  "estimated_cost_usd" numeric(12,6),
  "status" text not null,
  "error_code" text,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."ai_audit_logs" owner to "postgres";
create table "public"."audit_logs" (
  "id" uuid default gen_random_uuid() not null,
  "actor_id" uuid,
  "action" text not null,
  "entity_type" text,
  "entity_id" uuid,
  "metadata" jsonb,
  "ip_hash" text,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."audit_logs" owner to "postgres";
create table "public"."automation_jobs" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "status" text not null,
  "items_processed" integer default 0 not null,
  "message" text,
  "started_at" timestamp with time zone default now() not null,
  "finished_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."automation_jobs" owner to "postgres";
create table "public"."business_documents" (
  "id" uuid default gen_random_uuid() not null,
  "business_id" uuid not null,
  "title" text not null,
  "doc_type" text default 'other'::text not null,
  "file_url" text not null,
  "status" text default 'pending_review'::text not null,
  "uploaded_by" uuid,
  "review_note" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."business_documents" owner to "postgres";
create table "public"."business_profiles" (
  "id" uuid default gen_random_uuid() not null,
  "owner_id" uuid default auth.uid(),
  "name" text not null,
  "slug" text not null,
  "business_type" text not null,
  "description" text,
  "website_url" text,
  "external_affiliate_url" text,
  "state" text,
  "city" text,
  "verification_status" text default 'unverified'::text not null,
  "sponsorship_status" text default 'none'::text not null,
  "transparency_score" numeric default 0 not null,
  "trust_rating" numeric default 0 not null,
  "is_claimed" boolean default false not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "search_vector" tsvector generated always as (((setweight(to_tsvector('english'::regconfig, COALESCE(name, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, ((((COALESCE(business_type, ''::text) || ' '::text) || COALESCE(city, ''::text)) || ' '::text) || COALESCE(state, ''::text))), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(description, ''::text)), 'C'::"char"))) stored
);
alter table "public"."business_profiles" owner to "postgres";
create table "public"."coa_reports" (
  "id" uuid not null,
  "owner_id" uuid not null,
  "product_name_reported" text,
  "batch_identifier_reported" text,
  "storage_bucket" text default 'coa-sources'::text not null,
  "storage_path" text not null,
  "source_sha256" text not null,
  "file_size" integer not null,
  "intake_status" text default 'upload_pending'::text not null,
  "extraction_status" text default 'not_started'::text not null,
  "human_review_status" text default 'not_reviewed'::text not null,
  "authenticity_status" text default 'unverified'::text not null,
  "publication_status" text default 'private'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "received_at" timestamp with time zone
);
alter table "public"."coa_reports" owner to "postgres";
create table "public"."drafts" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "form_type" text not null,
  "payload" jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."drafts" owner to "postgres";
create table "public"."education_attachments" (
  "id" uuid default gen_random_uuid() not null,
  "resource_id" uuid not null,
  "uploader_id" uuid not null,
  "storage_bucket" text default 'education-materials'::text not null,
  "storage_path" text not null,
  "file_name" text not null,
  "file_type" text not null,
  "file_size" integer not null,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."education_attachments" owner to "postgres";
create table "public"."education_resources" (
  "id" uuid default gen_random_uuid() not null,
  "submitter_id" uuid not null,
  "category" text not null,
  "title" text not null,
  "summary" text not null,
  "content" text not null,
  "source_urls" text[] default '{}'::text[] not null,
  "status" text default 'PENDING_REVIEW'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "search_vector" tsvector generated always as (((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, ((COALESCE(summary, ''::text) || ' '::text) || COALESCE(category, ''::text))), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(content, ''::text)), 'C'::"char"))) stored
);
alter table "public"."education_resources" owner to "postgres";
create table "public"."evidence_files" (
  "id" uuid default gen_random_uuid() not null,
  "owner_id" uuid,
  "report_id" uuid,
  "thread_id" uuid,
  "post_id" uuid,
  "storage_bucket" text not null,
  "storage_path" text not null,
  "file_name" text,
  "file_type" text,
  "file_size" integer,
  "metadata_stripped" boolean default false not null,
  "visibility" text default 'private'::text not null,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."evidence_files" owner to "postgres";
create table "public"."forum_posts" (
  "id" uuid default gen_random_uuid() not null,
  "thread_id" uuid not null,
  "author_id" uuid,
  "parent_post_id" uuid,
  "body" text not null,
  "status" text default 'published'::text not null,
  "is_anonymous" boolean default false not null,
  "risk_level" text default 'low'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."forum_posts" owner to "postgres";
create table "public"."forum_threads" (
  "id" uuid default gen_random_uuid() not null,
  "forum_id" uuid not null,
  "author_id" uuid,
  "title" text not null,
  "slug" text,
  "body" text,
  "status" text default 'published'::text not null,
  "visibility" text default 'public'::text not null,
  "is_anonymous" boolean default false not null,
  "is_pinned" boolean default false not null,
  "is_locked" boolean default false not null,
  "risk_level" text default 'low'::text not null,
  "ai_summary" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "search_vector" tsvector generated always as (((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(body, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(ai_summary, ''::text)), 'C'::"char"))) stored
);
alter table "public"."forum_threads" owner to "postgres";
create table "public"."forums" (
  "id" uuid default gen_random_uuid() not null,
  "slug" text not null,
  "name" text not null,
  "description" text,
  "category" text,
  "accent_color" text,
  "is_active" boolean default true not null,
  "is_sensitive" boolean default false not null,
  "requires_auth" boolean default false not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."forums" owner to "postgres";
create table "public"."moderation_batches" (
  "id" uuid default gen_random_uuid() not null,
  "queue_item_batch_status" text default 'open'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."moderation_batches" owner to "postgres";
create table "public"."moderation_queue" (
  "id" uuid default gen_random_uuid() not null,
  "content_type" text not null,
  "content_id" uuid not null,
  "reported_by" uuid,
  "reason" text,
  "risk_level" text default 'medium'::text not null,
  "status" text default 'open'::text not null,
  "assigned_to" uuid,
  "ai_notes" text,
  "admin_notes" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."moderation_queue" owner to "postgres";
create table "public"."moderation_queue_items" (
  "id" uuid default gen_random_uuid() not null,
  "report_id" uuid not null,
  "content_type" text not null,
  "content_id" uuid not null,
  "reported_by" uuid,
  "reason" text,
  "risk_level" text default 'medium'::text not null,
  "queue_status" text default 'queued'::text not null,
  "assigned_to" uuid,
  "ai_notes" text,
  "admin_notes" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "batch_id" uuid
);
alter table "public"."moderation_queue_items" owner to "postgres";
create table "public"."nda_signatures" (
  "id" uuid default gen_random_uuid() not null,
  "moderator_user_id" uuid not null,
  "report_id" uuid,
  "queue_item_id" uuid,
  "batch_id" uuid,
  "scope" text not null,
  "status" text default 'signed'::text not null,
  "signed_at" timestamp with time zone default now() not null,
  "document_version" text default 'v1'::text not null
);
alter table "public"."nda_signatures" owner to "postgres";
create table "public"."news" (
  "id" uuid default gen_random_uuid() not null,
  "title" text not null,
  "summary" text,
  "content" text,
  "source_name" text,
  "source_url" text,
  "category" text,
  "tags" text[] default '{}'::text[],
  "published_at" timestamp with time zone default now() not null,
  "created_at" timestamp with time zone default now() not null,
  "search_vector" tsvector generated always as (((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(summary, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, ((((COALESCE(content, ''::text) || ' '::text) || COALESCE(source_name, ''::text)) || ' '::text) || COALESCE(category, ''::text))), 'C'::"char"))) stored
);
alter table "public"."news" owner to "postgres";
create table "public"."notifications" (
  "id" uuid default gen_random_uuid() not null,
  "profile_id" uuid not null,
  "type" text not null,
  "title" text not null,
  "body" text,
  "link_url" text,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."notifications" owner to "postgres";
create table "public"."organization_memberships" (
  "id" uuid default gen_random_uuid() not null,
  "organization_id" uuid not null,
  "user_id" uuid not null,
  "role" text not null,
  "status" text default 'active'::text not null,
  "invited_by" uuid,
  "invited_at" timestamp with time zone,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."organization_memberships" owner to "postgres";
create table "public"."organization_verification_requests" (
  "id" uuid default gen_random_uuid() not null,
  "organization_id" uuid not null,
  "submitted_by" uuid not null,
  "status" text default 'submitted'::text not null,
  "legal_name" text not null,
  "registration_authority" text,
  "registration_reference" text,
  "review_note" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."organization_verification_requests" owner to "postgres";
create table "public"."profiles" (
  "id" uuid not null,
  "username" text not null,
  "display_name" text,
  "bio" text,
  "avatar_url" text,
  "role" app_role default 'USER'::app_role not null,
  "verification_status" text default 'unverified'::text not null,
  "trust_score" numeric default 0 not null,
  "transparency_score" numeric default 0 not null,
  "is_anonymous_allowed" boolean default true not null,
  "is_public" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "account_status" text default 'active'::text not null,
  "status_reason" text,
  "status_until" timestamp with time zone,
  "last_moderated_at" timestamp with time zone
);
alter table "public"."profiles" owner to "postgres";
create table "public"."reports" (
  "id" uuid default gen_random_uuid() not null,
  "reporter_id" uuid,
  "business_id" uuid,
  "forum_thread_id" uuid,
  "report_type" text not null,
  "title" text not null,
  "description" text not null,
  "location_state" text,
  "location_city" text,
  "is_anonymous" boolean default false not null,
  "status" text default 'submitted'::text not null,
  "verification_status" text default 'unverified'::text not null,
  "risk_level" text default 'medium'::text not null,
  "confidence_score" numeric default 0 not null,
  "public_summary" text,
  "admin_notes" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "business_name_reported" text
);
alter table "public"."reports" owner to "postgres";
create table "public"."role_catalog" (
  "role" app_role not null,
  "category" text not null,
  "label" text not null,
  "description" text not null,
  "sort_order" integer not null
);
alter table "public"."role_catalog" owner to "postgres";
create table "public"."role_permissions" (
  "role" app_role not null,
  "permission" text not null,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."role_permissions" owner to "postgres";
create table "public"."support_tickets" (
  "id" uuid default gen_random_uuid() not null,
  "profile_id" uuid,
  "email" text,
  "ticket_type" text not null,
  "subject" text not null,
  "message" text not null,
  "status" text default 'open'::text not null,
  "priority" text default 'normal'::text not null,
  "assigned_to" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."support_tickets" owner to "postgres";
create table "public"."user_moderation_actions" (
  "id" uuid default gen_random_uuid() not null,
  "target_user_id" uuid not null,
  "actor_id" uuid not null,
  "action" text not null,
  "reason" text,
  "notes" text,
  "previous_status" text,
  "new_status" text,
  "duration_until" timestamp with time zone,
  "reversed_at" timestamp with time zone,
  "reversed_by" uuid,
  "created_at" timestamp with time zone default now() not null
);
alter table "public"."user_moderation_actions" owner to "postgres";
create table "public"."verified_facts" (
  "id" uuid default gen_random_uuid() not null,
  "subject_user_id" uuid,
  "subject_business_id" uuid,
  "fact_text" text not null,
  "category" text default 'general'::text not null,
  "source_url" text,
  "verified_by" uuid,
  "verified_at" timestamp with time zone default now() not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "public"."verified_facts" owner to "postgres";
