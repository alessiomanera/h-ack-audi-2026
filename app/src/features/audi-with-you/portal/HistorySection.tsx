import type { LedgerEntry } from '@/shared/types'
import { Card } from '@/components/ui/card'
import { formatDate, formatPoints } from '@/lib/utils'
import { portalCopy } from './copy.it'
import { monthlyPoints } from './metrics'
import { Section } from './Section'

const copy = portalCopy.history

/** Section 7: points per month (plain CSS bars, neutral) and the full ledger. */
export function HistorySection({ ledger, now = new Date() }: { ledger: LedgerEntry[]; now?: Date }) {
  const buckets = monthlyPoints(ledger, now)
  const max = Math.max(1, ...buckets.map((b) => b.points))

  return (
    <Section id="storico" title={copy.title} intro={copy.intro}>
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-5">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-base font-bold">{copy.chartTitle}</h3>
            <p className="text-xs text-muted-foreground">{copy.chartHint}</p>
          </div>
          <ul className="mt-6 grid grid-cols-6 gap-2 sm:gap-3">
            {buckets.map((bucket) => (
              <li key={bucket.key} className="flex flex-col items-center gap-2">
                <span className="h-4 text-xs text-muted-foreground tabular-nums">
                  {bucket.points > 0 ? formatPoints(bucket.points) : ''}
                </span>
                <div className="flex h-32 w-full items-end border-b">
                  <div
                    className="w-full rounded-t-sm bg-foreground/70"
                    style={{ height: `${(bucket.points / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{bucket.label}</span>
                <span className="sr-only">
                  {formatPoints(bucket.points)} {portalCopy.common.points}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-7">
          <h3 className="border-b p-6 pb-4 text-base font-bold">{copy.listTitle}</h3>
          {ledger.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {ledger.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                  </div>
                  <p className="shrink-0 font-display font-bold tabular-nums">
                    {copy.points(formatPoints(entry.points))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Section>
  )
}
