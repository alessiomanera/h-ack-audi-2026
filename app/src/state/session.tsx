// Client session state: who is logged in and their MeResponse. UI components read it with useSession().
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  ActionRequest,
  ActionResult,
  BookingRequest,
  BookingResponse,
  CreateInviteResponse,
  LoginRequest,
  MeResponse,
  PersonaId,
  SignupRequest,
} from '@/shared/types'
import { api, ApiRequestError } from './api'

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated'

export interface SessionValue {
  status: SessionStatus
  me: MeResponse | null
  refresh: () => Promise<void>
  login: (req: LoginRequest) => Promise<void>
  signup: (req: SignupRequest) => Promise<void>
  loginAs: (personaId: PersonaId) => Promise<void>
  logout: () => Promise<void>
  /** Simulates an Audi event (demo panel). Updates `me` with the result. */
  runAction: (req: ActionRequest) => Promise<ActionResult>
  createInvite: (email: string) => Promise<CreateInviteResponse>
  acceptInvite: (code: string) => Promise<void>
  /** Re-seeds the demo data on the server and logs out. */
  resetDemo: () => Promise<void>
  /** Books a reward of a reached level. Updates `me` (points unchanged, new booking listed). */
  bookReward: (req: BookingRequest) => Promise<BookingResponse>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [status, setStatus] = useState<SessionStatus>('loading')

  const apply = useCallback((next: MeResponse | null) => {
    setMe(next)
    setStatus(next ? 'authenticated' : 'anonymous')
  }, [])

  const refresh = useCallback(async () => {
    try {
      apply(await api.me())
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) apply(null)
      else throw err
    }
  }, [apply])

  useEffect(() => {
    refresh().catch(() => apply(null))
  }, [refresh, apply])

  const value = useMemo<SessionValue>(
    () => ({
      status,
      me,
      refresh,
      login: async (req) => apply(await api.login(req)),
      signup: async (req) => apply(await api.signup(req)),
      loginAs: async (personaId) => apply(await api.loginAs(personaId)),
      logout: async () => {
        await api.logout()
        apply(null)
      },
      runAction: async (req) => {
        const result = await api.runAction(req)
        apply(result.me)
        return result
      },
      createInvite: async (email) => {
        const res = await api.createInvite({ email })
        await refresh()
        return res
      },
      acceptInvite: async (code) => apply(await api.acceptInvite(code)),
      resetDemo: async () => {
        await api.resetDemo()
        apply(null)
      },
      bookReward: async (req) => {
        const res = await api.postBooking(req)
        apply(res.me)
        return res
      },
    }),
    [status, me, refresh, apply],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}

/** Test helper: provide a fixed session value without a server. */
export function SessionTestProvider({ value, children }: { value: SessionValue; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
