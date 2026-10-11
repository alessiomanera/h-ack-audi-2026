// The courtesy car the user gets at their level. Neutral card with a chalk highlight, never lava.
import { CarFront, Zap } from 'lucide-react'
import type { CourtesyCarOffer } from '@/shared/types'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { sharedCopy } from './copy.it'

const copy = sharedCopy.courtesy

export function CourtesyCarCard({ offer }: { offer: CourtesyCarOffer }) {
  const upgraded = offer.offeredModel !== offer.ownModel
  return (
    <Card className="border-foreground/40 p-5 shadow-none">
      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <CarFront className="size-4" aria-hidden />
        {copy.eyebrow}
      </p>
      <p className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">{copy.model(offer.offeredModel)}</p>
      {upgraded && <p className="mt-1 text-sm text-muted-foreground">{copy.insteadOf(offer.ownModel)}</p>}

      <Separator className="my-4" />

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-sm bg-foreground px-2 py-0.5 text-xs font-bold text-background">
          {offer.rule.label}
        </span>
        {offer.rule.electricWhenAvailable && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-xs text-foreground">
            <Zap className="size-3" aria-hidden />
            {copy.electric}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{offer.rule.description}</p>
    </Card>
  )
}
