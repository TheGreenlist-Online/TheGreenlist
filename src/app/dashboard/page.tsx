import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <section className="container mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          THEBLACKLIST.ONLINE
        </p>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          Welcome back{session.user.name ? `, ${session.user.name}` : ''}. Manage your reports,
          community activity, and account settings from here.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/reports" className="rounded-lg border bg-card p-5 transition-colors hover:border-accent">
            <h2 className="font-semibold">Reports</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review transparency reports and public accountability updates.
            </p>
          </Link>

          <Link href="/forums" className="rounded-lg border bg-card p-5 transition-colors hover:border-accent">
            <h2 className="font-semibold">Forums</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Continue community discussions and track active topics.
            </p>
          </Link>

          <Link href="/settings" className="rounded-lg border bg-card p-5 transition-colors hover:border-accent">
            <h2 className="font-semibold">Settings</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage profile, preferences, and account details.
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Account</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{session.user.email ?? 'No email on file'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd>{session.user.role ?? 'USER'}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  )
}
