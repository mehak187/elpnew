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
            <RecordTable>
                <HeadRow>
                  <Th>No.</Th>
                  <Th>Month &amp; Year</Th>
                  {/* One line to a column: what it holds and what makes it
                      up read as one heading rather than two stacked rows. */}
                  <Th note="Basic Salary + Total Allowances">
                    Salary &amp; Allowances
                  </Th>
                  <Th>Loan Installment</Th>
                  <Th>Administrative Deduction</Th>
                  <Th note="Net Amount">Amount Paid</Th>
                  <Th>Payment Date</Th>
                </HeadRow>
                <tbody>
                  {shown.map((row, index) => {
                    const state = LOAN_STATE[row.loan.state];

                    return (
                      <Row key={row.id}>
                        <Td className="font-medium text-primary">{index + 1}</Td>
                        <Td className="font-medium text-primary">
                          {pad(row.month)}/{row.year}
                        </Td>

                        {/* Read down: what the salary is, what was added to
                            it, and what the two come to - the total last and
                            in green, because it is the figure being checked. */}
                        <Td className="text-left">
                          <p className="flex items-baseline justify-between gap-3">
                            <span className="text-muted-foreground">Salary:</span>
                            <span className="font-medium text-primary">
                              {money(row.basic)}
                            </span>
                          </p>
                          <p className="flex items-baseline justify-between gap-3">
                            <span className="text-muted-foreground">
                              Total Allowances:
                            </span>
                            <span className="font-medium text-primary">
                              {money(row.allowances)}
                            </span>
                          </p>
                          <p className="mt-1 flex items-baseline justify-between gap-3 border-t pt-1 text-base font-bold text-green-700">
                            <span>Total:</span>
                            <span>{money(row.gross)}</span>
                          </p>
                        </Td>

                        <Td className="text-left">
                          <p className="font-bold text-primary">
                            {money(row.loan.deducted)}
                          </p>

                          {row.loan.state === "none" ? (
                            <LoanLine>No loan installment</LoanLine>
                          ) : (
                            <>
                              <LoanLine>
                                Installment: {row.loan.number} / {row.loan.count}
                              </LoanLine>
                              {/* How much of the installment was taken, beside
                                  the figure it describes rather than off in
                                  the corner of the cell. */}
                              <LoanLine>
                                Deducted: {money(row.loan.deducted)}{" "}
                                <span
                                  className={cn(
                                    "ml-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                    state.tone
                                  )}
                                >
                                  {state.label}
                                </span>
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

                        {/* Money held back from the pay, so it is red wherever
                            it appears - with what it was held back for beside
                            it, because a deduction without a reason is a
                            figure nobody can answer. */}
                        <td className="border-r p-3 text-left">
                          <p className="font-bold text-destructive">
                            {money(row.administrative)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.administrativeReason || "-"}
                          </p>
                        </td>

                        {/* What actually reached the bank, which is what the
                            row is for - so it is the one cell that is lit, and
                            it says which account it reached. */}
                        <td className="border-r bg-green-50/70 p-3 text-left">
                          <p className="font-bold text-green-700">
                            {money(row.net)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.bank}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.accountNo}
                          </p>
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
