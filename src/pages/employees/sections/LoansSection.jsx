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
import { Save, FileText } from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { useFirm } from "@/lib/firm/context";
import { maskAccountNumber } from "@/pages/firm/firmData";
import UploadBox from "./UploadBox";
import {
  LOAN_CLASSIFICATION,
  categoriesOf,
  subcategoriesOf,
  loanRecords,
  schedule,
  amount,
  formatDate,
  period,
  SOURCE_SHORT,
} from "../loanData";

const NOTES_LIMIT = 300;
const PAGE_SIZE = 5;

const emptyDraft = {
  expenseType: "",
  category: "",
  subcategory: "",
  newAmount: "",
  monthly: "",
  method: "",
  accountId: "",
  paymentDate: "",
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

/** The note under a field that says where its figure came from. */
function Hint({ children }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/** A worked-out figure, shown rather than asked for. */
function Derived({ id, label, value, hint }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        className="bg-muted text-muted-foreground"
        value={value}
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

/** "Bank Muscat - Shatti Al Qurum (6789)" */
const accountLabel = (account) =>
  `${account.bankName} - ${account.bankBranch} (${maskAccountNumber(
    account.accountNumber
  ).slice(-4)})`;

/**
 * What the firm has borrowed, and the form that adds to it.
 *
 * The outstanding balance is not typed in either: it is what is still owed on
 * everything borrowed before, so a new loan cannot be entered against a figure
 * that disagrees with the loans already on the list.
 */
export default function LoansSection() {
  const { bankAccounts } = useFirm();

  const [records, setRecords] = useState(loanRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [proof, setProof] = useState(null);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  // Choosing at one level of the classification clears everything below it.
  const setExpenseType = (value) =>
    setDraft((prev) => ({ ...prev, expenseType: value, category: "", subcategory: "" }));
  const setCategory = (value) =>
    setDraft((prev) => ({ ...prev, category: value, subcategory: "" }));

  const num = (value) => Number(value || 0);

  // What was owed before this one. The list is newest first, so it is the
  // total the last loan left behind - repayments are not tracked yet, and this
  // becomes their running balance the moment they are.
  const latest = records[0];
  const outstanding = latest ? latest.outstanding + latest.newAmount : 0;
  const total = outstanding + num(draft.newAmount);
  const plan = schedule(total, num(draft.monthly));

  const account = bankAccounts.find((a) => String(a.id) === draft.accountId);

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.subcategory &&
    num(draft.newAmount) > 0 &&
    num(draft.monthly) > 0 &&
    draft.method &&
    draft.accountId &&
    draft.paymentDate &&
    proof;

  const save = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        paymentDate: draft.paymentDate,
        expenseType: draft.expenseType,
        category: draft.category,
        subcategory: draft.subcategory,
        method: draft.method,
        bank: account?.bankName || "",
        outstanding,
        newAmount: num(draft.newAmount),
        monthly: num(draft.monthly),
        proof: proof.name,
        proofUrl: URL.createObjectURL(proof),
        notes: draft.notes,
      },
      ...prev,
    ]);
    setDraft(emptyDraft);
    setProof(null);
    setPage(1);
  };

  const openProof = (record) => {
    if (record.proofUrl) {
      window.open(record.proofUrl, "_blank", "noopener,noreferrer");
    }
  };

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const shown = records.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Add a loan */}
      <div className="rounded-lg border p-4">
        <p className="mb-4 font-semibold text-primary">Add Loan</p>

        <div className="space-y-4">
          <Step number="1" title="Expense Classification" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="loan-expense-type" required>
                Expense Type
              </FieldLabel>
              <Select value={draft.expenseType} onValueChange={setExpenseType}>
                <SelectTrigger id="loan-expense-type">
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_CLASSIFICATION.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="loan-category" required>
                Category
              </FieldLabel>
              <Select
                value={draft.category}
                onValueChange={setCategory}
                disabled={!draft.expenseType}
              >
                <SelectTrigger id="loan-category">
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
              <FieldLabel htmlFor="loan-subcategory" required>
                Subcategory
              </FieldLabel>
              <Select
                value={draft.subcategory}
                onValueChange={(value) => set("subcategory", value)}
                disabled={!draft.category}
              >
                <SelectTrigger id="loan-subcategory">
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

          <Step number="2" title="Loan Details" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <Derived
              id="loan-outstanding"
              label={<>Outstanding Balance (<Rial />)</>}
              value={amount(outstanding)}
              hint="Remaining balance from previous loans"
            />

            <div className="space-y-2">
              <FieldLabel htmlFor="loan-new-amount" required>
                New Loan Amount (<Rial />)
              </FieldLabel>
              <Input
                id="loan-new-amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={draft.newAmount}
                onChange={(e) => set("newAmount", e.target.value)}
              />
            </div>

            <Derived
              id="loan-total"
              label={<>Total Loan Amount (<Rial />)</>}
              value={amount(total)}
              hint="Outstanding + New Amount"
            />

            <div className="space-y-2">
              <FieldLabel htmlFor="loan-monthly" required>
                Monthly Installment (<Rial />)
              </FieldLabel>
              <Input
                id="loan-monthly"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={draft.monthly}
                onChange={(e) => set("monthly", e.target.value)}
              />
            </div>

            <Derived
              id="loan-months"
              label="Number of Installments (Months)"
              value={plan.months}
              hint="Calculated automatically"
            />

            <Derived
              id="loan-installment"
              label={<>Installment Amount (<Rial />)</>}
              value={amount(plan.installment)}
              hint="Regular monthly installment"
            />

            <Derived
              id="loan-last"
              label={<>Last Installment Amount (<Rial />)</>}
              value={amount(plan.last)}
              hint="The last installment is different"
            />

            <Derived
              id="loan-total-months"
              label="Total Number of Months"
              value={plan.months}
              hint="Calculated automatically"
            />

            <div className="space-y-2">
              <FieldLabel htmlFor="loan-method" required>
                Payment Method
              </FieldLabel>
              <Select
                value={draft.method}
                onValueChange={(value) => set("method", value)}
              >
                <SelectTrigger id="loan-method">
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
              <FieldLabel htmlFor="loan-account" required>
                Bank / Account
              </FieldLabel>
              <Select
                value={draft.accountId}
                onValueChange={(value) => set("accountId", value)}
              >
                <SelectTrigger id="loan-account">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {accountLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="loan-date" required>
                Payment Date
              </FieldLabel>
              <Input
                id="loan-date"
                type="date"
                value={draft.paymentDate}
                onChange={(e) => set("paymentDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required>Transfer Proof</FieldLabel>
              <UploadBox file={proof} onSelect={setProof} />
              <Hint>PDF, JPG, PNG (Max 5MB)</Hint>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="loan-notes">Notes</FieldLabel>
            <div className="relative">
              <Input
                id="loan-notes"
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
              Save Loan
            </Button>
          </div>
        </div>
      </div>

      {/* What has been borrowed */}
      <div className="rounded-lg border">
        <p className="border-b p-4 font-semibold text-primary">Loans List</p>

        {records.length === 0 ? (
          <div className="p-6">
            <EmptyState>No loans recorded yet.</EmptyState>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto p-4">
              {/* Wide on purpose: the financial column carries six figures and
                  the columns beside it collapse if the table is allowed to
                  squeeze. It scrolls sideways instead. */}
              <table className="w-full min-w-[1280px] border text-sm">
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
                    {/* The money and the schedule read as one story, so they
                        are told in one column rather than side by side. */}
                    <th className="p-3 font-semibold" style={{ width: "32%" }}>
                      Financial Details (<Rial />)
                    </th>
                    <th className="whitespace-nowrap p-3 font-semibold">
                      Transfer Proof
                    </th>
                    <th className="p-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((record, index) => {
                    const loanTotal = record.outstanding + record.newAmount;
                    const plan = schedule(loanTotal, record.monthly);
                    return (
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
                        <td className="p-3 align-top">
                          <span className="block font-semibold">
                            {record.expenseType}
                          </span>
                          <span className="block text-muted-foreground">
                            {record.category} / {record.subcategory}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-3 align-top">
                          {period(record.paymentDate)}
                        </td>
                        <td className="p-3 align-top">
                          <span className="block">{record.method}</span>
                          {record.bank && (
                            <span className="block text-muted-foreground">
                              ({SOURCE_SHORT[record.bank] || record.bank})
                            </span>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          <span className="block">
                            <span className="font-semibold">Outstanding:</span>{" "}
                            {amount(record.outstanding)}
                            <span className="px-2 text-muted-foreground">|</span>
                            <span className="font-semibold">New Amount:</span>{" "}
                            {amount(record.newAmount)}
                            <span className="px-2 text-muted-foreground">|</span>
                            <span className="font-semibold">Total Loan:</span>{" "}
                            {amount(loanTotal)}
                          </span>
                          <span className="mt-1 block text-muted-foreground">
                            <span className="font-semibold">Monthly:</span>{" "}
                            {amount(plan.installment)}
                            <span className="px-2">|</span>
                            <span className="font-semibold">Last:</span>{" "}
                            {amount(plan.last)}
                            <span className="px-2">|</span>
                            <span className="font-semibold">Months:</span>{" "}
                            {plan.months}
                          </span>
                        </td>
                        <td className="p-3 align-top">
                          <button
                            type="button"
                            onClick={() => openProof(record)}
                            className="inline-flex items-center gap-1.5 rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-red-600" />
                            {record.proof}
                          </button>
                        </td>
                        <td className="p-3 align-top text-muted-foreground">
                          {record.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
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
