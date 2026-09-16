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
import { Card, CardContent } from "@/components/ui/card";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
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
  LOAN_EXPENSE_TYPE,
  LOAN_INCREASE,
  LOAN_PENDING,
  LOAN_STATUS_TONE,
  loanCategoryFor,
  outstandingTotal,
  pendingRequest,
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
// falls due. Where the loan is booked is not among them: it is settled by
// what the employee already owes.
const emptyDraft = {
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
function Hint({ className, children }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>
  );
}

/**
 * A note under a field that does not push the field around.
 *
 * The boxes in a row are lined up by their bottom edge, so anything hanging
 * below one of them would lift that box above the others. This hangs in the
 * space the grid leaves under the row instead.
 */
const UNDER_FIELD = "absolute left-0 top-full mt-1";

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
    <div className="flex flex-col justify-end space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
        {/* A figure that is typed needs the label to say what it is in; one
            that is worked out arrives with the currency already on it. */}
        {!readOnly && <> (<Rial />)</>}
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
        className={cn(readOnly && "bg-locked text-muted-foreground")}
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
    <div className="relative flex flex-col justify-end gap-2">
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
      <Hint className={UNDER_FIELD}>{unit}</Hint>
    </div>
  );
}

/** The date a run of instalments finishes on. Counted, never typed. */
function Ends({ id, label, value }) {
  return (
    <div className="flex flex-col justify-end space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        className="bg-locked text-muted-foreground"
        value={value ? formatDate(value) : ""}
      />
    </div>
  );
}

