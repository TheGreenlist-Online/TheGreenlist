# Compromised-password protection

Status: operational remediation pending. A documentation merge does not enable this setting.

The production security advisor on 2026-10-06 reported leaked-password protection disabled. Confirm the production Supabase project reference and that its plan supports leaked-password protection. Do not enable the production setting until the staging checks below pass. Then enable it in Supabase Authentication password/security settings for the confirmed TheGreenlist project. Do not alter redirect URLs, providers, email confirmation or session expiry while doing this.

## Acceptance evidence
- For each environment, record the environment name, non-secret Supabase project reference, plan, setting state and verification date. Never record passwords, tokens, email addresses or SMTP secrets.
- In a separate staging project, confirm the plan supports the setting and the existing `/auth/confirm` callback is allowlisted. Before enabling protection there, create a test account with a known compromised synthetic password; never use a real person's credentials. Enable leaked-password protection in staging, then verify sign-in with that synthetic password is rejected and the sign-in page points to recovery.
- Request a recovery link for that test account, verify the link opens the password-reset form, confirm the compromised synthetic password is rejected as the replacement, set a fresh strong synthetic password, and sign in successfully with it.
- Also verify signup and password reset reject a known compromised synthetic password, a fresh strong synthetic password is accepted, and ordinary sign-in, recovery and email-confirmation flows still work.
- Only after all staging checks pass, enable protection for production and record the production project reference and setting state. Re-run the production Supabase Security Advisor; auth_leaked_password_protection must disappear.
- Do not disable protection to make a legacy test password pass.

## Scope boundaries
CAPTCHA, per-IP signup limits, session revocation on suspension, MFA and account takeover response remain separate work. Never claim that enabling HIBP alone prevents account takeover.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
