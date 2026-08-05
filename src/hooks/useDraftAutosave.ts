'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type UseDraftAutosaveOptions = {
  /** Debounce delay, in ms, before an updated value is written to the server. Default 2000. */
  debounceMs?: number
  /** When false, autosave is fully disabled (no reads, no writes). Default true. */
  enabled?: boolean
}

type UseDraftAutosaveResult<T> = {
  /** Timestamp of the most recent successful save, or null if nothing has saved yet. */
  savedAt: Date | null
  /** True while a save request is in flight. */
  isSaving: boolean
  /** Deletes the persisted draft (call after a successful submit). */
  clearDraft: () => Promise<void>
  /** Fetches any existing draft once on mount. Returns the draft payload, or null if none exists. */
  loadDraft: () => Promise<T | null>
}

/**
 * Reusable client-side autosave hook backed by /api/drafts/[formType].
 *
 * - Debounces writes of `currentValues` to the server (PUT) whenever it changes.
 * - `loadDraft()` fetches any existing draft once — call it on mount and use the
 *   result to populate the form's initial state.
 * - `clearDraft()` deletes the persisted draft — call it after a successful submit.
 * - If the user is not authenticated, the underlying API calls will 401; this hook
 *   swallows those errors quietly so autosave just becomes a no-op instead of
 *   surfacing errors to the user.
 */
export function useDraftAutosave<T>(
  formType: string,
  currentValues: T,
  options?: UseDraftAutosaveOptions
): UseDraftAutosaveResult<T> {
  const debounceMs = options?.debounceMs ?? 2000
  const enabled = options?.enabled !== false

  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadedRef = useRef(false)
  const isFirstValueRef = useRef(true)
  const unauthorizedRef = useRef(false)

  const endpoint = `/api/drafts/${encodeURIComponent(formType)}`

  const loadDraft = useCallback(async (): Promise<T | null> => {
    if (!enabled || hasLoadedRef.current) return null
    hasLoadedRef.current = true

    try {
      const response = await fetch(endpoint, { method: 'GET' })

      if (response.status === 401) {
        unauthorizedRef.current = true
        return null
      }

      if (!response.ok) return null

      const body = await response.json().catch(() => null)
      const draft = body?.draft ?? null
      return (draft?.payload as T | undefined) ?? null
    } catch {
      return null
    }
  }, [enabled, endpoint])

  const clearDraft = useCallback(async (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!enabled || unauthorizedRef.current) return

    try {
      await fetch(endpoint, { method: 'DELETE' })
      setSavedAt(null)
    } catch {
      // Best-effort — a stale draft left behind is not worth surfacing an error for.
    }
  }, [enabled, endpoint])

  useEffect(() => {
    if (!enabled || unauthorizedRef.current) return

    // Skip the very first render so we don't immediately overwrite a draft
    // that loadDraft() is about to fetch (or hasn't resolved yet).
    if (isFirstValueRef.current) {
      isFirstValueRef.current = false
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentValues),
        })

        if (response.status === 401) {
          unauthorizedRef.current = true
          return
        }

        if (response.ok) {
          setSavedAt(new Date())
        }
      } catch {
        // Network errors shouldn't interrupt the user's typing — just skip this save.
      } finally {
        setIsSaving(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValues, enabled, debounceMs, endpoint])

  return { savedAt, isSaving, clearDraft, loadDraft }
}
