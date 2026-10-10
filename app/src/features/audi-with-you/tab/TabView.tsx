// Simplified mobile view of Audi with you. In the real product it lives in the customizable
// section of the myAudi app: the presenter explains that by voice, so no myAudi chrome here.
// framed=false: real phone, full width. framed=true: phone-sized frame on a desktop (projector).
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MeResponse } from '@/shared/types'
import { useSession } from '@/state/session'
import { program } from '../program'
import { AuthPanel } from '../shared/AuthPanel'
import { LevelCard } from '../shared/LevelCard'
import { tabCopy } from './copy.it'
import { fullVersionSearch } from './model'
import { ActionTiles, NextRewardSection, RecentPoints, TabHeader } from './TabSections'

function useFullVersionSearch(): string {
  const [params] = useSearchParams()
  return fullVersionSearch(params)
}

function Footer() {
  return <p className="pt-2 text-center text-[11px] text-subtle">{tabCopy.footer}</p>
}

function LoadingState() {
  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only" role="status">
        {tabCopy.loading}
      </span>
      <div className="h-6 w-40 animate-pulse rounded-sm bg-card" />
      <div className="h-4 w-56 animate-pulse rounded-sm bg-card" />
      <div className="h-40 animate-pulse rounded-lg bg-card" />
      <div className="h-28 animate-pulse rounded-lg bg-card" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-40 animate-pulse rounded-lg bg-card" />
        <div className="h-40 animate-pulse rounded-lg bg-card" />
      </div>
    </div>
  )
}

function AnonymousState() {
  const search = useFullVersionSearch()
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{program.name}</p>
        <h1 className="text-2xl font-bold leading-tight">{program.claim}</h1>
        <p className="text-sm text-muted-foreground">{tabCopy.anonymous.intro}</p>
      </header>
      <AuthPanel variant="compact" />
      <Link
        to={{ search }}
        className="flex min-h-11 items-center justify-center gap-2 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {tabCopy.anonymous.discover}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
      <Footer />
    </div>
  )
}

function AuthenticatedState({ me }: { me: MeResponse }) {
  const search = useFullVersionSearch()
  return (
    <div className="space-y-6">
      <TabHeader me={me} />
      <LevelCard me={me} variant="compact" />
      <NextRewardSection me={me} />
      <ActionTiles me={me} />
      <RecentPoints me={me} />
      <div className="space-y-2">
        <Button asChild size="lg" className="h-12 w-full justify-between px-5">
          <Link to={{ search }}>
            {tabCopy.cta.button}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">{tabCopy.cta.hint}</p>
      </div>
      <Footer />
    </div>
  )
}

function TabContent() {
  const { status, me } = useSession()
  if (status === 'anonymous') return <AnonymousState />
  if (status === 'authenticated' && me) return <AuthenticatedState me={me} />
  return <LoadingState />
}

function PhoneFrame({ children }: { children: ReactNode }) {
  const search = useFullVersionSearch()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-8 lg:flex-row lg:gap-12">
      <div
        role="region"
        aria-label={tabCopy.frame.caption}
        className="h-[min(780px,calc(100dvh-4rem))] w-[390px] max-w-full overflow-y-auto overscroll-contain rounded-[28px] border border-border bg-background [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="px-4 pb-6 pt-8">{children}</div>
      </div>
      <aside className="max-w-xs space-y-3 text-center lg:text-left">
        <p className="text-sm text-foreground">{tabCopy.frame.caption}</p>
        <p className="text-xs text-muted-foreground">{tabCopy.frame.note}</p>
        <Link
          to={{ search }}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {tabCopy.frame.link}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </aside>
    </main>
  )
}

export function TabView({ framed }: { framed: boolean }) {
  if (framed) {
    return (
      <PhoneFrame>
        <TabContent />
      </PhoneFrame>
    )
  }
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.25rem)]">
      <TabContent />
    </main>
  )
}
