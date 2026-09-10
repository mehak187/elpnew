import {
  Fragment,
  useState } from "react";
import { Button } from "@/components/ui/button";
import FormHeading from "@/components/shared/FormHeading";
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
import Panel from "@/components/shared/Panel";
import {
  Users,
  HandCoins,
  Info,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react";
import {
  LOAN_BOOKING,
  DEFAULT_LOAN_BOOKING,
  ADDITIONAL_LOAN,
  categoriesOf,
  subcategoriesOf,
  loanRecords,
  loanTotal,
  loanYear,
  schedule,
  scheduleRows,
  dueDate,
  INSTALLMENT_STATUS_TONE,
  amount,
  formatDate,
} from "../loanData";

const NOTES_LIMIT = 300;

// Three figures are asked for and everything else is counted from them:
// how much is wanted, what comes off each month, and when the first one
// falls due.
const emptyDraft = {
  ...DEFAULT_LOAN_BOOKING,
  requested: "",
  extraRequested: "",
  monthly: "",
  firstDate: "",
};

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
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

/** One of the figures the schedule is summed up by, label over number. */
function Total({ label, tone, children }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-base font-bold text-primary", tone)}>
        {children}
      </p>
    </div>
  );
}

/** The note under a field that says where its figure came from. */
function Hint({ children }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/**
 * One labelled line of a loan's summary.
 *
 * The labels are given a fixed width so the colons line up down the cell,
 * which is what makes four different facts read as one block.
 */
function Detail({ label, children }) {
  return (
    <span className="block text-xs">
      <span className="inline-block w-32 text-muted-foreground">{label}</span>
      <span className="font-semibold text-primary">: {children}</span>
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


/**
 * What the firm has borrowed, and the form that adds to it.
 *
 * The outstanding balance is not typed in either: it is what is still owed on
 * everything borrowed before, so a new loan cannot be entered against a figure
 * that disagrees with the loans already on the list.
 */
export default function LoansSection({ adding, onCloseAdd }) {
  const [records, setRecords] = useState(loanRecords);
  const [draft, setDraft] = useState(emptyDraft);

  // Which loans have been folded away. Absent means open: a loan says very
  // little without the schedule that repays it.
  const [collapsed, setCollapsed] = useState({});
  const [year, setYear] = useState("");

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const num = (value) => Number(value || 0);

  const isAdditional = draft.subcategory === ADDITIONAL_LOAN;

  // What was owed before this one. The list is newest first, so it is the
  // total the last loan left behind - an additional loan is repaid on the
  // whole debt, not just on the part being added now.
  const latest = records[0];
  const outstanding = latest ? latest.outstanding + latest.newAmount : 0;
  const requested = num(isAdditional ? draft.extraRequested : draft.requested);
  const totalLoan = isAdditional ? outstanding + requested : requested;

  // The number of months, the size of the final instalment and the day it
  // falls due all follow from the three figures above. None of them is typed,
  // so none of them can contradict the loan it describes.
  const plan = schedule(totalLoan, num(draft.monthly));
  const lastDue = plan.months ? dueDate(draft.firstDate, plan.months - 1) : "";

  // A request has no repayments against it yet, so the schedule below is what
  // the loan will look like rather than what it has done.
  const rows = scheduleRows(totalLoan, num(draft.monthly), draft.firstDate);
  const totalPaid = rows.reduce((sum, row) => sum + row.paid, 0);

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.subcategory &&
    requested > 0 &&
    num(draft.monthly) > 0 &&
    draft.firstDate;

  const save = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        kind: draft.subcategory,
        loanAmount: requested,
        merged: isAdditional ? outstanding : 0,
        // The office fills these in when it actually pays the loan out.
        disbursementDate: "",
        bankName: "",
        accountNumber: "",
        monthly: num(draft.monthly),
        firstDue: draft.firstDate,
        payments: [],
      },
      ...prev,
    ]);
    closeAdd();
  };

  const closeAdd = () => {
    setDraft(emptyDraft);
    onCloseAdd();
  };

  const toggle = (id) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  // The years that have loans in them, newest first, read off the loans
  // themselves - a year with nothing in it is not worth offering.
  const years = [...new Set(records.map(loanYear))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  const shownYear = year || years[0];
  const shown = records.filter((record) => loanYear(record) === shownYear);

  // Adding takes over the section: the list describes loans already running,
  // and none of it helps while a new one is being asked for.
  if (adding) {
    return (
      <div className="space-y-6">
        <FormHeading
          icon={HandCoins}
          title="Add Loan Request"
          note="Ask for a loan and see exactly how it will be repaid."
          onBack={closeAdd}
        />

        {/* Where the loan lands in the accounts. The subcategory is chosen
            first because it decides which questions the form asks. */}
        <Panel title="Request Details" icon={ClipboardList}>
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
                  {/* Laid out inline: the trigger clamps every span child to
                      one line with display:-webkit-box, which beats a flex
                      utility. */}
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
                  {subcategoriesOf(draft.expenseType, draft.category).map(
                    (sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Panel>

        {/* Three figures are asked for; the three under them are counted. */}
        <Panel title="Loan Information" icon={HandCoins}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <AmountField
              id="loan-requested"
              label="Requested Amount"
              required
              value={isAdditional ? draft.extraRequested : draft.requested}
              onChange={(e) =>
                set(
                  isAdditional ? "extraRequested" : "requested",
                  e.target.value
                )
              }
            />

            {/* An additional loan is repaid on the whole debt, so what was
                already owed has to be on the form that adds to it. */}
            {isAdditional && (
              <>
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
                  value={amount(totalLoan)}
                  readOnly
                />
              </>
            )}

            <AmountField
              id="loan-monthly"
              label="Monthly Installment"
              required
              value={draft.monthly}
              onChange={(e) => set("monthly", e.target.value)}
            />

            <div className="space-y-2">
              <FieldLabel htmlFor="loan-first-date" required>
                First Installment Date
              </FieldLabel>
              <Input
                id="loan-first-date"
                type="date"
                value={draft.firstDate}
                onChange={(e) => set("firstDate", e.target.value)}
              />
            </div>

            <Derived
              id="loan-months"
              label="Number of Months"
              value={plan.months || ""}
              hint="Calculated automatically"
            />

            <Derived
              id="loan-last-date"
              label="Last Installment Date"
              value={lastDue ? formatDate(lastDue) : ""}
              hint="Calculated automatically"
            />

            <Derived
              id="loan-last-amount"
              label={<>Last Installment Amount (<Rial />)</>}
              value={plan.months ? amount(plan.last) : ""}
              hint="Calculated automatically"
            />
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={closeAdd}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Submit Request
          </Button>
        </div>

        {/* The repayment plan, worked out as the figures above are typed, so
            the request is signed off against the schedule it creates. */}
        <div className="overflow-hidden rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-secondary/60 px-4 py-3">
            <p className="text-base font-bold text-primary">
              Installment Schedule
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Total label={<>Total Loan Amount (<Rial />)</>}>
                {amount(totalLoan)}
              </Total>
              <Total label={<>Total Paid (<Rial />)</>} tone="text-green-700">
                {amount(totalPaid)}
              </Total>
              <Total label={<>Remaining Amount (<Rial />)</>}>
                {amount(totalLoan - totalPaid)}
              </Total>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState>
                Enter the amount, the monthly instalment and the first due date
                to see the schedule.
              </EmptyState>
            </div>
          ) : (
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[880px] text-center text-sm">
                <thead className="sticky top-0 z-10 bg-secondary/60 text-primary">
                  <tr className="border-b">
                    <th className="p-3 font-semibold">No.</th>
                    <th className="whitespace-nowrap p-3 font-semibold">
                      Due Date
                    </th>
                    <th className="whitespace-nowrap p-3 font-semibold">
                      Installment Amount (<Rial />)
                    </th>
                    <th className="whitespace-nowrap p-3 font-semibold">
                      Paid Amount (<Rial />)
                    </th>
                    <th className="whitespace-nowrap p-3 font-semibold">
                      Balance (<Rial />)
                    </th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="whitespace-nowrap p-3 font-semibold">
                      Payment Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.no}
                      className="border-b transition-colors last:border-0 hover:bg-primary/5"
                    >
                      <td className="p-3 font-medium text-primary">{row.no}</td>
                      <td className="whitespace-nowrap p-3">
                        {formatDate(row.due)}
                      </td>
                      <td className="p-3">{amount(row.installment)}</td>
                      <td className="p-3">{amount(row.paid)}</td>
                      <td className="p-3">{amount(row.balance)}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-block rounded-full px-3 py-0.5 text-xs font-medium",
                            INSTALLMENT_STATUS_TONE[row.status]
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-3">
                        {row.paymentDate ? formatDate(row.paymentDate) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Which year is being looked at, and what the page is for. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <FieldLabel htmlFor="loan-year">Loan Year</FieldLabel>
          <Select value={shownYear} onValueChange={setYear}>
            <SelectTrigger id="loan-year" className="w-40">
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

        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
          This page shows your loan details and installment payments.
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        {shown.length === 0 ? (
          <div className="p-6">
            <EmptyState>No loans were drawn in {shownYear}.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1140px] text-sm">
              <thead>
                <tr className="border-b bg-secondary/60 text-primary">
                  <th className="p-3 font-semibold" style={{ width: "5%" }}>
                    No.
                  </th>
                  <th className="p-3 text-left font-semibold" style={{ width: "27%" }}>
                    Loan / Installment Details
                  </th>
                  <th className="whitespace-nowrap p-3 font-semibold" style={{ width: "11%" }}>
                    Due Date
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "13%" }}>
                    Installment Amount
                    <span className="block font-normal">(<Rial />)</span>
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "12%" }}>
                    Paid Amount
                    <span className="block font-normal">(<Rial />)</span>
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "14%" }}>
                    Installment Status
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "13%" }}>
                    Remaining Balance
                    <span className="block font-normal">(<Rial />)</span>
                  </th>
                  <th className="p-3" style={{ width: "5%" }}>
                    <span className="sr-only">Show instalments</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((record, index) => {
                  const total = loanTotal(record);
                  const rows = scheduleRows(
                    total,
                    record.monthly,
                    record.firstDue,
                    record.payments
                  );
                  const open = !collapsed[record.id];

                  return (
                    <Fragment key={record.id}>
                      {/* The loan itself. Nothing in the instalment columns
                          belongs to it, so nothing is put there. */}
                      <tr className="border-b bg-green-50/70">
                        <td className="p-3 text-center font-bold text-primary">
                          {index + 1}
                        </td>
                        <td className="p-3">
                          <span className="block font-bold text-primary">
                            {record.kind}
                            {record.merged > 0 && (
                              <span className="text-destructive">
                                {" "}
                                (Merged with Previous Loan)
                              </span>
                            )}
                          </span>
                          <Detail label="Loan Amount">
                            {amount(record.loanAmount)}
                          </Detail>
                          <Detail label="Disbursement Date">
                            {record.disbursementDate
                              ? formatDate(record.disbursementDate)
                              : "Not paid out yet"}
                          </Detail>
                          <Detail label="Bank / Account">
                            {record.bankName
                              ? record.bankName + " - " + record.accountNumber + " (IBAN)"
                              : "-"}
                          </Detail>
                          {record.merged > 0 && (
                            <Detail label="Note">
                              Previous loan of {amount(record.merged)} merged
                              into this loan.
                            </Detail>
                          )}
                        </td>
                        <td className="p-3 text-center text-muted-foreground">-</td>
                        <td className="p-3 text-center text-muted-foreground">-</td>
                        <td className="p-3 text-center text-muted-foreground">-</td>
                        <td className="p-3 text-center text-muted-foreground">-</td>
                        <td className="p-3 text-center text-muted-foreground">-</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(record.id)}
                            aria-expanded={open}
                            className="rounded p-1 text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {open ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                            <span className="sr-only">
                              {open
                                ? "Hide instalments"
                                : "Show instalments"}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {open &&
                        rows.map((row) => (
                          <tr
                            key={record.id + "-" + row.no}
                            className="border-b transition-colors hover:bg-primary/5"
                          >
                            <td className="p-3 text-center text-muted-foreground">
                              {index + 1}.{row.no}
                            </td>
                            <td className="p-3 font-medium text-primary">
                              Installment {row.no} of {row.of}
                            </td>
                            <td className="whitespace-nowrap p-3 text-center">
                              {formatDate(row.due)}
                            </td>
                            <td className="p-3 text-center">
                              {amount(row.installment)}
                            </td>
                            <td className="p-3 text-center">
                              {amount(row.paid)}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={cn(
                                  "inline-block rounded-md px-3 py-1 text-xs font-semibold",
                                  INSTALLMENT_STATUS_TONE[row.status]
                                )}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="p-3 text-center font-medium">
                              {amount(row.remaining)}
                            </td>
                            <td className="p-3" />
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}