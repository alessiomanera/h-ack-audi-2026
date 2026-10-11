import { LogOut, Smartphone } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useSession } from '@/state/session'
import { program } from '../program'
import { bookingCopy } from '../shared/booking.copy.it'
import { portalCopy } from './copy.it'
import type { PortalSectionId } from './Section'

const copy = portalCopy.topBar

function navLabel(id: PortalSectionId): string {
  return id === 'premi' ? bookingCopy.myBookings.nav : portalCopy.nav[id]
}

/** Sticky bar: program name, section anchors (desktop), user name, "Esci" and the link to the mobile view. */
export function TopBar({ sections }: { sections: PortalSectionId[] }) {
  const { status, me, logout } = useSession()
  const [params] = useSearchParams()
  const mobileParams = new URLSearchParams(params)
  mobileParams.set('vista', 'tab')

  const handleLogout = () => {
    logout().catch(() => toast.error(copy.logoutError))
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#inizio" className="shrink-0 font-display text-base font-bold whitespace-nowrap">
          {program.name}
        </a>
        {sections.length > 0 && (
          <nav aria-label={copy.navLabel} className="hidden items-center gap-5 lg:flex">
            {sections.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
              >
                {navLabel(id)}
              </a>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {status === 'authenticated' && me && (
            <span className="hidden text-sm font-medium sm:inline">{me.user.name}</span>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={{ search: `?${mobileParams.toString()}` }} aria-label={copy.mobileView}>
              <Smartphone aria-hidden />
              <span className="hidden sm:inline">{copy.mobileView}</span>
            </Link>
          </Button>
          {status === 'authenticated' && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut aria-hidden />
              {copy.logout}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
