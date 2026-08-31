import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  ArrowLeft,
  Briefcase,
  Users,
  Wallet,
  FileText,
  Network,
  Landmark,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROLES,
  canRecordFinance,
  canEditFirmSettings,
  canManageDocuments,
} from "@/lib/permissions";
import { useFirm } from "@/lib/firm/context";
import { overviewFigures, documentStatus, money } from "./firmData";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";

import OverviewSection from "./sections/OverviewSection";
import FirmInformationSection from "./sections/FirmInformationSection";
import DocumentsSection from "./sections/DocumentsSection";
import BranchesSection from "./sections/BranchesSection";
import BankAccountsSection from "./sections/BankAccountsSection";
import TransactionsSection from "./sections/TransactionsSection";

/**
 * The profile's sections, in the order the company is read: what it is, where
 * it works from, where its money sits, what it holds on file, and last the
 * summary of all of it. Financial Transactions is not chosen from here - Bank
 * Accounts opens it against one account - so it sits at the end.
 */
const SECTIONS = [
  {
    key: "information",
    label: "Company Details",
    icon: FileText,
    note: "Core legal and registration information",
  },
  {
    key: "branches",
    label: "Branches",
    icon: Network,
    note: "Offices the company works from",
  },
  {
    key: "bank",
    label: "Bank Accounts",
    icon: Landmark,
    note: "Manage all bank accounts and view account balances",
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
    note: "Licences, certificates and reports on file",
  },
  {
    key: "overview",
    label: "Company Overview",
    icon: Info,
    note: "Cases, clients and money, at a glance",
  },
  {
    key: "transactions",
    label: "Manage Transactions",
    icon: Wallet,
    note: "Every movement through the bank accounts",
  },
];

/** One headline figure, with the part of it worth knowing underneath. */
function HeadlineTile({ icon, label, value, note }) {
  const Icon = icon;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <span className="shrink-0 rounded-xl bg-secondary p-3 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold text-primary">{value}</p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LawFirmProfile() {
  const firm = useFirm();

  // The same figures the overview section reads, so the two cannot disagree.
  const figures = overviewFigures(firm);
  const expiringDocuments = firm.documents.filter(
    (document) => documentStatus(document) === "Expiring Soon"
  ).length;

  const [activeSection, setActiveSection] = useState("information");
  // Carries context when one section links into another, such as opening the
  // transaction history on a particular account.
  const [sectionArgs, setSectionArgs] = useState({});
  const [role, setRole] = useState(CURRENT_USER.role);

  const goToSection = (key, args = {}) => {
    setActiveSection(key);
    setSectionArgs(args);
  };

  const current = SECTIONS.find((s) => s.key === activeSection);

  // Every role may read the whole profile; the role decides what can be changed.
  const isAdmin = canEditFirmSettings(role);
  const canRecord = canRecordFinance(role);
  const canEditDocuments = canManageDocuments(role);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallback="/dashboard" />
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Building2 className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Company Profile
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              Manage company information, branches, accounts and documents
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

      {/* What the company amounts to, before any one section of it */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeadlineTile
          icon={Briefcase}
          label="Total Cases"
          value={figures.cases.total}
          note={figures.cases.active + " Active"}
        />
        <HeadlineTile
          icon={Users}
          label="Total Clients"
          value={figures.clients.total}
          note={figures.clients.withOpenCases + " With Open Cases"}
        />
        <HeadlineTile
          icon={Wallet}
          label="Total Bank Balance"
          value={money(figures.bank.total)}
          note={"Across " + firm.bankAccounts.length + " Accounts"}
        />
        <HeadlineTile
          icon={FileText}
          label="Documents"
          value={firm.documents.length}
          note={expiringDocuments + " Expiring Soon"}
        />
      </div>

      <div className="flex flex-col items-start gap-4 sm:gap-6 lg:flex-row">
        {/* Section navigation */}
        <Card className="w-full lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto">
          <CardContent className="p-3">
            <p className="mb-2 border-b px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Office Management
            </p>
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => goToSection(section.key)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-nowrap transition-colors",
                      activeSection === section.key
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="w-full flex-1">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-6 border-b pb-3">
                <h2 className="text-base font-semibold text-primary">
                  {current.label}
                </h2>
                <p className="text-xs text-muted-foreground">{current.note}</p>
              </div>

              {activeSection === "overview" && (
                <OverviewSection onNavigateSection={goToSection} />
              )}
              {activeSection === "information" && (
                <FirmInformationSection canEdit={isAdmin} />
              )}
              {activeSection === "documents" && (
                <DocumentsSection canEdit={canEditDocuments} />
              )}
              {activeSection === "branches" && (
                <BranchesSection canEdit={isAdmin} />
              )}
              {activeSection === "bank" && (
                <BankAccountsSection
                  onNavigateSection={goToSection}
                  canEdit={isAdmin}
                />
              )}
              {activeSection === "transactions" && (
                <TransactionsSection
                  initialAccountId={sectionArgs.accountId}
                  canRecord={canRecord}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
