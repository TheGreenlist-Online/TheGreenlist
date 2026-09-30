import Link from 'next/link'
import { ReactNode } from 'react'
import { RoleBadge } from '@/components/RoleBadge'
import { VerifiedWall, type VerifiedFact } from '@/components/VerifiedWall'
import { Ledger, LimitationsPanel, Notice, RecordHeader, StatusLabel } from '@/components/record'
import { formatDate, recordId } from '@/lib/recordStatus'

export type ProfileRecordData = {
  id?: string
  username: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url: string | null
  role?: string | null
  verification_status?: string | null
  is_public?: boolean | null
  created_at?: string
}

type ProfileRecordProps = {
  profile: ProfileRecordData
  /** Normalised platform role for display. */
  role: string | null
  facts: VerifiedFact[]
  /** True when the viewer is the account holder. */
  isOwner?: boolean
  /** True when only username and avatar may be shown. */
  isMinimal?: boolean
  actions?: ReactNode
}

/**
 * The one account profile layout. Used for the signed-in account's own view
 * and for public profiles, so both read identically: record header, account
 * ledger, statement, confirmed facts, limitations. No scores.
 */
export function ProfileRecord({ profile, role, facts, isOwner, isMinimal, actions }: ProfileRecordProps) {
  const name = profile.display_name || profile.username || 'Account holder'
  return (
    <>
      <RecordHeader
        eyebrow="Account"
        kind={isOwner ? 'Your account record' : 'Account record'}
        recordId={profile.id ? recordId('ACC', profile.id) : undefined}
        title={name}
        lede={isMinimal ? undefined : profile.bio || (isOwner ? 'No statement on record. Add one from account settings.' : undefined)}
        meta={[
          ...(profile.username ? [{ label: 'Username', value: `@${profile.username}` }] : []),
          ...(profile.created_at ? [{ label: 'Account opened', value: formatDate(profile.created_at, { year: 'numeric', month: 'long' }) }] : []),
        ]}
        actions={actions}
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-[var(--gl-border-strong)] bg-[var(--gl-surface-raised)]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-lg text-[var(--gl-text-muted)]" aria-hidden="true">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {!isMinimal ? (
            <div className="flex flex-wrap gap-2">
              {role ? <RoleBadge role={role} /> : null}
              <StatusLabel value={profile.verification_status ?? 'unverified'} fallback={{ label: 'Not verified', tone: 'neutral' }} />
              {profile.is_public === false ? <StatusLabel label="Private profile" tone="neutral" /> : null}
            </div>
          ) : null}
        </div>
      </RecordHeader>

      {isMinimal ? (
        <Notice tone="info" className="mt-8">
          This account has a private profile. Only the username and avatar are shown.
        </Notice>
      ) : (
        <>
          <Ledger
            title="Account"
            aside="Labels describe permissions and identity checks, not standing"
            className="mt-8"
            rows={[
              { label: 'Role', value: role ? role.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Not stated', note: 'Platform permissions. Roles are assigned by administrators and cannot be self-selected.' },
              { label: 'Identity check', value: <StatusLabel value={profile.verification_status ?? 'unverified'} fallback={{ label: 'Not verified', tone: 'neutral' }} /> },
              { label: 'Profile visibility', value: profile.is_public === false ? 'Private' : 'Public' },
              { label: 'Confirmed facts', value: `${facts.length} on record`, note: 'Reviewed by staff against a stated source. The account holder cannot add or edit these.' },
            ]}
          />

          <div className="mt-6">
            <VerifiedWall facts={facts} />
          </div>
        </>
      )}

      <LimitationsPanel subject="profile" className="mt-8">
        A profile shows an account&apos;s role and identity check. It does not rate the person, and The Green List publishes no
        trust or reputation scores for individuals. Role and verification labels describe platform permissions and identity checks, not endorsement.
      </LimitationsPanel>
      {isOwner ? (
        <p className="gl-meta mt-4">
          <Link href="/dashboard" className="gl-link">
            Your desk
          </Link>
          {profile.username ? (
            <Link href={`/profile/${profile.username}`} className="gl-link">
              Public view
            </Link>
          ) : null}
        </p>
      ) : null}
    </>
  )
}
