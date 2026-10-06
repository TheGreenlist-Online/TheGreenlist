# Compromised-password protection

Status: operational remediation pending. A documentation merge does not enable this setting.

The production security advisor on 2026-10-06 reported leaked-password protection disabled. Enable it in Supabase Authentication password/security settings for the confirmed TheGreenlist project, subject to the project's supported plan. Do not alter redirect URLs, providers, email confirmation or session expiry while doing this.

## Acceptance evidence
- Capture only the redacted setting state and date, never passwords, tokens or SMTP secrets.
- Re-run the Supabase Security Advisor; auth_leaked_password_protection must disappear.
- In staging, signup/password-reset with a known compromised test password must be rejected; a fresh strong test password must work.
- Verify ordinary sign-in, recovery and email-confirmation flows still work.
- Do not disable protection to make a legacy test password pass.

## Scope boundaries
CAPTCHA, per-IP signup limits, session revocation on suspension, MFA and account takeover response remain separate work. Never claim that enabling HIBP alone prevents account takeover.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
