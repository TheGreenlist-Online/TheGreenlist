"""Validate staging routing without connecting or printing connection details.

Session-pooler support is prepared for isolated tests only. Enabling a hosted
endpoint requires a reviewed exact hostname and dedicated validator role below;
neither a URL nor an environment variable can supply that approval.
"""
from dataclasses import dataclass
import os
import re
import sys
from urllib.parse import unquote_to_bytes, urlsplit


STAGING_PROJECT_REF = "otmaxtjstvbfckpgbwdi"
DIRECT_HOST = f"db.{STAGING_PROJECT_REF}.supabase.co"
ROLE_PATTERN = r"[A-Za-z_][A-Za-z0-9_]*"


@dataclass(frozen=True)
class SessionPooler:
    hostname: str
    role: str


# Intentionally disabled. Do not derive a pooler host from the project's region,
# accept a suffix wildcard, or load this trust decision from runner inputs.
# A reviewed endpoint must also be tested with the dedicated login's real grants.
APPROVED_SESSION_POOLER: SessionPooler | None = None


def approved_url(raw: str, *, session_pooler: SessionPooler | None = None) -> bool:
    """Check routing, not database privileges or hosted acceptance.

    The optional endpoint supports dependency-injected, credential-free tests.
    The command-line entrypoint uses only APPROVED_SESSION_POOLER.
    """
    try:
        if not raw or re.search(r"[\s\x00-\x1f\x7f]", raw):
            return False
        if re.search(r"%(?![0-9a-fA-F]{2})", raw):
            return False
        u = urlsplit(raw)
        if u.scheme not in ("postgres", "postgresql") or not raw.startswith(u.scheme + "://"):
            return False
        if u.path != "/postgres" or u.fragment or "#" in raw:
            return False
        if not u.username or not u.password:
            return False
        # Reserved password characters must be percent-encoded. In particular,
        # reject raw @ and backslashes before URL/libpq parsers can disagree.
        if not re.fullmatch(r"(?:[A-Za-z0-9._~-]|%[0-9a-fA-F]{2})+", u.password):
            return False
        if any(c < 32 or c == 127 for c in unquote_to_bytes(u.password)):
            return False
        # No encoded names, duplicate keys, routing overrides, service/options
        # injection, TLS downgrade, or arbitrary future libpq parameters.
        if u.query not in ("", "sslmode=require", "sslmode=verify-full"):
            return False
        endpoint = u.netloc.rsplit("@", 1)[-1]
        if u.hostname == DIRECT_HOST:
            return bool(
                re.fullmatch(ROLE_PATTERN, u.username)
                and endpoint in (DIRECT_HOST, DIRECT_HOST + ":5432")
            )
        if session_pooler is None:
            return False
        # This also validates injected test configurations. The exact endpoint,
        # dedicated role and project suffix together identify the pooler tenant.
        if not re.fullmatch(r"[a-z0-9]+(?:[.-][a-z0-9]+)+", session_pooler.hostname):
            return False
        if not re.fullmatch(ROLE_PATTERN, session_pooler.role):
            return False
        if session_pooler.role.lower() in (
            "postgres", "anon", "authenticated", "service_role", "authenticator",
            "pgbouncer", "dashboard_user",
        ) or session_pooler.role.lower().startswith(("pg_", "supabase_")):
            return False
        return (
            u.hostname == session_pooler.hostname
            and endpoint == session_pooler.hostname + ":5432"
            and u.username == session_pooler.role + "." + STAGING_PROJECT_REF
        )
    except (ValueError, UnicodeError, TypeError):
        return False


def main() -> int:
    if not approved_url(os.environ.get("STAGING_DATABASE_URL", ""),
                        session_pooler=APPROVED_SESSION_POOLER):
        print("::error title=BLOCKED R1::Invalid or non-approved staging connection URL")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
