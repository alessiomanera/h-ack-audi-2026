// Invite a family member as secondary user: dialog with email, then a share link.
// Only the key user of the primary household can invite.
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Check, Copy, LoaderCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPoints } from '@/lib/utils'
import { useSession } from '@/state/session'
import { getAction, program } from '../program'
import { sharedCopy } from './copy.it'
import { errorMessage } from './hooks'

const copy = sharedCopy.invite

export function InviteButton({ className, label }: { className?: string; label?: string }) {
  const { me, createInvite } = useSession()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const household = me?.households[0]
  const slots = household?.secondarySlots
  const reason = !me || !household
    ? copy.reasonAnonymous
    : household.myRole !== 'key'
      ? copy.reasonSecondary
      : slots && slots.used >= slots.max
        ? copy.reasonFull
        : null
  const text = label ?? copy.label

  if (reason || !household || !slots) {
    return (
      // display: contents keeps the caller's layout classes (mt-auto, w-full) working on the button.
      <div className="contents">
        <Button type="button" variant="outline" disabled className={className}>
          <UserPlus aria-hidden />
          {text}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">{reason}</p>
      </div>
    )
  }

  function reset() {
    setEmail('')
    setLink(null)
    setCopied(false)
    setError(null)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await createInvite(email.trim())
      setLink(`${window.location.origin}${res.link}`)
      toast(copy.created, { description: res.invite.email })
    } catch (err) {
      setError(errorMessage(err, sharedCopy.genericError))
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast(copy.copied)
    } catch {
      toast(copy.copyFailed)
    }
  }

  const invitePoints = formatPoints(getAction(program, 'invite').points)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" className={className}>
          <UserPlus aria-hidden />
          {text}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">{copy.title}</DialogTitle>
          <DialogDescription>{copy.body(household.vehicle.model, invitePoints)}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-foreground">{copy.slots(slots.used, slots.max)}</p>

        {link ? (
          <div className="grid gap-3">
            <Label htmlFor={`${id}-link`}>{copy.linkLabel}</Label>
            <div className="flex gap-2">
              <Input id={`${id}-link`} readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} aria-label={copy.copy}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              </Button>
            </div>
            <Button type="button" variant="ghost" onClick={reset}>
              {copy.another}
            </Button>
          </div>
        ) : (
          <form className="grid gap-3" onSubmit={(e) => void submit(e)}>
            <Label htmlFor={`${id}-email`}>{copy.email}</Label>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="off"
              required
              placeholder={copy.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm text-foreground">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" aria-hidden />}
              {copy.submit}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
