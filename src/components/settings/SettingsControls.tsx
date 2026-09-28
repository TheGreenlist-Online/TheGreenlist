'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The form primitives used across settings.
 *
 * The old settings and preferences pages hand-rolled the same input, checkbox
 * and label markup with slightly different padding, borders and focus rings
 * each time. These own the treatment so every control in settings matches.
 */

export function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="gl-label">
      {children}
      {hint ? <span className="mt-1 block normal-case tracking-normal text-[var(--gl-text-muted)]">{hint}</span> : null}
    </label>
  )
}

const inputBase = 'gl-input'

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  hint?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  maxLength?: number
  prefix?: string
  multiline?: boolean
  rows?: number
  /** Shown under the field when a max length is set. */
  showCount?: boolean
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  disabled,
  error,
  maxLength,
  prefix,
  multiline,
  rows = 4,
  showCount,
}: TextFieldProps) {
  const describedBy = error ? `${id}-error` : undefined

  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>

      <div className={cn(prefix && 'relative')}>
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 pt-px text-sm text-[var(--gl-text-muted)]">
            {prefix}
          </span>
        ) : null}

        {multiline ? (
          <textarea
            id={id}
            value={value}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange?.(event.target.value)}
            className={cn(inputBase, 'resize-y leading-6', error && 'border-[var(--gl-status-alert)]')}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            maxLength={maxLength}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange?.(event.target.value)}
            className={cn(inputBase, prefix && 'pl-[1.6rem]', error && 'border-[var(--gl-status-alert)]')}
          />
        )}
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} className="gl-help text-[#f0a094]">
            {error}
          </p>
        ) : (
          <span />
        )}
        {showCount && maxLength ? (
          <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--gl-text-muted)]">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  )
}

type ToggleProps = {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** A real switch (role=switch) rather than a bare checkbox, with a large hit area. */
export function Toggle({ id, label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 border border-[var(--gl-border)] bg-[var(--gl-ink)] p-4">
      <div className="min-w-0">
        <label htmlFor={id} className={cn('text-sm font-semibold text-[var(--gl-text)]', !disabled && 'cursor-pointer')}>
          {label}
        </label>
        {description ? <p className="mt-1 text-xs leading-5 text-[var(--gl-text-muted)]">{description}</p> : null}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-accent-strong)]',
          checked ? 'border-[var(--gl-accent-strong)] bg-[var(--gl-accent)]' : 'border-[var(--gl-border-strong)] bg-[var(--gl-surface-raised)]',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 bg-[var(--gl-ink)] transition-all',
            checked ? 'left-[1.55rem]' : 'left-1',
          )}
        />
      </button>
    </div>
  )
}

/** Inline result banner for a save attempt. */
export function StatusMessage({ tone, children }: { tone: 'success' | 'error'; children: ReactNode }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn('gl-notice', tone === 'success' ? 'gl-notice--confirmed' : 'gl-notice--alert')}
    >
      {children}
    </p>
  )
}
