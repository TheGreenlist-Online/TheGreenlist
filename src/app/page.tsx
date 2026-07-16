import Link from 'next/link'
import {
  BookOpen,
  Building2,
  FileSearch,
  FileText,
  Landmark,
  Leaf,
  Map,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'

const pillars = [
  {
    title: 'Report It',
    subtitle: 'Shine a light',
    href: '/report',
    icon: Search,
    tone: 'violet',
  },
  {
    title: 'Verify It',
    subtitle: 'Seek the truth',
    href: '/businesses',
    icon: ShieldCheck,
    tone: 'gold',
  },
  {
    title: 'Build Community',
    subtitle: 'Stand together',
    href: '/forums',
    icon: Users,
    tone: 'cyan',
  },
  {
    title: 'Drive Change',
    subtitle: 'Leave a legacy',
    href: '/town',
    icon: Leaf,
    tone: 'lime',
  },
]

const districts = [
  {
    title: 'Green List Town',
    eyebrow: 'Immersive gateway',
    description: 'Enter a living digital town where every building opens a real transparency, education, or community feature.',
    href: '/town',
    icon: Map,
  },
  {
    title: 'Reports Bureau',
    eyebrow: 'Public accountability',
    description: 'Document incidents, attach supporting evidence, and follow clear status-based review workflows.',
    href: '/reports',
    icon: FileText,
  },
  {
    title: 'Business District',
    eyebrow: 'Verified profiles',
    description: 'Explore trust-first business profiles centered on licensing, transparency history, and reputation.',
    href: '/businesses',
    icon: Building2,
  },
  {
    title: 'Community Forum',
    eyebrow: 'Shared experience',
    description: 'Discuss safety, accountability, policy, education, and lived cannabis experiences with the community.',
    href: '/forums',
    icon: Users,
  },
  {
    title: 'Education Center',
    eyebrow: 'Public-interest knowledge',
    description: 'Review policy context, consumer safety guidance, and transparent educational resources.',
    href: '/education/new',
    icon: BookOpen,
  },
  {
    title: 'Evidence Archive',
    eyebrow: 'Structured documentation',
    description: 'Submit records, screenshots, and supporting materials through an organized evidence pathway.',
    href: '/evidence/upload',
    icon: FileSearch,
  },
]

export default function HomePage() {
  return (
    <PageShell className="greenlist-home">
      <section className="greenlist-hero" aria-labelledby="home-heading">
        <div className="greenlist-hero__smoke greenlist-hero__smoke--left" />
        <div className="greenlist-hero__smoke greenlist-hero__smoke--right" />
        <div className="greenlist-hero__flare" />

        <div className="greenlist-hero__inner">
          <div className="greenlist-seal" aria-hidden="true">
            <span className="greenlist-seal__ring">Truth · Transparency · Trust</span>
            <div className="greenlist-seal__leaf"><Leaf strokeWidth={1.5} /></div>
          </div>

          <p className="greenlist-kicker">Cannabis transparency and accountability</p>
          <h1 id="home-heading" className="greenlist-wordmark">
            <span className="greenlist-wordmark__the">The</span>
            <span className="greenlist-wordmark__green">Green</span>
            <span className="greenlist-wordmark__list">List</span>
          </h1>
          <p className="greenlist-hero__tagline">Accountability above all.</p>
          <p className="greenlist-hero__copy">
            A public-interest platform for verified business reputation, evidence-led reports, education, and community trust.
            No marketplace. No ordering. No cannabis sales.
          </p>

          <div className="greenlist-hero__actions">
            <Button asChild size="lg" className="greenlist-primary-button">
              <Link href="/town"><Map className="mr-2 h-5 w-5" />Enter Green List Town</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="greenlist-secondary-button">
              <Link href="/forums">Explore the platform</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="greenlist-secondary-button">
              <Link href="/reports">View reports</Link>
            </Button>
          </div>

          <div className="greenlist-pillars" aria-label="Core platform pathways">
            {pillars.map(({ title, subtitle, href, icon: Icon, tone }) => (
              <Link key={title} href={href} className={`greenlist-pillar greenlist-pillar--${tone}`}>
                <span className="greenlist-pillar__icon"><Icon /></span>
                <span className="greenlist-pillar__title">{title}</span>
                <span className="greenlist-pillar__subtitle">{subtitle}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="greenlist-section" aria-labelledby="district-heading">
        <div className="greenlist-section__heading">
          <p><Sparkles className="h-4 w-4" /> Explore the platform</p>
          <h2 id="district-heading">A digital town built around truth</h2>
          <span>Every destination is a real platform function—not a storefront or sales tool.</span>
        </div>

        <div className="greenlist-district-grid">
          {districts.map(({ title, eyebrow, description, href, icon: Icon }) => (
            <Link href={href} key={title} className="greenlist-district-card">
              <div className="greenlist-district-card__topline" />
              <span className="greenlist-district-card__icon"><Icon /></span>
              <p>{eyebrow}</p>
              <h3>{title}</h3>
              <span>{description}</span>
              <strong>Enter district →</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="greenlist-civic-panel" aria-labelledby="trust-heading">
        <div>
          <p className="greenlist-kicker">Transparent by design</p>
          <h2 id="trust-heading">Built for public trust—not transactions.</h2>
          <p>
            The Green List keeps reporting, verification, education, moderation, and governance visible while protecting personal information and sensitive evidence.
          </p>
        </div>
        <div className="greenlist-civic-panel__points">
          <span><ShieldCheck /> Verification standards</span>
          <span><Landmark /> Community governance</span>
          <span><FileSearch /> Evidence-led review</span>
        </div>
      </section>
    </PageShell>
  )
}
