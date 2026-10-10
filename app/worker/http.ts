// HTTP helpers: JSON responses, typed errors, body parsing, cookies.
import type { ApiError } from '../src/shared/types'
import { COPY } from './copy.it'

export const SESSION_COOKIE = 'awy_session'
const MAX_BODY_BYTES = 16 * 1024

/** Per-request context passed to every route handler. */
export interface Ctx {
  req: Request
  db: D1Database
  now: Date
  params: Record<string, string>
}

/** Expected failure, turned into an ApiError response by the router. */
export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Cache-Control', 'no-store')
  return Response.json(data, { ...init, headers })
}

export function errorResponse(status: number, code: string, message: string): Response {
  const body: ApiError = { error: code, message }
  return json(body, { status })
}

/** Parses a JSON object body; an empty body is treated as `{}`. */
export async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  const declared = Number(req.headers.get('Content-Length') ?? '0')
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, 'too_large', COPY.errors.tooLarge)
  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'too_large', COPY.errors.tooLarge)
  if (text.trim() === '') return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new HttpError(400, 'bad_request', COPY.errors.badJson)
  }
  if (!isRecord(parsed)) throw new HttpError(400, 'bad_request', COPY.errors.badJson)
  return parsed
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}

export function sessionCookie(token: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}