/** A worked-out figure, shown rather than asked for. */
function Derived({ id, label, value, hint }) {
  return (
    <div className="relative flex flex-col justify-end gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        className="bg-locked text-muted-foreground"
        value={value}
      />
      {hint && <Hint className={UNDER_FIELD}>{hint}</Hint>}
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

  // What the employee still owes on everything approved, and therefore which
  // of the two categories this request falls under. Neither is asked for:
  // both follow from the loans already on the list, and a request waiting for
  // a decision is not money in hand.
  const outstanding = outstandingTotal(records);
  const category = loanCategoryFor(records);
  const isIncrease = category === LOAN_INCREASE;

  // One request at a time: nothing can be asked for while the office is still
  // deciding the last one.
  const waiting = pendingRequest(records);

  const requested = num(isIncrease ? draft.extraRequested : draft.requested);
  const totalLoan = isIncrease ? outstanding + requested : requested;

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
    !waiting && requested > 0 && num(draft.monthly) > 0 && draft.firstDate;

  const save = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        kind: category,
        // Asked for, not granted: the office decides it from its own side.
        status: LOAN_PENDING,
        loanAmount: requested,
        merged: isIncrease ? outstanding : 0,
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

  // Nothing can be asked for while a request is still being decided: a second
  // one would be asking for the same money twice.
  if (adding && waiting) {
    return (
      <div className="space-y-6">
        <FormHeading
          icon={HandCoins}
          title="Add Loan Request"
          note="Ask for a loan and see exactly how it will be repaid."
          onBack={closeAdd}
        />

        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
          </span>
          <span>
            <span className="block font-semibold">
              A loan request is already awaiting approval.
            </span>
            <span className="block">
              {amount(waiting.loanAmount)} was asked for and is still being
              decided. A new request cannot be made until then.
            </span>
          </span>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={closeAdd}>
            Back to Loans
          </Button>
        </div>
      </div>
    );
  }

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

        {/* Where the loan lands in the accounts. Neither field is a question:
            a loan is always an employee expense, and which category it falls
            under is read off what is still owed. */}
        <Panel title="Request Details" icon={ClipboardList}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="loan-type">Expense Type</FieldLabel>
              <Input
                id="loan-type"
                value={LOAN_EXPENSE_TYPE}
                readOnly
                tabIndex={-1}
                className="cursor-default bg-locked text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="loan-category">Category</FieldLabel>
              <Input
                id="loan-category"
                value={category}
                readOnly
                tabIndex={-1}
                className="cursor-default bg-locked text-muted-foreground"
              />
              <Hint>
                {isIncrease
                  ? "An earlier loan is still being repaid, so this request adds to it."
                  : "Nothing is outstanding, so this is a new loan."}
              </Hint>
            </div>
          </div>
        </Panel>

        {/* Three figures are asked for; the three under them are counted.
            The boxes line up on their bottom edge, so a label that wraps onto
            a second line grows upwards and leaves its box where the others
            are; the notes underneath hang in the padding below the row. */}
        <Panel title="Loan Information" icon={HandCoins}>
          <div className="grid grid-cols-1 items-end gap-4 pb-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
            <AmountField
              id="loan-requested"
              label="Requested Amount"
              required
              value={isIncrease ? draft.extraRequested : draft.requested}
              onChange={(e) =>
                set(
                  isIncrease ? "extraRequested" : "requested",
                  e.target.value
                )
              }
            />

            {/* An increase is repaid on the whole debt, so what was already
                owed has to be on the form that adds to it. */}
            {isIncrease && (
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

            <div className="flex flex-col justify-end space-y-2">
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
              label="Last Installment Amount"
              value={plan.months ? amount(plan.last) : ""}
              hint="Calculated automatically"
            />
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Plain buttons: this form sits inside the employee form, which a
              submit button here would send instead. */}
          <Button type="button" variant="outline" onClick={closeAdd}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!canSave}>
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
              <Total label="Total Loan Amount">{amount(totalLoan)}</Total>
              <Total label="Total Paid" tone="text-green-700">
                {amount(totalPaid)}
              </Total>
              <Total label="Remaining Amount">
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
            <div className="max-h-96 overflow-auto p-4">
              <RecordTable minWidth={880}>
                <HeadRow>
                    <Th>No.</Th>
                    <Th>Due Date</Th>
                    <Th className="text-right">Installment Amount</Th>
                    <Th className="text-right">Paid Amount</Th>
                    <Th className="text-right">Balance</Th>
                    <Th className="text-center">Status</Th>
                    <Th>Payment Date</Th>
                </HeadRow>
                <tbody>
                  {rows.map((row) => (
                    <Row key={row.no}>
                      <Td className="font-medium text-primary">{row.no}</Td>
                      <Td className="whitespace-nowrap">
                        {formatDate(row.due)}
                      </Td>
                      <Td className="text-right">{amount(row.installment)}</Td>
                      <Td className="text-right">{amount(row.paid)}</Td>
                      <Td className="text-right">{amount(row.balance)}</Td>
                      <Td className="text-center">
                        <span
                          className={cn(
                            "inline-block rounded-md px-3 py-1 text-xs font-semibold",
                            INSTALLMENT_STATUS_TONE[row.status]
                          )}
                        >
                          {row.status}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {row.paymentDate ? formatDate(row.paymentDate) : "-"}
                      </Td>
                    </Row>
                  ))}
                </tbody>
              </RecordTable>
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

      <Card>
        <CardContent className="p-4 sm:p-6">
        {shown.length === 0 ? (
            <EmptyState>No loans were drawn in {shownYear}.</EmptyState>
        ) : (
            <RecordTable minWidth={1140}>
              <HeadRow>
                  <Th width="5%">No.</Th>
                  <Th width="27%" className="text-left">
                    Loan / Installment Details
                  </Th>
                  <Th width="11%">Due Date</Th>
                  {/* No unit in the headings: every figure below carries it. */}
                  <Th width="13%" className="text-right">
                    Installment Amount
                  </Th>
                  <Th width="12%" className="text-right">
                    Paid Amount
                  </Th>
                  <Th width="14%">Installment Status</Th>
                  <Th width="13%" className="text-right">
                    Remaining Balance
                  </Th>
                  <Th width="5%">
                    <span className="sr-only">Show instalments</span>
                  </Th>
              </HeadRow>
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
                      <Row className="bg-green-50/70">
                        <Td className="font-bold text-primary">{index + 1}</Td>
                        <Td className="text-left">
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
                          {/* Where the request has got to: it decides what the
                              next one may be asked for, so it is on the row. */}
                          <Detail label="Status">
                            <span
                              className={cn(
                                "font-semibold",
                                LOAN_STATUS_TONE[record.status]
                              )}
                            >
                              {record.status}
                            </span>
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
                        </Td>
                        <Td className="text-center text-muted-foreground">-</Td>
                        <Td className="text-right text-muted-foreground">-</Td>
                        <Td className="text-right text-muted-foreground">-</Td>
                        <Td className="text-center text-muted-foreground">-</Td>
                        <Td className="text-right text-muted-foreground">-</Td>
                        <Td className="text-center">
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
                        </Td>
                      </Row>

                      {open &&
                        rows.map((row) => (
                          <Row key={record.id + "-" + row.no}>
                            <Td className="text-muted-foreground">
                              {index + 1}.{row.no}
                            </Td>
                            <Td className="text-left font-medium text-primary">
                              Installment {row.no} of {row.of}
                            </Td>
                            <Td className="whitespace-nowrap">
                              {formatDate(row.due)}
                            </Td>
                            <Td className="text-right">
                              {amount(row.installment)}
                            </Td>
                            <Td className="text-right">{amount(row.paid)}</Td>
                            <Td className="text-center">
                              <span
                                className={cn(
                                  "inline-block rounded-md px-3 py-1 text-xs font-semibold",
                                  INSTALLMENT_STATUS_TONE[row.status]
                                )}
                              >
                                {row.status}
                              </span>
                            </Td>
                            <Td className="text-right font-medium">
                              {amount(row.remaining)}
                            </Td>
                            <Td />
                          </Row>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </RecordTable>
        )}
        </CardContent>
      </Card>
    </div>
  );
}