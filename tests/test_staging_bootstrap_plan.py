import copy
import importlib.util
import tempfile
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('bootstrap', Path(__file__).resolve().parents[1] / 'scripts/check-staging-bootstrap.py')
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)


class BootstrapPlanTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        bundle = self.root / 'supabase/bootstrap/staging'
        bundle.mkdir(parents=True)
        migrations = self.root / 'supabase/migrations'
        migrations.mkdir()
        m = migrations / '20260912213426_test.sql'
        m.write_text('-- synthetic migration\n')
        artifacts = []
        for category in ('application_schema', 'auth_storage_customizations', 'reference_configuration', 'extensions_roles'):
            f = bundle / (category + '.sql')
            f.write_text('-- synthetic SQL; validator test only\n')
            artifacts.append({'category': category, 'path': str(f.relative_to(self.root)), 'sha256': bootstrap.digest(f), 'review_reference': 'synthetic review'})
        self.plan = {'format_version': 1, 'status': 'reviewed', 'source_ref': bootstrap.SOURCE, 'target_ref': bootstrap.STAGING,
                     'repository_sha': 'a' * 40, 'snapshot_utc': '2026-11-02T00:00:00Z', 'review_reference': 'synthetic review',
                     'organization_drift_resolution': 'synthetic comparison', 'disposable_restore_evidence': 'synthetic evidence',
                     'artifacts': artifacts, 'migrations': [{'path': str(m.relative_to(self.root)), 'sha256': bootstrap.digest(m),
                     'decision': 'included_in_snapshot', 'evidence': 'synthetic function/ACL/policy comparison'}]}

    def test_complete_plan_validates_only_provenance(self):
        self.assertEqual(bootstrap.validate(self.root, self.plan), [])

    def test_local_preparation_does_not_approve_hosted_restore(self):
        self.plan['status'] = 'prepared_local'
        for key, name in (('catalog_query', 'catalog.sql'), ('catalog_expected', 'catalog.json')):
            p = self.root / 'supabase/bootstrap/staging' / name
            p.write_text('{}' if name.endswith('.json') else '-- synthetic query')
            self.plan[key] = {'path':str(p.relative_to(self.root)), 'sha256':bootstrap.digest(p)}
        self.assertEqual(bootstrap.validate(self.root, self.plan, local_only=True), [])
        self.assertTrue(bootstrap.validate(self.root, self.plan))
        self.plan['catalog_expected']['sha256'] = '0' * 64
        self.assertTrue(bootstrap.validate(self.root, self.plan, local_only=True))

    def test_rejects_unreviewed_or_wrong_target(self):
        for key, value in (('status', 'pending_review'), ('target_ref', bootstrap.SOURCE), ('snapshot_utc', None), ('organization_drift_resolution', None), ('disposable_restore_evidence', None)):
            plan = copy.deepcopy(self.plan)
            plan[key] = value
            self.assertTrue(bootstrap.validate(self.root, plan), key)

    def test_rejects_missing_duplicate_and_new_migrations(self):
        for entries in ([], self.plan['migrations'] * 2):
            plan = copy.deepcopy(self.plan)
            plan['migrations'] = entries
            self.assertTrue(bootstrap.validate(self.root, plan))
        (self.root / 'supabase/migrations/20260912213610_new.sql').write_text('-- new\n')
        self.assertTrue(bootstrap.validate(self.root, self.plan))

    def test_rejects_changed_sql(self):
        for section in ('artifacts', 'migrations'):
            plan = copy.deepcopy(self.plan)
            plan[section][0]['sha256'] = '0' * 64
            self.assertTrue(bootstrap.validate(self.root, plan))

    def test_rejects_artifact_escape_and_symlink(self):
        outside = self.root / 'outside.sql'
        outside.write_text('-- synthetic\n')
        for name in ('outside.sql', 'supabase/bootstrap/staging/escape.sql'):
            if 'escape' in name:
                (self.root / name).symlink_to(outside)
            plan = copy.deepcopy(self.plan)
            plan['artifacts'][0]['path'] = name
            plan['artifacts'][0]['sha256'] = bootstrap.digest(outside)
            self.assertTrue(bootstrap.validate(self.root, plan))

    def test_rejects_unresolved_decision_and_missing_comparison(self):
        for key, value in (('decision', 'skip'), ('evidence', None)):
            plan = copy.deepcopy(self.plan)
            plan['migrations'][0][key] = value
            self.assertTrue(bootstrap.validate(self.root, plan))
