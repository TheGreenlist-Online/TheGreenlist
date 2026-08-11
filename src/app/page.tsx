import Link from 'next/link'
import {
  BadgeCheck, BarChart3, BookOpen, Bot, Building2, CircleAlert, FileSearch,
  FileText, Gavel, Leaf, LockKeyhole, MessageSquare, Newspaper, Search,
  ShieldCheck, Sparkles, Users, Waypoints,
} from 'lucide-react'
import { PageShell } from '@/components/PageShell'

const capabilities = [
  ['Authentication system', '/auth/signin', 'live'], ['Forum ecosystem', '/forums', 'live'],
  ['User social profiles', '/profile', 'live'], ['Transparency reports', '/reports', 'live'],
  ['AI-assisted moderation', '/admin/moderation', 'beta'], ['Business profiles', '/businesses', 'live'],
  ['Affiliate & advertising', '/legal/ftc', 'planned'], ['Memberships', '/dashboard', 'planned'],
  ['News aggregation', '/news', 'live'], ['Legal aid forums', '/forums', 'beta'],
  ['Admin analytics', '/admin', 'beta'], ['Whistleblower reporting', '/report', 'live'],
  ['Mobile-first experience', '/', 'live'], ['Personalized home feed', '/dashboard', 'planned'],
  ['Dynamic forum navigation', '/forums', 'live'], ['Trend & sentiment analytics', '/trending', 'beta'],
  ['Badges & reputation', '/profile', 'beta'], ['Content tagging & search', '/forums', 'beta'],
  ['Notifications & messaging', '/dashboard', 'beta'], ['API & integrations', '/api-docs', 'beta'],
] as const

const forumCategories = ['Cultivation', 'Grow Ops', 'Dispensaries', 'Budtenders', 'Consumer Safety', 'Product Reviews', 'Mold Reports', 'Worker Rights', 'Wage Theft', 'Fake Products', 'Policy & Legislation', 'Legal Aid', 'AI & Cannabis', 'Compliance Violations', 'Industry Corruption', 'Medical Cannabis', 'Regional Boards', 'News & Investigations']

const moderation = [
  [ShieldCheck, 'Toxicity detection'], [CircleAlert, 'Spam filtering'], [FileSearch, 'Misinformation'],
  [Users, 'Harassment'], [Gavel, 'Legal-risk analysis'], [FileText, 'Duplicate detection'],
  [Bot, 'AI summaries'], [BarChart3, 'Trend analysis'],
] as const

const pathways = [
  [Search, 'Report it', 'Submit an incident and evidence', '/report'],
  [BadgeCheck, 'Verify it', 'Review transparent business records', '/businesses'],
  [MessageSquare, 'Discuss it', 'Join public-interest forums', '/forums'],
  [BookOpen, 'Understand it', 'Use education and current news', '/education'],
] as const

function Status({ value }: { value: 'live' | 'beta' | 'planned' }) {
  return <span className={`spec-status spec-status--${value}`}>{value}</span>
}

