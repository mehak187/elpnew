import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Scale,
  Users,
  Inbox,
  FilePlus,
  Receipt,
  Wallet,
} from "lucide-react";
import { canView, ROLES, SECTION_KEYS as K } from "@/lib/permissions";

import { StatCard } from "@/components/shared/panels";
import {
  summaryStats,
  bottomSummary,
  money,
  CURRENT_USER,
} from "./dashboard/dashboardData";

import { QuickSearch, QuickActions, TodaysBrief } from "./dashboard/sections/TopSections";
import { TodaysHearings, UpcomingHearings } from "./dashboard/sections/HearingsSections";
import { Deadlines, AppealDeadlineAlerts } from "./dashboard/sections/DeadlinesSection";
import { MyTasks, OverdueTasks } from "./dashboard/sections/TasksSections";
import {
  UrgentActions,
  CasesRequiringAttention,
  MissingDocuments,
} from "./dashboard/sections/AlertsSections";
import {
  CourtNotifications,
  RecentCaseUpdates,
  RecentJudgments,
} from "./dashboard/sections/CourtSections";
import { CasesByStage } from "./dashboard/sections/CasesByStageSection";
import { ExecutionFollowUp } from "./dashboard/sections/ExecutionSection";
import { FinancialSnapshot, UnbilledCases } from "./dashboard/sections/FinancialSections";
import {
  CasesReceivedByClient,
  CaseFlowTrend,
  StoppedClients,
  TopClients,
  NewClients,
} from "./dashboard/sections/CaseFlowSections";
import { TeamWorkload, ClientFollowUp } from "./dashboard/sections/TeamAndClientSections";

/** Two-column row that collapses to one column, skipping any hidden child. */
function Pair({ children }) {
  const visible = children.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">{visible}</div>
  );
}

export default function Dashboard() {
  // Auth is not wired up yet, so the role is switchable here to make the
  // permission rules visible. It becomes the signed-in user's role later.
  const [role, setRole] = useState(CURRENT_USER.role);
  const can = (key) => canView(role, key);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-secondary p-2 sm:p-3">
            <LayoutDashboard className="h-5 w-5 text-secondary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">Dashboard</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Welcome back, {CURRENT_USER.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Viewing as</span>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 w-48 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick search and quick actions */}
      <div className="space-y-3">
        <QuickSearch />
        {can(K.quickActions) && <QuickActions />}
      </div>

      {can(K.brief) && <TodaysBrief currentUser={CURRENT_USER.name} />}

      {/* Top summary cards */}
      {can(K.summary) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Active Cases" value={summaryStats.activeCases.value} previous={summaryStats.activeCases.previous} to={summaryStats.activeCases.to} icon={Scale} />
          <StatCard label="Total Clients" value={summaryStats.totalClients.value} previous={summaryStats.totalClients.previous} to={summaryStats.totalClients.to} icon={Users} />
          <StatCard label="Cases Received This Month" value={summaryStats.casesReceivedThisMonth.value} previous={summaryStats.casesReceivedThisMonth.previous} to={summaryStats.casesReceivedThisMonth.to} icon={Inbox} />
          <StatCard label="New Cases This Month" value={summaryStats.newCasesThisMonth.value} previous={summaryStats.newCasesThisMonth.previous} to={summaryStats.newCasesThisMonth.to} icon={FilePlus} />
          <StatCard label="Pending Invoices" value={summaryStats.pendingInvoices.value} previous={summaryStats.pendingInvoices.previous} to={summaryStats.pendingInvoices.to} icon={Receipt} />
          <StatCard label="Outstanding Amount" value={summaryStats.outstandingAmount.value} previous={summaryStats.outstandingAmount.previous} to={summaryStats.outstandingAmount.to} icon={Wallet} format={money} />
        </div>
      )}

      <Pair>
        {can(K.todaysHearings) && <TodaysHearings key="today" />}
        {can(K.upcomingHearings) && <UpcomingHearings key="upcoming" />}
      </Pair>

      <Pair>
        {can(K.deadlines) && <Deadlines key="deadlines" />}
        {can(K.deadlines) && <AppealDeadlineAlerts key="appeals" />}
      </Pair>

      <Pair>
        {can(K.myTasks) && <MyTasks key="tasks" role={role} currentUser={CURRENT_USER.name} />}
        {can(K.overdueTasks) && <OverdueTasks key="overdue" />}
      </Pair>

      <Pair>
        {can(K.urgentActions) && <UrgentActions key="urgent" />}
        {can(K.casesAttention) && <CasesRequiringAttention key="attention" />}
      </Pair>

      <Pair>
        {can(K.missingDocuments) && <MissingDocuments key="docs" />}
        {can(K.courtNotifications) && <CourtNotifications key="notifications" />}
      </Pair>

      <Pair>
        {can(K.recentUpdates) && <RecentCaseUpdates key="updates" />}
        {can(K.recentJudgments) && <RecentJudgments key="judgments" />}
      </Pair>

      <Pair>
        {can(K.casesByStage) && <CasesByStage key="stages" />}
        {can(K.clientFollowUp) && <ClientFollowUp key="clientFollowUp" />}
      </Pair>

      {can(K.execution) && <ExecutionFollowUp />}

      {can(K.financial) && <FinancialSnapshot />}
      {can(K.unbilled) && <UnbilledCases />}

      {/* Case flow - management view of where the work is coming from */}
      {can(K.caseFlow) && (
        <>
          <CasesReceivedByClient />
          <Pair>
            <CaseFlowTrend key="trend" />
            <TopClients key="top" />
          </Pair>
          <Pair>
            <StoppedClients key="stopped" />
            <NewClients key="new" />
          </Pair>
        </>
      )}

      {can(K.teamWorkload) && <TeamWorkload />}

      {/* Bottom summary */}
      {can(K.bottomSummary) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Hearings This Month" value={bottomSummary.hearingsThisMonth.value} to={bottomSummary.hearingsThisMonth.to} />
          <StatCard label="Judgments Issued" value={bottomSummary.judgmentsIssued.value} to={bottomSummary.judgmentsIssued.to} />
          <StatCard label="Open Execution Files" value={bottomSummary.openExecutionFiles.value} to={bottomSummary.openExecutionFiles.to} />
          <StatCard label="Overdue Tasks" value={bottomSummary.overdueTasks.value} to={bottomSummary.overdueTasks.to} />
        </div>
      )}
    </div>
  );
}
