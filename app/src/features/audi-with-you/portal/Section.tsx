import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PortalSectionId =
  | 'livello'
  | 'premi'
  | 'come-funziona'
  | 'punti'
  | 'livelli'
  | 'esperienze'
  | 'famiglia'
  | 'storico'
  | 'passaggio'
  | 'regolamento'

/** One anchored block of the full version, with an h2 title and an optional intro line. */
export function Section({
  id,
  title,
  intro,
  className,
  children,
}: {
  id: PortalSectionId
  title: string
  intro?: string
  className?: string
  children: ReactNode
}) {
  const titleId = `${id}-titolo`
  return (
    <section id={id} aria-labelledby={titleId} className={cn('scroll-mt-20 border-t py-12 lg:py-16', className)}>
      <div className="mb-8 max-w-2xl space-y-2">
        <h2 id={titleId} className="text-2xl font-bold sm:text-3xl">
          {title}
        </h2>
        {intro && <p className="text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </section>
  )
}
