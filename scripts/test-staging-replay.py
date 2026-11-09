"""Destructive tests restricted to an explicitly selected disposable LOCAL database.

No database URL accepted. Hosted URLs, libpq routing overrides and remote Docker
contexts are never consumed. This is not a staging restore tool.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / 'supabase/bootstrap/staging'
spec = importlib.util.spec_from_file_location('fingerprint', ROOT / 'scripts/check-catalog-fingerprint.py')
fingerprint = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fingerprint)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument('--local-service', action='store_true')
    target.add_argument('--container')
    args = parser.parse_args()
    # Pass only what local psql needs. In particular no PGHOSTADDR/PGSERVICE/PGOPTIONS.
    env = {'PATH': os.environ.get('PATH', '/usr/bin:/bin'), 'PGCONNECT_TIMEOUT': '5'}
    if args.container:
        if not re.fullmatch(r'greenlist-baseline-test-[a-z0-9-]+', args.container):
            parser.error('Only a labelled disposable local container is supported')
        docker_env = {k:v for k,v in os.environ.items() if k not in ('DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH')}
        docker = ['docker', '--host=unix:///var/run/docker.sock']
        inspected = json.loads(subprocess.check_output(docker+['inspect',args.container], env=docker_env))
        if inspected[0]['HostConfig']['NetworkMode'] != 'none' or inspected[0]['Config']['Labels'].get('com.greenlist.disposable') != 'true':
            parser.error('Container must be labelled disposable with network=none')
        command = docker+['exec','-i',args.container,'psql','-U','postgres','-d','migration_scratch']
        env = docker_env
    else:
        env['PGPASSWORD'] = 'disposable_only'  # fixed throwaway CI service value, never a supplied secret
        command = ['psql','--host=127.0.0.1','--port=5432','--username=postgres','--dbname=migration_scratch']
    command += ['-X','-q','-A','-t','-v','ON_ERROR_STOP=1']
    def sql(code, expected_error=None):
        result = subprocess.run(command,input=code,text=True,capture_output=True,env=env,timeout=90)
        if expected_error:
            if result.returncode == 0 or expected_error not in result.stderr:
                raise RuntimeError('Expected failure control did not fail as specified')
            return ''
        if result.returncode:
            # Avoid printing SQL bodies/parameters or connection diagnostics into CI artifacts.
            raise RuntimeError('Local SQL failed; statement batch aborted (no SQL or connection values logged)')
        return result.stdout.strip()
    expected = json.loads((BUNDLE/'catalog-fingerprint.json').read_text())
    definition = (BUNDLE/'catalog-fingerprint.sql').read_text()
    select = definition.split('begin read only;',1)[1].rsplit('rollback;',1)[0]
    phases = sorted(BUNDLE.glob('[0-9][0-9]-*.sql'))
    restore = '\n'.join(p.read_text() for p in phases)
    checks=[]
    def passed(label):
        checks.append({'check':label,'status':'PASS'})
        print('PASS '+label,flush=True)
    try:
        sql("""do $$ begin
          if current_database()<>'migration_scratch' or current_setting('server_version_num')::int not between 170000 and 179999
             or exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth','storage') and c.relkind in ('r','p'))
          then raise exception 'Expected empty disposable PostgreSQL 17 database'; end if;
        end $$;""")
        passed('empty disposable PostgreSQL 17 guard')
        first=sorted((ROOT/'supabase/migrations').glob('*.sql'))[0].read_text()
        sql('begin;\n'+first+'\ncommit;',expected_error='business_documents')
        passed('incremental-only negative control')
        sql((ROOT/'supabase/tests/bootstrap-platform-fixture.sql').read_text())
        sql('begin; drop function storage.foldername(text);\n'+restore+'\ncommit;',expected_error='Missing managed Auth/Storage')
        passed('missing prerequisite negative control')
        sql('begin;\n'+restore+'\nrollback;')
        if sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','v');") != '0':
            raise RuntimeError('Restore rollback left application objects')
        passed('whole-restore rollback')
        sql('begin;\n'+restore+'\ncommit;')
        actual=json.loads(sql(definition))
        if any(c['status']!='PASS' for c in fingerprint.compare(expected,actual)):
            raise RuntimeError('Restored catalog differs from captured application fingerprint')
        passed('complete application catalog parity')
        for label,mutation in [
            ('missing table','drop table public.drafts cascade;'),
            ('missing Auth hook','drop trigger on_auth_user_created_create_profile on auth.users;'),
            ('RLS disabled','alter table public.profiles disable row level security;'),
            ('grant widened','grant truncate on public.profiles to anon;'),
            ('default ACL widened','alter default privileges for role postgres in schema public grant truncate on tables to authenticated;'),
            ('bucket exposed',"update storage.buckets set public=true where id='coa-sources';"),
            ('permission expanded',"insert into role_permissions values('MODERATOR','platform.admin');"),
        ]:
            changed=json.loads(sql('begin;'+mutation+select+'rollback;'))
            if not any(c['status']=='FAIL' for c in fingerprint.compare(expected,changed)):
                raise RuntimeError('Drift control was accepted: '+label)
            passed('negative control: '+label)
        sql('begin;\n'+restore+'\ncommit;',expected_error='empty application schema')
        if json.loads(sql(definition)) != actual:
            raise RuntimeError('Replay rejection or fault rollback changed catalog')
        passed('replay rejected without catalog change')
    except (RuntimeError,ValueError,subprocess.SubprocessError) as exc:
        print(json.dumps({'status':'FAIL_LOCAL_REPLAY','error':str(exc),'checks':checks}))
        return 1
    print(json.dumps({'status':'PASS_LOCAL_REPLAY','scope':'disposable PostgreSQL SQL only; hosted acceptance NOT RUN','checks':checks}))
    return 0

if __name__ == '__main__':
    sys.exit(main())
