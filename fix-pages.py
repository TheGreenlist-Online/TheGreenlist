from pathlib import Path

files = {
"src/components/SimplePage.tsx": """import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

type SimplePageProps = {
  title: string
  subtitle: string
  sections: {
    heading: string
    body: string
  }[]
}

export function SimplePage({ title, subtitle, sections }: SimplePageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <section className="mb-10 rounded-lg border bg-card p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            THEBLACKLIST.ONLINE
          </p>
          <h1 className="mb-4 text-4xl font-bold">{title}</h1>
          <p className="max-w-3xl text-muted-foreground">{subtitle}</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.heading} className="rounded-lg border bg-card p-6">
              <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </section>

        <div className="mt-10">
          <Link href="/" className="text-sm font-semibold text-accent hover:underline">
            ← Back to homepage
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
""",

"src/app/forums/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function ForumsPage() {
  return (
    <SimplePage
      title="Forums"
      subtitle="Community discussion spaces for cannabis transparency, consumer reports, industry accountability, and open public oversight."
      sections={[
        {
          heading: 'Community watchdog discussions',
          body: 'Forums will give users a place to discuss business practices, consumer experiences, product concerns, and patterns that deserve public attention.',
        },
        {
          heading: 'Structured topics',
          body: 'Future forum categories can include dispensaries, brands, labs, delivery services, product safety, pricing, legal updates, and verified consumer feedback.',
        },
      ]}
    />
  )
}
""",

"src/app/businesses/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function BusinessesPage() {
  return (
    <SimplePage
      title="Businesses"
      subtitle="A public-facing directory concept for cannabis businesses, accountability records, transparency signals, and consumer verification."
      sections={[
        {
          heading: 'Business profiles',
          body: 'This section will eventually organize cannabis businesses with public information, transparency markers, review signals, and accountability history.',
        },
        {
          heading: 'Verification-first design',
          body: 'The goal is not blind promotion. The goal is a clearer view of who operates responsibly, who communicates honestly, and who earns public trust.',
        },
      ]}
    />
  )
}
""",

"src/app/news/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function NewsPage() {
  return (
    <SimplePage
      title="News"
      subtitle="Cannabis industry updates, policy shifts, consumer alerts, accountability stories, and transparency-focused reporting."
      sections={[
        {
          heading: 'Industry updates',
          body: 'This page will collect cannabis market news, regulatory changes, public safety notices, and business accountability updates.',
        },
        {
          heading: 'Transparency lens',
          body: 'News content should focus on what consumers, patients, workers, and responsible operators need to know to make informed decisions.',
        },
      ]}
    />
  )
}
""",

"src/app/reports/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function ReportsPage() {
  return (
    <SimplePage
      title="Reports"
      subtitle="A future hub for structured reports, public complaints, incident summaries, and transparency documentation."
      sections={[
        {
          heading: 'Consumer and community reports',
          body: 'Reports can document patterns involving service issues, product concerns, misleading claims, unsafe practices, or other accountability matters.',
        },
        {
          heading: 'Evidence-oriented intake',
          body: 'The reporting workflow should eventually collect dates, locations, business names, screenshots, receipts, product labels, and witness details where appropriate.',
        },
      ]}
    />
  )
}
""",

"src/app/legal/terms/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function TermsPage() {
  return (
    <SimplePage
      title="Terms of Service"
      subtitle="Baseline terms for using TheBlacklist.online. This placeholder should be reviewed before final legal publication."
      sections={[
        {
          heading: 'Use of the platform',
          body: 'Users are expected to participate honestly, avoid harassment, avoid knowingly false claims, and use the platform for lawful transparency and accountability purposes.',
        },
        {
          heading: 'Content responsibility',
          body: 'User-submitted content should be factual, evidence-supported where possible, and respectful of applicable laws and rights.',
        },
      ]}
    />
  )
}
""",

"src/app/legal/privacy/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function PrivacyPage() {
  return (
    <SimplePage
      title="Privacy Policy"
      subtitle="A plain-language privacy placeholder for TheBlacklist.online. Final policy should match the actual data collected by the app."
      sections={[
        {
          heading: 'Information collected',
          body: 'The platform may collect account information, submitted reports, technical logs, and communication details needed to operate the service.',
        },
        {
          heading: 'Privacy direction',
          body: 'The goal is to minimize unnecessary collection, protect sensitive submissions, and clearly explain how user information is handled.',
        },
      ]}
    />
  )
}
""",

