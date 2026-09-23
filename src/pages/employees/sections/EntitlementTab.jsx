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
import { EmptyState } from "@/components/shared/panels";
import {
  Settled, Choice,
  checkRequired,
} from "@/components/shared/formFields";
import { PAYING_ACCOUNTS } from "@/pages/firm/firmData";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
  RecordLink,
} from "@/components/shared/RecordTable";
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import {
  Lock,
  FileText,
  FileCheck,
  History,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import { useLeaves } from "@/lib/leaves/context";
import { formatDate } from "@/pages/firm/firmData";
import { remainingBalance, entitlementOf } from "../leaveData";
import { PAYMENT_YEARS } from "../payrollData";
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
  overtimeRate,
  medicalAmount,
  hourlyRate,
  hoursBetween,
  clockTime,
  OVERTIME_TYPES,
  nextKindRequestNo,
  entitlementsFor,
  nextEntitlementNo,
  modeOf,
  lastSimilar,
  entitlementHistory,
} from "../entitlementData";

const NOTES_LIMIT = 500;

/**
 * A section heading, with the rule down its left.
 *
 * The same mark the page's own heading uses, one step quieter - so a run of
 * fields always sits under something that says which question they answer.
 */
const HEADING = "border-s-4 border-primary ps-3 text-base font-bold text-primary";

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDraft = () => ({
  requestDate: todayIso(),
  year: String(new Date().getFullYear()),
  month: "",
  leaveType: "Annual Leave",
  days: "",
  amount: "",
  reason: "",
  // Overtime is claimed as the shift that was worked rather than as a number
  // of hours: the hours follow from the clock, and a typed total can disagree
  // with the times beside it.
  overtimeDate: todayIso(),
  startTime: "",
  endTime: "",
  overtimeType: "",
  // A medical claim is made from the bill: what it cost, what the insurer
  // met, and the invoice that proves both.
  treatmentDate: todayIso(),
  invoiceNo: "",
  totalCost: "",
  insuranceCovered: "",
});

const emptyPayment = () => ({
  approved: "",
  method: "",
  // One choice for where it leaves from: the account carries its bank.
  bankAccount: "",
  paymentDate: todayIso(),
  reference: "",
});

/** A field's label. */
function FieldLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
    </Label>
  );
}

/**
 * Where the request is booked. None of it is a choice - every entitlement is
 * filed the same way - so the box wears a lock rather than a chevron.
 */
