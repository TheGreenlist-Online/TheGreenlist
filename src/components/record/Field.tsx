'use client'

import { ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type FieldProps = {
  label: ReactNode
  htmlFor?: string
  help?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

/** Label + control + help text. Every form on the site is built from these. */
export function Field({ label, htmlFor, help, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('gl-field', className)}>
      <label className="gl-label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="gl-help text-[#f0a094]" role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="gl-help">{help}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('gl-input', className)} {...props} />
))
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn('gl-select', className)} {...props} />
))
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('gl-textarea', className)} {...props} />
))
Textarea.displayName = 'Textarea'

/** Row of actions under a form, separated by a rule. */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('gl-form-actions', className)}>{children}</div>
}
