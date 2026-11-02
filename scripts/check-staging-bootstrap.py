"""Validate a reviewed schema-only bootstrap plan. Never connects to a database.

This validates provenance and ordering, not SQL safety or semantic parity. SQL and
acceptance evidence still require human review; this is deliberately not a SQL executor.
"""
import hashlib
import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PLAN = Path('supabase/bootstrap/staging/plan.json')
STAGING = 'otmaxtjstvbfckpgbwdi'
SOURCE = 'idtnlninotxwqpznbwur'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(root, plan, local_only=False):
    failures = []
    def require(condition, message):
        if not condition:
            failures.append(message)
    require(plan.get('format_version') == 1, 'Unsupported plan format')
    require(plan.get('target_ref') == STAGING, 'Target must be isolated staging')
    require(plan.get('source_ref') == SOURCE, 'Unexpected source snapshot project')
    require(plan.get('status') in (('prepared_local', 'reviewed') if local_only else ('reviewed',)),
            'Hosted review is pending' if not local_only else 'Local preparation is incomplete')
    require(bool(re.fullmatch(r'[0-9a-f]{40}', plan.get('repository_sha', ''))), 'Missing pinned repository SHA')
    require(bool(plan.get('snapshot_utc')), 'Missing source snapshot timestamp')
    require(bool(plan.get('review_reference')), 'Missing review reference')
    require(bool(plan.get('organization_drift_resolution')), 'PR #29 definition drift is unresolved')
    artifacts = plan.get('artifacts', [])
    categories = {'application_schema', 'auth_storage_customizations', 'reference_configuration', 'extensions_roles'}
    require({a.get('category') for a in artifacts} == categories, 'Missing bootstrap artifact categories')
    seen = set()
    for artifact in artifacts:
        name = artifact.get('path', '')
        path = (root / name).resolve()
        allowed = (root / 'supabase/bootstrap/staging').resolve()
        require(name not in seen, 'Duplicate artifact path')
        seen.add(name)
        if not path.is_relative_to(allowed) or path.suffix != '.sql' or not path.is_file():
            failures.append('Missing or unsafe SQL artifact path')
            continue
        require(artifact.get('sha256') == digest(path), 'Bootstrap artifact checksum mismatch')
        require(bool(artifact.get('review_reference')), 'Artifact requires SQL and privacy review')
    for key in ('catalog_query', 'catalog_expected'):
        if local_only or key in plan:
            entry = plan.get(key, {})
            path = (root / entry.get('path', '')).resolve()
            allowed = (root / 'supabase/bootstrap/staging').resolve()
            if not path.is_relative_to(allowed) or not path.is_file() or path.suffix not in ('.sql', '.json'):
                failures.append('Missing or unsafe catalog fingerprint artifact')
            else:
                require(entry.get('sha256') == digest(path), 'Catalog fingerprint checksum mismatch')
    actual = sorted((root / 'supabase/migrations').glob('*.sql'))
    entries = plan.get('migrations', [])
    require([e.get('path') for e in entries] == [str(p.relative_to(root)) for p in actual], 'Migration inventory must cover every file exactly once in filename order')
    # Coverage is a per-file semantic decision, never inferred from a timestamp.
    for entry in entries:
        name = entry.get('path', '')
        path = root / name
        if name not in [str(p.relative_to(root)) for p in actual]:
            continue
        require(entry.get('sha256') == digest(path), 'Migration checksum mismatch')
        require(entry.get('decision') in ('included_in_snapshot', 'apply_after_snapshot'), 'Unresolved migration decision: ' + path.name)
        require(bool(entry.get('evidence')), 'Missing definition comparison: ' + path.name)
    require(bool(plan.get('disposable_restore_evidence')), 'Disposable Supabase restore has not passed')
    return failures


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--local', action='store_true', help='Validate preparation only; never grants hosted approval')
    args = parser.parse_args()
    try:
        plan = json.loads((ROOT / PLAN).read_text())
        failures = validate(ROOT, plan, local_only=args.local)
    except (OSError, ValueError, KeyError, TypeError):
        failures = ['Missing or malformed bootstrap plan']
    report = {'status': 'BLOCKED_BOOTSTRAP' if failures else ('PASS_LOCAL_PREPARATION' if args.local else 'PASS_PLAN_REVIEW'),
              'failures': failures, 'target_ref': STAGING,
              'scope': 'provenance and ordering only; no database acceptance assertion'}
    print(json.dumps(report, indent=2))
    return int(bool(failures))


if __name__ == '__main__':
    sys.exit(main())