export default function HomePage() {
  return (
    <PageShell className="greenlist-home spec-home">
      <section className="spec-hero" aria-labelledby="home-heading">
        <div className="spec-hero__glow" />
        <div className="spec-wrap spec-hero__content">
          <p className="spec-eyebrow"><span className="spec-pulse" /> Civic-tech cannabis transparency</p>
          <h1 id="home-heading"><span>The</span>Green List</h1>
          <p className="spec-deck">The public accountability layer for cannabis.</p>
          <p className="spec-intro">Reports, verified context, business transparency, current news, education, and community discussion—connected in one evidence-led platform.</p>
          <div className="spec-actions">
            <Link className="spec-button spec-button--primary" href="/town"><Waypoints />Enter Green List Town</Link>
            <Link className="spec-button" href="/report"><FileText />Submit a report</Link>
            <Link className="spec-button" href="/news"><Newspaper />Read current news</Link>
          </div>
          <div className="spec-pathways">
            {pathways.map(([Icon, title, copy, href]) => <Link href={href} key={title}><Icon /><span><strong>{title}</strong><small>{copy}</small></span></Link>)}
          </div>
        </div>
      </section>

      <div className="spec-wrap spec-board">
        <section className="spec-mission spec-panel">
          <div><p className="spec-label"><Leaf />Mission</p><h2>Truth needs infrastructure.</h2><p>Build the most trusted cannabis-industry transparency platform: a civic-tech ecosystem for accountability, verification, legal aid, reporting, analytics, and public education.</p></div>
          <div className="spec-version"><span>Platform</span><strong>Public beta</strong><span>Domain</span><strong>thegreenlist.online</strong></div>
        </section>

        <section className="spec-boundaries" aria-label="Platform purpose and compliance boundaries">
          <article className="spec-panel"><p className="spec-label"><BadgeCheck />We are</p><ul><li>Transparency infrastructure</li><li>Civic-tech watchdog</li><li>Investigative reporting hub</li><li>Community and education platform</li><li>Verified business directory</li><li>Analytics and trend intelligence</li></ul></article>
          <article className="spec-panel spec-panel--danger"><p className="spec-label"><CircleAlert />We are not</p><ul><li>A dispensary or cannabis marketplace</li><li>A checkout, cart, broker, or payment processor</li><li>A delivery, inventory, or transaction service</li><li>A facilitator of interstate cannabis commerce</li></ul><strong>No cannabis sales. Under any circumstances.</strong></article>
          <article className="spec-panel spec-panel--blue"><p className="spec-label"><LockKeyhole />Legal compliance</p><ul><li>No sales, ordering, delivery, or fulfillment</li><li>FTC labels on promotions and affiliate links</li><li>No deceptive or unverified medical claims</li><li>User allegations remain labeled until reviewed</li><li>Human review for consequential moderation</li></ul></article>
        </section>

        <section className="spec-panel">
          <div className="spec-section-head"><div><p className="spec-label"><Sparkles />Core platform</p><h2>One system, twenty connected capabilities.</h2></div><p>Status reflects the current implementation—not a marketing promise.</p></div>
          <div className="spec-capability-grid">{capabilities.map(([name, href, status], index) => <Link href={href} key={name}><span className="spec-number">{String(index + 1).padStart(2, '0')}</span><strong>{name}</strong><Status value={status} /></Link>)}</div>
        </section>

        <section className="spec-panel">
          <div className="spec-section-head"><div><p className="spec-label"><MessageSquare />Forum districts</p><h2>Follow the issue, not the noise.</h2></div><Link href="/forums">Open all forums →</Link></div>
          <div className="spec-tags">{forumCategories.map(category => <Link href={`/forums?category=${encodeURIComponent(category)}`} key={category}>{category}</Link>)}</div>
          <p className="spec-note">Threads · voting · AI summaries · tagging · attachments · anonymous reporting pathways · trust signals</p>
        </section>

        <section className="spec-panel">
          <div className="spec-section-head"><div><p className="spec-label"><Bot />AI and moderation</p><h2>Machine speed. Human judgment.</h2></div><p>AI assists reviewers; people make consequential decisions.</p></div>
          <div className="spec-moderation">{moderation.map(([Icon, label]) => <div key={label}><Icon /><span>{label}</span></div>)}</div>
        </section>

        <section className="spec-architecture spec-panel">
          <div><p className="spec-label"><Building2 />Platform architecture</p><h2>Built to scale without losing accountability.</h2><p>Next.js and TypeScript on Vercel, PostgreSQL and protected storage on Supabase, OpenAI-assisted analysis with audit metadata, and integrations designed around explicit permissions.</p></div>
          <div className="spec-flow" aria-label="High level architecture"><span>Web + mobile</span><i>→</i><span>API + authorization</span><i>→</i><span>Postgres + storage</span><i>→</i><span>AI + external sources</span></div>
        </section>
      </div>
    </PageShell>
  )
}
