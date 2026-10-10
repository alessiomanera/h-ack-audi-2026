// Demo panel, visible only with ?demo=1: switch persona, simulate Audi events, reset the demo.
// A simulated service opens the courtesy car moment: the car you drive while yours is in the workshop.
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChevronDown, LoaderCircle, RotateCcw, Wrench } from 'lucide-react'
import type { ActionRequest, ActionResult, PersonaId, ServiceKind } from '@/shared/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn, formatPoints } from '@/lib/utils'
import { useSession } from '@/state/session'
import { getAction, getLevel, program } from '../program'
import { sharedCopy } from './copy.it'
import { CourtesyCarCard } from './CourtesyCarCard'
import { errorMessage, firstName, useCountUp } from './hooks'

const copy = sharedCopy.demo

const PERSONA_IDS: PersonaId[] = ['paolo', 'luca', 'giulia']

interface DemoAction {
  id: string
  label: string
  req: ActionRequest
}

const ACTIONS: DemoAction[] = [
  { id: 'tagliando', label: copy.actions.tagliando, req: { type: 'service', meta: { serviceKind: 'tagliando' } } },
  { id: 'gomme', label: copy.actions.gomme, req: { type: 'service', meta: { serviceKind: 'gomme' } } },
  {
    id: 'check',
    label: copy.actions.checkInvernale,
    req: { type: 'service', meta: { serviceKind: 'check_invernale' } },
  },
  { id: 'dealer', label: copy.actions.dealer, req: { type: 'session', meta: { sessionKind: 'dealer' } } },
  {
    id: 'driving',
    label: copy.actions.driving,
    req: { type: 'session', meta: { sessionKind: 'driving_experience' } },
  },
  { id: 'event', label: copy.actions.event, req: { type: 'event', meta: { eventName: copy.eventName } } },
  { id: 'charging', label: copy.actions.charging, req: { type: 'charging' } },
  { id: 'invite', label: copy.actions.invite, req: { type: 'invite', meta: { inviteeName: copy.inviteeName } } },
]