"src/app/legal/ftc/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function FTCPage() {
  return (
    <SimplePage
      title="FTC Disclosures"
      subtitle="Disclosure space for sponsored content, affiliate relationships, ads, business listings, and compensation transparency."
      sections={[
        {
          heading: 'Sponsored content',
          body: 'Any paid placement, sponsorship, affiliate relationship, or compensated recommendation should be clearly labeled for users.',
        },
        {
          heading: 'Transparency standard',
          body: 'TheBlacklist.online should separate editorial/community accountability content from paid visibility or promotional placements.',
        },
      ]}
    />
  )
}
""",

"src/app/legal/dmca/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function DMCAPage() {
  return (
    <SimplePage
      title="DMCA"
      subtitle="Copyright takedown and intellectual property contact page placeholder."
      sections={[
        {
          heading: 'Copyright concerns',
          body: 'Rights holders should be able to submit copyright concerns with enough information to identify the work, the disputed content, and the requesting party.',
        },
        {
          heading: 'Response process',
          body: 'The platform should review notices, remove or restrict content where legally required, and preserve a fair counter-notice process when appropriate.',
        },
      ]}
    />
  )
}
""",

"src/app/contact/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function ContactPage() {
  return (
    <SimplePage
      title="Contact Us"
      subtitle="Contact TheBlacklist.online for support, partnerships, corrections, safety concerns, or general platform questions."
      sections={[
        {
          heading: 'General contact',
          body: 'For now, contact can be routed through support@theblacklist.online until a dedicated contact form is connected.',
        },
        {
          heading: 'Corrections and disputes',
          body: 'Businesses and users should have a clear path to request corrections, submit context, or dispute inaccurate information.',
        },
      ]}
    />
  )
}
""",

"src/app/help/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function HelpPage() {
  return (
    <SimplePage
      title="Help Center"
      subtitle="Guidance for using the platform, submitting reports, understanding listings, and participating responsibly."
      sections={[
        {
          heading: 'How to use the site',
          body: 'Users will be able to browse public information, read accountability content, join discussions, and submit reports through structured workflows.',
        },
        {
          heading: 'Responsible participation',
          body: 'The platform should encourage evidence, clarity, fairness, and lawful public-interest discussion.',
        },
      ]}
    />
  )
}
""",

"src/app/report/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function ReportIssuePage() {
  return (
    <SimplePage
      title="Report Issue"
      subtitle="A future intake page for platform issues, business concerns, product concerns, and transparency reports."
      sections={[
        {
          heading: 'What to report',
          body: 'Users may eventually report inaccurate listings, safety concerns, suspicious business conduct, broken pages, or moderation issues.',
        },
        {
          heading: 'Useful evidence',
          body: 'Strong reports should include dates, names, locations, screenshots, receipts, labels, order numbers, and a clear timeline when available.',
        },
      ]}
    />
  )
}
""",

"src/app/api-docs/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function ApiDocsPage() {
  return (
    <SimplePage
      title="API Docs"
      subtitle="Developer documentation placeholder for future TheBlacklist.online data, reporting, moderation, and verification APIs."
      sections={[
        {
          heading: 'Future API access',
          body: 'API documentation can eventually describe endpoints for reports, business profiles, moderation workflows, and verification signals.',
        },
        {
          heading: 'Access control',
          body: 'Any API should use strong authentication, rate limits, audit logs, and privacy-aware data handling.',
        },
      ]}
    />
  )
}
""",

"src/app/profile/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function ProfilePage() {
  return (
    <SimplePage
      title="Profile"
      subtitle="User profile placeholder for account details, saved reports, community activity, and verification settings."
      sections={[
        {
          heading: 'Account overview',
          body: 'This page can later show the user profile, public activity, privacy settings, and submitted reports.',
        },
        {
          heading: 'Identity and trust',
          body: 'Future profile tools can support verified identity, optional anonymity, and reputation signals without exposing unnecessary personal details.',
        },
      ]}
    />
  )
}
""",

"src/app/settings/page.tsx": """import { SimplePage } from '@/components/SimplePage'

export default function SettingsPage() {
  return (
    <SimplePage
      title="Settings"
      subtitle="Account and platform settings placeholder for privacy, notifications, profile controls, and security."
      sections={[
        {
          heading: 'Account settings',
          body: 'Users should eventually be able to manage display name, email, notification preferences, privacy settings, and account security.',
        },
        {
          heading: 'Safety controls',
          body: 'Future settings can include data export, account deletion, report history, and moderation preference controls.',
        },
      ]}
    />
  )
}
""",
}

for path, content in files.items():
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")

print(f"Wrote {len(files)} files cleanly.")
