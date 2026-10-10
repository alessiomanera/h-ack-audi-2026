// Logged-in user opening an invite link (?invito=CODE): offer to join that family as secondary user.
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { LoaderCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSession } from '@/state/session'
import { sharedCopy } from './copy.it'
import { errorMessage, firstName, useInvitePreview } from './hooks'

const copy = sharedCopy.banner

export function InviteAcceptBanner() {
  const [params, setParams] = useSearchParams()
  const { status, acceptInvite } = useSession()
  const code = params.get('invito')
  const active = status === 'authenticated' && code !== null
  const invite = useInvitePreview(active ? code : null, copy.invalid)
  const [busy, setBusy] = useState(false)

  if (!active || !code) return null

  function dismiss() {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('invito')
        return next
      },
      { replace: true },
    )
  }

  async function accept(inviteCode: string) {
    setBusy(true)
    try {
      await acceptInvite(inviteCode)
      toast(copy.accepted)
      dismiss()
    } catch (err) {
      toast.error(errorMessage(err, sharedCopy.genericError))
    } finally {
      setBusy(false)
    }
  }

  const preview = invite.preview
  const usable = preview !== null && preview.status === 'pending'

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4">
      <Card role="region" aria-label={copy.accept} className="border-foreground/40 p-4 shadow-none md:p-5">
        {invite.loading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : usable ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <p className="font-display text-lg font-bold leading-snug">
                  {copy.title(firstName(preview.inviterName), preview.vehicleModel)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="ghost" onClick={dismiss} disabled={busy}>
                {copy.dismiss}
              </Button>
              <Button type="button" onClick={() => void accept(preview.code)} disabled={busy}>
                {busy && <LoaderCircle className="animate-spin" aria-hidden />}
                {copy.accept}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{invite.error ?? copy.invalid}</p>
            <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
              {copy.dismiss}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
