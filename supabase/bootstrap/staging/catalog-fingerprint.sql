-- Read-only fingerprints only; never returns definitions, records or credentials.
begin read only;
set local search_path=public,extensions;
select jsonb_build_object(
'02', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select * from (select nspname, pg_get_userbyid(nspowner) as owner, nspacl
from pg_namespace where nspname in ('public','private','auth','storage') order by nspname) q where nspname in ('public','private')) r) rows),
'03', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select n.nspname, c.relname, c.relkind, pg_get_userbyid(c.relowner) as owner,
 c.relrowsecurity,c.relforcerowsecurity,c.relacl,c.reloptions,c.relpersistence,
 c.relispartition,pg_get_expr(c.relpartbound,c.oid) as partition_bound,
 case when c.relkind='p' then pg_get_partkeydef(c.oid) end as partition_key,
 case when c.relkind in ('v','m') then pg_get_viewdef(c.oid,true) end as view_definition
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private') order by 1,2) r) rows),
'04', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select n.nspname,c.relname,a.attnum,a.attname,format_type(a.atttypid,a.atttypmod) as type,
 a.attnotnull,a.attidentity,a.attgenerated,a.attacl,a.attstorage,
 co.collname,cn.nspname as collation_schema,pg_get_expr(d.adbin,d.adrelid) as default_expression
from pg_attribute a join pg_class c on c.oid=a.attrelid
join pg_namespace n on n.oid=c.relnamespace
left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
left join pg_collation co on co.oid=a.attcollation
left join pg_namespace cn on cn.oid=co.collnamespace
where n.nspname in ('public','private') and a.attnum>0 and not a.attisdropped
order by n.nspname,c.relname,a.attnum) r) rows),
'05', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select n.nspname,t.typname,t.typtype,pg_get_userbyid(t.typowner) as owner,t.typacl,
 t.typnotnull,t.typdefault,format_type(t.typbasetype,t.typtypmod) as base_type,
 e.enumlabel,e.enumsortorder
from pg_type t join pg_namespace n on n.oid=t.typnamespace
left join pg_enum e on e.enumtypid=t.oid
where n.nspname in ('public','private') order by 1,2,e.enumsortorder) r) rows),
'06', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select n.nspname,c.conname,c.conrelid::regclass::text as relation,
 c.contypid::regtype::text as domain,c.convalidated,pg_get_constraintdef(c.oid,true) as definition
from pg_constraint c join pg_namespace n on n.oid=c.connamespace
where n.nspname in ('public','private') order by 1,3,2) r) rows),
'07', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select n.nspname,c.relname,pg_get_indexdef(i.indexrelid) as definition,
 i.indisvalid,i.indisready,i.indisreplident,i.indisclustered
from pg_index i join pg_class c on c.oid=i.indrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private') order by 1,2,3) r) rows),
'08', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select n.nspname,c.relname,format_type(s.seqtypid,null) as type,
 s.seqstart,s.seqincrement,s.seqmax,s.seqmin,s.seqcache,s.seqcycle
from pg_sequence s join pg_class c on c.oid=s.seqrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private') order by 1,2) r) rows),
'09', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as identity_arguments,
 p.prokind,pg_get_userbyid(p.proowner) as owner,p.proacl,p.prosecdef,p.proconfig,
 pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.prokind in ('f','p','w') order by 1,2,3) r) rows),
'10', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select * from (select n.nspname,c.relname,t.tgname,t.tgenabled,
 fn.nspname as function_schema,p.proname,pg_get_triggerdef(t.oid,true) as definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
join pg_proc p on p.oid=t.tgfoid join pg_namespace fn on fn.oid=p.pronamespace
where not t.tgisinternal and n.nspname in ('public','private','auth','storage')
order by 1,2,3) q where nspname in ('public','private') or function_schema in ('public','private')) r) rows),
'11', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','private','auth','storage') order by 1,2,3) r) rows),
'13', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select * from (select pg_get_userbyid(d.defaclrole) as owner,n.nspname,d.defaclobjtype,d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace order by 1,2,3) q where nspname in ('public','private')) r) rows),
'16', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select pg_describe_object(d.classid,d.objid,d.objsubid) as object,
 pg_describe_object(d.refclassid,d.refobjid,d.refobjsubid) as dependency,d.deptype
from pg_depend d
where (d.classid='pg_class'::regclass and d.objid in
 (select c.oid from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private')))
or (d.classid='pg_proc'::regclass and d.objid in
 (select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')))
or (d.classid='pg_type'::regclass and d.objid in
 (select t.oid from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname in ('public','private')))
order by 1,2,3) r) rows),
'role-reference', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select role::text,category,label,description,sort_order from public.role_catalog order by role::text) r) rows),
'permission-reference', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select role::text,permission from public.role_permissions order by role::text,permission) r) rows),
'bucket-reference', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select id,name,public,file_size_limit,allowed_mime_types from storage.buckets where id in ('evidence','business-documents','education-materials','coa-sources') order by id) r) rows),
'comments', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select i.type,i.schema,i.identity,d.description from pg_description d cross join lateral pg_identify_object(d.classoid,d.objoid,d.objsubid) i where i.schema in ('public','private') order by i.type,i.identity) r) rows),
'application-event-trigger', (select jsonb_build_object('count',count(*),'md5',md5(coalesce(jsonb_agg(value order by value::text collate "C"),'[]'::jsonb)::text)) from (select to_jsonb(r) as value from (select evtname as name,evtevent as event,pg_get_userbyid(evtowner) as owner,evtenabled as enabled,evttags as tags,evtfoid::regprocedure::text as function from pg_event_trigger where evtname='ensure_rls') r) rows)
);
rollback;
