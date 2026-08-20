import { Users, PhoneCall } from "lucide-react";
import { SectionCard, Row, PriorityDot, EmptyState } from "../widgets";
import { teamWorkload, clientFollowUp } from "../dashboardData";

/** Requirement 27 - who is carrying how much. */
export function TeamWorkload() {
  return (
    <SectionCard title="Team Workload" icon={Users}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Employee</th>
              <th className="pb-2 text-right font-medium">Active Cases</th>
              <th className="pb-2 text-right font-medium">Pending Tasks</th>
              <th className="pb-2 text-right font-medium">Overdue</th>
              <th className="pb-2 text-right font-medium">Hearings This Week</th>
              <th className="pb-2 text-right font-medium">Deadlines</th>
            </tr>
          </thead>
          <tbody>
            {teamWorkload.map((member) => (
              <tr key={member.name} className="border-b last:border-0">
                <td className="py-2">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </td>
                <td className="py-2 text-right font-semibold">
                  {member.activeCases}
                </td>
                <td className="py-2 text-right">{member.pendingTasks}</td>
                <td className="py-2 text-right">
                  <span
                    className={
                      member.overdueTasks > 0
                        ? "font-semibold text-red-600"
                        : "text-muted-foreground"
                    }
                  >
                    {member.overdueTasks}
                  </span>
                </td>
                <td className="py-2 text-right">{member.hearingsThisWeek}</td>
                <td className="py-2 text-right">{member.upcomingDeadlines}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/** Requirement 17 */
export function ClientFollowUp() {
  return (
    <SectionCard title="Client Follow-up" icon={PhoneCall}>
      <div className="space-y-3">
        {clientFollowUp.length === 0 && (
          <EmptyState>No client action outstanding.</EmptyState>
        )}
        {clientFollowUp.map((item) => (
          <Row key={item.id} to="/clients">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.client}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.reason}
                {item.caseNo && " · " + item.caseNo}
              </p>
            </div>
            <PriorityDot level={item.priority} />
          </Row>
        ))}
      </div>
    </SectionCard>
  );
}
