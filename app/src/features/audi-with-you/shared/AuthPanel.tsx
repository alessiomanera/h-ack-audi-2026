// Sign in: "Accedi come" (demo personas), email + PIN login, signup. With ?invito=CODE the signup joins
// the inviter's family as secondary user.
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronRight, CircleAlert, LoaderCircle } from 'lucide-react'
import type { PersonaId } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useSession } from '@/state/session'
import { program } from '../program'
import { sharedCopy } from './copy.it'
import { errorMessage, firstName, useInvitePreview, usePersonas } from './hooks'

const copy = sharedCopy.auth

const MODELS = program.segments.flatMap((s) => s.models)
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 16 }, (_, i) => CURRENT_YEAR - i)
const DEFAULT_MODEL = MODELS.includes('A3') ? 'A3' : (MODELS[0] ?? '')

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm'

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4)
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-foreground">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function PersonasTab() {
  const { loginAs } = useSession()
  const { personas, loading } = usePersonas()
  const [busy, setBusy] = useState<PersonaId | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function pick(id: PersonaId) {
    setBusy(id)
    setError(null)
    try {
      await loginAs(id)
    } catch (err) {
      setError(errorMessage(err, sharedCopy.genericError))
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <p className="py-4 text-sm text-muted-foreground">{copy.personasLoading}</p>
  if (personas.length === 0) return <p className="py-4 text-sm text-muted-foreground">{copy.personasEmpty}</p>

  return (
    <div className="grid gap-2">
      {personas.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void pick(p.id)}
          className="h-auto justify-between gap-3 whitespace-normal px-4 py-3 text-left"
        >
          <span className="min-w-0">
            <span className="block font-bold">{p.name}</span>
            <span className="block text-sm font-normal text-muted-foreground">{p.tagline}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
            {sharedCopy.roles[p.role]}
            {busy === p.id ? <LoaderCircle className="animate-spin" aria-hidden /> : <ChevronRight aria-hidden />}
          </span>
        </Button>
      ))}
      <FormError message={error} />
    </div>
  )
}

function LoginTab() {
  const { login } = useSession()
  const id = useId()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) return setError(copy.pinInvalid)
    setBusy(true)
    setError(null)
    try {
      await login({ email: email.trim(), pin })
    } catch (err) {
      setError(errorMessage(err, sharedCopy.genericError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(e) => void submit(e)}>
      <Field id={`${id}-email`} label={copy.email}>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          required
          placeholder={copy.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field id={`${id}-pin`} label={copy.pin}>
        <Input
          id={`${id}-pin`}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={4}
          required
          placeholder={copy.pinPlaceholder}
          value={pin}
          onChange={(e) => setPin(onlyDigits(e.target.value))}
        />
      </Field>
      <FormError message={error} />
      <Button type="submit" disabled={busy}>
        {busy && <LoaderCircle className="animate-spin" aria-hidden />}
        {copy.loginSubmit}
      </Button>
    </form>
  )
}

function SignupTab({ inviteCode }: { inviteCode: string | null }) {
  const { signup } = useSession()
  const [, setParams] = useSearchParams()
  const id = useId()
  const invite = useInvitePreview(inviteCode, copy.inviteInactive)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [year, setYear] = useState(CURRENT_YEAR - 3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joining = invite.preview !== null && invite.preview.status === 'pending' ? invite.preview : null
  const inviteInactive = inviteCode !== null && !invite.loading && joining === null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) return setError(copy.pinInvalid)
    setBusy(true)
    setError(null)
    try {
      const base = { name: name.trim(), email: email.trim(), pin }
      if (joining) {
        await signup({ ...base, inviteCode: joining.code })
        // The invite is used: drop the param so the accept banner does not show again.
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('invito')
            return next
          },
          { replace: true },
        )
      } else {
        await signup({ ...base, vehicle: { model, year } })
      }
    } catch (err) {
      setError(errorMessage(err, sharedCopy.genericError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(e) => void submit(e)}>
      {invite.loading && <p className="text-sm text-muted-foreground">{copy.inviteLoading}</p>}
      {joining && (
        <div className="rounded-md border border-foreground/40 p-4">
          <p className="font-display text-lg font-bold">
            {copy.invitedBy(firstName(joining.inviterName), joining.vehicleModel)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.invitedBody}</p>
        </div>
      )}
      {inviteInactive && <p className="text-sm text-muted-foreground">{copy.inviteInactive}</p>}

      <Field id={`${id}-name`} label={copy.name}>
        <Input
          id={`${id}-name`}
          autoComplete="given-name"
          required
          placeholder={copy.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field id={`${id}-email`} label={copy.email}>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          required
          placeholder={copy.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field id={`${id}-pin`} label={copy.pin}>
        <Input
          id={`${id}-pin`}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={4}
          required
          placeholder={copy.pinPlaceholder}
          value={pin}
          onChange={(e) => setPin(onlyDigits(e.target.value))}
        />
      </Field>

      {!joining && (
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Field id={`${id}-model`} label={copy.model}>
            <select id={`${id}-model`} className={selectClass} value={model} onChange={(e) => setModel(e.target.value)}>
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {sharedCopy.courtesy.model(m)}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${id}-year`} label={copy.year}>
            <select
              id={`${id}-year`}
              className={selectClass}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{copy.demoWarning}</p>
      <FormError message={error} />
      <Button type="submit" disabled={busy || invite.loading}>
        {busy && <LoaderCircle className="animate-spin" aria-hidden />}
        {joining ? copy.joinSubmit : copy.signupSubmit}
      </Button>
    </form>
  )
}

export function AuthPanel({ variant = 'full' }: { variant?: 'compact' | 'full' }) {
  const [params] = useSearchParams()
  const inviteCode = params.get('invito')
  const full = variant === 'full'

  return (
    <Card data-variant={variant} className={cn('shadow-none', full ? 'p-6' : 'p-4')}>
      <h2 className={cn('font-display font-bold', full ? 'text-2xl' : 'text-xl')}>{copy.title}</h2>
      {full && <p className="mt-2 text-sm text-muted-foreground">{copy.intro}</p>}
      <Tabs defaultValue={inviteCode ? 'signup' : 'personas'} className="mt-5">
        <TabsList className="grid h-auto w-full grid-cols-3 border border-border bg-background">
          <TabsTrigger value="personas" className="data-[state=active]:bg-accent">
            {copy.tabs.personas}
          </TabsTrigger>
          <TabsTrigger value="login" className="data-[state=active]:bg-accent">
            {copy.tabs.login}
          </TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-accent">
            {copy.tabs.signup}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="personas" className="mt-4">
          <PersonasTab />
        </TabsContent>
        <TabsContent value="login" className="mt-4">
          <LoginTab />
        </TabsContent>
        <TabsContent value="signup" className="mt-4">
          <SignupTab inviteCode={inviteCode} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
