import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import { Rial } from "@/components/shared/Rial";
import { cn } from "@/lib/utils";
import { Save } from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import {
  ALLOWANCES,
  DEDUCTIONS,
  PAYMENT_MONTHS,
  PAYMENT_YEARS,
  PAYMENT_SOURCES,
  SOURCE_SHORT,
  salaryRecords,
  totalEarnings,
  totalDeductions,
  netSalary,
  netAmount,
  amount,
  period,
  formatDate,
} from "../payrollData";

const NOTES_LIMIT = 300;
const PAGE_SIZE = 5;

const emptyDraft = {
  basic: "",
  special: "",
  housing: "",
  transport: "",
  electricity: "",
  water: "",
  loan: "",
  administrative: "",
  month: "",
  year: "",
  paymentDate: "",
  method: "",
  source: "",
  notes: "",
};

/** A heading over one group of the payslip. */
function Group({ title, children }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {children}
      </div>
      <div className="border-b" />
    </div>
  );
}

/**
 * One amount on the payslip, with the currency inside the box.
 *
 * `readOnly` marks a figure that is worked out rather than entered; `highlight`
 * marks the one figure the whole page is for.
 */
function Amount({ id, label, required, value, onChange, readOnly, highlight }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={readOnly ? "text" : "number"}
          min={readOnly ? undefined : "0"}
          step={readOnly ? undefined : "0.001"}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          placeholder="0.000"
          className={cn(
            "pr-12",
            readOnly && "text-muted-foreground",
            readOnly && !highlight && "bg-muted",
            highlight && "border-green-600 bg-green-50 font-bold text-green-700"
          )}
          value={value}
          onChange={onChange}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Rial />
        </span>
      </div>
    </div>
  );
}

/**
 * What an employee has been paid, and the form that adds to it.
 *
 * Nothing below the second group is ever typed: the totals, the net and the
 * amount payable are all read off the figures above them every render, so a
 * payslip cannot claim a net its own lines do not add up to.
 */
