"""Prepare the reviewed-delta candidate for closed staging; never connect or apply.

The original snapshot and hosted acceptance gate remain unchanged. This package
is a candidate for review, not evidence that hosted Auth/Storage/recovery passed.
No credentials, CI login, default ACL changes, or historical replay are included.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / 'supabase/bootstrap/staging'
COMPLETION = ROOT / 'supabase/bootstrap/staging-completion'
TARGET = 'otmaxtjstvbfckpgbwdi'
SOURCES = {
    '00-platform-contract.sql': '439273b461c28949ac3ac73607876ce2d0cec92a7b870ab37922f7a06201fffc',
    '20-functions.sql': '63913638b52e80026cce6988ab99da86cc51415f9811a3eab9563430da1d4c11',
    '30-post-data.sql': '1c328adb2b3638e203da53177caefc61ad98a8e2b9131423986b0ddc77a96347',
    '40-triggers.sql': '4d2b38894fa4135bb6ca94ad19a0681a9c7bfe453fa8c446c53f3cc0bbe8b430',
    '50-policies-grants.sql': '68d3be5fc17218808d48b5a392ba6c8434359aa9be79731c7cc336b0994810eb',
    '70-reference-config.sql': 'b0e410305c06408139e328c38799adfb1d1c95389ce2063c999f70cab651c523',
    '80-comments.sql': '55ea86e74ff92182af5a400a7be0c8880b02dd57f4dedfdf6356f986b930515f',
    'catalog-fingerprint.sql': 'aba15155a93064c1a5e44f23b2074b91ae6fb9cd8611442dfc378c2f8807b6bb',
}


def build(target):
    if target != TARGET:
        raise ValueError('Only the isolated staging target is supported')
    source = {}
    for name, expected in SOURCES.items():
        data = (BUNDLE / name).read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError('Unreviewed source change: ' + name)
        source[name] = data.decode()
    query = source['catalog-fingerprint.sql'].split('set local search_path=public,extensions;\n', 1)[1].rsplit('rollback;', 1)[0].strip().removesuffix(';')
    closed = json.loads((ROOT / 'supabase/bootstrap/closed-staging/applied-fingerprint.json').read_text())
    # Default ACLs are platform-owned and intentionally NOT restored or changed.
    # Their before/after equality is asserted independently within this statement.
    expected = json.dumps(closed, separators=(',', ':'))
    fingerprint_guard = "do $fingerprint$ declare actual jsonb; begin\n" + query + " into actual;\n"
    fingerprint_guard += "if (actual-'13') is distinct from ('" + expected + "'::jsonb-'13') then raise exception 'Expected exact closed staging foundation'; end if; end $fingerprint$;"
    view = 'create view "public"."user_roles" with (security_invoker=true) as '
    bucket = 'insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values '
    public_schema = 'alter schema "public" owner to "pg_database_owner";'
    if source['30-post-data.sql'].count(view) != 1 or source['70-reference-config.sql'].count(bucket) != 4 or source['50-policies-grants.sql'].count(public_schema) != 1:
        raise ValueError('Reviewed phase boundary changed')
    view_sql = view + source['30-post-data.sql'].split(view, 1)[1]
    bucket_sql = bucket + source['70-reference-config.sql'].split(bucket, 1)[1]
    body = '\n'.join([
        '-- STAGING COMPLETION CANDIDATE; target ' + TARGET,
        (COMPLETION / '00-closed-precondition.sql').read_text(),
        source['00-platform-contract.sql'],
        fingerprint_guard,
        source['20-functions.sql'],
        view_sql,
        source['40-triggers.sql'],
        # Public namespace state was already verified by the closed fingerprint.
        # Preserve it exactly rather than needlessly reordering its ACL array.
        source['50-policies-grants.sql'].split(public_schema, 1)[0],
        bucket_sql,
        source['80-comments.sql'],
        (COMPLETION / '90-authority-hardening.sql').read_text(),
        (COMPLETION / '99-verify-completion.sql').read_text(),
    ])
    if '$completion_payload$' in body:
        raise ValueError('Unexpected SQL delimiter')
    return 'do $completion$ begin execute $completion_payload$\n' + body + '\n$completion_payload$; end $completion$;\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    sql = build(args.target)
    args.output.write_text(sql)
    print(json.dumps({'status': 'PREPARED_COMPLETION_CANDIDATE', 'target': TARGET,
                      'sha256': hashlib.sha256(sql.encode()).hexdigest(),
                      'bytes': len(sql.encode()), 'hosted_acceptance': 'NOT_RUN'}))


if __name__ == '__main__':
    main()
