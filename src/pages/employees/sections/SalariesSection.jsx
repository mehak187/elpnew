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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/panels";
import { Rial } from "@/components/shared/Rial";
import { Save, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { employeeRecords } from "../employeeData";
import {
  PAYROLL_CLASSIFICATION,
  PAYROLL_TYPES,
  PAYMENT_MONTHS,
  PAYMENT_YEARS,
  PAYMENT_SOURCES,
  SOURCE_SHORT,
  categoriesOf,
  subcategoriesOf,
  salaryRecords,
  amount,
  netAmount,
  period,
  formatDate,
} from "../payrollData";

const NOTES_LIMIT = 300;
const PAGE_SIZE = 5;

const emptyDraft = {
  expenseType: "",
  category: "",
  subcategory: "",
  employee: "",
  payrollType: "",
  month: "",
  year: "",
  basicSalary: "",
  allowances: "",
  deductions: "",
  method: "",
  source: "",
  paymentDate: "",
  reference: "",
  notes: "",
};

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

/** A numbered heading, ruled off from the fields below it. */
function Step({ number, title }) {
  return (
    <p className="border-b pb-2 text-sm font-semibold text-primary">
      {number}. {title}
    </p>
  );
}

/**
 * What an employee has been paid, and the form that adds to it.
 *
 * Net amount is never typed in - it is read off the three figures above it
 * every render, so the total on the record cannot disagree with its parts.
 */
export default function SalariesSection() {
  const [records, setRecords] = useState(salaryRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  // Choosing at one level of the classification clears everything below it.
  const setExpenseType = (value) =>
    setDraft((prev) => ({ ...prev, expenseType: value, category: "", subcategory: "" }));
  const setCategory = (value) =>
    setDraft((prev) => ({ ...prev, category: value, subcategory: "" }));

  const num = (value) => Number(value || 0);
  const net = num(draft.basicSalary) + num(draft.allowances) - num(draft.deductions);

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.employee &&
    draft.payrollType &&
    draft.month &&
    draft.year &&
    draft.method &&
    draft.paymentDate;

  const save = () => {
    if (!canSave) return;
    // Basic pay and allowances are two lines on the record, not one figure,
    // because the history shows them apart.
    const entitlements = [];
    if (num(draft.basicSalary)) {
      entitlements.push({ label: "Basic Salary", value: num(draft.basicSalary) });
    }
    if (num(draft.allowances)) {
      entitlements.push({
        label: entitlements.length ? "Allowances" : draft.payrollType,
        value: num(draft.allowances),
      });
    }
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        paymentDate: draft.paymentDate,
        expenseType: draft.expenseType,
        category: draft.category,
        subcategory: draft.subcategory,
        month: draft.month,
        year: draft.year,
        method: draft.method,
        source: draft.source,
        entitlements,
        deductions: draft.deductions === "" ? null : num(draft.deductions),
        reference: draft.reference,
        notes: draft.notes,
      },
      ...prev,
    ]);
    setDraft(emptyDraft);
    setPage(1);
  };

  const remove = (id) => setRecords((prev) => prev.filter((r) => r.id !== id));

  // Editing lifts the payment back into the form and takes it off the list, so
  // saving puts one corrected record back rather than a second copy.
  const edit = (record) => {
    const basic = record.entitlements.find((l) => l.label === "Basic Salary");
    const rest = record.entitlements.filter((l) => l !== basic);
    setDraft({
      ...emptyDraft,
      expenseType: record.expenseType,
      category: record.category,
      subcategory: record.subcategory,
      payrollType: record.expenseType,
      month: record.month,
      year: record.year,
      basicSalary: basic ? String(basic.value) : "",
      allowances: rest.length ? String(rest[0].value) : "",
      deductions: record.deductions == null ? "" : String(record.deductions),
      method: record.method,
      source: record.source,
      paymentDate: record.paymentDate,
      reference: record.reference || "",
      notes: record.notes || "",
    });
    remove(record.id);
  };

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const shown = records.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Add a payment */}
      <div className="rounded-lg border p-4">
        <p className="mb-4 font-semibold text-primary">Add Salary / Allowance</p>

        <div className="space-y-4">
          <Step number="1" title="Expense Classification" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="salary-expense-type" required>
                Expense Type
              </FieldLabel>
              <Select value={draft.expenseType} onValueChange={setExpenseType}>
                <SelectTrigger id="salary-expense-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PAYROLL_CLASSIFICATION.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-category" required>
                Category
              </FieldLabel>
              <Select
                value={draft.category}
                onValueChange={setCategory}
                disabled={!draft.expenseType}
              >
                <SelectTrigger id="salary-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesOf(draft.expenseType).map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-subcategory">Subcategory</FieldLabel>
              <Select
                value={draft.subcategory}
                onValueChange={(value) => set("subcategory", value)}
                disabled={!draft.category}
              >
                <SelectTrigger id="salary-subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategoriesOf(draft.expenseType, draft.category).map((sub) => (
                    <SelectItem key={sub.name} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Step number="2" title="Payment Details" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="salary-employee" required>
                Employee
              </FieldLabel>
              <Select
                value={draft.employee}
                onValueChange={(value) => set("employee", value)}
              >
                <SelectTrigger id="salary-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeeRecords.map((employee) => (
                    <SelectItem key={employee.id} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-payroll-type" required>
                Payroll Type
              </FieldLabel>
              <Select
                value={draft.payrollType}
                onValueChange={(value) => set("payrollType", value)}
              >
                <SelectTrigger id="salary-payroll-type">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAYROLL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                (Salary, Allowance, End of Service, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-month" required>
                Payment Month
              </FieldLabel>
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
              <FieldLabel htmlFor="salary-year" required>
                Payment Year
              </FieldLabel>
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
              <FieldLabel htmlFor="salary-basic">
                Basic Salary (<Rial />)
              </FieldLabel>
              <Input
                id="salary-basic"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={draft.basicSalary}
                onChange={(e) => set("basicSalary", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-allowances">
                Allowances (<Rial />)
              </FieldLabel>
              <Input
                id="salary-allowances"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={draft.allowances}
                onChange={(e) => set("allowances", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-deductions">
                Deductions (<Rial />)
              </FieldLabel>
              <Input
                id="salary-deductions"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={draft.deductions}
                onChange={(e) => set("deductions", e.target.value)}
              />
            </div>

            {/* Worked out, not asked for */}
            <div className="space-y-2">
              <FieldLabel htmlFor="salary-net">
                Net Amount (<Rial />)
              </FieldLabel>
              <Input
                id="salary-net"
                readOnly
                tabIndex={-1}
                className="bg-muted text-muted-foreground"
                value={amount(net)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-method" required>
                Payment Method
              </FieldLabel>
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
              <FieldLabel htmlFor="salary-source">Bank / Cash</FieldLabel>
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

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-date" required>
                Payment Date
              </FieldLabel>
              <Input
                id="salary-date"
                type="date"
                value={draft.paymentDate}
                onChange={(e) => set("paymentDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="salary-reference">
                Reference / Voucher No.
              </FieldLabel>
              <Input
                id="salary-reference"
                placeholder="Enter reference number"
                value={draft.reference}
                onChange={(e) => set("reference", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="salary-notes">Notes</FieldLabel>
            <div className="relative">
              <Input
                id="salary-notes"
                maxLength={NOTES_LIMIT}
                placeholder="Enter notes (optional)"
                className="h-16 pr-16"
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
              <span className="pointer-events-none absolute bottom-1.5 right-3 text-xs text-muted-foreground">
                {draft.notes.length}/{NOTES_LIMIT}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={save} disabled={!canSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Salary / Allowance
            </Button>
          </div>
        </div>
      </div>

      {/* What has been paid */}
      <div className="rounded-lg border">
        <p className="border-b p-4 font-semibold text-primary">
          Salaries / Allowances History
        </p>

        {records.length === 0 ? (
          <div className="p-6">
            <EmptyState>No payments recorded yet.</EmptyState>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[1000px] border text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="p-3 font-semibold">No.</th>
                    <th className="p-3 font-semibold">Payment Date</th>
                    <th className="p-3 font-semibold">
                      Expense Type
                      <span className="block font-normal">
                        Category / Subcategory
                      </span>
                    </th>
                    <th className="p-3 font-semibold">Month / Year</th>
                    <th className="p-3 font-semibold">Payment Method</th>
                    <th className="p-3 font-semibold">
                      Payment Details (<Rial />)
                    </th>
                    <th className="p-3 font-semibold">Notes</th>
                    <th className="p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b transition-colors last:border-0 hover:bg-primary/10"
                    >
                      <td className="p-3 align-top">
                        <button
                          type="button"
                          onClick={() => edit(record)}
                          className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {start + index + 1}
                        </button>
                      </td>
                      <td className="whitespace-nowrap p-3 align-top">
                        {formatDate(record.paymentDate)}
                      </td>
                      <td className="p-3 align-top">
                        <span className="block font-semibold">
                          {record.expenseType}
                        </span>
                        <span className="block text-muted-foreground">
                          {record.category}
                          {record.subcategory && " / " + record.subcategory}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-3 align-top">
                        {period(record)}
                      </td>
                      <td className="p-3 align-top">
                        <span className="block">{record.method}</span>
                        {record.source && (
                          <span className="block text-muted-foreground">
                            ({SOURCE_SHORT[record.source] || record.source})
                          </span>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <span className="block">
                          {record.entitlements.map((line, i) => (
                            <span key={line.label}>
                              {i > 0 && (
                                <span className="px-2 text-muted-foreground">
                                  |
                                </span>
                              )}
                              <span className="font-semibold">
                                {line.label}:
                              </span>{" "}
                              {amount(line.value)}
                            </span>
                          ))}
                          {record.deductions != null && (
                            <>
                              <span className="px-2 text-muted-foreground">
                                |
                              </span>
                              <span className="font-semibold">Deductions:</span>{" "}
                              {amount(record.deductions)}
                            </>
                          )}
                        </span>
                        <span className="mt-1 block">
                          <span className="font-semibold">Net Amount:</span>{" "}
                          {amount(netAmount(record))}
                        </span>
                      </td>
                      <td className="p-3 align-top text-muted-foreground">
                        {record.notes || "-"}
                      </td>
                      <td className="p-3 align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">
                                Actions for payment {start + index + 1}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => edit(record)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => remove(record.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
              <span>
                Showing {start + 1} to {Math.min(start + PAGE_SIZE, records.length)}{" "}
                of {records.length} entries
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