export default function SalariesSection() {
  const [records, setRecords] = useState(salaryRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const onAmount = (name) => (e) => set(name, e.target.value);

  const earnings = totalEarnings(draft);
  const deductions = totalDeductions(draft);
  const net = netSalary(draft);

  const canSave =
    Number(draft.basic) > 0 &&
    draft.month &&
    draft.year &&
    draft.paymentDate &&
    draft.method;

  const save = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        paymentDate: draft.paymentDate,
        month: draft.month,
        year: draft.year,
        basic: Number(draft.basic) || 0,
        // The allowances are kept as the one figure that was paid: a payslip
        // records what happened, and must not move when the rates do.
        allowances: earnings - (Number(draft.basic) || 0),
        deductions,
        method: draft.method,
        source: draft.source,
        notes: draft.notes,
      },
      ...prev,
    ]);
    setDraft(emptyDraft);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const shown = records.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* The payslip */}
      <div className="space-y-6 rounded-lg border p-4 sm:p-6">
        <Group title="Salary & Allowances">
          <Amount
            id="salary-basic"
            label="Basic Salary"
            required
            value={draft.basic}
            onChange={onAmount("basic")}
          />
          {ALLOWANCES.map((allowance) => (
            <Amount
              key={allowance.key}
              id={"salary-" + allowance.key}
              label={allowance.label}
              value={draft[allowance.key]}
              onChange={onAmount(allowance.key)}
            />
          ))}
        </Group>

        <Group title="Deductions">
          {DEDUCTIONS.map((deduction) => (
            <Amount
              key={deduction.key}
              id={"salary-" + deduction.key}
              label={deduction.label}
              value={draft[deduction.key]}
              onChange={onAmount(deduction.key)}
            />
          ))}
          <Amount
            id="salary-total-deductions"
            label="Total Deductions from Salary"
            value={amount(deductions)}
            readOnly
          />
        </Group>

        <Group title="Total Payable Amounts">
          <Amount
            id="salary-earnings"
            label="Total Earnings (Salary + Allowances)"
            value={amount(earnings)}
            readOnly
          />
          <Amount
            id="salary-deductions-total"
            label="Total Deductions from Salary"
            value={amount(deductions)}
            readOnly
          />
          <Amount
            id="salary-net"
            label="Net Salary (After Deductions)"
            value={amount(net)}
            readOnly
          />
          <Amount
            id="salary-payable"
            label="Amount Payable"
            value={amount(net)}
            readOnly
            highlight
          />
        </Group>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">Payment Details</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="salary-month">
                Payment Month<span className="text-destructive"> *</span>
              </Label>
              <Select
                value={draft.month}
                onValueChange={(value) => set("month", value)}
              >
                <SelectTrigger id="salary-month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-year">
                Payment Year<span className="text-destructive"> *</span>
              </Label>
              <Select
                value={draft.year}
                onValueChange={(value) => set("year", value)}
              >
                <SelectTrigger id="salary-year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-date">
                Payment Date<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="salary-date"
                type="date"
                value={draft.paymentDate}
                onChange={(e) => set("paymentDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-method">
                Payment Method<span className="text-destructive"> *</span>
              </Label>
              <Select
                value={draft.method}
                onValueChange={(value) => set("method", value)}
              >
                <SelectTrigger id="salary-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-source">Bank / Cash</Label>
              <Select
                value={draft.source}
                onValueChange={(value) => set("source", value)}
              >
                <SelectTrigger id="salary-source">
                  <SelectValue placeholder="Select bank or cash" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="salary-notes">Notes</Label>
              <div className="relative">
                <Input
                  id="salary-notes"
                  maxLength={NOTES_LIMIT}
                  placeholder="Enter notes (optional)"
                  className="pr-16"
                  value={draft.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {draft.notes.length}/{NOTES_LIMIT}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={save} disabled={!canSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Salary
          </Button>
        </div>
      </div>

      {/* What has been paid */}
      <div className="rounded-lg border">
        <p className="border-b p-4 text-lg font-bold text-primary">
          Salaries / Allowances History
        </p>

        {records.length === 0 ? (
          <div className="p-6">
            <EmptyState>No payments recorded yet.</EmptyState>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[860px] border text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="p-3 font-semibold">No.</th>
                    <th className="p-3 font-semibold">Payment Date</th>
                    <th className="p-3 font-semibold">Month / Year</th>
                    <th className="p-3 font-semibold">
                      Payment Details (<Rial />)
                    </th>
                    <th className="p-3 font-semibold">Payment Method</th>
                    <th className="p-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b transition-colors last:border-0 hover:bg-primary/10"
                    >
                      <td className="p-3 align-top font-medium text-primary">
                        {start + index + 1}
                      </td>
                      <td className="whitespace-nowrap p-3 align-top">
                        {formatDate(record.paymentDate)}
                      </td>
                      <td className="whitespace-nowrap p-3 align-top">
                        {period(record)}
                      </td>
                      <td className="p-3 align-top">
                        <span className="block">
                          <span className="font-semibold">Basic Salary:</span>{" "}
                          {amount(record.basic)}
                          <span className="px-2 text-muted-foreground">|</span>
                          <span className="font-semibold">Allowances:</span>{" "}
                          {amount(record.allowances)}
                          <span className="px-2 text-muted-foreground">|</span>
                          <span className="font-semibold">Deductions:</span>{" "}
                          {amount(record.deductions)}
                        </span>
                        {/* The one figure that actually left the account */}
                        <span className="mt-1 block font-semibold text-green-700">
                          Net Amount: {amount(netAmount(record))}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <span className="block">{record.method}</span>
                        {record.source && (
                          <span className="block text-muted-foreground">
                            ({SOURCE_SHORT[record.source] || record.source})
                          </span>
                        )}
                      </td>
                      <td className="p-3 align-top text-muted-foreground">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
              <span>
                Showing {start + 1} to{" "}
                {Math.min(start + PAGE_SIZE, records.length)} of {records.length}{" "}
                entries
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={n === currentPage ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  ›<span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
