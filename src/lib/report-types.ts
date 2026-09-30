export const REPORT_TYPES = [
  { value: 'mislabeling', label: 'Mislabeling' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'worker_safety', label: 'Worker Safety' },
  { value: 'deceptive_marketing', label: 'Deceptive Marketing' },
  { value: 'correction_request', label: 'Correction request' },
  { value: 'other', label: 'Other accountability matter' },
] as const

export type ReportType = (typeof REPORT_TYPES)[number]['value']

export const REPORT_TYPE_VALUES = new Set<string>(REPORT_TYPES.map(({ value }) => value))

/** The type /about/corrections directs readers to. Exported so links and the intake agree on the token. */
export const CORRECTION_REQUEST_TYPE = 'correction_request' satisfies ReportType

export function isReportType(value: string | null | undefined): value is ReportType {
  return typeof value === 'string' && REPORT_TYPE_VALUES.has(value)
}
