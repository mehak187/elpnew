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
import { cn } from "@/lib/utils";
import { Rial } from "@/components/shared/Rial";
import { FileText, Users, HandCoins, Info } from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { useFirm } from "@/lib/firm/context";
import { maskAccountNumber } from "@/pages/firm/firmData";
import UploadBox from "./UploadBox";
import {
  LOAN_BOOKING,
  DEFAULT_LOAN_BOOKING,
  ADDITIONAL_LOAN,
  categoriesOf,
  subcategoriesOf,
  loanRecords,
  schedule,
  endDate,
  amount,
  formatDate,
  SOURCE_SHORT,
} from "../loanData";

const NOTES_LIMIT = 300;
const PAGE_SIZE = 5;

const emptyDraft = {
  ...DEFAULT_LOAN_BOOKING,
  requested: "",
  first: "",
  last: "",
  months: "",
  extraRequested: "",
  instFirst: "",
  instLast: "",
  instCount: "",
  method: "",
  accountId: "",
  paymentDate: "",
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

/**
 * One figure on the loans list, kept whole.
 *
 * The label and its number never separate; the bar that follows sits inside
 * the same unbreakable piece, so a line break lands between figures.
 */
function Money({ label, children, last }) {
  return (
    <span className="inline-block whitespace-nowrap">
      <span className="font-semibold">{label}</span> {children}
      {!last && <span className="px-2 text-muted-foreground">|</span>}
    </span>
  );
}

/** A titled group of fields, ruled off from the next. */
function Block({ title, children }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-primary">{title}</p>
      {children}
    </div>
  );
}

/** An amount field, with the currency named in its label. */
function AmountField({ id, label, required, hint, value, onChange, readOnly }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label} (<Rial />)
        {hint && (
          <Info
            className="ml-1 inline h-3.5 w-3.5 align-text-top text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </FieldLabel>
      <Input
        id={id}
        type={readOnly ? "text" : "number"}
        min={readOnly ? undefined : "0"}
        step={readOnly ? undefined : "0.001"}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        placeholder="0.000"
        className={cn(readOnly && "bg-muted text-muted-foreground")}
        value={value}
        onChange={onChange}
        title={hint}
      />
    </div>
  );
}

/** A count of months, with the unit named under it. */
function Count({ id, label, required, unit, value, onChange }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        type="number"
        min="1"
        placeholder="0"
        value={value}
        onChange={onChange}
      />
      <Hint>{unit}</Hint>
    </div>
  );
}

