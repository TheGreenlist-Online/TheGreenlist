"""Exercise the workflow's exact URL guard using synthetic credentials only."""
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import textwrap
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/staging-baseline-gate.yml"
SCRIPT = ROOT / "scripts/staging-url-guard.py"
SPEC = importlib.util.spec_from_file_location("staging_url_guard", SCRIPT)
guard = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = guard
SPEC.loader.exec_module(guard)
HOST = "db.otmaxtjstvbfckpgbwdi.supabase.co"
BASE = f"postgresql://readonly:synthetic@{HOST}:5432/postgres"
# RFC 2606 invalid-domain fixtures, never real provider endpoints.
POOLER = guard.SessionPooler("session-pooler.example.invalid", "staging_validator")
POOL_BASE = ("postgresql://staging_validator.otmaxtjstvbfckpgbwdi:synthetic@"
             "session-pooler.example.invalid:5432/postgres")


class StagingUrlGuardTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = WORKFLOW.read_text()

    def cli(self, url, extra_env=None):
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            env={**os.environ, "STAGING_DATABASE_URL": url, **(extra_env or {})},
            capture_output=True, text=True,
        )
        for private_part in ("synthetic", "staging_validator", HOST, POOLER.hostname):
            self.assertNotIn(private_part, result.stdout + result.stderr)
        return result

    def test_approved_direct_urls(self):
        for url in (BASE, BASE + "?sslmode=require", BASE + "?sslmode=verify-full",
                    BASE.replace("postgresql:", "postgres:"),
                    BASE.replace(":5432", ""), BASE.replace("synthetic", "p%40ss%3Aword")):
            with self.subTest(url=url):
                self.assertTrue(guard.approved_url(url))
                self.assertEqual(self.cli(url).returncode, 0)

    def test_routing_and_tls_overrides_rejected_for_both_routes(self):
        for base in (BASE, POOL_BASE):
            for query in ("hostaddr=203.0.113.1", "host=elsewhere.example",
                          "%68ostaddr=203.0.113.1", "service=production",
                          "servicefile=/tmp/service", "options=-csearch_path=public",
                          "sslmode=disable", "sslmode=prefer", "sslmode=require&hostaddr=203.0.113.1",
                          "sslmode=require&sslmode=require", "sslmode=require&unknown=value",
                          "%73slmode=require", "sslmode=%72equire", "sslmode=require&",
                          "hostaddr=", "hostaddr", "dbname=host%3Devil"):
                with self.subTest(base=base, query=query):
                    self.assertFalse(guard.approved_url(base + "?" + query, session_pooler=POOLER))

    def test_malformed_and_wrong_targets(self):
        for url in ("", BASE.replace(HOST, "db.idtnlninotxwqpznbwur.supabase.co"),
                    BASE.replace(HOST, HOST + ".evil.example"),
                    BASE.replace(HOST, HOST.upper()), BASE.replace(HOST, HOST + "."),
                    BASE.replace("postgresql:", "https:"), BASE.replace("postgresql:", "POSTGRESQL:"),
                    BASE + "#fragment", BASE + "#", BASE.replace(":5432", ":6543"),
                    BASE.replace(":5432", ":invalid"), BASE.replace(":5432", ":05432"),
                    BASE.replace("/postgres", "/other"), BASE.replace("/postgres", "/host%3Devil"),
                    BASE.replace("readonly", "user%40other"), BASE.replace("synthetic", "%ZZ"),
                    BASE.replace("synthetic", "x%00y"), BASE.replace("synthetic", "x%0ay"),
                    BASE.replace("synthetic", "x%7fy"), BASE.replace("synthetic", "x@y"),
                    BASE.replace("synthetic", "x\\y"), BASE.replace("synthetic", ""),
                    BASE + "\n", "\t" + BASE, BASE.replace(HOST, HOST + ",elsewhere.example"),
                    BASE.replace("readonly:synthetic@", "")):
            with self.subTest(url=url):
                self.assertFalse(guard.approved_url(url, session_pooler=POOLER))
                self.assertNotEqual(self.cli(url).returncode, 0)

    def test_session_pooler_is_disabled_in_actual_entrypoint(self):
        self.assertIsNone(guard.APPROVED_SESSION_POOLER)
        self.assertFalse(guard.approved_url(POOL_BASE))
        result = self.cli(POOL_BASE, {
            "STAGING_POOLER_HOST": POOLER.hostname,
            "STAGING_POOLER_ROLE": POOLER.role,
            "APPROVED_SESSION_POOLER": POOLER.hostname,
            "STAGING_PROJECT_REF": "idtnlninotxwqpznbwur",
        })
        self.assertEqual(result.returncode, 1)
        self.assertIn("BLOCKED R1", result.stdout)

    def test_reviewed_pooler_requires_exact_host_role_project_and_session_port(self):
        for url in (POOL_BASE, POOL_BASE + "?sslmode=require",
                    POOL_BASE + "?sslmode=verify-full",
                    POOL_BASE.replace("synthetic", "p%40ss%3Aword")):
            with self.subTest(url=url):
                self.assertTrue(guard.approved_url(url, session_pooler=POOLER))
        for url in (
            POOL_BASE.replace(POOLER.hostname, "other-pooler.example.invalid"),
            POOL_BASE.replace(POOLER.hostname, POOLER.hostname + ".evil.example"),
            POOL_BASE.replace(POOLER.hostname, POOLER.hostname.upper()),
            POOL_BASE.replace(POOLER.hostname, POOLER.hostname + "."),
            POOL_BASE.replace("otmaxtjstvbfckpgbwdi", "idtnlninotxwqpznbwur"),
            POOL_BASE.replace("otmaxtjstvbfckpgbwdi", "anotherproject"),
            POOL_BASE.replace(".otmaxtjstvbfckpgbwdi", ""),
            POOL_BASE.replace("staging_validator", "other_validator"),
            POOL_BASE.replace("staging_validator", "postgres"),
            POOL_BASE.replace("staging_validator", "service_role"),
            POOL_BASE.replace("staging_validator.", "staging_validator%2E"),
            POOL_BASE.replace(":5432", ":6543"), POOL_BASE.replace(":5432", ""),
            POOL_BASE.replace(":5432", ":05432"), POOL_BASE.replace("/postgres", "/other"),
            POOL_BASE.replace("synthetic", "x@evil"), POOL_BASE.replace("synthetic", "%0a"),
        ):
            with self.subTest(url=url):
                self.assertFalse(guard.approved_url(url, session_pooler=POOLER))

    def test_pooler_configuration_rejects_privileged_or_ambiguous_roles(self):
        for role in ("postgres", "anon", "authenticated", "service_role", "authenticator",
                     "pgbouncer", "dashboard_user", "pg_read_all_data", "supabase_admin",
                     "POSTGRES", "SUPABASE_ADMIN", "reader.other", "reader%2Eother", "reader "):
            endpoint = guard.SessionPooler(POOLER.hostname, role)
            url = POOL_BASE.replace("staging_validator", role)
            with self.subTest(role=role):
                self.assertFalse(guard.approved_url(url, session_pooler=endpoint))
        for host in ("*.example.invalid", "host,other.example.invalid", "host.example.invalid:5432",
                     "host.example.invalid/path", "host.example.invalid.", "Host.example.invalid"):
            with self.subTest(host=host):
                self.assertFalse(guard.approved_url(
                    POOL_BASE.replace(POOLER.hostname, host),
                    session_pooler=guard.SessionPooler(host, POOLER.role)))

    def test_credentials_are_not_guard_arguments_or_output(self):
        self.assertIn("python3 scripts/staging-url-guard.py\n", self.workflow)
        self.assertNotIn("def approved_url", self.workflow)
        self.assertEqual(self.cli(BASE).stdout, "")
        self.assertEqual(self.cli(POOL_BASE).stderr, "")

    def test_readiness_gate_remains_fail_closed(self):
        self.assertIn("needs: catalog", self.workflow)
        self.assertIn('if [ "$CATALOG_RESULT" != "success" ]; then', self.workflow)
        self.assertIn("BLOCKED_HOSTED_ACCEPTANCE", self.workflow)
        self.assertTrue(self.workflow.rstrip().endswith("exit 1"))
        self.assertNotIn("continue-on-error", self.workflow)

    def test_inherited_libpq_environment_is_cleared(self):
        sanitation = self.workflow.split("# Clear inherited libpq routing, service and TLS overrides.")[1].split(
            "          sudo apt-get"
        )[0]
        command = textwrap.dedent(sanitation) + """
test -z "${PGHOSTADDR+x}"
test -z "${PGSERVICE+x}"
test -z "${PGSERVICEFILE+x}"
test -z "${PGOPTIONS+x}"
test -z "${PGDATABASE+x}"
test -z "${PGUSER+x}"
test -z "${PGPASSWORD+x}"
test -z "${PGPASSFILE+x}"
test -z "${PGSSLROOTCERT+x}"
test "$PGSSLMODE" = require
test "$PGCONNECT_TIMEOUT" = 10
"""
        result = subprocess.run(["bash", "-eu", "-c", command], env={
            **os.environ, "PGHOSTADDR": "203.0.113.1", "PGSERVICE": "production",
            "PGSERVICEFILE": "/tmp/service", "PGSSLMODE": "disable",
            "PGOPTIONS": "-crole=postgres", "PGDATABASE": "production",
            "PGUSER": "postgres", "PGPASSWORD": "synthetic",
            "PGPASSFILE": "/tmp/synthetic", "PGSSLROOTCERT": "/tmp/synthetic",
        }, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr.decode())


if __name__ == "__main__":
    unittest.main()
