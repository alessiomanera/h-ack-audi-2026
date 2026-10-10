// Small data hooks for the shared components. They call the typed api client, never fetch directly.
import { useEffect, useRef, useState } from 'react'
import type { InvitePreview, Persona } from '@/shared/types'
import { api, ApiRequestError } from '@/state/api'

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiRequestError && err.message ? err.message : fallback
}

/** Seeded demo personas for "Accedi come". Empty list when the server does not answer. */
export function usePersonas(): { personas: Persona[]; loading: boolean } {
  const [state, setState] = useState<{ personas: Persona[]; loading: boolean }>({ personas: [], loading: true })
  useEffect(() => {
    let alive = true
    api
      .personas()
      .then((personas) => {
        if (alive) setState({ personas, loading: false })
      })
      .catch(() => {
        if (alive) setState({ personas: [], loading: false })
      })
    return () => {
      alive = false
    }
  }, [])
  return state
}

interface PreviewState {
  code: string | null
  preview: InvitePreview | null
  error: string | null
}

/** Preview of an invite code from ?invito=. Pass null to skip the request. */
export function useInvitePreview(
  code: string | null,
  fallbackError: string,
): { preview: InvitePreview | null; error: string | null; loading: boolean } {
  const [state, setState] = useState<PreviewState>({ code: null, preview: null, error: null })
  useEffect(() => {
    if (!code) return
    let alive = true
    api
      .previewInvite(code)
      .then((preview) => {
        if (alive) setState({ code, preview, error: null })
      })
      .catch((err: unknown) => {
        if (alive) setState({ code, preview: null, error: errorMessage(err, fallbackError) })
      })
    return () => {
      alive = false
    }
  }, [code, fallbackError])
  if (!code) return { preview: null, error: null, loading: false }
  if (state.code !== code) return { preview: null, error: null, loading: true }
  return { preview: state.preview, error: state.error, loading: false }
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Animated number: counts from the previous value (or `initial`) to `target` with requestAnimationFrame.
 * Jumps straight to the target when the user prefers reduced motion.
 */
export function useCountUp(target: number, { initial, duration = 900 }: { initial?: number; duration?: number } = {}): number {
  const [display, setDisplay] = useState(initial ?? target)
  const fromRef = useRef(initial ?? target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    if (prefersReducedMotion() || typeof window.requestAnimationFrame !== 'function') {
      fromRef.current = target
      setDisplay(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = Math.round(from + (target - from) * eased)
      fromRef.current = value
      setDisplay(value)
      if (t < 1) raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}
