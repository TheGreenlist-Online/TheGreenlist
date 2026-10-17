/** Legacy section header; renders the standard section rule. Prefer `Section` from components/record. */
export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="gl-section__head">
      <div>
        {eyebrow ? <p className="greenlist-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {description ? <p className="max-w-md">{description}</p> : null}
    </div>
  )
}
