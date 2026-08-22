import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROLES,
  canRecordFinance,
  canEditFirmSettings,
  canManageDocuments,
} from "@/lib/permissions";
import { useFirm } from "@/lib/firm/context";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";

import OverviewSection from "./sections/OverviewSection";
import FirmInformationSection from "./sections/FirmInformationSection";
import DocumentsSection from "./sections/DocumentsSection";
import BranchesSection from "./sections/BranchesSection";
import BankAccountsSection from "./sections/BankAccountsSection";
import TransactionsSection from "./sections/TransactionsSection";

/**
 * Section 10 of the specification lists the page structure. These are its
 * sections, in that order.
 */
const SECTIONS = [
  { key: "overview", label: "Overview / Dashboard" },
  { key: "information", label: "Firm Information" },
  { key: "documents", label: "Documents" },
  { key: "branches", label: "Branches" },
  { key: "bank", label: "Bank Accounts" },
  { key: "transactions", label: "Financial Transactions" },
];

export default function LawFirmProfile() {
  const navigate = useNavigate();
  const { firmInfo } = useFirm();

  const [activeSection, setActiveSection] = useState("overview");
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="rounded-xl bg-secondary p-2 sm:p-3">
            <Building2 className="h-5 w-5 text-secondary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              {firmInfo.nameEn || "Law Firm Profile"}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm" dir="rtl">
              {firmInfo.nameAr}
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

      <div className="flex flex-col items-start gap-4 sm:gap-6 lg:flex-row">
        {/* Section navigation */}
        <Card className="w-full lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto">
          <CardContent className="p-3">
            <p className="mb-2 border-b px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Law Firm Profile
            </p>
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
              {SECTIONS.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => goToSection(section.key)}
                  className={cn(
                    "rounded-md px-3 py-2 text-left text-sm font-medium text-nowrap transition-colors",
                    activeSection === section.key
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  {section.label}
                </button>
              ))}
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
              </div>

              {activeSection === "overview" && (
                <OverviewSection onNavigateSection={goToSection} />
              )}
              {activeSection === "information" && (
                <FirmInformationSection canEdit={isAdmin} />
              )}
              {activeSection === "documents" && (
                <DocumentsSection
                  initialStatusFilter={sectionArgs.status}
                  canEdit={canEditDocuments}
                />
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
