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
    <label htmlFor={htmlFor} className="block">
      <span className="text-sm font-semibold text-zinc-100">{children}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  )
}

const inputBase =
  'mt-2 w-full rounded-lg border border-white/[.12] bg-black/30 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/20 disabled:cursor-not-allowed disabled:bg-white/[.03] disabled:text-zinc-500'

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
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 pt-px text-sm text-zinc-500">
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
            className={cn(inputBase, 'resize-y leading-6', error && 'border-red-400/60')}
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
            className={cn(inputBase, prefix && 'pl-[1.6rem]', error && 'border-red-400/60')}
          />
        )}
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} className="text-xs font-medium text-red-300">
            {error}
          </p>
        ) : (
          <span />
        )}
        {showCount && maxLength ? (
          <span className="shrink-0 text-xs tabular-nums text-zinc-600">
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
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/[.07] bg-white/[.02] p-4">
      <div className="min-w-0">
        <label htmlFor={id} className={cn('text-sm font-semibold text-zinc-100', !disabled && 'cursor-pointer')}>
          {label}
        </label>
        {description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}
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
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d120f]',
          checked ? 'border-emerald-300/50 bg-emerald-500/70' : 'border-white/15 bg-white/[.08]',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all',
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
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        tone === 'success'
          ? 'border-emerald-300/35 bg-emerald-950/30 text-emerald-200'
          : 'border-red-300/35 bg-red-950/25 text-red-200',
      )}
    >
      {children}
    </p>
  )
}
