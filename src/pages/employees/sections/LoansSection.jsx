import {
  Fragment,
  useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import AiSearch from "@/components/shared/AiSearch";
import SearchableSelect from "@/components/shared/SearchableSelect";
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
import { amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nextRequestNo } from "../requestFlow";
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import {
  Users,
  HandCoins,
  Tag,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { employeeRecords } from "../employeeData";
import {
  LOAN_EXPENSE_TYPE,
  LOAN_CATEGORY,
  LOAN_INCREASE,
  LOAN_PENDING,
  LOAN_REJECTED,
  LOAN_DECISION_STATUS,
  LOAN_STATUS_CHIP,
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

/** The button says what it is about to do, not merely that it saves. */
const CONFIRM_LABEL = {
  full: "Confirm Full Approval",
  partial: "Confirm Partial Approval",
  rejected: "Confirm Rejection",
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

/** The note under a field that says where its figure came from. */
function Hint({ children }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/**
 * One labelled line of a loan's summary.
 *
 * The labels are given a fixed width so the colons line up down the cell,
 * which is what makes three different facts read as one block.
 */
function Detail({ label, children }) {
  return (
    <span className="block text-xs">
      <span className="inline-block w-32 text-muted-foreground">{label}</span>
      <span className="font-semibold text-primary">: {children}</span>
    </span>
  );
}

/** An amount field, with the currency named in its label. */
function AmountField({ id, label, required, value, onChange, readOnly }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label} (<Rial />)
      </FieldLabel>
      <Input
        id={id}
        type={readOnly ? "text" : "number"}
        min={readOnly ? undefined : "0"}
        step={readOnly ? undefined : "0.001"}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        placeholder="0.000"
        className={cn(readOnly && "cursor-default bg-locked text-muted-foreground")}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * A figure the form works out rather than asks for.
 *
 * Shown in the same green as every other settled figure in the system, with
 * the note under it saying where it came from.
 */
function Derived({ id, label, value, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        className="cursor-default bg-locked text-muted-foreground"
        value={value}
      />
      <Hint>Calculated automatically</Hint>
    </div>
  );
}

/**
 * A booking the form does not ask about: a loan is always an employee expense
 * and always a loan, and which kind it is follows from what is still owed.
 */
function Fixed({ id, label, value, icon: Icon }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required>
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={() => {}}>
        <SelectTrigger id={id}>
          {/* Laid out inline rather than by class: the trigger clamps every
              span child to one line with display:-webkit-box, which would beat
              a flex utility and stack these two. */}
          <span style={{ display: "flex" }} className="min-w-0 items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={value}>{value}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * What the employee has borrowed, and the form that adds to it.
 *
 * The outstanding balance is not typed in either: it is what is still owed on
 * everything borrowed before, so a new loan cannot be entered against a figure
 * that disagrees with the loans already on the list.
 */
export default function LoansSection({
  employee,
  adding,
  onCloseAdd,
  // Opening a request from the list puts the section back into adding, so
  // the window over the page is the one that shows it.
  onOpenAdd,
  // The words on the button that opens the form, over the list it adds to.
  addLabel = "Add Loan",
  // Management decides a request; on My Profile the decision is only read.
  canDecide = true,
}) {
  const [records, setRecords] = useState(loanRecords);
  const [draft, setDraft] = useState(emptyDraft);
  // Which stage of the request is open, and what management decided.
  const [stage, setStage] = useState("request");
  const [decision, setDecision] = useState("");
  // The request that has been submitted and is now being decided, and the
  // terms management is deciding it on.
  const [openId, setOpenId] = useState(null);
  const [review, setReview] = useState({
    approved: "",
    monthly: "",
    firstDate: "",
    notes: "",
  });

  // Which loans have been folded away. Absent means open: a loan says very
  // little without the schedule that repays it.
  const [collapsed, setCollapsed] = useState({});
  const [year, setYear] = useState("");
  const [query, setQuery] = useState("");

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const num = (value) => Number(value || 0);

  // The loan belongs to whoever's record it was opened from, and can be
  // written for a colleague instead.
  const people = employeeRecords.map((person) => ({
    value: person.name,
    label: person.name,
  }));
  const borrower = draft.employee ?? (employee?.name || "");

  // What the employee still owes on everything approved, and therefore which
  // of the two categories this request falls under. Neither is asked for:
  // both follow from the loans already on the list, and a request waiting for
  // a decision is not money in hand.
  const outstanding = outstandingTotal(records);
  const category = loanCategoryFor(records);
  const isIncrease = category === LOAN_INCREASE;

  // One request at a time: nothing can be asked for while the office is still
  // deciding the last one. The request just submitted on this form is the one
  // being decided here, so it does not block itself.
  const waiting = pendingRequest(records.filter((record) => record.id !== openId));

  const requested = num(isIncrease ? draft.extraRequested : draft.requested);
  const totalLoan = isIncrease ? outstanding + requested : requested;

  // The number of months, the size of the final instalment and the day it
  // falls due all follow from the three figures above. None of them is typed,
  // so none of them can contradict the loan it describes.
  const plan = schedule(totalLoan, num(draft.monthly));
  const lastDue = plan.months ? dueDate(draft.firstDate, plan.months - 1) : "";

  // The same arithmetic over what management decided rather than what was
  // asked for. Only a partial approval may amend the terms.
  const amending = decision === "partial";
  const reviewPlan = schedule(num(review.approved), num(review.monthly));
  const reviewLastDue = reviewPlan.months
    ? dueDate(review.firstDate, reviewPlan.months - 1)
    : "";
  const setReviewField = (name, value) =>
    setReview((prev) => ({ ...prev, [name]: value }));
  const canConfirm =
    Boolean(decision) &&
    (!amending || (num(review.approved) > 0 && num(review.monthly) > 0 && review.firstDate));

  const canSave =
    !waiting &&
    borrower &&
    requested > 0 &&
    num(draft.monthly) > 0 &&
    draft.firstDate;

  /**
   * The request submitted. It is on record straight away, waiting for a
   * decision, and the form moves on to the stage that gives one.
   */
  const save = () => {
    if (!canSave) return;
    const id = records.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    setRecords((prev) => [
      {
        id,
        employee: borrower,
        kind: category,
        // On the list straight away, under a temporary number, waiting on a
        // decision. Asked for, not granted.
        requestNo: nextRequestNo(records),
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
    setOpenId(id);
    // Management decides on what was asked for, until it amends it.
    setReview({
      approved: String(requested),
      monthly: draft.monthly,
      firstDate: draft.firstDate,
      notes: "",
    });
    setStage("decision");
  };

  /**
   * The decision confirmed. A full approval grants what was asked for; a
   * partial one grants the amended terms; a rejection grants nothing, so the
   * request is left as it was asked for and marked refused.
   */
  const confirmDecision = () => {
    if (!decision || !openId) return;
    const amended = decision === "partial";
    setRecords((prev) =>
      prev.map((record) =>
        record.id === openId
          ? {
              ...record,
              status: LOAN_DECISION_STATUS[decision],
              loanAmount: amended ? num(review.approved) : record.loanAmount,
              monthly: amended ? num(review.monthly) : record.monthly,
              firstDue: amended ? review.firstDate : record.firstDue,
              managementNotes: review.notes.trim(),
            }
          : record
      )
    );
    closeAdd();
  };

  const closeAdd = () => {
    setDraft(emptyDraft);
    setStage("request");
    setDecision("");
    setOpenId(null);
    setReview({ approved: "", monthly: "", firstDate: "", notes: "" });
    onCloseAdd();
  };

  /** A request opened back off the list, to be followed or decided. */
  const track = (record) => {
    setOpenId(record.id);
    setStage("decision");
    setDecision(
      Object.keys(LOAN_DECISION_STATUS).find(
        (key) => LOAN_DECISION_STATUS[key] === record.status
      ) || ""
    );
    setDraft({
      requested: String(record.loanAmount),
      extraRequested: String(record.loanAmount),
      monthly: String(record.monthly),
      firstDate: record.firstDue,
      employee: record.employee,
    });
    setReview({
      approved: String(record.loanAmount),
      monthly: String(record.monthly),
      firstDate: record.firstDue,
      notes: record.managementNotes || "",
    });
    onOpenAdd?.();
  };

  const toggle = (id) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  // The years that have loans in them, newest first, read off the loans
  // themselves - a year with nothing in it is not worth offering.
  const years = [...new Set(records.map(loanYear))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  const shownYear = year || years[0];
  const shown = smartSearch(
    records.filter((record) => loanYear(record) === shownYear),
    query
  );

  /* ------------------------------------------------- the request being made */

  // Nothing can be asked for while a request is still being decided: a second
  // one would be asking for the same money twice.
  const blocked = adding && waiting && stage === "request";

  const form = blocked ? (
      <div className="space-y-6">
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
  ) : (
        <div className="space-y-6">
          {/* The two stages of the request. Either header opens its stage. */}
          <RequestSteps
            active={stage}
            onChange={setStage}
            steps={[
              {
                key: "request",
                title: "Loan Request",
                note: "Loan details and repayment schedule",
                done: Boolean(canSave),
              },
              {
                key: "decision",
                title: "Management Decision",
                note: "Review and approval decision",
                done: Boolean(decision),
              },
            ]}
          />

          {stage === "request" && (
            <h3 className="text-base font-semibold text-primary">Loan Request</h3>
          )}

          {stage === "decision" ? (
            <>
              <DecisionChoice
                subject="loan"
                value={decision}
                onChange={setDecision}
                disabled={!canDecide}
                // A loan is granted on terms, not only on an amount.
                notes={{
                  full: "Approve the loan as requested",
                  partial: "Approve with amended terms",
                }}
              />

              {/* The terms the loan runs on. They are what was asked for
                  unless management is amending them, which only a partial
                  approval does. */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="decision-employee" required>
                    Employee
                  </FieldLabel>
                  <SearchableSelect
                    id="decision-employee"
                    value={borrower}
                    onValueChange={(value) => set("employee", value)}
                    options={people}
                    placeholder="Select employee"
                    searchPlaceholder="Search employees..."
                    disabled={!amending}
                  />
                </div>

                <Fixed
                  id="decision-type"
                  label="Expense Type"
                  value={LOAN_EXPENSE_TYPE}
                  icon={Users}
                />
                <Fixed
                  id="decision-category"
                  label="Category"
                  value={LOAN_CATEGORY}
                  icon={Tag}
                />
                <Fixed
                  id="decision-subcategory"
                  label="Subcategory"
                  value={category}
                />

                <AmountField
                  id="decision-approved"
                  label="Approved Amount"
                  required
                  readOnly={!amending}
                  value={
                    amending ? review.approved : amountValue(num(review.approved))
                  }
                  onChange={(e) => setReviewField("approved", e.target.value)}
                />

                <AmountField
                  id="decision-monthly"
                  label="Monthly Installment"
                  required
                  readOnly={!amending}
                  value={
                    amending ? review.monthly : amountValue(num(review.monthly))
                  }
                  onChange={(e) => setReviewField("monthly", e.target.value)}
                />

                <div className="space-y-2">
                  <FieldLabel htmlFor="decision-first-date" required>
                    First Installment Date
                  </FieldLabel>
                  <Input
                    id="decision-first-date"
                    type={amending ? "date" : "text"}
                    readOnly={!amending}
                    tabIndex={amending ? undefined : -1}
                    className={cn(
                      !amending && "cursor-default bg-locked text-muted-foreground"
                    )}
                    value={
                      amending
                        ? review.firstDate
                        : review.firstDate
                          ? formatDate(review.firstDate)
                          : ""
                    }
                    onChange={(e) => setReviewField("firstDate", e.target.value)}
                  />
                </div>

                <Derived
                  id="decision-months"
                  label="Number of Months"
                  value={reviewPlan.months || ""}
                />

                <Derived
                  id="decision-last-date"
                  label="Last Installment Date"
                  value={reviewLastDue ? formatDate(reviewLastDue) : ""}
                />

                <Derived
                  id="decision-last-amount"
                  label="Last Installment Amount (OMR)"
                  value={reviewPlan.months ? amountValue(reviewPlan.last) : ""}
                />

                <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                  <FieldLabel htmlFor="decision-notes">
                    Management Notes
                  </FieldLabel>
                  <Textarea
                    id="decision-notes"
                    rows={3}
                    value={review.notes}
                    onChange={(e) => setReviewField("notes", e.target.value)}
                    placeholder="Enter management notes"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="loan-employee" required>
                  Employee
                </FieldLabel>
                <SearchableSelect
                  id="loan-employee"
                  value={borrower}
                  onValueChange={(value) => set("employee", value)}
                  options={people}
                  placeholder="Select employee"
                  searchPlaceholder="Search employees..."
                />
              </div>

              {/* Where the loan lands in the accounts. None of the three is a
                  question: a loan is always an employee expense, and which
                  kind it is is read off what is still owed. */}
              <Fixed
                id="loan-type"
                label="Expense Type"
                value={LOAN_EXPENSE_TYPE}
                icon={Users}
              />
              <Fixed
                id="loan-category"
                label="Category"
                value={LOAN_CATEGORY}
                icon={Tag}
              />
              <Fixed
                id="loan-subcategory"
                label="Subcategory"
                value={category}
              />

              <AmountField
                id="loan-requested"
                label="Requested Amount"
                required
                value={isIncrease ? draft.extraRequested : draft.requested}
                onChange={(e) =>
                  set(isIncrease ? "extraRequested" : "requested", e.target.value)
                }
              />

              {/* An increase is repaid on the whole debt, so what was already
                  owed has to be on the form that adds to it. */}
              {isIncrease && (
                <>
                  <Derived
                    id="loan-outstanding"
                    label="Current Outstanding Balance"
                    value={amount(outstanding)}
                  />
                  <Derived
                    id="loan-after"
                    label="Total Loan Amount After Addition"
                    value={amount(totalLoan)}
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
              />

              <Derived
                id="loan-last-date"
                label="Last Installment Date"
                value={lastDue ? formatDate(lastDue) : ""}
              />

              <Derived
                id="loan-last-amount"
                label="Last Installment Amount (OMR)"
                value={plan.months ? amountValue(plan.last) : ""}
              />
            </div>
          )}

          {/* Plain buttons: this form sits inside the employee form, which a
              submit button here would send instead. */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeAdd}>
              Cancel
            </Button>
            {stage === "decision" ? (
              <Button
                type="button"
                onClick={confirmDecision}
                disabled={!canConfirm || !canDecide}
              >
                {CONFIRM_LABEL[decision] || "Confirm Decision"}
              </Button>
            ) : (
              <Button type="button" onClick={save} disabled={!canSave}>
                Save and Submit Request
              </Button>
            )}
          </div>
        </div>
  );

  return (
    <div className="space-y-6">
      {/* Opened over the page, so the list it is filed into stays behind. */}
      <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && closeAdd()}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openId
                ? "Loan " +
                  (records.find((r) => r.id === openId)?.requestNo || "")
                : "Add Loan Request"}
            </DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------- the loans already running */}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* The search on the left, where every list in the system has it,
              with the year beside it, and the name of the list on the right. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <AiSearch
                value={query}
                onChange={setQuery}
                placeholder="Ask about loans..."
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="loan-year" className="whitespace-nowrap">
                  Loan Year
                </Label>
                <Select value={shownYear} onValueChange={(v) => v && setYear(v)}>
                  <SelectTrigger id="loan-year" className="w-32">
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

            {addLabel && !adding && (
              <Button type="button" className="ml-auto" onClick={onOpenAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {addLabel}
              </Button>
            )}
          </div>

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
                {/* The unit is said once, in the heading, so the figures under
                    it can be read against each other. */}
                <Th width="13%" className="text-right">
                  Installment Amount (OMR)
                </Th>
                <Th width="12%" className="text-right">
                  Paid Amount (OMR)
                </Th>
                <Th width="14%">Installment Status</Th>
                <Th width="13%" className="text-right">
                  Remaining Balance (OMR)
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
                        {/* A request waiting on a decision carries its
                            temporary number and opens back into the form. */}
                        <Td className="whitespace-nowrap font-bold text-primary">
                          {record.status === LOAN_PENDING ||
                          record.status === LOAN_REJECTED ? (
                            <button
                              type="button"
                              onClick={() => track(record)}
                              className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {record.requestNo || index + 1}
                            </button>
                          ) : (
                            index + 1
                          )}

                          {/* Where it stands, under the number it belongs
                              to - the Installment Status column is the
                              instalments', not the loan's. */}
                          <span
                            className={cn(
                              "mt-1 block w-fit rounded-md px-2.5 py-0.5 text-xs font-semibold",
                              LOAN_STATUS_CHIP[record.status]
                            )}
                          >
                            {record.status}
                          </span>
                        </Td>
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
                            {amountValue(record.loanAmount)}
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
                              Previous loan of {amountValue(record.merged)}{" "}
                              merged into this loan.
                            </Detail>
                          )}
                        </Td>
                        <Td className="text-center text-muted-foreground">-</Td>
                        <Td className="text-right text-muted-foreground">-</Td>
                        <Td className="text-right text-muted-foreground">-</Td>
                        {/* The instalment columns say nothing about the loan
                            itself, so nothing is put in them. */}
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
                              {open ? "Hide instalments" : "Show instalments"}
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
                              {amountValue(row.installment)}
                            </Td>
                            <Td className="text-right">
                              {amountValue(row.paid)}
                            </Td>
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
                              {amountValue(row.remaining)}
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
