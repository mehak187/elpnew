import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bordered, EmptyState } from "@/components/shared/panels";
import { Settled, Choice } from "@/components/shared/formFields";
import { PAYING_ACCOUNTS } from "@/pages/firm/firmData";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import {
  Lock,
  CalendarDays,
  FileText,
  FileCheck,
  User,
  Landmark,
  History,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import { useLeaves } from "@/lib/leaves/context";
import { formatDate } from "@/pages/firm/firmData";
import { nextRequestNo } from "../requestFlow";
import { typesIn, remainingBalance } from "../leaveData";
import {
  PAYMENT_YEARS,
  SALARY_MONTHS,
} from "../payrollData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import {
  ENTITLEMENT_EXPENSE_TYPE,
  ENTITLEMENT_CATEGORY,
  ENTITLEMENT_SUBCATEGORY,
  ENTITLEMENT_PENDING,
  ENTITLEMENT_APPROVED,
  ENTITLEMENT_REJECTED,
  ENTITLEMENT_STATUS_CHIP,
  encashmentAmount,
  overtimeAmount,
  hourlyRate,
  entitlementsFor,
  nextEntitlementNo,
  modeOf,
  lastSimilar,
  entitlementHistory,
} from "../entitlementData";

const NOTES_LIMIT = 500;

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDraft = () => ({
  requestDate: todayIso(),
  year: String(new Date().getFullYear()),
  month: "",
  leaveType: "Annual Leave",
  days: "",
  hours: "",
  amount: "",
  reason: "",
});

const emptyPayment = () => ({
  approved: "",
  method: "",
  // One choice for where it leaves from: the account carries its bank.
  bankAccount: "",
  paymentDate: todayIso(),
  reference: "",
});

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
    </Label>
  );
}

/**
 * Where the request is booked. None of it is a choice - every entitlement is
 * filed the same way - so the box wears a lock rather than a chevron.
 */
function Booked({ id, label, value }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          readOnly
          tabIndex={-1}
          value={value}
          className="cursor-default bg-locked pl-9 text-muted-foreground"
        />
      </div>
    </div>
  );
}

/**
 * One fact of the card under the decision.
 *
 * The label carries the icon and the value sits under it, lighter and
 * smaller: the card is read across for what the request is, not down.
 */
function Fact({ icon, label, children }) {
  const Icon = icon;
  return (
    <div className="px-0 lg:px-4 lg:first:pl-0">
      <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        {label}
      </p>
      {/* Lighter and smaller than the label above it: the card is read for
          what the request is, not for any one figure in it. */}
      <p className="mt-1 text-xs font-normal text-primary">{children}</p>
    </div>
  );
}

/** A figure the form works out rather than asks for. */
function Worked({ id, label, value }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value}
        className="cursor-default bg-locked text-muted-foreground"
      />
    </div>
  );
}

/**
 * One entitlement, asked for and decided.
 *
 * Every tab in the section works this way, and differs only in what it counts:
 * days off a leave balance, hours of overtime, or a sum the employee names.
 * Everything after that - the classification, the decision, the payment and
 * the numbering - is the same, so it is written once here.
 */
