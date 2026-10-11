// Single page, two views of the same program:
// - TabView: the simplified mobile view (meant to live in the myAudi customizable section);
// - FullPortal: the full version, with more space and metrics.
// Default: TabView under 768px, FullPortal above. Force with ?vista=tab or ?vista=completa.
// ?vista=tab on a desktop shows the TabView inside a phone-width frame (for the pitch).
import { useSearchParams } from 'react-router'
import { useMediaQuery } from '@/state/useMediaQuery'
import { DemoPanel } from './shared/DemoPanel'
import { InviteAcceptBanner } from './shared/InviteAcceptBanner'
import { FullPortal } from './portal/FullPortal'
import { TabView } from './tab/TabView'

export type ViewMode = 'tab' | 'completa'

export function useViewMode(): { mode: ViewMode; forced: boolean; isDesktop: boolean } {
  const [params] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const forced = params.get('vista')
  if (forced === 'tab' || forced === 'completa') return { mode: forced, forced: true, isDesktop }
  return { mode: isDesktop ? 'completa' : 'tab', forced: false, isDesktop }
}

export function AudiWithYouPage() {
  const { mode, isDesktop } = useViewMode()
  return (
    <>
      <InviteAcceptBanner />
      {mode === 'tab' ? <TabView framed={isDesktop} /> : <FullPortal />}
      <DemoPanel />
    </>
  )
}
