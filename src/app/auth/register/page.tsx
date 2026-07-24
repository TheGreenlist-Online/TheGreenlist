import Link from 'next/link'

export default function RegisterPage() {
  return (
    <main className="min-h-screen px-4 py-16 text-foreground smoke-surface">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
        <div className="glow-border w-full rounded-lg p-px">
          <div className="rounded-lg bg-card/95 p-8 shadow-2xl shadow-black/40 backdrop-blur">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              The Green List
            </p>
            <h1 className="text-3xl font-bold text-foreground">Registration is closed</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The Green List uses owner-approved accounts. Public visitors cannot create an account or choose a role.
            </p>
            <div className="mt-8 rounded-xl border border-emerald-300/30 bg-emerald-950/20 p-4 text-sm leading-6 text-emerald-100">
              Accounts must be invited by the platform owner and verified before a business, moderator, or administrator role is assigned. An invitation does not grant elevated access by itself.
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Already have an approved account?{' '}
              <Link href="/auth/signin" className="font-semibold text-accent hover:underline">
                Sign in
              </Link>
            </p>
            <Link href="/" className="mt-6 block text-sm text-accent hover:underline">
              Back to homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
