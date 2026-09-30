import { ReactNode } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { StatusLabel } from '@/components/record/StatusLabel'
import type { RecordStatus } from '@/lib/recordStatus'

type MetaItem = { label?: string; value: ReactNode }

type RecordHeaderProps = {
  title: ReactNode
  /** Plain statement of what the record holds. */
  lede?: ReactNode
  /** Section eyebrow override (defaults to the current section). */
  eyebrow?: string
  /** Kind of record shown after the eyebrow: `Business record`, `Report`, `Resource`. */
  kind?: string
  /** Public record identifier, e.g. GL-RPT-1A2B3C4D. */
  recordId?: string
  jurisdiction?: string
  /** Status resolved via recordStatus(); shown beside the eyebrow. */
  status?: RecordStatus
  /** Additional monospace metadata (Filed, Last reviewed, Author...). */
  meta?: MetaItem[]
  actions?: ReactNode
  children?: ReactNode
}

/**
 * Standard header for any record-oriented page: business, report, resource,
 * discussion, alert. Produces the same file-header row on every record —
 * jurisdiction / kind / ID, then title, then scope, then metadata.
 */
export function RecordHeader({ title, lede, eyebrow, kind, recordId, jurisdiction, status, meta, actions, children }: RecordHeaderProps) {
  const fileRow: ReactNode[] = []
  if (jurisdiction) fileRow.push(<span key="j">{jurisdiction}</span>)
  if (kind) fileRow.push(<span key="k">{kind}</span>)
  if (recordId) fileRow.push(<span key="i">{recordId}</span>)

  return (
    <PageIntro
      eyebrow={eyebrow}
      title={title}
      lede={lede}
      actions={actions}
      meta={
        fileRow.length ? (
          <>
            {fileRow.map((node, index) => (
              <span key={index} className="contents">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {node}
              </span>
            ))}
          </>
        ) : undefined
      }
    >
      {status || (meta && meta.length) ? (
        <div className="gl-meta mt-4">
          {status ? <StatusLabel status={status} /> : null}
          {meta?.map((item, index) => (
            <span key={index}>
              {item.label ? <strong>{item.label}</strong> : null} {item.value}
            </span>
          ))}
        </div>
      ) : null}
      {children}
    </PageIntro>
  )
}
