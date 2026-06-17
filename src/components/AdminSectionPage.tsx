import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export async function AdminSectionPage({ title, description }: { title: string; description: string }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen smoke-surface text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <section className="glow-border rounded-lg p-px">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Admin</p>
            <h1 className="mt-3 text-3xl font-bold">{title}</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{description}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ['Review queue', '/admin/review'],
            ['News', '/admin/news'],
            ['Sources', '/admin/sources'],
            ['Moderation', '/admin/moderation'],
            ['Submissions', '/admin/submissions'],
            ['Logs', '/admin/logs'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg border border-accent/20 bg-card/70 p-4 text-sm font-semibold text-foreground transition hover:border-accent/60 hover:text-accent">
              {label}
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  )
}
