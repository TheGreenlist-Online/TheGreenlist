"""Compare read-only catalog fingerprints. Output check labels only, never SQL/data."""
import json
from pathlib import Path
import sys

EXPECTED = Path(__file__).resolve().parents[1] / 'supabase/bootstrap/staging/catalog-fingerprint.json'

def compare(expected, actual):
    checks = []
    for key in sorted(set(expected) | set(actual)):
        checks.append({'check': key, 'status': 'PASS' if key in expected and key in actual and expected[key] == actual[key] else 'FAIL'})
    if not expected:
        checks.append({'check': 'nonempty expected catalog', 'status': 'FAIL'})
    return checks

def main():
    try:
        expected = json.loads(EXPECTED.read_text())
        actual = json.loads(Path(sys.argv[1]).read_text())
        if not isinstance(expected, dict) or not isinstance(actual, dict):
            raise ValueError('object required')
        checks = compare(expected, actual)
    except (OSError, ValueError, IndexError, TypeError):
        checks = [{'check': 'valid catalog fingerprint input', 'status': 'FAIL'}]
    passed = all(c['status'] == 'PASS' for c in checks)
    print(json.dumps({'scope': 'captured application catalog only; not hosted service acceptance',
                      'status': 'PASS_CATALOG' if passed else 'FAIL_CATALOG', 'checks': checks}, indent=2))
    return 0 if passed else 1

if __name__ == '__main__':
    sys.exit(main())
