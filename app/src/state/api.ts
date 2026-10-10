// Typed fetch client for the Worker API. No UI here.
import type {
  ActionRequest,
  ActionResult,
  ApiError,
  CreateInviteRequest,
  CreateInviteResponse,
  InvitePreview,
  LoginRequest,
  MeResponse,
  Persona,
  PersonaId,
  Program,
  SignupRequest,
} from '@/shared/types'

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, body: ApiError) {
    super(body.message)
    this.status = status
    this.code = body.error
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    let err: ApiError = { error: 'http_error', message: 'Qualcosa non ha funzionato. Riprova.' }
    try {
      err = (await res.json()) as ApiError
    } catch {
      // keep the generic message
    }
    throw new ApiRequestError(res.status, err)
  }
  return (await res.json()) as T
}

export const api = {
  me: () => request<MeResponse>('GET', '/api/me'),
  program: () => request<Program>('GET', '/api/program'),
  personas: () => request<Persona[]>('GET', '/api/personas'),
  signup: (body: SignupRequest) => request<MeResponse>('POST', '/api/auth/signup', body),
  login: (body: LoginRequest) => request<MeResponse>('POST', '/api/auth/login', body),
  loginAs: (personaId: PersonaId) => request<MeResponse>('POST', '/api/auth/persona', { personaId }),
  logout: () => request<{ ok: true }>('POST', '/api/auth/logout'),
  createInvite: (body: CreateInviteRequest) => request<CreateInviteResponse>('POST', '/api/invites', body),
  previewInvite: (code: string) => request<InvitePreview>('GET', `/api/invites/${encodeURIComponent(code)}`),
  acceptInvite: (code: string) => request<MeResponse>('POST', `/api/invites/${encodeURIComponent(code)}/accept`),
  runAction: (body: ActionRequest) => request<ActionResult>('POST', '/api/actions', body),
  resetDemo: () => request<{ ok: true }>('POST', '/api/demo/reset'),
}
