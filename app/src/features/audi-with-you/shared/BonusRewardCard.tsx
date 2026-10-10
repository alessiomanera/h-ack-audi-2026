// The bonus reward (the custom wrap) shown as a highlighted card in chalk tones, never lava.
// The image is optional: when the file is missing or fails to load it is hidden, never shown broken.
// Bonus rewards are unlocked by level and assigned by early access: they are never redeemed with points.
import { useState, type ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import type { ProgramReward } from '@/shared/types'
import { cn } from '@/lib/utils'
import { sharedCopy } from './copy.it'

const copy = sharedCopy.bonus

function useImage(src: string | undefined): { src: string | null; onError: () => void } {
  // Remember which source failed, so a new image path gets its own chance to load.
  const [failed, setFailed] = useState<string | null>(null)
  return {
    src: src && failed !== src ? src : null,
    onError: () => setFailed(src ?? null),
  }
}

export function BonusRewardCard({
  reward,
  levelName,
  variant = 'card',
  action,
}: {
  reward: ProgramReward
  levelName: string
  variant?: 'card' | 'teaser'
  /** Card variant only: the claim button, "Prenotato" or "Si sblocca a" (RewardClaimAction). */
  action?: ReactNode
}) {
  const image = useImage(reward.image)

  if (variant === 'teaser') {
    return (
      <article
        aria-label={reward.title}
        data-variant="teaser"
        className="flex items-center gap-3 rounded-lg border border-foreground/40 bg-card p-3 text-card-foreground"
      >
        {image.src ? (
          <img
            src={image.src}
            alt={copy.imageAlt(reward.title)}
            onError={image.onError}
            loading="lazy"
            className="size-12 shrink-0 rounded-sm border border-border object-cover"
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-border">
            <Sparkles className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{copy.eyebrow}</p>
          <p className="truncate text-sm font-bold">{reward.title}</p>
          <p className="truncate text-xs text-muted-foreground">{copy.unlocksAt(levelName)}</p>
        </div>
      </article>
    )
  }

  return (
    <article
      aria-label={reward.title}
      data-variant="card"
      className="overflow-hidden rounded-lg border border-foreground/40 bg-card text-card-foreground"
    >
      {image.src && (
        <img
          src={image.src}
          alt={copy.imageAlt(reward.title)}
          onError={image.onError}
          loading="lazy"
          className="aspect-[16/9] w-full border-b border-border object-cover"
        />
      )}
      <div className={cn('p-5', image.src ? 'pt-4' : '')}>
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Sparkles className="size-4" aria-hidden />
          {copy.eyebrow}
        </p>
        <h3 className="mt-3 text-balance font-display text-2xl font-bold leading-tight">{reward.title}</h3>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">{reward.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-sm bg-foreground px-2 py-0.5 text-xs font-bold text-background">
            {copy.unlocksAt(levelName)}
          </span>
        </div>
        {reward.limited && <p className="mt-3 text-pretty text-sm text-foreground">{copy.limited}</p>}
        {reward.note && <p className="mt-2 text-pretty text-xs text-muted-foreground">{reward.note}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </article>
  )
}
