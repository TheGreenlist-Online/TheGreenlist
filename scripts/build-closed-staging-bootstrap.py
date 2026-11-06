"""Build a closed, schema-only staging foundation. Never connects to a database.

This is NOT the full captured baseline or a way to pass its hosted release gate.
Only tables, enums, constraints, indexes and non-sensitive reference rows are
included. No application routines, views, triggers, policies or bucket changes.
Apply the entire output in ONE transaction to the verified isolated staging
project. All newly inherited API grants are revoked before commit.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / 'supabase/bootstrap/staging'
TARGET = 'otmaxtjstvbfckpgbwdi'
SOURCES = {
    '00-platform-contract.sql': '439273b461c28949ac3ac73607876ce2d0cec92a7b870ab37922f7a06201fffc',
    '10-structure.sql': 'e0c9bb1100cc922a00121671a709ec2294f3a2f71ef4f55e6f49982b0bfb0e01',
    '30-post-data.sql': '1c328adb2b3638e203da53177caefc61ad98a8e2b9131423986b0ddc77a96347',
    '70-reference-config.sql': 'b0e410305c06408139e328c38799adfb1d1c95389ce2063c999f70cab651c523',
}


def build(target, bundle=BUNDLE):
    if target != TARGET:
        raise ValueError('Only the isolated staging target is supported')
    source = {}
    for name, expected in SOURCES.items():
        data = (bundle / name).read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError('Unreviewed source change: ' + name)
        source[name] = data.decode()
    # Exact reviewed boundaries, not general SQL filtering. Fail if they drift.
    view = 'create view "public"."user_roles" with (security_invoker=true) as '
    buckets = "insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values "
    if source['30-post-data.sql'].count(view) != 1 or source['70-reference-config.sql'].count(buckets) != 4:
        raise ValueError('Reviewed phase boundary changed')
    constraints = source['30-post-data.sql'].split(view)[0]
    reference = source['70-reference-config.sql'].split(buckets)[0]
    body = '\n'.join([
        '-- CLOSED STAGING FOUNDATION, not application activation. Target: ' + TARGET,
        '-- Run atomically through the staging project migration API. Do not use on production.',
        (ROOT / 'supabase/bootstrap/closed-staging/preflight.sql').read_text(),
        source['00-platform-contract.sql'],
        source['10-structure.sql'],
        constraints,
        (ROOT / 'supabase/bootstrap/closed-staging/lockdown.sql').read_text(),
        reference,
        (ROOT / 'supabase/bootstrap/closed-staging/verify.sql').read_text(),
    ])
    # One server statement is atomic even if the caller uses autocommit. Do not
    # rely on a client sending multiple statements under one transaction.
    if '$closed_payload$' in body:
        raise ValueError('Unexpected SQL delimiter in reviewed input')
    return 'do $closed$ begin execute $closed_payload$\n' + body + '\n$closed_payload$; end $closed$;\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    sql = build(args.target)
    args.output.write_text(sql)
    print(json.dumps({'status': 'PREPARED_CLOSED_FOUNDATION', 'target': TARGET,
                      'sha256': hashlib.sha256(sql.encode()).hexdigest(),
                      'bytes': len(sql.encode()), 'application_ready': False}))


if __name__ == '__main__':
    main()