export default function EntitlementTab({
  kind,
  label,
  employee,
  records,
  onRecords,
  query,
  adding,
  onCloseAdd,
  onOpenAdd,
  // The firm decides; on My Profile the request is asked for and only read.
  canDecide = true,
}) {
  const { leaves } = useLeaves();
  const [draft, setDraft] = useState(emptyDraft);
  const [payment, setPayment] = useState(emptyPayment);
  const [stage, setStage] = useState("request");
  const [decision, setDecision] = useState("");
  const [openId, setOpenId] = useState(null);
  const [reason, setReason] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setPay = (name, value) =>
    setPayment((prev) => ({ ...prev, [name]: value }));

  const mode = modeOf(kind);
  const open = records.find((row) => row.id === openId) || null;
  const settled = open?.status === ENTITLEMENT_APPROVED;
  const refused = open?.status === ENTITLEMENT_REJECTED;

  const mine = smartSearch(entitlementsFor(records, employee?.name, kind), query);

  // What is left of the leave being encashed - counted off the leave already
  // taken, never stored.
  const balance =
    mode === "leaveDays"
      ? remainingBalance(leaves, employee?.name, draft.leaveType, draft.year)
      : null;
  const available = balance && !balance.expired ? balance.remaining : 0;
  const days = Number(draft.days || 0);
  const after = Math.max(available - days, 0);
  const exceeded = mode === "leaveDays" && days > available;

  // What the request comes to. Days and hours are worth what the salary says
  // they are worth; anything else is the sum that was asked for.
  const amount =
    mode === "leaveDays"
      ? encashmentAmount(employee?.salary, days)
      : mode === "hours"
        ? overtimeAmount(employee?.salary, draft.hours)
        : Number(draft.amount || 0);

  const counted =
    mode === "leaveDays"
      ? days > 0
      : mode === "hours"
        ? Number(draft.hours) > 0
        : Number(draft.amount) > 0;

  const canSubmit =
    draft.requestDate &&
    counted &&
    !exceeded &&
    (mode !== "hours" || draft.month) &&
    draft.reason.trim();

  // A full approval grants what was asked for; only a partial one names a
  // figure of its own, and a refusal grants nothing at all.
  const amending = decision === "partial";
  const refusing = decision === "rejected";
  const approvedAmount = amending ? Number(payment.approved || 0) : amount;
  const decidedOn = open?.decisionDate || todayIso();
  const attachedName = open?.attachment || "";
  // What this person was given last time, where there was a last time.
  const previous = lastSimilar(records, employee?.name, kind, openId);

  const canDisburse =
    Boolean(decision) &&
    !refusing &&
    canDecide &&
    approvedAmount > 0 &&
    approvedAmount <= amount &&
    payment.method &&
    payment.bankAccount &&
    payment.paymentDate &&
    payment.reference.trim();

  const close = () => {
    setDraft(emptyDraft());
    setPayment(emptyPayment());
    setReceipt(null);
    setShowHistory(false);
    setStage("request");
    setDecision("");
    setOpenId(null);
    setReason("");
    onCloseAdd();
  };

  /**
   * The request made. It is on the list straight away, under a temporary
   * number and waiting on a decision.
   */
  const submit = () => {
    if (!canSubmit) return;
    const details = {
      requestDate: draft.requestDate,
      year: draft.year,
      month: draft.month,
      leaveType: draft.leaveType,
      days,
      hours: Number(draft.hours || 0),
      amount,
      reason: draft.reason.trim(),
    };

    if (open) {
      onRecords((prev) =>
        prev.map((row) => (row.id === openId ? { ...row, ...details } : row))
      );
    } else {
      const id = records.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      onRecords((prev) => [
        {
          id,
          kind,
          employee: employee?.name || "",
          requestNo: nextRequestNo(prev),
          entitlementNo: "",
          status: ENTITLEMENT_PENDING,
          rejectionReason: "",
          ...details,
        },
        ...prev,
      ]);
      setOpenId(id);
    }
    setPay("approved", String(amount));
    setStage("decision");
  };

  /** Approved and paid: the request takes the list's own number. */
  const disburse = () => {
    if (!openId || !canDisburse) return;
    onRecords((prev) =>
      prev.map((row) =>
        row.id === openId
          ? {
              ...row,
              entitlementNo: row.entitlementNo || nextEntitlementNo(prev),
              status: ENTITLEMENT_APPROVED,
              rejectionReason: "",
              amount: approvedAmount,
              approvedAmount,
              decisionDate: decidedOn,
              decidedBy: CURRENT_USER.name,
              managementComment: reason.trim(),
              method: payment.method,
              bankAccount: payment.bankAccount,
              paymentDate: payment.paymentDate,
              reference: payment.reference.trim(),
              receipt: receipt?.name || "",
            }
          : row
      )
    );
    close();
  };

  /** Refused: the request keeps its temporary number and says why. */
  const reject = () => {
    if (!openId || !reason.trim()) return;
    onRecords((prev) =>
      prev.map((row) =>
        row.id === openId
          ? {
              ...row,
              status: ENTITLEMENT_REJECTED,
              decisionDate: decidedOn,
              decidedBy: CURRENT_USER.name,
              managementComment: reason.trim(),
              rejectionReason: reason.trim(),
            }
          : row
      )
    );
    close();
  };

  /** A request opened back off the list, to be followed or decided. */
  const track = (record) => {
    setOpenId(record.id);
    setStage("decision");
    setDecision(record.status === ENTITLEMENT_REJECTED ? "rejected" : "");
    setReason("");
    setDraft({
      ...emptyDraft(),
      requestDate: record.requestDate,
      year: record.year || "",
      month: record.month || "",
      leaveType: record.leaveType || "Annual Leave",
      days: String(record.days || ""),
      hours: String(record.hours || ""),
      amount: String(record.amount || ""),
      reason: record.reason || "",
    });
    setPayment({
      ...emptyPayment(),
      approved: String(record.amount || ""),
      method: record.method || "",
      bankAccount: record.bankAccount || "",
      paymentDate: record.paymentDate || todayIso(),
      reference: record.reference || "",
    });
    onOpenAdd();
  };

  /** What the list shows a request was for, in one line. */
  const measure = (record) =>
    modeOf(record.kind) === "leaveDays"
      ? record.days + " Days"
      : modeOf(record.kind) === "hours"
        ? record.hours + " Hours"
        : "-";

  const form = (
    <div className="space-y-6">
      {/* The two stages of the request. Either header opens its stage. */}
      <RequestSteps
        active={stage}
        onChange={setStage}
        steps={[
          {
            key: "request",
            title: label + " Request",
            note: canSubmit
              ? label + " details completed"
              : "Enter " + label.toLowerCase() + " details",
            done: Boolean(canSubmit),
          },
          {
            key: "decision",
            title: "Management Decision",
            note: "Review, approve and disburse",
            done: Boolean(decision),
            disabled: !canSubmit,
          },
        ]}
      />

      {stage === "decision" ? (
        <>
          {/* What was asked for is not restated here: it is in the card at
              the foot of the page, which is where the decision is checked
              against it. */}
          <DecisionChoice
            value={decision}
            onChange={setDecision}
            disabled={!canDecide || settled || refused}
          />

          {/* The answer itself: when it was given, what it grants, and why.
              A separate box from the choice above it, with room between. */}
          <Bordered title="Decision">
            {/* The bottom padding is the room the counter hangs in. */}
            <div className="grid grid-cols-1 gap-4 pb-5 sm:gap-6 lg:grid-cols-5">
              <Settled
                id="ent-decision-date"
                label="Decision Date"
                value={formatDate(decidedOn)}
              />

              {/* Only a partial approval names a figure of its own; a full
                  one grants what was asked for. */}
              {amending ? (
                <div className="flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-approved" required>
                    Approved Amount (OMR)
                  </FieldLabel>
                  <Input
                    id="ent-approved"
                    inputMode="decimal"
                    value={payment.approved}
                    onChange={(e) =>
                      setPay("approved", e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.000"
                    className={cn(approvedAmount > amount && "border-destructive")}
                  />
                </div>
              ) : (
                <Settled
                  id="ent-approved"
                  label="Approved Amount (OMR)"
                  value={amountValue(approvedAmount)}
                />
              )}

              {/* The counter hangs below the box rather than sitting in the
                  column: in the flow it would push this field's box up out
                  of line with the two beside it. */}
              <div className="relative flex h-full flex-col justify-end gap-2 lg:col-span-3">
                <FieldLabel htmlFor="ent-comment" required={refusing}>
                  Management Comment
                </FieldLabel>
                <Textarea
                  id="ent-comment"
                  rows={2}
                  maxLength={NOTES_LIMIT}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={!canDecide || settled || refused}
                  placeholder="Enter management comment"
                />
                <p className="absolute right-0 top-full mt-1 text-xs text-muted-foreground">
                  {reason.length} / {NOTES_LIMIT}
                </p>
              </div>
            </div>
          </Bordered>

          {/* How the money actually reaches them. A refused request has none
              of this: there is nothing to pay, and so nothing to ask. */}
          {decision && !refusing && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                <Settled
                  id="ent-type"
                  label="Expense Type"
                  value={ENTITLEMENT_EXPENSE_TYPE}
                />
                <Settled
                  id="ent-category"
                  label="Category"
                  value={ENTITLEMENT_CATEGORY}
                />
                <Settled
                  id="ent-subcategory"
                  label="Subcategory"
                  value={ENTITLEMENT_SUBCATEGORY[kind] || label + " Request"}
                />
                <Settled
                  id="ent-disbursed"
                  label="Amount Disbursed (OMR)"
                  value={amountValue(approvedAmount)}
                  payable
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                <Choice
                  id="ent-method"
                  label="Payment Method"
                  value={payment.method}
                  onChange={(value) => value && setPay("method", value)}
                  placeholder="Select method"
                  options={PAYMENT_METHODS}
                  disabled={!canDecide}
                />

                {/* One choice, not two: the account carries the bank it is
                    held at, so they cannot be set to disagree. */}
                <Choice
                  id="ent-bank"
                  label="Bank / Account"
                  value={payment.bankAccount}
                  onChange={(value) => value && setPay("bankAccount", value)}
                  placeholder="Select bank account"
                  options={PAYING_ACCOUNTS}
                  disabled={!canDecide}
                />

                <div className="flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-payment-date" required>
                    Payment Date
                  </FieldLabel>
                  <Input
                    id="ent-payment-date"
                    type="date"
                    value={payment.paymentDate}
                    onChange={(e) => setPay("paymentDate", e.target.value)}
                    disabled={!canDecide}
                  />
                </div>

                {/* The proof of the transfer sits beside its reference as a
                    plain icon: nothing to press but the paperclip itself. */}
                <div className="flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-reference" required>
                    Payment Reference
                  </FieldLabel>
                  <div className="flex w-full min-w-0 items-center gap-2">
                    <Input
                      id="ent-reference"
                      className="min-w-0 flex-1"
                      value={payment.reference}
                      onChange={(e) => setPay("reference", e.target.value)}
                      placeholder="TRX-0000-00000"
                      disabled={!canDecide}
                    />
                    <label
                      className="shrink-0 cursor-pointer text-primary hover:text-primary/70"
                      title={
                        receipt ? receipt.name + " attached" : "Upload transfer receipt"
                      }
                    >
                      {receipt ? (
                        <FileCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <UploadCloud className="h-5 w-5" />
                      )}
                      <span className="sr-only">Upload transfer receipt</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files[0] && setReceipt(e.target.files[0])
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Everything about the request itself, in one line under the
              decision it belongs to - wearing the colour of that decision,
              so the answer is read before a word of it. */}
          <div
            className={cn(
              "rounded-lg border p-4",
              decision === "full" && "border-green-600/50 bg-decision-full",
              decision === "partial" && "border-violet-400 bg-decision-partial",
              refusing && "border-red-500/50 bg-decision-rejected",
              !decision && "bg-card"
            )}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x">
              <Fact icon={CalendarDays} label="Request Date">
                {draft.requestDate ? formatDate(draft.requestDate) : "-"}
                {attachedName && (
                  <span className="mt-0.5 block text-primary">{attachedName}</span>
                )}
              </Fact>
              <Fact icon={FileText} label="Request Type">
                General
              </Fact>
              <Fact icon={User} label="Employee Name">
                {(employee?.name || "") +
                  (employee?.empNo ? " - " + employee.empNo : "")}
              </Fact>
              <Fact icon={Landmark} label="Bank / Account">
                {employee?.bankName
                  ? employee.bankName + " - " + employee.accountNumber
                  : "-"}
              </Fact>
              <Fact icon={History} label="History">
                <button
                  type="button"
                  className="text-primary no-underline hover:text-primary/70"
                  onClick={() => setShowHistory(true)}
                >
                  View history
                </button>
              </Fact>
            </div>

            {/* What this person was given last time, where there was a last
                time: the one comparison every decision wants. */}
            {previous && (
              <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                Last Similar Request:{" "}
                <span className="text-primary">
                  {label} &middot; {previous.entitlementNo || previous.requestNo}{" "}
                  &middot; Paid {formatDate(previous.paymentDate)}
                </span>
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Where the request is booked. None of it is asked for: every
              entitlement is filed the same way. */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-primary">
              Request Classification
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Booked
                id="ent-type"
                label="Expense Type"
                value={ENTITLEMENT_EXPENSE_TYPE}
              />
              <Booked
                id="ent-category"
                label="Category"
                value={ENTITLEMENT_CATEGORY}
              />
              <Booked
                id="ent-subcategory"
                label="Subcategory"
                value={ENTITLEMENT_SUBCATEGORY[kind] || label + " Request"}
              />

              <div className="space-y-2">
                <FieldLabel htmlFor="ent-request-date">Request Date</FieldLabel>
                <Input
                  id="ent-request-date"
                  type="date"
                  value={draft.requestDate}
                  onChange={(e) => set("requestDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {/* Days off a leave balance. */}
            {mode === "leaveDays" && (
              <>
                <div className="space-y-2">
                  <FieldLabel htmlFor="ent-year" required>
                    Year
                  </FieldLabel>
                  <Select
                    value={draft.year}
                    onValueChange={(value) => value && set("year", value)}
                  >
                    <SelectTrigger id="ent-year">
                      <SelectValue />
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
                  <FieldLabel htmlFor="ent-leave-type" required>
                    Leave Type
                  </FieldLabel>
                  <Select
                    value={draft.leaveType}
                    onValueChange={(value) => value && set("leaveType", value)}
                  >
                    <SelectTrigger id="ent-leave-type">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesIn("Regular Leave").map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Worked
                  id="ent-available"
                  label="Available Leave Balance"
                  value={balance ? available + " Days" : "-"}
                />

                <div className="space-y-2">
                  <FieldLabel htmlFor="ent-days" required>
                    Days Requested for Encashment
                  </FieldLabel>
                  <Input
                    id="ent-days"
                    inputMode="numeric"
                    value={draft.days}
                    onChange={(e) => set("days", e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className={cn(exceeded && "border-destructive text-destructive")}
                  />
                  {exceeded && (
                    <p role="alert" className="text-xs font-semibold text-destructive">
                      More days than the balance holds
                    </p>
                  )}
                </div>

                <Worked
                  id="ent-after"
                  label="Balance After Request"
                  value={balance ? after + " Days" : "-"}
                />
              </>
            )}

            {/* Hours of overtime, at the employee's own rate. */}
            {mode === "hours" && (
              <>
                <div className="space-y-2">
                  <FieldLabel htmlFor="ent-month" required>
                    Month
                  </FieldLabel>
                  <Select
                    value={draft.month}
                    onValueChange={(value) => value && set("month", value)}
                  >
                    <SelectTrigger id="ent-month">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="ent-year" required>
                    Year
                  </FieldLabel>
                  <Select
                    value={draft.year}
                    onValueChange={(value) => value && set("year", value)}
                  >
                    <SelectTrigger id="ent-year">
                      <SelectValue />
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
                  <FieldLabel htmlFor="ent-hours" required>
                    Overtime Hours
                  </FieldLabel>
                  <Input
                    id="ent-hours"
                    inputMode="decimal"
                    value={draft.hours}
                    onChange={(e) =>
                      set("hours", e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0"
                  />
                </div>

                <Worked
                  id="ent-rate"
                  label="Hourly Rate (OMR)"
                  value={amountValue(hourlyRate(employee?.salary))}
                />
              </>
            )}

            {/* A sum the employee names. */}
            {mode === "amount" && (
              <div className="space-y-2 sm:col-span-1">
                <FieldLabel htmlFor="ent-amount" required>
                  Requested Amount (OMR)
                </FieldLabel>
                <Input
                  id="ent-amount"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) =>
                    set("amount", e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="0.000"
                />
              </div>
            )}

            {mode !== "amount" && (
              <Worked
                id="ent-estimated"
                label="Estimated Amount (OMR)"
                value={amountValue(amount)}
              />
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="ent-reason-notes" required>
              Reason / Notes
            </FieldLabel>
            <Textarea
              id="ent-reason-notes"
              rows={3}
              maxLength={NOTES_LIMIT}
              value={draft.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder={"Enter the reason for requesting " + label.toLowerCase()}
            />
          </div>
        </>
      )}

      {/* The way back and the answer, with clear room above them. */}
      <div className="flex flex-wrap justify-end gap-2 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={stage === "decision" ? () => setStage("request") : close}
        >
          Back
        </Button>
        {stage === "decision" ? (
          refusing ? (
            !refused && (
              <Button
                type="button"
                variant="destructive"
                onClick={reject}
                disabled={!reason.trim()}
              >
                Confirm Rejection
              </Button>
            )
          ) : (
            !settled && (
              <Button type="button" onClick={disburse} disabled={!canDisburse}>
                Approve &amp; Pay
              </Button>
            )
          )
        ) : (
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            Save
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Opened over the page, so the list it is filed into stays behind. */}
      <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{label + " Request"}</DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>

      {/* What has already happened to this request, newest first. Nothing
          here is kept twice: every line is read off the record itself. */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-h-[85vh] w-[92vw] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {"History - " + (open?.entitlementNo || open?.requestNo || label)}
            </DialogTitle>
          </DialogHeader>

          {entitlementHistory(open).length === 0 ? (
            <EmptyState>Nothing has happened to this request yet.</EmptyState>
          ) : (
            <RecordTable minWidth={980}>
              <HeadRow>
                <Th width="14%">Date &amp; Time</Th>
                <Th width="14%">Action</Th>
                <Th width="11%">Previous Status</Th>
                <Th width="11%">New Status</Th>
                <Th width="14%">Performed By</Th>
                <Th width="10%" className="text-right">
                  Amount
                </Th>
                <Th width="16%">Comment</Th>
                <Th width="10%">Reference</Th>
              </HeadRow>
              <tbody>
                {entitlementHistory(open).map((event, index) => (
                  <Row key={index}>
                    <Td className="whitespace-nowrap text-primary">
                      {formatDate(event.at)}
                    </Td>
                    <Td className="text-primary">{event.action}</Td>
                    <Td className="text-muted-foreground">{event.from}</Td>
                    <Td className="text-primary">{event.to}</Td>
                    <Td className="text-primary">{event.by}</Td>
                    <Td className="whitespace-nowrap text-right font-semibold text-green-700">
                      {amountValue(event.amount)}
                    </Td>
                    <Td className="text-left text-muted-foreground">
                      {event.comment || "-"}
                    </Td>
                    <Td className="text-primary">{event.reference || "-"}</Td>
                  </Row>
                ))}
              </tbody>
            </RecordTable>
          )}
        </DialogContent>
      </Dialog>

      {mine.length === 0 ? (
        <EmptyState>
          No {label.toLowerCase()} has been requested yet.
        </EmptyState>
      ) : (
        <RecordTable minWidth={900}>
          <HeadRow>
            <Th width="12%">No.</Th>
            <Th width="16%">Request Date</Th>
            <Th width="34%">Request Details</Th>
            <Th width="14%">Quantity</Th>
            <Th width="24%" className="text-right">
              Amount (OMR)
            </Th>
          </HeadRow>
          <tbody>
            {mine.map((record, index) => (
              <Row key={record.id}>
                {/* A request waiting on a decision carries its temporary
                    number and opens back into the form. */}
                <Td className="whitespace-nowrap font-medium text-primary">
                  {record.entitlementNo ? (
                    record.entitlementNo
                  ) : (
                    <button
                      type="button"
                      onClick={() => track(record)}
                      className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {record.requestNo || index + 1}
                    </button>
                  )}

                  {/* Where it stands, under the number it belongs to. */}
                  <span
                    className={cn(
                      "mt-1 block w-fit rounded-md px-2.5 py-0.5 text-xs font-semibold",
                      ENTITLEMENT_STATUS_CHIP[record.status]
                    )}
                  >
                    {record.status}
                  </span>
                </Td>

                <Td className="whitespace-nowrap">
                  {formatDate(record.requestDate)}
                </Td>

                <Td className="text-left">
                  <span className="block font-semibold text-primary">
                    {record.leaveType && modeOf(record.kind) === "leaveDays"
                      ? record.leaveType
                      : label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {record.reason}
                  </span>
                </Td>

                <Td className="whitespace-nowrap">{measure(record)}</Td>

                <Td className="whitespace-nowrap text-right font-bold text-green-700">
                  {amountValue(record.amount)}
                </Td>
              </Row>
            ))}
          </tbody>
        </RecordTable>
      )}
    </>
  );
}
