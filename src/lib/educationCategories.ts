/** Resource categories for Learn. One definition; list, detail and submission pages share it. */
export const EDUCATION_CATEGORIES: Record<string, { label: string; scope: string }> = {
  SAFETY_GUIDE: { label: 'Safety guide', scope: 'How to read labels, certificates of analysis, and recall notices.' },
  REGULATORY_RESOURCE: { label: 'Regulatory resource', scope: 'How licensing, testing, and enforcement work in a jurisdiction.' },
  WORKER_RIGHTS: { label: 'Worker rights', scope: 'Protections and reporting channels for people working in the industry.' },
  RESEARCH_SUMMARY: { label: 'Research summary', scope: 'What a published study found, with its limits stated.' },
}

export function educationCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Resource'
  return EDUCATION_CATEGORIES[category]?.label ?? category.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}
