export const REPORT_TYPES = [
  { value: 'mislabeling', label: 'Mislabeling' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'worker_safety', label: 'Worker Safety' },
  { value: 'deceptive_marketing', label: 'Deceptive Marketing' },
  { value: 'other', label: 'Other accountability matter' },
] as const

export type ReportType = (typeof REPORT_TYPES)[number]['value']

export const REPORT_TYPE_VALUES = new Set<string>(REPORT_TYPES.map(({ value }) => value))
