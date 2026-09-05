import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { withRial } from "@/lib/money";
import { commissionsFor, feesFor, commissionOn } from "@/pages/firm/commissionData";

import SalariesSection from "./SalariesSection";
import LoansSection from "./LoansSection";
import AssistanceSection from "./AssistanceSection";

const money = (amount) =>
  withRial(
    Number(amount || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );

/**
 * The four kinds of money an employee is owed, in the order they are asked
 * about.
 *
 * `add` is the wording of the button that opens that category's form; a
 * category without one has nothing to add here - commission is agreed on the
 * Company Profile, and only read from this side.
 */
const TABS = [
  { key: "salaries", label: "Salaries / Allowances", add: "Add Salary / Bonus" },
  { key: "loans", label: "Loans", add: "Add Loan" },
  { key: "assistance", label: "Assistance", add: "Add Assistance" },
  { key: "commission", label: "Commission" },
];

/** The commission agreed with this employee, read from the firm's records. */
function CommissionTab({ employee }) {
  const records = commissionsFor(employee.name);

  if (records.length === 0) {
    return (
      <EmptyState>
        No commission has been agreed with this employee.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3 font-semibold">Commission No.</th>
              <th className="p-3 font-semibold">Client</th>
              <th className="p-3 font-semibold">Type &amp; Recurrence</th>
              <th className="p-3 font-semibold">
                Legal Fees (Before VAT) &amp; Commission
              </th>
              <th className="p-3 font-semibold">Effective</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
              >
                <td className="whitespace-nowrap p-3 font-medium">
                  {record.commissionNo}
                </td>
                <td className="p-3">{record.clientName}</td>
                <td className="p-3">
                  <span className="block">
                    {record.type}
                    {record.caseFileNo && " · Case file " + record.caseFileNo}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {record.recurrence}
                  </span>
                </td>
                <td className="p-3">
                  <span className="block font-medium">
                    {money(feesFor(record))}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {record.rate}%
                  </span>
                  <span className="block text-xs font-medium text-green-700">
                    Commission: {money(commissionOn(record))}
                  </span>
                </td>
                <td className="p-3">
                  <span className="block">{record.effectiveFrom}</span>
                  <span className="block text-xs text-muted-foreground">
                    {record.effectiveTo
                      ? "to " + record.effectiveTo
                      : "Open ended"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/**
 * Everything the firm pays one employee, on one page.
 *
 * Salary, loans, assistance and commission were four entries in the menu, all
 * answering the same question - what this person is owed and why. They are one
 * page with four tabs instead, and each tab's Add button opens its form at the
 * top of that tab rather than at the top of the page: the form belongs to the
 * records underneath it, not to the whole employee.
 */
export default function FinancialBenefitsSection({ employee, onSaveSalary }) {
  const [tab, setTab] = useState("salaries");
  // Which tab's form is open, if any. Changing tab closes it: a half-filled
  // loan form has no business staying open over the assistance records.
  const [adding, setAdding] = useState(null);

  const current = TABS.find((option) => option.key === tab) || TABS[0];

  const choose = (key) => {
    setTab(key);
    setAdding(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg border p-1">
        {TABS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => choose(option.key)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === option.key
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* The heading of the category, and the way to add to it, at the start
          of that category rather than at the top of the page. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-primary">{current.label}</p>
        {current.add && (
          <Button
            type="button"
            onClick={() => setAdding(tab)}
            disabled={adding === tab}
          >
            <Plus className="mr-2 h-4 w-4" />
            {current.add}
          </Button>
        )}
      </div>

      {tab === "salaries" && (
        <SalariesSection
          employee={employee}
          adding={adding === "salaries"}
          onCloseAdd={() => setAdding(null)}
          onSave={onSaveSalary}
        />
      )}

      {tab === "loans" && (
        <LoansSection
          adding={adding === "loans"}
          onCloseAdd={() => setAdding(null)}
        />
      )}

      {tab === "assistance" && (
        <AssistanceSection
          adding={adding === "assistance"}
          onCloseAdd={() => setAdding(null)}
        />
      )}

      {tab === "commission" && <CommissionTab employee={employee} />}
    </div>
  );
}
