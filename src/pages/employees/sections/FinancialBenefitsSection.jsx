import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import FormHeading from "@/components/shared/FormHeading";
import { Plus } from "lucide-react";
import { withRial } from "@/lib/money";
import { commissionsFor, feesFor, commissionOn } from "@/pages/firm/commissionData";

import SalariesSection from "./SalariesSection";
import LoansSection from "./LoansSection";
import AssistanceSection from "./AssistanceSection";
import { BENEFIT_TABS } from "./benefitTabs";

const money = (amount) =>
  withRial(
    Number(amount || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );

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
 * page with four tabs instead. The tabs themselves sit in the corner of the
 * section's heading, which is where the choice of tab belongs; this page shows
 * whichever one is open. Each tab's Add button opens its form at the top of
 * that tab rather than at the top of the page: the form belongs to the records
 * underneath it, not to the whole employee.
 */
export default function FinancialBenefitsSection({
  employee,
  onSaveSalary,
  tab,
}) {
  // Which tab's form is open, if any.
  const [adding, setAdding] = useState(null);

  const current =
    BENEFIT_TABS.find((option) => option.key === tab) || BENEFIT_TABS[0];

  return (
    <div className="space-y-6">
      {/* The heading of the category, and the way to add to it, at the start
          of that category rather than at the top of the page. The icon is
          what says this names the tab and not the section above it. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormHeading
          title={current.label}
          note={current.note}
          icon={current.icon}
        />
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