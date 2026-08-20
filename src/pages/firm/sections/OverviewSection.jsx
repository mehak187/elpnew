import { Briefcase, Users, Wallet, Landmark, FileText } from "lucide-react";
import { SectionCard, Tile } from "@/components/shared/panels";
import { useFirm } from "@/lib/firm/context";
import { overviewFigures, money } from "../firmData";

/**
 * Section 9 of the specification. Every figure here is computed from the same
 * records the other sections manage, so the overview cannot drift out of step
 * with them, and each one links through to where the detail lives.
 */
export default function OverviewSection({ onNavigateSection }) {
  const firm = useFirm();
  const figures = overviewFigures(firm);

  return (
    <div className="space-y-6">
      <SectionCard title="Cases" icon={Briefcase}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Total Cases" value={figures.cases.total} to="/litigation" />
          <Tile label="Active Cases" value={figures.cases.active} tone="good" to="/litigation" />
          <Tile label="Closed Cases" value={figures.cases.closed} to="/litigation" />
          <Tile label="New Cases" value={figures.cases.newCases} tone="info" to="/litigation" />
        </div>

        <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">
          Cases by Branch
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {figures.cases.byBranch.map(({ branch, count }) => (
            <Tile
              key={branch.id}
              label={branch.name + " (" + branch.branchNumber + ")"}
              value={count}
              to="/litigation"
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Clients" icon={Users}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Total Clients" value={figures.clients.total} to="/clients" />
          <Tile label="Active Clients" value={figures.clients.active} tone="good" to="/clients" />
          <Tile label="Clients with Open Cases" value={figures.clients.withOpenCases} to="/clients" />
          <Tile label="Clients with Outstanding Payments" value={figures.clients.withOutstanding} tone="warning" to="/clients" />
        </div>
      </SectionCard>

      <SectionCard title="Financial" icon={Wallet}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Total Invoiced" value={money(figures.financial.totalInvoiced)} to="/finance" />
          <Tile label="Total Paid" value={money(figures.financial.totalPaid)} tone="good" to="/finance" />
          <Tile label="Total Outstanding" value={money(figures.financial.totalOutstanding)} tone="high" to="/finance" />
          <Tile label="Total Expenses" value={money(figures.financial.totalExpenses)} tone="warning" onClick={() => onNavigateSection("transactions")} />
        </div>
      </SectionCard>

      <SectionCard title="Bank Accounts" icon={Landmark}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile
            label="Total Bank Balance"
            value={money(figures.bank.total)}
            tone="good"
            onClick={() => onNavigateSection("bank")}
          />
          {figures.bank.byAccount.map(({ account, balance }) => (
            <Tile
              key={account.id}
              label={account.bankName + (account.active ? "" : " (disabled)")}
              value={money(balance)}
              onClick={() => onNavigateSection("bank")}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Documents" icon={FileText}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Tile
            label="Active Documents"
            value={figures.documents.active}
            tone="good"
            onClick={() => onNavigateSection("documents", { status: "Active" })}
          />
          <Tile
            label="Documents Expiring Soon"
            value={figures.documents.expiringSoon}
            tone="warning"
            onClick={() => onNavigateSection("documents", { status: "Expiring Soon" })}
          />
          <Tile
            label="Expired Documents"
            value={figures.documents.expired}
            tone="high"
            onClick={() => onNavigateSection("documents", { status: "Expired" })}
          />
        </div>
      </SectionCard>

      <p className="text-xs text-muted-foreground">
        Figures are calculated from the firm&apos;s branches, cases, invoices,
        payments and documents. Selecting any of them opens the related detail.
      </p>
    </div>
  );
}
