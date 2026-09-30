import Link from 'next/link'

export default function RegisterPage() {
 return (
 <main className="min-h-screen px-4 py-16 text-foreground">
 <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
 <div className="gl-panel w-full">
 <div className="p-8">
 <p className="greenlist-eyebrow mb-3">The Green List</p>
 <h1 className="greenlist-page-title">Accounts are issued on request</h1>
 <p className="mt-3 text-sm leading-6 text-[var(--gl-text-secondary)]">
 Reading the record requires no account. Accounts are for filing reports, submitting evidence, claiming a business record, and taking part in discussions, and are approved by the platform before use.
 </p>
 <div className="gl-limitations mt-8">
 Accounts are invited by the platform and verified before a business, reviewer, or administrator role is assigned. An invitation does not grant elevated access by itself. To request access, use the contact page.
 </div>

 <p className="mt-6 text-sm text-[var(--gl-text-secondary)]">
 Already hold an account?{' '}
 <Link href="/auth/signin" className="gl-link">
 Sign in
 </Link>
 </p>
 <Link href="/" className="mt-6 block text-sm gl-link">
 Back to homepage
 </Link>
 </div>
 </div>
 </section>
 </main>
 )
}
