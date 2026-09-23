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
import { Bordered, EmptyState } from "@/components/shared/panels";
import {
  FieldLabel,
  Settled,
  Said,
  Choice,
  Attach,
  checkRequired,
} from "@/components/shared/formFields";
import AiSearch from "@/components/shared/AiSearch";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYING_ACCOUNTS } from "@/pages/firm/firmData";
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
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import {
  HandCoins,
  Plus,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  LOAN_EXPENSE_TYPE,
  LOAN_CATEGORY,
  LOAN_INCREASE,
  LOAN_PENDING,
  LOAN_REJECTED,
  LOAN_DECISION_STATUS,
  LOAN_STATUS_CHIP,
  loanCategoryFor,
  nextLoanNo,
  startMonths,
  monthEnd,
  outstandingTotal,
  pendingRequest,
  loanRecords,
  loansFor,
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
  startMonth: "",
  comment: "",
};

const COMMENT_LIMIT = 300;

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
      <FieldLabel htmlFor={id}>
        {label} (<Rial />)
      </FieldLabel>
      <Input
        required={required && !readOnly}
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
  // A loan belongs to somebody, so a page shows only that person's.
  const [records, setRecords] = useState(() =>
    loansFor(loanRecords, employee?.name)
  );
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
    startMonth: "",
    notes: "",
  });
  // How an approved loan actually reaches the employee.
  const [payout, setPayout] = useState({
    method: "",
    bankAccount: "",
    paymentDate: "",
    reference: "",
  });
  const [receipt, setReceipt] = useState(null);

  // Which loans have been folded away. Absent means open: a loan says very
  // little without the schedule that repays it.
  const [attachment, setAttachment] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [year, setYear] = useState("");
  const [query, setQuery] = useState("");

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const num = (value) => Number(value || 0);

  // The loan belongs to whoever's record it was opened from.
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

  // An installment comes off the pay at the end of a month, so the month is
  // what is asked for and the day follows from it.
  const firstDate = monthEnd(draft.startMonth);

  // The number of months, the size of the final instalment and the day it
  // falls due all follow from the three figures above. None of them is typed,
  // so none of them can contradict the loan it describes.
  const plan = schedule(totalLoan, num(draft.monthly));
  const lastDue = plan.months ? dueDate(firstDate, plan.months - 1) : "";

  const requestedOn =
    records.find((record) => record.id === openId)?.requestedOn ||
    new Date().toISOString().slice(0, 10);
  // The months a repayment can start in, settled once rather than on every
  // keystroke in the form above them.
  const months = startMonths();

  const attachedName =
    attachment?.name ||
    records.find((record) => record.id === openId)?.attachment ||
    "";

  const requestNo = openId
    ? records.find((record) => record.id === openId)?.requestNo || ""
    : nextLoanNo(records);

  // Only a partial approval may amend the terms; a full one grants what was
  // asked for, and a refusal grants nothing.
  const amending = decision === "partial";
  const setReviewField = (name, value) =>
    setReview((prev) => ({ ...prev, [name]: value }));
  const setPayoutField = (name, value) =>
    setPayout((prev) => ({ ...prev, [name]: value }));
  const refusing = decision === "rejected";
  const canConfirm =
    Boolean(decision) &&
    (refusing
      ? Boolean(review.notes.trim())
      : num(review.approved) > 0 &&
        num(review.monthly) > 0 &&
        review.startMonth &&
        payout.method &&
        payout.bankAccount &&
        payout.paymentDate &&
        payout.reference.trim());

  const canSave =
    !waiting &&
    borrower &&
    requested > 0 &&
    num(draft.monthly) > 0 &&
    draft.startMonth;

  /**
   * The request submitted. It is on record straight away, waiting for a
   * decision, and the form moves on to the stage that gives one.
   */
  const save = () => {
    if (!checkRequired() || !canSave) return;
    const id = records.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    setRecords((prev) => [
      {
        id,
        employee: borrower,
        kind: category,
        // On the list straight away, under a temporary number, waiting on a
        // decision. Asked for, not granted.
        requestNo,
        requestedOn,
        startMonth: draft.startMonth,
        employeeComment: draft.comment.trim(),
        attachment: attachment?.name || "",
        status: LOAN_PENDING,
        loanAmount: requested,
        merged: isIncrease ? outstanding : 0,
        // The office fills these in when it actually pays the loan out.
        disbursementDate: "",
        bankName: "",
        accountNumber: "",
        monthly: num(draft.monthly),
        firstDue: firstDate,
        payments: [],
      },
      ...prev,
    ]);
    setOpenId(id);
    // Management decides on what was asked for, until it amends it.
    setReview({
      approved: String(requested),
      monthly: draft.monthly,
      startMonth: draft.startMonth,
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
    if (!checkRequired() || !canConfirm || !decision || !openId) return;
    const amended = decision === "partial";
    setRecords((prev) =>
      prev.map((record) =>
        record.id === openId
          ? {
              ...record,
              status: LOAN_DECISION_STATUS[decision],
              loanAmount: amended ? num(review.approved) : record.loanAmount,
              monthly: amended ? num(review.monthly) : record.monthly,
              startMonth: amended ? review.startMonth : record.startMonth,
              firstDue: amended ? monthEnd(review.startMonth) : record.firstDue,
              managementNotes: review.notes.trim(),
              ...(refusing
                ? {}
                : {
                    method: payout.method,
                    bankAccount: payout.bankAccount,
                    disbursementDate: payout.paymentDate,
                    reference: payout.reference.trim(),
                    receipt: receipt?.name || "",
                  }),
            }
          : record
      )
    );
    closeAdd();
  };

  const closeAdd = () => {
    setDraft(emptyDraft);
    setAttachment(null);
    setStage("request");
    setDecision("");
    setOpenId(null);
    setReview({ approved: "", monthly: "", startMonth: "", notes: "" });
    setPayout({ method: "", bankAccount: "", paymentDate: "", reference: "" });
    setReceipt(null);
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
      startMonth: record.startMonth || "",
      comment: record.employeeComment || "",
      employee: record.employee,
    });
    setReview({
      approved: String(record.loanAmount),
      monthly: String(record.monthly),
      startMonth: record.startMonth || "",
      notes: record.managementNotes || "",
    });
    setPayout({
      method: record.method || "",
      bankAccount: record.bankAccount || "",
      paymentDate: record.disbursementDate || "",
      reference: record.reference || "",
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
                note: canSave
                  ? "Loan details and repayment schedule completed"
                  : "Loan details and repayment schedule",
                done: Boolean(canSave),
              },
              {
                key: "decision",
                title: "Management Decision",
                note: "Review, approve and disburse",
                done: Boolean(decision),
              },
            ]}
          />

          {stage === "decision" ? (
            <>
              {/* Who asked, and under what number. Whatever backs the request
                  up hangs under the number it belongs to. */}
              <Bordered title="Request Information">
                <div className="form-grid">
                  <div className="flex h-full flex-col justify-end gap-2">
                    <Settled id="decision-no" label="Request No." value={requestNo} />
                    {attachedName && (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-sm text-primary no-underline hover:text-primary/70"
                        title={"Open " + attachedName}
                      >
                        <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                        {attachedName}
                      </button>
                    )}
                  </div>

                  <Settled
                    id="decision-date"
                    label="Request Date"
                    value={formatDate(requestedOn)}
                  />
                  <Settled
                    id="decision-employee"
                    label="Employee Name"
                    value={borrower}
                  />
                  <Settled
                    id="decision-active"
                    label="Active Loan Status"
                    value={
                      isIncrease
                        ? "Active Loan - " + amount(outstanding)
                        : "No Active Loan"
                    }
                  />
                </div>
              </Bordered>

              <DecisionChoice
                value={decision}
                onChange={setDecision}
                // A loan is granted on terms, not only on an amount.
                notes={{
                  full: "Approve the loan as requested",
                  partial: "Approve with amended terms",
                  rejected: "Reject the loan request",
                }}
              />

              {/* Nothing is granted and nothing leaves the firm on a refusal,
                  so both are asked about only once something is approved. */}
              {decision && !refusing && (
                <>
                  {/* The terms the loan runs on. They are what was asked for
                      unless management is amending them, which only a partial
                      approval does. */}
                  <Bordered title="Loan Approval & Repayment">
                    <div className="form-grid">
                      <Settled
                        id="decision-requested"
                        label="Requested Loan Amount"
                        value={amount(totalLoan)}
                      />

                      {amending ? (
                        <AmountField
                          id="decision-approved"
                          label="Approved Loan Amount"
                          required
                          value={review.approved}
                          onChange={(e) => setReviewField("approved", e.target.value)}
                        />
                      ) : (
                        <Settled
                          id="decision-approved"
                          label="Approved Loan Amount"
                          value={amount(num(review.approved))}
                          payable
                        />
                      )}

                      {amending ? (
                        <AmountField
                          id="decision-monthly"
                          label="Monthly Installment"
                          required
                          value={review.monthly}
                          onChange={(e) => setReviewField("monthly", e.target.value)}
                        />
                      ) : (
                        <Settled
                          id="decision-monthly"
                          label="Monthly Installment"
                          value={amount(num(review.monthly))}
                        />
                      )}

                      {amending ? (
                        <Choice
                          id="decision-start-month"
                          label="Start Month"
                          value={review.startMonth}
                          onChange={(value) => value && setReviewField("startMonth", value)}
                          placeholder="Select start month"
                          options={months}
                        />
                      ) : (
                        <Settled
                          id="decision-start-month"
                          label="Start Month"
                          value={review.startMonth}
                        />
                      )}
                    </div>
                  </Bordered>

                  {/* Where the loan is booked, and how it actually leaves. */}
                  <Bordered title="Expense & Disbursement Details">
                    <div className="form-grid">
                      <Settled
                        id="decision-expense-type"
                        label="Expense Type"
                        value={LOAN_EXPENSE_TYPE}
                      />
                      <Settled
                        id="decision-category"
                        label="Category"
                        value={LOAN_CATEGORY}
                      />
                      <Settled
                        id="decision-subcategory"
                        label="Subcategory"
                        value={category}
                      />

                      <Choice
                        id="decision-method"
                        label="Payment Method"
                        value={payout.method}
                        onChange={(value) => value && setPayoutField("method", value)}
                        placeholder="Select method"
                        options={PAYMENT_METHODS}
                      />

                      {/* One choice, not two: the account carries the bank it
                          is held at, so they cannot be set to disagree. */}
                      <Choice
                        id="decision-bank"
                        label="Bank Account"
                        value={payout.bankAccount}
                        onChange={(value) => value && setPayoutField("bankAccount", value)}
                        placeholder="Select bank account"
                        options={PAYING_ACCOUNTS}
                      />

                      <div className="flex h-full flex-col justify-end gap-2">
                        <FieldLabel htmlFor="decision-pay-date" required>
                          Payment Date
                        </FieldLabel>
                        <Input
                          id="decision-pay-date"
                          type="date"
                          value={payout.paymentDate}
                          onChange={(e) => setPayoutField("paymentDate", e.target.value)}
                        />
                      </div>

                      {/* What the bank called the transfer, and the proof. */}
                      <div className="flex h-full flex-col justify-end gap-2">
                        <FieldLabel htmlFor="decision-reference" required>
                          Transfer No.
                        </FieldLabel>
                        <div className="flex w-full min-w-0 items-center gap-2">
                          <Input
                            id="decision-reference"
                            className="min-w-0 flex-1"
                            value={payout.reference}
                            onChange={(e) => setPayoutField("reference", e.target.value)}
                            placeholder="TRX-0000-00000"
                          />
                          <Attach
                            file={receipt}
                            onPick={setReceipt}
                            label="transfer receipt"
                          />
                        </div>
                      </div>

                      <Settled
                        id="decision-to-disburse"
                        label="Amount to Disburse"
                        value={amount(num(review.approved))}
                        payable
                      />
                    </div>
                  </Bordered>
                </>
              )}

              {/* A refusal is only as good as its reason, so there the
                  comment is required; on an approval it is a note. */}
              <Bordered
                title={
                  <>
                    Management Comment
                  </>
                }
              >
                <div className="space-y-2">
                  <Textarea
                    id="decision-notes"
                    rows={3}
                    maxLength={COMMENT_LIMIT}
                    value={review.notes}
                    onChange={(e) => setReviewField("notes", e.target.value)}
                    placeholder={
                      refusing
                        ? "Enter the reason for rejection"
                        : "Add management comment (optional)"
                    }
                  />
                  <p className="text-end text-xs text-muted-foreground">
                    {review.notes.length} / {COMMENT_LIMIT}
                  </p>
                </div>
              </Bordered>

              {/* What was granted and what leaves, in one line to be read
                  against the terms above before it is confirmed. */}
              {decision && !refusing && (
                <div className="rounded-lg border border-green-600/40 bg-green-50/50 p-4">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-green-700">
                    <span
                      aria-hidden="true"
                      className="h-5 w-1 shrink-0 rounded-full bg-green-600"
                    />
                    Loan Approval &amp; Transfer Summary
                  </p>
                  <div className="form-grid lg:[&>*+*]:border-s">
                    <Said label="Employee Name" value={borrower} />
                    <Said
                      label="Approved Loan Amount"
                      value={amount(num(review.approved))}
                      settled
                    />
                    <Said
                      label="Monthly Installment"
                      value={amount(num(review.monthly))}
                      settled
                    />
                    <Said
                      label="Transfer Amount"
                      value={amount(num(review.approved))}
                      settled
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Who is asking, under what number, and what they already owe
                  - which is what decides whether this is a new loan or an
                  addition to the one running. */}
              <Bordered title="Request Information">
                {/* The bottom padding is the room the status hint hangs in. */}
                <div className="form-grid pb-8">
                  <div className="flex h-full flex-col justify-end gap-2">
                    <FieldLabel htmlFor="loan-no">Request No.</FieldLabel>
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <Input
                        id="loan-no"
                        readOnly
                        tabIndex={-1}
                        value={requestNo}
                        className="min-w-0 flex-1 cursor-default bg-locked text-muted-foreground"
                      />
                      <Attach
                        file={attachment}
                        onPick={setAttachment}
                        label="supporting document"
                      />
                    </div>
                  </div>

                  <Settled
                    id="loan-request-date"
                    label="Request Date"
                    value={formatDate(requestedOn)}
                  />
                  <Settled id="loan-employee" label="Employee Name" value={borrower} />

                  <Settled
                    id="loan-active"
                    label="Active Loan Status"
                    value={
                      isIncrease
                        ? "Active Loan - " + amount(outstanding)
                        : "No Active Loan"
                    }
                    hint={
                      isIncrease
                        ? "An active loan is running - this request will be added to it."
                        : "No active loan found - this request will create a new loan."
                    }
                  />
                </div>
              </Bordered>

              {/* How much, how fast, and from when. Everything else about the
                  schedule is counted from these three. */}
              <Bordered title="Repayment Schedule">
                <div className="form-grid form-grid-3">
                  <AmountField
                    id="loan-requested"
                    label="Requested Loan Amount"
                    required
                    value={isIncrease ? draft.extraRequested : draft.requested}
                    onChange={(e) =>
                      set(isIncrease ? "extraRequested" : "requested", e.target.value)
                    }
                  />

                  <AmountField
                    id="loan-monthly"
                    label="Monthly Installment"
                    required
                    value={draft.monthly}
                    onChange={(e) => set("monthly", e.target.value)}
                  />

                  {/* An installment comes off the pay at the end of a month,
                      so a month is asked for rather than a day. */}
                  <Choice
                    id="loan-start-month"
                    label="Start Month"
                    value={draft.startMonth}
                    onChange={(value) => value && set("startMonth", value)}
                    placeholder="Select start month"
                    options={months}
                  />
                </div>
              </Bordered>

              <Bordered title="Employee Comment">
                <div className="space-y-2">
                  <Textarea
                    id="loan-comment"
                    rows={3}
                    maxLength={COMMENT_LIMIT}
                    value={draft.comment}
                    onChange={(e) => set("comment", e.target.value)}
                    placeholder="Add a comment supporting this loan request (optional)"
                  />
                  <p className="text-end text-xs text-muted-foreground">
                    {draft.comment.length} / {COMMENT_LIMIT}
                  </p>
                </div>
              </Bordered>

              {/* What the three figures above come to, read back as one line
                  before the request is sent. */}
              <div className="rounded-lg border border-green-600/40 bg-green-50/50 p-4">
                <p className="mb-3 flex items-center gap-2 font-semibold text-green-700">
                  <span
                    aria-hidden="true"
                    className="h-5 w-1 shrink-0 rounded-full bg-green-600"
                  />
                  Loan &amp; Repayment Summary
                </p>
                <div className="form-grid lg:[&>*+*]:border-s">
                  <Said label="Loan Amount" value={amount(totalLoan)} settled />
                  <Said
                    label="Monthly Installment"
                    value={amount(num(draft.monthly))}
                    settled
                  />
                  <Said
                    label="Number of Installments"
                    value={plan.months ? String(plan.months) : ""}
                  />
                  <Said
                    label="Final Installment"
                    value={
                      lastDue
                        ? formatDate(lastDue) + " - " + amount(plan.last)
                        : ""
                    }
                    settled
                  />
                </div>
              </div>
            </>
          )}

          {/* Plain buttons: this form sits inside the employee form, which a
              submit button here would send instead. */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            {/* What has been borrowed before is the list behind this form. */}
            <Button type="button" variant="ghost" onClick={closeAdd}>
              <History className="me-2 h-4 w-4" />
              History
            </Button>

            <div className="ms-auto flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={closeAdd}>
                Cancel
              </Button>
              {stage === "decision" ? (
                <Button
                  type="button"
                  onClick={confirmDecision}
                  // Not a completeness check: somebody without the permission
                  // to decide a loan may not press this at all. What the form
                  // is missing is said by the fields when it is pressed.
                  disabled={!canDecide}
                >
                  Save
                </Button>
              ) : (
                <Button type="button" onClick={save}>
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
  );

  return (
    <div className="space-y-6">
      {/* Opened over the page, so the list it is filed into stays behind. */}
      <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && closeAdd()}>
        <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {stage === "decision" ? "Loan Management Decision" : "Loan Request"}
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
              <Button type="button" className="ms-auto" onClick={onOpenAdd}>
                <Plus className="me-2 h-4 w-4" />
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
                <Th width="27%" className="text-start">
                  Loan / Installment Details
                </Th>
                <Th width="11%">Due Date</Th>
                {/* The unit is said once, in the heading, so the figures under
                    it can be read against each other. */}
                <Th width="13%" className="text-end">
                  Installment Amount (OMR)
                </Th>
                <Th width="12%" className="text-end">
                  Paid Amount (OMR)
                </Th>
                <Th width="14%">Installment Status</Th>
                <Th width="13%" className="text-end">
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
                        <Td className="text-start">
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
                        <Td className="text-end text-muted-foreground">-</Td>
                        <Td className="text-end text-muted-foreground">-</Td>
                        {/* The instalment columns say nothing about the loan
                            itself, so nothing is put in them. */}
                        <Td className="text-center text-muted-foreground">-</Td>
                        <Td className="text-end text-muted-foreground">-</Td>
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
                            <Td className="text-start font-medium text-primary">
                              Installment {row.no} of {row.of}
                            </Td>
                            <Td className="whitespace-nowrap">
                              {formatDate(row.due)}
                            </Td>
                            <Td className="text-end">
                              {amountValue(row.installment)}
                            </Td>
                            <Td className="text-end">
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
                            <Td className="text-end font-medium">
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
