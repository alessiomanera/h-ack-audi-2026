// Audi with you API: a small hand-written router over D1. Static assets (the SPA) are served
// by the assets binding; only /api/* reaches this Worker (run_worker_first).
import { program } from '../src/features/audi-with-you/program'
import { runAction } from './actions'
import { listPersonas, login, logout, personaLogin, signup } from './auth'
import { COPY } from './copy.it'
import { buildMe } from './db'
import { HttpError, clearSessionCookie, errorResponse, json, type Ctx } from './http'
import { acceptInviteRoute, createInvite, previewInvite } from './invites'
import { ensureSeeded, resetDemo } from './seed'
import { requireUser } from './session'

type Method = 'GET' | 'POST'
type Handler = (ctx: Ctx) => Promise<Response>

interface Route {
  method: Method
  pattern: string[]
  handler: Handler
}

async function getMe(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx)
  return json(await buildMe(ctx.db, user, ctx.now))
}

async function getProgram(): Promise<Response> {
  return json(program)
}

async function demoReset(ctx: Ctx): Promise<Response> {
  await resetDemo(ctx.db, ctx.now)
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
}

const route = (method: Method, path: string, handler: Handler): Route => ({
  method,
  pattern: path.split('/').filter(Boolean),
  handler,
})

const ROUTES: Route[] = [
  route('POST', '/api/auth/signup', signup),
  route('POST', '/api/auth/login', login),
  route('POST', '/api/auth/persona', personaLogin),
  route('POST', '/api/auth/logout', logout),
  route('GET', '/api/me', getMe),
  route('GET', '/api/program', getProgram),
  route('GET', '/api/personas', listPersonas),
  route('POST', '/api/invites', createInvite),
  route('GET', '/api/invites/:code', previewInvite),
  route('POST', '/api/invites/:code/accept', acceptInviteRoute),
  route('POST', '/api/actions', runAction),
  route('POST', '/api/demo/reset', demoReset),
]

function match(pattern: string[], segments: string[]): Record<string, string> | null {
  if (pattern.length !== segments.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i]
    if (p.startsWith(':')) {
      try {
        params[p.slice(1)] = decodeURIComponent(segments[i])
      } catch {
        return null
      }
    } else if (p !== segments[i]) {
      return null
    }
  }
  return params
}

async function handle(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const segments = url.pathname.split('/').filter(Boolean)
  let pathMatched = false
  for (const r of ROUTES) {
    const params = match(r.pattern, segments)
    if (!params) continue
    pathMatched = true
    if (r.method !== req.method) continue
    const ctx: Ctx = { req, db: env.DB, now: new Date(), params }
    // A fresh deploy only needs migrations: the demo data seeds itself on first use.
    if (r.handler !== demoReset && r.handler !== getProgram) await ensureSeeded(ctx.db, ctx.now)
    return r.handler(ctx)
  }
  return pathMatched
    ? errorResponse(405, 'method_not_allowed', COPY.errors.methodNotAllowed)
    : errorResponse(404, 'not_found', COPY.errors.notFound)
}

export default {
  async fetch(req, env): Promise<Response> {
    try {
      return await handle(req, env)
    } catch (err) {
      if (err instanceof HttpError) return errorResponse(err.status, err.code, err.message)
      const url = new URL(req.url)
      console.error(
        JSON.stringify({
          message: 'unhandled API error',
          method: req.method,
          path: url.pathname,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        }),
      )
      return errorResponse(500, 'internal', COPY.errors.internal)
    }
  },
} satisfies ExportedHandler<Env>
