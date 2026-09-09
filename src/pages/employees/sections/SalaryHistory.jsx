import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/panels";
import { cn } from "@/lib/utils";
import { MONTH_NAMES, salaryHistoryRows } from "../payrollData";

/** Money as it reads on a payslip: three decimals, grouped. */
const money = (value) =>
  Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const pad = (n) => String(n).padStart(2, "0");

/** How much of an installment was taken, as a word and a colour. */
const LOAN_STATE = {
  full: { label: "Full", tone: "bg-green-100 text-green-800" },
  partial: { label: "Partial", tone: "bg-amber-100 text-amber-800" },
  none: { label: "N/A", tone: "bg-muted text-muted-foreground" },
};

/** One line of the loan cell: what it is, then what it says. */
function LoanLine({ children }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/**
 * What has been paid, month by month, and what the loan did to it.
 *
 * Every figure past the four that were recorded - the installment number, the
 * balance left, the installments still to come, the net - is worked out here
 * from the deductions themselves. A month cannot therefore show a balance its
 * own deductions do not support.
 */
export default function SalaryHistory() {
  const rows = salaryHistoryRows();

  const years = [...new Set(rows.map((row) => String(row.year)))].sort((a, b) =>
    b.localeCompare(a)
  );

  const [month, setMonth] = useState("all");
  const [year, setYear] = useState(years[0] || "");

  const shown = rows.filter(
    (row) =>
      String(row.year) === year &&
      (month === "all" || String(row.month) === month)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMonth">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="salaryMonth" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryYear">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="salaryYear" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {shown.length === 0 ? (
            <EmptyState>No salary was paid in that period.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border text-center text-sm">
                <thead>
                  <tr className="border-b bg-secondary/60 text-primary">
                    <th className="border-r p-3 font-semibold">No.</th>
                    <th className="border-r p-3 font-semibold">Month &amp; Year</th>
                    <th className="border-r p-3 font-semibold">
                      Salary &amp; Allowances
                      <span className="block text-xs font-normal text-muted-foreground">
                        (Basic Salary + Total Allowances)
                      </span>
                    </th>
                    <th className="border-r p-3 font-semibold">Loan Installment</th>
                    <th className="border-r p-3 font-semibold">
                      Administrative Deduction
                    </th>
                    <th className="border-r p-3 font-semibold">
                      Amount Paid
                      <span className="block text-xs font-normal text-muted-foreground">
                        (Net Amount)
                      </span>
                    </th>
                    <th className="p-3 font-semibold">Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row, index) => {
                    const state = LOAN_STATE[row.loan.state];

                    return (
                      <tr
                        key={row.id}
                        className="border-b align-top transition-colors last:border-0 hover:bg-primary/5"
                      >
                        <td className="border-r p-3 font-medium text-primary">
                          {index + 1}
                        </td>
                        <td className="border-r p-3 font-medium text-primary">
                          {pad(row.month)}/{row.year}
                        </td>

                        {/* The two figures that make it, under the one they
                            make: a total nobody can check is just a number. */}
                        <td className="border-r p-3">
                          <p className="font-bold text-green-700">
                            {money(row.gross)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({money(row.basic)} + {money(row.allowances)})
                          </p>
                        </td>

                        <td className="border-r p-3 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-primary">
                              {money(row.loan.deducted)}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                                state.tone
                              )}
                            >
                              {state.label}
                            </span>
                          </div>

                          {row.loan.state === "none" ? (
                            <LoanLine>No loan installment</LoanLine>
                          ) : (
                            <>
                              <LoanLine>
                                Installment: {row.loan.number} / {row.loan.count}
                              </LoanLine>
                              <LoanLine>
                                Deducted: {money(row.loan.deducted)} (
                                {state.label})
                              </LoanLine>
                              {row.loan.shortfall > 0 && (
                                <LoanLine>
                                  Remaining for this installment:{" "}
                                  {money(row.loan.shortfall)}
                                </LoanLine>
                              )}
                              <LoanLine>
                                Remaining Loan: {money(row.loan.remaining)}
                              </LoanLine>
                              <LoanLine>
                                Remaining Installments:{" "}
                                {row.loan.remainingInstallments}
                              </LoanLine>
                            </>
                          )}
                        </td>

                        <td className="border-r p-3 text-primary">
                          {money(row.administrative)}
                        </td>

                        {/* What actually reached the bank, which is what the
                            row is for - so it is the one cell that is lit. */}
                        <td className="border-r bg-green-50/70 p-3 font-bold text-green-700">
                          {money(row.net)}
                        </td>

                        <td className="p-3 text-primary">
                          {row.paymentDate.split("-").reverse().join("/")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
