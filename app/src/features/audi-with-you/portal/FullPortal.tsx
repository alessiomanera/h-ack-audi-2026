// The full version of Audi with you: same program as the mobile tab, with more space and metrics.
import type { MeResponse } from '@/shared/types'
import { useSession } from '@/state/session'
import { program } from '../program'
import { AuthPanel } from '../shared/AuthPanel'
import { portalCopy } from './copy.it'
import { FamilySection } from './FamilySection'
import { HistorySection } from './HistorySection'
import { LevelSection } from './LevelSection'
import {
  EarnPointsSection,
  ExperiencesSection,
  HowItWorksSection,
  LevelsSection,
  PassageSection,
  RulesSection,
} from './ProgramSections'
import type { PortalSectionId } from './Section'
import { TopBar } from './TopBar'

const AUTHENTICATED_NAV: PortalSectionId[] = ['livello', 'punti', 'livelli', 'esperienze', 'famiglia', 'storico']
const ANONYMOUS_NAV: PortalSectionId[] = ['come-funziona', 'punti', 'livelli', 'esperienze', 'passaggio', 'regolamento']

export function FullPortal() {
  const { status, me } = useSession()
  const signedIn = status === 'authenticated' && me !== null
  const nav = status === 'loading' ? [] : signedIn ? AUTHENTICATED_NAV : ANONYMOUS_NAV

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TopBar sections={nav} />
      <main id="inizio" className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6">
        {status === 'loading' ? (
          <PortalSkeleton />
        ) : me && signedIn ? (
          <AuthenticatedContent me={me} />
        ) : (
          <AnonymousContent />
        )}
      </main>
      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-8 text-xs text-subtle sm:px-6">{portalCopy.footer}</p>
      </footer>
    </div>
  )
}

function AuthenticatedContent({ me }: { me: MeResponse }) {
  return (
    <>
      <h1 className="sr-only">{program.name}</h1>
      <LevelSection me={me} />
      <HowItWorksSection />
      <EarnPointsSection />
      <LevelsSection currentLevel={me.level.current} />
      <ExperiencesSection userLevel={me.level.current} />
      <FamilySection me={me} />
      <HistorySection ledger={me.ledger} />
      <PassageSection me={me} />
      <RulesSection />
    </>
  )
}

function AnonymousContent() {
  const copy = portalCopy.hero
  return (
    <>
      <section
        aria-labelledby="hero-titolo"
        className="grid gap-10 py-12 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-20"
      >
        <div className="space-y-6 lg:col-span-7">
          <p className="text-sm tracking-widest text-muted-foreground uppercase">{copy.eyebrow}</p>
          <h1 id="hero-titolo" className="text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
            {program.claim}
          </h1>
          {copy.lines.map((line) => (
            <p key={line} className="max-w-xl text-lg text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
        <div className="lg:col-span-5">
          <AuthPanel variant="full" />
        </div>
      </section>
      <HowItWorksSection />
      <EarnPointsSection />
      <LevelsSection currentLevel={null} />
      <ExperiencesSection userLevel={null} />
      <PassageSection me={null} />
      <RulesSection />
    </>
  )
}

function PortalSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6 py-12">
      <p className="sr-only" role="status">
        {portalCopy.loading}
      </p>
      <div className="h-10 w-2/3 animate-pulse rounded-md bg-card" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-56 animate-pulse rounded-lg bg-card lg:col-span-7" />
        <div className="h-56 animate-pulse rounded-lg bg-card lg:col-span-5" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    </div>
  )
}
