import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import FormHeading from "@/components/shared/FormHeading";
import TabBar from "@/components/shared/TabBar";
import { Plus, Eye, EyeOff } from "lucide-react";
import { withRial } from "@/lib/money";
import {
  commissionRecords,
  commissionsFor,
  feesFor,
  commissionOn,
  monthAndYear,
  nextCommissionNo,
  SPECIFIC_COMMISSION,
} from "@/pages/firm/commissionData";
import CommissionForm from "@/pages/firm/sections/CommissionForm";
import { useClients } from "@/lib/clients/context";

import SalariesSection from "./SalariesSection";
import BonusSection from "./BonusSection";
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

/**
 * The commission agreed with this employee, read from the firm's records.
 *
 * The same form the firm's own commission page uses opens above the list -
 * with one difference: the person it is paid to is this employee, so the two
 * questions about who it is for are answered before it opens.
 */
function CommissionTab({ employee, adding, onCloseAdd }) {
  const { clients } = useClients();
  const [records, setRecords] = useState(() => commissionsFor(employee.name));

  // The client chosen on the open form, if any. While a commission is being
  // written for a client, the list shows only what is already agreed with that
  // client - which is what the new one has to be judged against.
  const [clientFilter, setClientFilter] = useState("");

  const filtering = adding && Boolean(clientFilter);
  const clientName =
    clients.find((client) => client.clientNo === clientFilter)?.clientName ||
    "";
  const shown = filtering
    ? records.filter((record) => record.clientNo === clientFilter)
    : records;

  /** Closing the form, by either button, puts the whole list back. */
  const close = () => {
    setClientFilter("");
    onCloseAdd();
  };

  /** The form settles what was agreed; the list gives it its number. */
  const save = (record) => {
    setRecords((prev) => [
      ...prev,
      {
        ...record,
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        commissionNo: nextCommissionNo(commissionRecords.concat(prev)),
      },
    ]);
    close();
  };

  return (
    <div className="space-y-6">
      {adding && (
        <CommissionForm
          employee={employee}
          onCancel={close}
          onSave={save}
          onClientChange={setClientFilter}
        />
      )}

      {filtering && (
        <p className="text-sm text-muted-foreground">
          Showing commissions for{" "}
          <span className="font-semibold text-primary">{clientName}</span>{" "}
          only
        </p>
      )}

      {shown.length === 0 ? (
        <EmptyState>
          {filtering
            ? "No commission has been agreed with this employee on " +
              clientName +
              " yet."
            : "No commission has been agreed with this employee."}
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-semibold">Commission No.</th>
                  <th className="p-3 font-semibold">Client</th>
                  <th className="p-3 font-semibold">Beneficiary</th>
                  <th className="whitespace-nowrap p-3 font-semibold">
                    Month &amp; Year
                  </th>
                  <th className="p-3 font-semibold">Commission Type</th>
                  <th className="p-3 font-semibold">
                    Legal Fees (Before VAT) &amp; Commission
                  </th>
                  <th className="p-3 font-semibold">Period</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                  >
                    <td className="whitespace-nowrap p-3 font-medium">
                      {record.commissionNo}
                    </td>
                    <td className="p-3">{record.clientName}</td>
                    <td className="p-3">
                      <span className="block">{record.paidTo}</span>
                      <span className="block text-xs text-muted-foreground">
                        {record.classification}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {monthAndYear(record)}
                    </td>
                    <td className="p-3">
                      <span className="block">{record.type}</span>
                      {/* A specific commission names the file and the invoice
                          it was worked out from; a fixed one runs over the
                          period in the last column and has neither. */}
                      {record.type === SPECIFIC_COMMISSION && (
                        <>
                          <span className="block text-xs text-muted-foreground">
                            File No.: {record.caseFileNo || "-"}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Invoice No.: {record.invoiceNo || "-"}
                          </span>
                        </>
                      )}
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
                      <span className="block">{record.periodFrom}</span>
                      <span className="block text-xs text-muted-foreground">
                        {record.periodTo
                          ? "to " + record.periodTo
                          : "Open ended"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
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
  onTabChange,
  // The firm sets what it pays; on My Profile the figures are only read.
  canEdit = true,
}) {
  // Which tab's form is open, if any.
  const [adding, setAdding] = useState(null);

  // Whether the salary breakdown above the history is open. Closed to start:
  // the history is what is looked at most, and the breakdown is a long form
  // that would push it off the screen every time the tab is opened.
  const [salaryDetailsOpen, setSalaryDetailsOpen] = useState(false);

  // My Profile shows what the employee is paid. What the office keeps its own
  // record of - the bonuses it decided on - is not shown there at all, so the
  // tab itself goes, and with it any chance of landing on a tab that is gone.
  const tabs = canEdit
    ? BENEFIT_TABS
    : BENEFIT_TABS.filter((option) => !option.office);

  const current = tabs.find((option) => option.key === tab) || tabs[0];
  const open = current.key;

  const showsDetailsToggle = open === "salaries" && adding !== "salaries";

  // Salary and commission are what the firm decides to pay; a loan and
  // assistance are what the employee asks for. So on My Profile the first two
  // are only read, and the other two can still be asked for.
  const firmDecides = open === "salaries" || open === "commission";
  const showsAdd = Boolean(current.add) && (canEdit || !firmDecides);

  return (
    <div className="space-y-6">
      {/* One row for the whole section: the open tab's name on the left, and
          on the right the tabs and the buttons that act on what is open. A
          heading above the tabs would only name the tab that is already
          highlighted. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormHeading title={current.label} note={current.note} icon={current.icon} />

        <div className="flex flex-wrap items-center gap-2">
          <TabBar options={tabs} value={open} onChange={onTabChange} />

          {/* The word says what a click will do, not what is on screen now. */}
          {showsDetailsToggle && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={salaryDetailsOpen}
              aria-controls="salary-details"
              onClick={() => setSalaryDetailsOpen((open) => !open)}
            >
              {salaryDetailsOpen ? (
                <EyeOff className="mr-1.5 h-4 w-4" />
              ) : (
                <Eye className="mr-1.5 h-4 w-4" />
              )}
              {salaryDetailsOpen ? "Hide" : "Show"}
            </Button>
          )}

          {showsAdd && (
            <Button
              type="button"
              onClick={() => setAdding(open)}
              disabled={adding === open}
            >
              <Plus className="mr-2 h-4 w-4" />
              {current.add}
            </Button>
          )}
        </div>
      </div>

      {open === "salaries" && (
        <SalariesSection
          employee={employee}
          adding={adding === "salaries"}
          onCloseAdd={() => setAdding(null)}
          onSave={onSaveSalary}
          detailsOpen={salaryDetailsOpen}
          canEdit={canEdit}
        />
      )}

      {open === "bonus" && (
        <BonusSection
          employee={employee}
          adding={adding === "bonus"}
          onCloseAdd={() => setAdding(null)}
        />
      )}

      {open === "loans" && (
        <LoansSection
          adding={adding === "loans"}
          onCloseAdd={() => setAdding(null)}
        />
      )}

      {open === "assistance" && (
        <AssistanceSection
          employee={employee}
          adding={adding === "assistance"}
          onCloseAdd={() => setAdding(null)}
        />
      )}

      {open === "commission" && (
        <CommissionTab
          employee={employee}
          adding={adding === "commission"}
          onCloseAdd={() => setAdding(null)}
        />
      )}
    </div>
  );
}