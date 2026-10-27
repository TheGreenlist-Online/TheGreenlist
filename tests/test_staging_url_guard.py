"""Exercise the exact workflow validator without database access or credentials."""
import os
from pathlib import Path
import subprocess
import sys
import textwrap
import unittest

WORKFLOW = Path(__file__).resolve().parents[1] / ".github/workflows/staging-baseline-gate.yml"
HOST = "db.otmaxtjstvbfckpgbwdi.supabase.co"
BASE = f"postgresql://readonly:synthetic@{HOST}:5432/postgres"

class StagingUrlGuardTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        workflow = WORKFLOW.read_text()
        block = workflow.split("          python3 - <<'PY'")[2].split("          PY")[0]
        cls.code = compile(textwrap.dedent(block), str(WORKFLOW), "exec")
        cls.workflow = workflow

    def accepts(self, url):
        result = subprocess.run(
            [sys.executable, "-c", textwrap.dedent(
                self.workflow.split("          python3 - <<'PY'")[2].split("          PY")[0]
            )],
            env={**os.environ, "STAGING_DATABASE_URL": url},
            capture_output=True, text=True,
        )
        self.assertNotIn("synthetic", result.stdout + result.stderr)
        return result.returncode == 0

    def test_approved_urls(self):
        for url in (BASE, BASE + "?sslmode=require", BASE + "?sslmode=verify-full",
                    BASE.replace("postgresql:", "postgres:"),
                    BASE.replace(":5432", ""), BASE.replace("synthetic", "p%40ss%3Aword")):
            with self.subTest(url=url):
                self.assertTrue(self.accepts(url))

    def test_routing_and_tls_overrides(self):
        for query in ("hostaddr=203.0.113.1", "host=elsewhere.example",
                      "%68ostaddr=203.0.113.1", "service=production",
                      "servicefile=/tmp/service", "options=-csearch_path=public",
                      "sslmode=disable", "sslmode=prefer", "sslmode=require&hostaddr=203.0.113.1",
                      "sslmode=require&sslmode=require", "sslmode=require&unknown=value",
                      "hostaddr=", "hostaddr", "dbname=host%3Devil"):
            with self.subTest(query=query):
                self.assertFalse(self.accepts(BASE + "?" + query))

    def test_malformed_and_wrong_targets(self):
        for url in ("", BASE.replace(HOST, "db.idtnlninotxwqpznbwur.supabase.co"),
                    BASE.replace(HOST, HOST + ".evil.example"),
                    BASE.replace("postgresql:", "https:"), BASE + "#fragment",
                    BASE + "#", BASE.replace(":5432", ":6543"),
                    BASE.replace(":5432", ":invalid"), BASE.replace("/postgres", "/other"),
                    BASE.replace("/postgres", "/host%3Devil"),
                    BASE.replace("readonly", "user%40other"), BASE.replace("synthetic", "%ZZ"),
                    BASE.replace("synthetic", "x%00y"), BASE + "\n", "\t" + BASE,
                    BASE.replace(HOST, HOST + ",elsewhere.example"),
                    BASE.replace("readonly:synthetic@", "")):
            with self.subTest(url=url):
                self.assertFalse(self.accepts(url))

    def test_inherited_libpq_environment_is_cleared(self):
        # Run the actual shell sanitation and a fake psql; no network connection.
        sanitation = self.workflow.split("# Clear inherited libpq routing, service and TLS overrides.")[1].split(
            "          sudo apt-get"
        )[0]
        command = textwrap.dedent(sanitation) + """
test -z "${PGHOSTADDR+x}"
test -z "${PGSERVICE+x}"
test -z "${PGSERVICEFILE+x}"
test "$PGSSLMODE" = require
test "$PGCONNECT_TIMEOUT" = 10
"""
        result = subprocess.run(["bash", "-eu", "-c", command], env={
            **os.environ, "PGHOSTADDR": "203.0.113.1", "PGSERVICE": "production",
            "PGSERVICEFILE": "/tmp/service", "PGSSLMODE": "disable",
        }, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr.decode())

if __name__ == "__main__":
    unittest.main()
