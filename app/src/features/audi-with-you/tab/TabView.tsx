// Simplified mobile view of Audi with you, as a section of the myAudi app.
// The chrome follows the Stitch mockup (brand/assets/stitch): a header with the section title, a chevron,
// "myAudi" below and an avatar circle; on a desktop frame also the bottom navigation pill with the
// section's star highlighted. Neutral tones only: the single lava element stays the LevelCard fill.
// framed=false: real phone, full width. framed=true: phone-sized frame on a desktop (projector).
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowRight,
  AudioLines,
  BatteryFull,
  Car,
  ChevronRight,
  Globe,
  Navigation,
  ShoppingBag,
  Star,
  User,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MeResponse } from '@/shared/types'
import { useSession } from '@/state/session'
import { program } from '../program'
import { AuthPanel } from '../shared/AuthPanel'
import { bookingCopy } from '../shared/booking.copy.it'
import { LevelCard } from '../shared/LevelCard'
import { MyBookings } from '../shared/MyBookings'
import { tabCopy } from './copy.it'
import { firstName, fullVersionSearch } from './model'
import {
  ActionTiles,
  BonusTeaser,
  LevelRewards,
  NextRewardSection,
  RecentPoints,
  TabHeader,
} from './TabSections'

const phone = bookingCopy.phone

function useFullVersionSearch(): string {
  const [params] = useSearchParams()
  return fullVersionSearch(params)
}

function Footer() {
  return (
    <div className="space-y-1 pt-2 text-center text-[11px] text-subtle">
      <p>{tabCopy.footer}</p>
      <p data-testid="prototype-note" className="text-pretty">
        {tabCopy.prototypeNote}
      </p>
    </div>
  )
}

/** myAudi section header: title with chevron, "myAudi" below, avatar circle on the right. */
function MyAudiHeader() {
  const { me } = useSession()
  const initial = me ? firstName(me.user.name).charAt(0).toUpperCase() : null
  return (
    <header className="flex items-start justify-between gap-3 pb-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-1 text-xl font-bold leading-tight">
          {program.name}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">{phone.subtitle}</p>
      </div>
      <span
        aria-hidden
        title={phone.profile}
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-bold"
      >
        {initial ?? <User className="size-5 text-muted-foreground" />}
      </span>
    </header>
  )
}

const NAV: { key: keyof typeof phone.nav; Icon: LucideIcon; active?: boolean }[] = [
  { key: 'car', Icon: Car },
  { key: 'navigation', Icon: Navigation },
  { key: 'voice', Icon: AudioLines },
  { key: 'program', Icon: Star, active: true },
  { key: 'discover', Icon: Globe },
  { key: 'shop', Icon: ShoppingBag },
]

/** myAudi bottom navigation pill (decorative except for the current section). */
function MyAudiNav({ className }: { className?: string }) {
  return (
    <nav aria-label={phone.navLabel} className={className}>
      <ul className="flex h-16 items-center justify-between rounded-full border border-border bg-card/95 px-2 backdrop-blur">
        {NAV.map(({ key, Icon, active }) => (
          <li key={key} className="flex flex-1 justify-center">
            <span
              aria-current={active ? 'page' : undefined}
              data-active={active === true}
              className={cn(
                'flex size-11 items-center justify-center rounded-full',
                active ? 'bg-accent text-foreground ring-1 ring-foreground/10' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" fill={active ? 'currentColor' : 'none'} aria-hidden />
              <span className="sr-only">{phone.nav[key]}</span>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function StatusBar() {
  return (
    <div aria-hidden className="flex items-center justify-between px-7 pb-1 pt-3 text-xs font-bold">
      <span className="tabular-nums">9:30</span>
      <span className="size-3 rounded-full border border-border bg-background" />
      <span className="flex items-center gap-1.5">
        <span className="flex h-3 items-end gap-px">
          {[40, 60, 80, 100].map((h) => (
            <span key={h} className="w-0.5 rounded-full bg-foreground" style={{ height: `${h}%` }} />
          ))}
        </span>
        <Wifi className="size-3.5" />
        <BatteryFull className="size-4" />
      </span>
    </div>
  )
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
        <h2 className="text-2xl font-bold leading-tight">{program.claim}</h2>
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
      <LevelRewards me={me} />
      <MyBookings bookings={me.bookings ?? []} />
      <BonusTeaser />
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
        className="relative flex h-[min(820px,calc(100dvh-4rem))] w-[390px] max-w-full flex-col overflow-hidden rounded-[44px] border border-border bg-background"
      >
        <StatusBar />
        <div className="px-5 pt-3">
          <MyAudiHeader />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
        <MyAudiNav className="absolute inset-x-3 bottom-5" />
        <span aria-hidden className="absolute bottom-1.5 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-foreground/40" />
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
      <MyAudiHeader />
      <TabContent />
    </main>
  )
}
