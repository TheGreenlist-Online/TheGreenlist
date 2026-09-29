import { ContactIntakeForm } from '@/app/contact/contact-intake-form'

export default function ContactPage() {
  return (
    <main className="px-4 py-16 text-foreground smoke-surface">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">The Green List</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-100 md:text-5xl">Contact intake</h1>
        <p className="mt-4 text-base leading-7 text-zinc-300">
          Use this structured intake to route support, partnership, sponsor, affiliate, and operations requests into our automation workflows.
        </p>
        <ul className="mt-6 space-y-2 text-sm leading-6 text-zinc-300">
          <li>• Reports, moderation decisions, and sensitive legal workflows remain in-platform.</li>
          <li>• This intake does not enable cannabis sales, payments, ordering, delivery, or inventory transactions.</li>
          <li>• For urgent legal matters, use designated legal channels listed in policy pages.</li>
        </ul>
        <ContactIntakeForm />
      </section>
    </main>
  )
}