function Booked({ id, label, value }) {
  return (
    <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          readOnly
          tabIndex={-1}
          value={value}
          className="cursor-default bg-locked ps-9 text-muted-foreground"
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
    <div className="px-0 lg:px-4 lg:first:ps-0">
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
    <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
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

  // The number it already carries, or the one it is about to be given. Shown
  // before it is saved so the employee can quote it.
  const requestNo = open?.requestNo || nextKindRequestNo(records, kind);

  // Who it is for, as a personnel record names them: the name alone is not an
  // identifier, and two people can share one.
  const whose =
    (employee?.name || "") + (employee?.empNo ? " \u2014 " + employee.empNo : "");

  // What the leave being encashed is worth in a year, read off the leave type
  // rather than stored: it is a rule of the type, not a fact of the request.
  const yearlyEntitlement = entitlementOf(draft.leaveType) || "-";

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

  // How long the overtime shift ran, counted off the clock rather than typed.
  const workedHours =
    mode === "hours" ? hoursBetween(draft.startTime, draft.endTime) : 0;

  // What an hour of it is worth: the ordinary hourly rate, lifted by however
  // much the kind of day it fell on is worth.
  const otRate =
    mode === "hours" ? overtimeRate(employee?.salary, draft.overtimeType) : 0;

  // What the request comes to. Days and hours are worth what the salary says
  // they are worth; anything else is the sum that was asked for.
  const amount =
    mode === "leaveDays"
      ? encashmentAmount(employee?.salary, days)
      : mode === "hours"
        ? overtimeAmount(employee?.salary, workedHours, draft.overtimeType)
        : mode === "medical"
          ? medicalAmount(draft.totalCost, draft.insuranceCovered)
          : Number(draft.amount || 0);

  // An insurer meeting more than the bill is a refund, not a claim, and the
  // form says so rather than quietly showing nothing owed.
  const overInsured =
    mode === "medical" &&
    Number(draft.totalCost || 0) > 0 &&
    Number(draft.insuranceCovered || 0) > Number(draft.totalCost || 0);

  const counted =
    mode === "leaveDays"
      ? days > 0
      : mode === "hours"
        ? workedHours > 0
        : mode === "medical"
          ? amount > 0
          : Number(draft.amount) > 0;

  const canSubmit =
    draft.requestDate &&
    counted &&
    !exceeded &&
    (mode !== "hours" ||
      (draft.overtimeDate && draft.startTime && draft.endTime && draft.overtimeType)) &&
    (mode !== "medical" ||
      (draft.treatmentDate && draft.invoiceNo.trim() && !overInsured)) &&
    draft.reason.trim();

  // A full approval grants what was asked for; only a partial one names a
  // figure of its own, and a refusal grants nothing at all.
  const amending = decision === "partial";
  const refusing = decision === "rejected";
  const approvedAmount = amending ? Number(payment.approved || 0) : amount;

  /**
   * How many days a decision actually grants.
   *
   * A full approval grants the days asked for. A partial one grants whatever
   * the amount was cut to, so the days are read back off that figure rather
   * than asked for a second time - two fields for one decision can disagree,
   * and the money is the half that gets paid.
   */
  const approvedDays =
    mode !== "leaveDays" || amount <= 0
      ? null
      : amending
        ? Math.round((approvedAmount / amount) * days * 10) / 10
        : days;

  /** The same, in hours, for a request counted in hours. */
  const approvedHours =
    mode !== "hours" || amount <= 0
      ? null
      : amending
        ? Math.round((approvedAmount / amount) * workedHours * 10) / 10
        : workedHours;
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
    if (!checkRequired() || !canSubmit) return;
    const details = {
      requestDate: draft.requestDate,
      year: draft.year,
      leaveType: draft.leaveType,
      days,
      overtimeDate: draft.overtimeDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
      overtimeType: draft.overtimeType,
      hours: workedHours,
      treatmentDate: draft.treatmentDate,
      invoiceNo: draft.invoiceNo.trim(),
      totalCost: Number(draft.totalCost || 0),
      insuranceCovered: Number(draft.insuranceCovered || 0),
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
          requestNo: nextKindRequestNo(prev, kind),
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
              approvedDays: approvedDays ?? undefined,
              approvedHours: approvedHours ?? undefined,
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
          {/* What is being answered, read back and unanswerable-with: a
              decision is taken against what was asked for, so what was asked
              for has to be on the same screen as the answer. */}
          <div className="space-y-4">
            <h3 className={HEADING}>
              Request Information
            </h3>
            <div className="form-grid">
              <Booked id="dec-employee" label="Employee Name" value={whose} />
              <Booked id="dec-request-no" label="Request No." value={requestNo} />
              <Booked
                id="dec-request-date"
                label="Request Date"
                value={draft.requestDate ? formatDate(draft.requestDate) : "-"}
              />
              {mode === "leaveDays" && (
                <Booked id="dec-year" label="Year" value={draft.year} />
              )}
              {mode === "hours" && (
                <Booked
                  id="dec-ot-year"
                  label="Year"
                  value={String(draft.overtimeDate || "").slice(0, 4) || "-"}
                />
              )}

              {mode === "medical" && (
                <>
                  <Booked
                    id="dec-treatment-date"
                    label="Date"
                    value={
                      draft.treatmentDate ? formatDate(draft.treatmentDate) : "-"
                    }
                  />
                  <Booked
                    id="dec-invoice-no"
                    label="Invoice No."
                    value={draft.invoiceNo || "-"}
                  />
                  <Booked
                    id="dec-total-cost"
                    label="Total Medical Cost (OMR)"
                    value={amountValue(draft.totalCost)}
                  />
                  <Booked
                    id="dec-insured"
                    label="Insurance Covered Amount (OMR)"
                    value={amountValue(draft.insuranceCovered)}
                  />
                  <Booked
                    id="dec-requested"
                    label="Requested Amount (OMR)"
                    value={amountValue(amount)}
                  />
                </>
              )}
            </div>
          </div>

          {mode !== "medical" && (
          <div className="space-y-4">
            <h3 className={HEADING}>
              {label} Summary
            </h3>
            {/* As wide as the summary has fields to fill: overtime reads back
                eight, which is two rows of four, while leave encashment reads
                back six and wants them on one. A row that leaves half itself
                empty reads as a row with something missing from it. */}
            <div className="form-grid">
              {mode === "leaveDays" ? (
                <>
                  <Booked
                    id="dec-leave-type"
                    label="Leave Type"
                    value={draft.leaveType}
                  />
                  <Booked
                    id="dec-entitlement"
                    label="Annual Leave Entitlement"
                    value={yearlyEntitlement}
                  />
                  <Booked
                    id="dec-balance"
                    label="Remaining Leave Balance"
                    value={balance ? available + " Days" : "-"}
                  />
                  <Booked
                    id="dec-days"
                    label="Days Requested for Encashment"
                    value={days + " Days"}
                  />
                  <Booked
                    id="dec-after"
                    label="Balance After Request"
                    value={balance ? after + " Days" : "-"}
                  />
                </>
              ) : (
                mode === "hours" && (
                  <>
                    <Booked
                      id="dec-ot-date"
                      label="Overtime Date"
                      value={
                        draft.overtimeDate ? formatDate(draft.overtimeDate) : "-"
                      }
                    />
                    <Booked
                      id="dec-start"
                      label="Start Time"
                      value={clockTime(draft.startTime)}
                    />
                    <Booked
                      id="dec-end"
                      label="End Time"
                      value={clockTime(draft.endTime)}
                    />
                    <Booked
                      id="dec-total-hours"
                      label="Total Overtime Hours"
                      value={workedHours ? workedHours + " Hours" : "-"}
                    />
                    <Booked
                      id="dec-ot-type"
                      label="Overtime Type"
                      value={draft.overtimeType || "-"}
                    />
                    <Booked
                      id="dec-rate"
                      label="Hourly Rate (OMR)"
                      value={amountValue(hourlyRate(employee?.salary))}
                    />
                    <Booked
                      id="dec-ot-rate"
                      label="Overtime Rate (OMR)"
                      value={draft.overtimeType ? amountValue(otRate) : "-"}
                    />
                  </>
                )
              )}

              <Booked
                id="dec-estimated"
                label="Estimated Amount (OMR)"
                value={amountValue(amount)}
              />
            </div>
          </div>
          )}

          <DecisionChoice
            value={decision}
            onChange={setDecision}
            disabled={!canDecide || settled || refused}
          />

          {/* The answer itself: when it was given, what it grants, and why.
              A separate box from the choice above it, with room between. */}
          <div className="space-y-4">
            <h3 className={HEADING}>Decision</h3>

            {/* A refusal grants nothing, so it has no day and no figure to
                show - only a reason. Leaving an Approved Amount on screen
                beside a rejection invites the question of what was approved,
                and the answer is nothing. */}
            {!refusing && (
              <div className="form-grid">
                <Settled
                  id="ent-decision-date"
                  label="Decision Date"
                  value={formatDate(decidedOn)}
                />

                {approvedDays !== null && (
                  <Settled
                    id="ent-approved-days"
                    label="Approved Days"
                    value={approvedDays + " Days"}
                  />
                )}

                {approvedHours !== null && (
                  <Settled
                    id="ent-approved-hours"
                    label="Approved Hours"
                    value={approvedHours + " Hours"}
                  />
                )}

                {/* Only a partial approval names a figure of its own; a full
                    one grants what was asked for. */}
                {amending ? (
                  <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
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
                      className={cn(
                        approvedAmount > amount && "border-destructive"
                      )}
                    />
                  </div>
                ) : (
                  <Settled
                    id="ent-approved"
                    label="Approved Amount (OMR)"
                    value={amountValue(approvedAmount)}
                  />
                )}
              </div>
            )}

            {/* The comment takes the whole width rather than a share of the
                row above: it is prose, not a figure, and a box that stops
                two thirds of the way across leaves the section looking like
                it ran out of things to say. */}
            <div className="space-y-2">
              <FieldLabel htmlFor="ent-comment" required={refusing}>
                {refusing ? "Reason for Rejection" : "Management Comment"}
              </FieldLabel>
              <Textarea
                id="ent-comment"
                rows={3}
                maxLength={NOTES_LIMIT}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={!canDecide || settled || refused}
                placeholder={
                  refusing
                    ? "Say why this request is refused"
                    : "Enter management comment"
                }
              />
              <p className="text-end text-xs text-muted-foreground">
                {reason.length} / {NOTES_LIMIT}
              </p>
            </div>
          </div>

          {/* How the money actually reaches them. A refused request has none
              of this: there is nothing to pay, and so nothing to ask. */}
          {decision && !refusing && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={HEADING}>
                Payment Details
              </h3>
              <div className="form-grid">
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

              <div className="form-grid">
                <Choice
                  id="ent-method"
                  label="Payment Method"
                  value={payment.method}
                  onChange={(value) => value && setPay("method", value)}
                  placeholder="Select method"
                  options={PAYMENT_METHODS}
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
                />

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-payment-date" required>
                    Payment Date
                  </FieldLabel>
                  <Input
                    id="ent-payment-date"
                    type="date"
                    value={payment.paymentDate}
                    onChange={(e) => setPay("paymentDate", e.target.value)}
                  />
                </div>

                {/* The proof of the transfer sits beside its reference as a
                    plain icon: nothing to press but the paperclip itself. */}
                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:[&>*+*]:border-s">
              <Fact icon={FileText} label="Supporting Document">
                {attachedName || "None attached"}
              </Fact>
              <Fact icon={History} label="History">
                <RecordLink onClick={() => setShowHistory(true)}>
                  View history
                  </RecordLink>
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
          {/* Who is asking, and under what number. None of it is asked for:
              the request is being written on this person's own record, on the
              day it is being written. Where it is booked is not here either -
              that belongs beside the payment it governs, on the stage that
              makes one. */}
          <div className="space-y-4">
            <h3 className={HEADING}>
              Request Information
            </h3>
            <div className="form-grid">
              <Booked id="ent-employee" label="Employee Name" value={whose} />
              <Booked id="ent-request-no" label="Request No." value={requestNo} />
              <Booked
                id="ent-request-date"
                label="Request Date"
                value={formatDate(draft.requestDate)}
              />

              {/* The year the overtime falls in, read off its own date -
                  asking for it again is asking to be told something the form
                  already knows, and can be told wrong. */}
              {mode === "hours" && (
                <Booked
                  id="ent-ot-year"
                  label="Year"
                  value={String(draft.overtimeDate || "").slice(0, 4) || "-"}
                />
              )}

              {/* Which year's balance is being drawn on. */}
              {mode === "leaveDays" && (
                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
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
              )}
            </div>
          </div>

          <h3 className={HEADING}>
            {label} Details
          </h3>
          <div className="form-grid">
            {/* Days off a leave balance. */}
            {mode === "leaveDays" && (
              <>
                {/* Not a choice: only annual leave is encashable. Sick leave
                    is there to be taken and unpaid leave is worth nothing, so
                    offering either would be offering a mistake. */}
                <Booked
                  id="ent-leave-type"
                  label="Leave Type"
                  value={draft.leaveType}
                />

                <Booked
                  id="ent-entitlement"
                  label="Annual Leave Entitlement"
                  value={yearlyEntitlement}
                />

                <Booked
                  id="ent-available"
                  label="Remaining Leave Balance"
                  value={balance ? available + " Days" : "-"}
                />

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
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

                <Booked
                  id="ent-after"
                  label="Balance After Request"
                  value={balance ? after + " Days" : "-"}
                />
              </>
            )}

            {/* The shift that was worked. The hours are not asked for: they
                are the distance between the two clock times, and a typed
                total could disagree with them. Nor is the rate, which is the
                salary's own hourly rate lifted by whatever the kind of day is
                worth. */}
            {mode === "hours" && (
              <>
                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-ot-date" required>
                    Overtime Date
                  </FieldLabel>
                  <Input
                    id="ent-ot-date"
                    type="date"
                    value={draft.overtimeDate}
                    onChange={(e) => set("overtimeDate", e.target.value)}
                  />
                </div>

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-start" required>
                    Start Time
                  </FieldLabel>
                  <Input
                    id="ent-start"
                    type="time"
                    value={draft.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                  />
                </div>

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-end" required>
                    End Time
                  </FieldLabel>
                  <Input
                    id="ent-end"
                    type="time"
                    value={draft.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                  />
                </div>

                <Booked
                  id="ent-total-hours"
                  label="Total Overtime Hours"
                  value={workedHours ? workedHours + " Hours" : "-"}
                />

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-ot-type" required>
                    Overtime Type
                  </FieldLabel>
                  <Select
                    value={draft.overtimeType}
                    onValueChange={(value) => value && set("overtimeType", value)}
                  >
                    <SelectTrigger id="ent-ot-type">
                      <SelectValue placeholder="Select overtime type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OVERTIME_TYPES.map((option) => (
                        <SelectItem key={option.name} value={option.name}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Booked
                  id="ent-rate"
                  label="Hourly Rate (OMR)"
                  value={amountValue(hourlyRate(employee?.salary))}
                />

                <Booked
                  id="ent-ot-rate"
                  label="Overtime Rate (OMR)"
                  value={draft.overtimeType ? amountValue(otRate) : "-"}
                />
              </>
            )}

            {/* A medical bill: what it came to, what the insurer met, and
                what is therefore left for the firm. The last of the three is
                not asked for - it is the first less the second, and a typed
                figure could disagree with the two above it. */}
            {mode === "medical" && (
              <>
                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-treatment-date" required>
                    Date
                  </FieldLabel>
                  <Input
                    id="ent-treatment-date"
                    type="date"
                    value={draft.treatmentDate}
                    onChange={(e) => set("treatmentDate", e.target.value)}
                  />
                </div>

                {/* The invoice, and the copy of it. The paperclip sits on the
                    number because it is that invoice being attached, not some
                    loose document belonging to the request at large. */}
                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-invoice-no" required>
                    Invoice No.
                  </FieldLabel>
                  <div className="flex w-full min-w-0 items-center gap-2">
                    <Input
                      id="ent-invoice-no"
                      className="min-w-0 flex-1"
                      value={draft.invoiceNo}
                      onChange={(e) => set("invoiceNo", e.target.value)}
                      placeholder="INV-00000"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      asChild
                      title={
                        receipt ? receipt.name + " attached" : "Upload the invoice"
                      }
                      className={cn(
                        "shrink-0",
                        receipt && "border-green-600 text-green-600"
                      )}
                    >
                      <label htmlFor="ent-invoice-file" className="cursor-pointer">
                        {receipt ? (
                          <FileCheck className="h-4 w-4" />
                        ) : (
                          <UploadCloud className="h-4 w-4" />
                        )}
                        <span className="sr-only">Upload the invoice</span>
                      </label>
                    </Button>
                    <Input
                      id="ent-invoice-file"
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files[0] && setReceipt(e.target.files[0])
                      }
                    />
                  </div>
                </div>

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-total-cost" required>
                    Total Medical Cost (OMR)
                  </FieldLabel>
                  <Input
                    id="ent-total-cost"
                    inputMode="decimal"
                    value={draft.totalCost}
                    onChange={(e) =>
                      set("totalCost", e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.000"
                  />
                </div>

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-insured">
                    Insurance Covered Amount (OMR)
                  </FieldLabel>
                  <Input
                    id="ent-insured"
                    inputMode="decimal"
                    value={draft.insuranceCovered}
                    onChange={(e) =>
                      set("insuranceCovered", e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.000"
                    className={cn(overInsured && "border-destructive text-destructive")}
                  />
                  {overInsured && (
                    <p role="alert" className="text-xs font-semibold text-destructive">
                      More than the bill came to
                    </p>
                  )}
                </div>

                <Booked
                  id="ent-requested"
                  label="Requested Amount (OMR)"
                  value={amountValue(amount)}
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

            {mode !== "amount" && mode !== "medical" && (
              <Worked
                id="ent-estimated"
                label="Estimated Amount (OMR)"
                value={amountValue(amount)}
              />
            )}
          </div>

          <div className="space-y-2">
            <h3 className={HEADING}>
              Employee Comment
            </h3>
            <Textarea
              id="ent-reason-notes"
              rows={3}
              maxLength={NOTES_LIMIT}
              value={draft.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Enter employee comment"
            />
            <p className="text-end text-xs text-muted-foreground">
              {draft.reason.length} / {NOTES_LIMIT}
            </p>
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
              <Button type="button" onClick={disburse}>
                Approve &amp; Pay
              </Button>
            )
          )
        ) : (
          <Button type="button" onClick={submit}>
            Submit Request
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Opened over the page, so the list it is filed into stays behind. */}
      <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-[1700px] overflow-y-auto">
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
                <Th width="10%" className="text-end">
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
                    <Td className="whitespace-nowrap text-end font-semibold text-green-700">
                      {amountValue(event.amount)}
                    </Td>
                    <Td className="text-start text-muted-foreground">
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
            <Th width="24%" className="text-end">
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

                <Td className="text-start">
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

                <Td className="whitespace-nowrap text-end font-bold text-green-700">
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
