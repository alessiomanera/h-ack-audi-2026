import type { MeResponse } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate, formatPoints } from '@/lib/utils'
import { getLevel, program } from '../program'
import { InviteButton } from '../shared/InviteButton'
import { portalCopy } from './copy.it'
import { Section } from './Section'

const copy = portalCopy.family

/** Section 6: the primary household, its members and invites. Points stay personal. */
export function FamilySection({ me }: { me: MeResponse }) {
  const household = me.households[0]

  if (!household) {
    return (
      <Section id="famiglia" title={copy.title} intro={copy.intro}>
        <p className="text-muted-foreground">{copy.none}</p>
      </Section>
    )
  }

  const keyName = household.members.find((m) => m.role === 'key')?.name ?? copy.keyFallback

  return (
    <Section id="famiglia" title={copy.title} intro={copy.intro}>
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b p-6">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{copy.membersLabel}</p>
              <h3 className="mt-1 text-xl font-bold">
                {copy.vehicle(household.vehicle.model, household.vehicle.year)}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {copy.slots(household.secondarySlots.used, household.secondarySlots.max)}
            </p>
          </div>
          <ul className="divide-y">
            {household.members.map((member) => (
              <li key={member.userId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {member.name}
                    {member.isMe && <Badge className="rounded-sm font-medium">{copy.me}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {portalCopy.common.levelLine(getLevel(program, member.level).name)}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-sm font-medium">
                  {copy.roles[member.role]}
                </Badge>
                <p className="w-28 text-right font-display font-bold tabular-nums">
                  {formatPoints(member.points)}{' '}
                  <span className="font-sans text-xs font-normal text-muted-foreground">
                    {portalCopy.common.points}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-4">
          {household.myRole === 'key' ? (
            <InviteButton label={copy.inviteLabel} className="w-full" />
          ) : (
            <p className="rounded-lg border p-4 text-sm">{copy.secondary(keyName)}</p>
          )}
          {household.pendingInvites.length > 0 && (
            <Card className="p-6">
              <h3 className="text-base font-bold">{copy.pendingTitle}</h3>
              <ul className="mt-3 divide-y">
                {household.pendingInvites.map((invite) => (
                  <li key={invite.code} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(invite.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="rounded-sm font-medium">
                      {copy.pending}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Section>
  )
}