function initiallyOpen(): boolean {
  // Expanded on desktop, collapsed bottom sheet on phones so it does not cover the view.
  if (typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(min-width: 768px)').matches
}

interface ServiceMoment {
  kind: ServiceKind
  result: ActionResult
}

function ServiceDialog({ moment, onClose }: { moment: ServiceMoment | null; onClose: () => void }) {
  return (
    <Dialog open={moment !== null} onOpenChange={(open) => !open && onClose()}>
      {moment && <ServiceDialogBody moment={moment} />}
    </Dialog>
  )
}

function ServiceDialogBody({ moment }: { moment: ServiceMoment }) {
  const c = copy.service
  const { result, kind } = moment
  const offer = result.courtesyCar
  const me = result.me
  const level = getLevel(program, me.level.current)
  const next = me.level.next ? getLevel(program, me.level.next) : null
  const total = useCountUp(me.level.points, { initial: Math.max(0, me.level.points - result.awarded), duration: 1200 })

  const service = getAction(program, 'service')
  const doubled =
    service.multiplier !== undefined && result.awarded >= service.points * service.multiplier.factor
  const title =
    result.awarded > 0 ? c.headline(c[kind], formatPoints(result.awarded)) : c.headlineNoPoints(c[kind])
  const nextBetter = next && offer && next.courtesyCar.label !== offer.rule.label ? next : null

  return (
    <DialogContent className="max-h-[90dvh] max-w-md gap-0 overflow-y-auto rounded-lg bg-card p-0">
      <div className="p-6 pb-5">
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Wrench className="size-4" aria-hidden />
          {c.eyebrow}
        </p>
        <DialogTitle className="mt-3 pr-6 font-display text-2xl font-bold leading-tight">{title}</DialogTitle>
        <DialogDescription className="mt-2">
          {doubled && service.multiplier ? `${service.multiplier.label}. ` : ''}
          <span className="tabular-nums">{c.total(formatPoints(total), level.name)}</span>
        </DialogDescription>
        {result.levelUp && (
          <span className="mt-3 inline-flex items-center rounded-sm bg-foreground px-2 py-0.5 text-xs font-bold text-background">
            {c.levelUpBadge(getLevel(program, result.levelUp).name)}
          </span>
        )}
      </div>

      {offer && (
        <>
          <Separator />
          <div className="grid gap-4 p-6">
            <p className="font-display text-lg font-bold leading-snug">
              {offer.offeredModel !== offer.ownModel
                ? c.whileInService(offer.ownModel, offer.offeredModel)
                : c.sameModel(offer.ownModel)}
            </p>
            <CourtesyCarCard offer={offer} />
            {nextBetter && (
              <p className="text-sm text-muted-foreground">{c.nextLevel(nextBetter.name, nextBetter.courtesyCar.label)}</p>
            )}
          </div>
        </>
      )}

      <div className="p-6 pt-0">
        <DialogClose asChild>
          <Button type="button" className="w-full">
            {c.close}
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  )
}

function DemoPanelBody() {
  const { status, me, loginAs, runAction, resetDemo } = useSession()
  const [open, setOpen] = useState(initiallyOpen)
  const [busy, setBusy] = useState<string | null>(null)
  const [moment, setMoment] = useState<ServiceMoment | null>(null)
  const loggedIn = status === 'authenticated' && me !== null
  const currentName = me ? firstName(me.user.name) : null

  async function run(id: string, task: () => Promise<void>) {
    setBusy(id)
    try {
      await task()
    } catch (err) {
      toast.error(errorMessage(err, sharedCopy.genericError))
    } finally {
      setBusy(null)
    }
  }

  const switchPersona = (id: PersonaId) =>
    run(`persona-${id}`, async () => {
      await loginAs(id)
      toast(copy.nowYouAre(copy.personaNames[id]))
    })

  const simulate = (action: DemoAction) =>
    run(action.id, async () => {
      const result = await runAction(action.req)
      const description = [result.entry?.label, result.notice].filter(Boolean).join('. ') || undefined
      if (result.awarded > 0) toast(copy.awarded(formatPoints(result.awarded)), { description })
      else toast(result.notice ?? copy.nothingAwarded)
      if (result.levelUp) {
        const level = getLevel(program, result.levelUp)
        toast(copy.levelUp(level.name), { description: level.tagline })
      }
      const kind = action.req.meta?.serviceKind
      if (action.req.type === 'service' && kind && result.courtesyCar) setMoment({ kind, result })
    })

  const reset = () =>
    run('reset', async () => {
      await resetDemo()
      toast(copy.resetDone)
    })

  return (
    <>
      {/* In-flow spacer: on phones the fixed bottom sheet must not cover the end of the page. */}
      <div aria-hidden className="h-14 md:hidden" />
      <aside
        aria-label={copy.title}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:inset-x-auto md:bottom-4 md:right-4 md:w-80 md:rounded-lg md:border"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? copy.collapse : copy.expand}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {copy.badge}
            </span>
            <span className="text-sm font-bold">{copy.title}</span>
          </span>
          <ChevronDown className={cn('size-4 transition-transform', open ? '' : 'rotate-180')} aria-hidden />
        </button>

        {open && (
          <div className="grid max-h-[60dvh] gap-4 overflow-y-auto border-t border-border p-4">
            <section className="grid gap-2">
              <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{copy.personas}</h3>
              <div className="grid grid-cols-3 gap-2">
                {PERSONA_IDS.map((id) => {
                  const name = copy.personaNames[id]
                  const active = currentName === name
                  return (
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      aria-pressed={active}
                      disabled={busy !== null}
                      onClick={() => void switchPersona(id)}
                    >
                      {busy === `persona-${id}` && <LoaderCircle className="animate-spin" aria-hidden />}
                      {name}
                    </Button>
                  )
                })}
              </div>
            </section>

            <section className="grid gap-2">
              <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{copy.events}</h3>
              {!loggedIn && <p className="text-xs text-muted-foreground">{copy.loginFirst}</p>}
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!loggedIn || busy !== null}
                    onClick={() => void simulate(action)}
                    className="h-auto min-h-9 whitespace-normal py-2 leading-tight"
                  >
                    {busy === action.id && <LoaderCircle className="animate-spin" aria-hidden />}
                    {action.label}
                  </Button>
                ))}
              </div>
            </section>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy !== null}
              onClick={() => void reset()}
              className="justify-self-start text-muted-foreground"
            >
              {busy === 'reset' ? <LoaderCircle className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
              {copy.reset}
            </Button>
          </div>
        )}
      </aside>
      <ServiceDialog moment={moment} onClose={() => setMoment(null)} />
    </>
  )
}

export function DemoPanel() {
  const [params] = useSearchParams()
  if (params.get('demo') !== '1') return null
  return <DemoPanelBody />
}