/** The date a run of instalments finishes on. Counted, never typed. */
function Ends({ id, label, value }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        className="bg-muted text-muted-foreground"
        value={value ? formatDate(value) : ""}
      />
    </div>
  );
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
export default function LoansSection({ adding, onCloseAdd }) {
  const { bankAccounts } = useFirm();

  const [records, setRecords] = useState(loanRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [proof, setProof] = useState(null);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const num = (value) => Number(value || 0);

  const isAdditional = draft.subcategory === ADDITIONAL_LOAN;

  // What was owed before this one. The list is newest first, so it is the
  // total the last loan left behind - repayments are not tracked yet, and this
  // becomes their running balance the moment they are.
  const latest = records[0];
  const outstanding = latest ? latest.outstanding + latest.newAmount : 0;
  const totalAfter = outstanding + num(draft.extraRequested);

  // Both end dates are counted forward from the day the money goes out, so
  // neither can be typed to say something the instalment count does not.
  const loanEnds = endDate(draft.paymentDate, draft.months);
  const instalmentEnds = endDate(draft.paymentDate, draft.instCount);

  const account = bankAccounts.find((a) => String(a.id) === draft.accountId);

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.subcategory &&
    num(isAdditional ? draft.extraRequested : draft.requested) > 0 &&
    num(draft.instFirst) > 0 &&
    num(draft.instCount) > 0 &&
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
        outstanding: isAdditional ? outstanding : 0,
        newAmount: num(isAdditional ? draft.extraRequested : draft.requested),
        monthly: num(draft.instFirst),
        last: num(draft.instLast),
        months: num(draft.instCount),
        endsOn: instalmentEnds,
        proof: proof.name,
        proofUrl: URL.createObjectURL(proof),
        notes: draft.subcategory,
      },
      ...prev,
    ]);
    closeAdd();
  };

  const closeAdd = () => {
    setDraft(emptyDraft);
    setProof(null);
    setPage(1);
    onCloseAdd();
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

  if (adding) {
    return (
      <div className="space-y-6 rounded-lg border p-4 sm:p-6">
        {/* Where the loan lands in the accounts. The subcategory is chosen
            first because it decides which questions the form asks. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor="loan-type" required>
              Expense Type
            </FieldLabel>
            <Select
              value={draft.expenseType}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  expenseType: value,
                  category: "",
                  subcategory: "",
                }))
              }
            >
              <SelectTrigger id="loan-type">
                {/* Laid out inline: the trigger clamps every span child to one
                    line with display:-webkit-box, which beats a flex utility. */}
                <span
                  style={{ display: "flex" }}
                  className="min-w-0 items-center gap-2"
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Select expense type" />
                </span>
              </SelectTrigger>
              <SelectContent>
                {LOAN_BOOKING.map((type) => (
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
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, category: value, subcategory: "" }))
              }
              disabled={!draft.expenseType}
            >
              <SelectTrigger id="loan-category">
                <span
                  style={{ display: "flex" }}
                  className="min-w-0 items-center gap-2"
                >
                  <HandCoins className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Select category" />
                </span>
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
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* The first block is the loan being asked for, and what it asks
            depends on which kind it is: a new loan states its own amount,
            an additional one states what is being added to a balance that
            is already there. Only one of the two can be true, so only one
            is shown. */}
        {isAdditional ? (
          <Block title="Additional Loan Amount">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              <AmountField
                id="loan-extra"
                label="Requested Amount"
                required
                value={draft.extraRequested}
                onChange={(e) => set("extraRequested", e.target.value)}
              />
              <AmountField
                id="loan-outstanding"
                label="Current Outstanding Balance"
                hint="What is still owed on earlier borrowing"
                value={amount(outstanding)}
                readOnly
              />
              <AmountField
                id="loan-after"
                label="Total Loan Amount After Addition"
                value={amount(totalAfter)}
                readOnly
              />
            </div>
          </Block>
        ) : (
          <Block title="Loan Amount">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-6">
              <AmountField
                id="loan-requested"
                label="Requested Amount"
                required
                value={draft.requested}
                onChange={(e) => set("requested", e.target.value)}
              />
              <AmountField
                id="loan-first"
                label="First Installment"
                required
                value={draft.first}
                onChange={(e) => set("first", e.target.value)}
              />
              <AmountField
                id="loan-last"
                label="Last Installment"
                hint="The last instalment settles whatever the whole ones leave"
                value={draft.last}
                onChange={(e) => set("last", e.target.value)}
              />
              <Count
                id="loan-count"
                label="Number of Months"
                required
                unit="Months"
                value={draft.months}
                onChange={(e) => set("months", e.target.value)}
              />
              <Ends id="loan-end" label="Loan End Date" value={loanEnds} />
            </div>
          </Block>
        )}

        <Block title="Installments">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <AmountField
              id="loan-inst-first"
              label="First Installment"
              required
              value={draft.instFirst}
              onChange={(e) => set("instFirst", e.target.value)}
            />
            <AmountField
              id="loan-inst-last"
              label="Last Installment"
              hint="The last instalment settles whatever the whole ones leave"
              value={draft.instLast}
              onChange={(e) => set("instLast", e.target.value)}
            />
            <Count
              id="loan-inst-count"
              label="Number of Installments"
              required
              unit="Installments"
              value={draft.instCount}
              onChange={(e) => set("instCount", e.target.value)}
            />
            <Ends
              id="loan-inst-end"
              label="Installment End Date"
              value={instalmentEnds}
            />
          </div>
        </Block>

        <Block title="Payment Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
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
        </Block>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={closeAdd}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Save Loan Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                    {/* Six columns, because eight will not fit: the date
                        already carries the month and year, and the proof
                        belongs with the payment it evidences. */}
                    <th className="p-3 font-semibold" style={{ width: "5%" }}>
                      No.
                    </th>
                    <th className="whitespace-nowrap p-3 font-semibold" style={{ width: "11%" }}>
                      Payment Date
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "18%" }}>
                      Expense Type
                      <span className="block font-normal">
                        Category / Subcategory
                      </span>
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "30%" }}>
                      Financial Details (<Rial />)
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "20%" }}>
                      Payment Method
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "16%" }}>
                      Notes
                    </th>
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
                        <td className="p-3 align-top">
                          {/* Each figure is one unbreakable piece, so a narrow
                              column wraps between them rather than stranding a
                              number on its own line. */}
                          <span className="block">
                            <Money label="Outstanding:">
                              {amount(record.outstanding)}
                            </Money>
                            <Money label="New Amount:">
                              {amount(record.newAmount)}
                            </Money>
                            <Money label="Total Loan:" last>
                              {amount(loanTotal)}
                            </Money>
                          </span>
                          <span className="mt-1 block text-muted-foreground">
                            <Money label="Monthly:">
                              {amount(plan.installment)}
                            </Money>
                            <Money label="Last:">{amount(plan.last)}</Money>
                            <Money label="Months:" last>{plan.months}</Money>
                          </span>
                        </td>
                        <td className="p-3 align-top">
                          <span className="block whitespace-nowrap">
                            {record.method}
                          </span>
                          {record.bank && (
                            <span className="block whitespace-nowrap text-muted-foreground">
                              ({SOURCE_SHORT[record.bank] || record.bank})
                            </span>
                          )}
                          {record.proof && (
                            <button
                              type="button"
                              onClick={() => openProof(record)}
                              className="mt-1 inline-flex items-center gap-1.5 rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <FileText className="h-4 w-4 shrink-0 text-red-600" />
                              <span className="truncate">{record.proof}</span>
                            </button>
                          )}
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
