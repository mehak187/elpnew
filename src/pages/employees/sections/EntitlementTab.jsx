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
  Settled,
  Choice,
  Field,
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
  Save,
  Clock,
  Banknote,
  CalendarDays,
  User,
  Landmark,
  FileText,
  FileCheck,
  History,
  UploadCloud,
} from "lucide-react";
import UploadIcon from "@/components/shared/UploadIcon";
import { cn } from "@/lib/utils";
import { amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import { useLeaves } from "@/lib/leaves/context";
import { formatDate } from "@/pages/firm/firmData";
import { remainingBalance } from "../leaveData";
import { PAYMENT_YEARS, SALARY_MONTHS } from "../payrollData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import {
  ENTITLEMENT_EXPENSE_TYPE,
  TRANSPORT_GENERAL,
  TRANSPORT_COURT,
  ENTITLEMENT_CATEGORY,
  ENTITLEMENT_SUBCATEGORY,
  ENTITLEMENT_PENDING,
  ENTITLEMENT_APPROVED,
  ENTITLEMENT_REJECTED,
  ENTITLEMENT_STATUS_CHIP,
  encashmentAmount,
  overtimeAmount,
  hourlyRate,
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
  // Overtime is claimed as a month's hours, at the ordinary hourly rate.
  hours: "",
  // A transport claim is general, or made for a case - in which case it
  // names the file and the day of the trip.
  transportType: TRANSPORT_GENERAL,
  fileNo: "",
  travelDate: "",
});

const emptyPayment = () => ({
  approved: "",
  // What a partial approval grants, in the unit the request was counted in.
  // The money follows from these; only a request already made in money asks
  // for `approved` directly.
  approvedDays: "",
  approvedHours: "",
  // What happened on the case the trip was for, recorded as the claim is paid.
  updateDate: todayIso(),
  updateText: "",
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
  // The allowances whose sheets put the sum asked for beside the decision
  // and at the head of the summary, rather than an account or a type.
  const namesAmount = kind === "medical" || kind === "transport";
  const open = records.find((row) => row.id === openId) || null;
  const settled = open?.status === ENTITLEMENT_APPROVED;
  const refused = open?.status === ENTITLEMENT_REJECTED;

  const mine = smartSearch(entitlementsFor(records, employee?.name, kind), query);

  // "January" rather than "01", as the card under the decision writes it.
  const monthName =
    SALARY_MONTHS.find((month) => month.value === draft.month)?.label || "";

  // The number it already carries, or the one it is about to be given. Shown
  // before it is saved so the employee can quote it.
  const requestNo = open?.requestNo || nextKindRequestNo(records, kind);

  // Who it is for, as a personnel record names them: the name alone is not an
  // identifier, and two people can share one.
  const whose =
    (employee?.name || "") + (employee?.empNo ? " \u2014 " + employee.empNo : "");

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
  // The overtime hours the employee is claiming for the month.
  const workedHours = mode === "hours" ? Number(draft.hours || 0) : 0;

  // What an hour of it is worth: the ordinary hourly rate, lifted by however
  // much the kind of day it fell on is worth.
  // What the request comes to. Days and hours are worth what the salary says
  // they are worth; anything else is the sum that was asked for.
  const amount =
    mode === "leaveDays"
      ? encashmentAmount(employee?.salary, days)
      : mode === "hours"
        ? overtimeAmount(employee?.salary, workedHours)
        : Number(draft.amount || 0);

  const counted =
    mode === "leaveDays"
      ? days > 0
      : mode === "hours"
        ? workedHours > 0
        : Number(draft.amount) > 0;

  // A court-linked trip names its file and its day; a general one does not.
  const courtLinked =
    kind === "transport" && draft.transportType === TRANSPORT_COURT;

  // Transport asks for a comment but does not insist on one; every other
  // request has to say why it is being made.
  const reasonRequired = kind !== "transport";

  const canSubmit =
    draft.requestDate &&
    counted &&
    !exceeded &&
    (mode !== "hours" ||
      (draft.year && draft.month && workedHours > 0)) &&
    (!courtLinked || (draft.fileNo.trim() && draft.travelDate)) &&
    (!reasonRequired || draft.reason.trim());

  // A full approval grants what was asked for; only a partial one names a
  // figure of its own, and a refusal grants nothing at all.
  const amending = decision === "partial";
  /**
   * Nothing is disbursed on either of these. A refusal ends the request; a
   * return keeps it alive and asks the employee for what is missing. Both
   * want a comment and neither wants a payment, so the form treats them the
   * same from here on.
   */
  const returning = decision === "completion";
  const refusing = decision === "rejected" || returning;

  /**
   * What a decision actually grants, in the unit the request was made in.
   *
   * A full approval grants what was asked for. A partial one is management
   * cutting the count - days of leave, or hours of overtime - so that is the
   * figure they type, and the money follows from it. The other way round
   * would have them working out a sum to arrive at a number of days, which is
   * the calculation the form is there to do.
   */
  const approvedDays =
    mode !== "leaveDays"
      ? null
      : amending
        ? Number(payment.approvedDays || 0)
        : days;

  const approvedHours =
    mode !== "hours"
      ? null
      : amending
        ? Number(payment.approvedHours || 0)
        : workedHours;

  /**
   * What that comes to. Worked out from whatever was granted, never typed
   * beside it: a sum and a count that disagree is a record nobody can settle.
   * Only the kinds counted in money are asked for a figure directly.
   */
  const approvedAmount =
    mode === "leaveDays"
      ? encashmentAmount(employee?.salary, approvedDays)
      : mode === "hours"
        ? overtimeAmount(employee?.salary, approvedHours)
        : amending
          ? Number(payment.approved || 0)
          : amount;
  const decidedOn = open?.decisionDate || todayIso();
  const attachedName = open?.attachment || "";
  // What this person was given last time, where there was a last time.
  const previous = lastSimilar(records, employee?.name, kind, openId);

  /**
   * Whether a partial approval grants something possible.
   *
   * More than nothing, and never more than was asked for: an office that may
   * grant less than the request may not use the same answer to grant more.
   * Checked in the unit that was actually typed, so the message can name it.
   */
  const grantIsSound =
    !amending ||
    (approvedDays !== null
      ? approvedDays > 0 && approvedDays <= days
      : approvedHours !== null
        ? approvedHours > 0 && approvedHours <= workedHours
        : approvedAmount > 0 && approvedAmount <= amount);

  const canDisburse =
    Boolean(decision) &&
    !refusing &&
    canDecide &&
    grantIsSound &&
    approvedAmount > 0 &&
    approvedAmount <= amount &&
    payment.method &&
    payment.bankAccount &&
    payment.paymentDate &&
    payment.reference.trim() &&
    // A court-linked trip is paid together with what happened on the case.
    (!courtLinked || (payment.updateDate && payment.updateText.trim()));

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
      month: draft.month,
      leaveType: draft.leaveType,
      days,
      hours: workedHours,
      amount,
      reason: draft.reason.trim(),
      transportType: kind === "transport" ? draft.transportType : undefined,
      fileNo: courtLinked ? draft.fileNo.trim() : "",
      travelDate: courtLinked ? draft.travelDate : "",
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
              fileUpdateDate: courtLinked ? payment.updateDate : undefined,
              fileUpdate: courtLinked ? payment.updateText.trim() : undefined,
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
      transportType: record.transportType || TRANSPORT_GENERAL,
      fileNo: record.fileNo || "",
      travelDate: record.travelDate || "",
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

  /**
   * The decision itself: when it was given, what it grants, and why.
   *
   * One row of four - the date, what was granted in the request's own unit,
   * the money that comes to, and the comment - the way every one of the
   * request sheets draws it. A refusal or a return grants nothing, so it has
   * no figures to show and the comment takes the whole row.
   */
  const decisionFields = (
    <div className="form-grid">
      {!refusing && (
        <>
                  <Settled
                    id="ent-decision-date"
                    label="Decision Date"
                    value={formatDate(decidedOn)}
                  />

                  {namesAmount && (
                    <Settled
                      id="ent-requested"
                      label="Requested Amount (OMR)"
                      value={amountValue(amount)}
                    />
                  )}

                  {/* A partial approval is management cutting the count, so
                      that is the field it opens. A full approval grants what
                      was asked for and has nothing to type. */}
                  {approvedDays !== null &&
                    (amending ? (
                      <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                        <FieldLabel htmlFor="ent-approved-days" required>
                          Days Requested for Encashment
                        </FieldLabel>
                        <Input
                          id="ent-approved-days"
                          inputMode="numeric"
                          value={payment.approvedDays}
                          onChange={(e) =>
                            setPay("approvedDays", e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="0"
                          className={cn(!grantIsSound && "border-destructive")}
                        />
                        {!grantIsSound && (
                          <p role="alert" className="text-xs font-semibold text-destructive">
                            {"Between 1 and " + days + " days"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Settled
                        id="ent-approved-days"
                        label="Days Requested for Encashment"
                        value={approvedDays + " Days"}
                      />
                    ))}

                  {approvedHours !== null &&
                    (amending ? (
                      <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                        <FieldLabel htmlFor="ent-approved-hours" required>
                          Approved Overtime Hours
                        </FieldLabel>
                        <Input
                          id="ent-approved-hours"
                          inputMode="decimal"
                          value={payment.approvedHours}
                          onChange={(e) =>
                            setPay("approvedHours", e.target.value.replace(/[^\d.]/g, ""))
                          }
                          placeholder="0"
                          className={cn(!grantIsSound && "border-destructive")}
                        />
                        {!grantIsSound && (
                          <p role="alert" className="text-xs font-semibold text-destructive">
                            {"Between 0 and " + workedHours + " hours"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Settled
                        id="ent-approved-hours"
                        label="Approved Overtime Hours"
                        value={approvedHours + " Hours"}
                      />
                    ))}

                  {/* Worked out from whatever was granted above, except where
                      the request is a sum in the first place. */}
                  {amending && approvedDays === null && approvedHours === null ? (
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
                        className={cn(!grantIsSound && "border-destructive")}
                      />
                    </div>
                  ) : (
                    <Settled
                      id="ent-approved"
                      label="Approved Amount (OMR)"
                      value={amountValue(approvedAmount)}
                    />
                  )}
        </>
      )}

      <div
        className={cn(
          "form-field flex h-full flex-col justify-end gap-2",
          refusing ? "span-12" : "span-3"
        )}
      >
        <FieldLabel htmlFor="ent-comment">
          {returning
            ? "What is Missing"
            : refusing
              ? "Reason for Rejection"
              : "Management Comment"}
        </FieldLabel>
        <Textarea
          id="ent-comment"
          rows={refusing ? 3 : 1}
          maxLength={NOTES_LIMIT}
          required={refusing}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={!canDecide || settled || refused}
          placeholder={
            returning
              ? "Say what the employee still has to supply"
              : refusing
                ? "Say why this request is refused"
                : "Enter management comment"
          }
          className={cn(!refusing && "min-h-9 resize-none")}
        />
        {refusing && (
          <p className="text-end text-xs text-muted-foreground">
            {reason.length} / {NOTES_LIMIT}
          </p>
        )}
      </div>
    </div>
  );

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
          {/* The request is not read back here. What it was for is on
              the stage behind this one, and the four facts a decision
              actually needs - who, when, what kind, which account - are
              on the card at the foot of the page. Saying them twice on
              one screen is what the drawing takes out. */}

          {/* Each answer says what it does, in the name of the thing being
              decided - "approve the leave encashment", not "approve" - so the
              three cards cannot be told apart only by their colour. Built
              from the tab's own label rather than written out nine times. */}
          <DecisionChoice
            value={decision}
            onChange={setDecision}
            disabled={!canDecide || settled || refused}
            offers={["full", "partial", "completion", "rejected"]}
            notes={
              mode === "hours"
                ? {
                    full: "Approve the overtime request as submitted",
                    partial: "Approve adjusted overtime hours or amount",
                    completion: "Return for missing information or documents",
                    rejected: "Reject the overtime request",
                  }
                : {
                    full: "Approve the " + label.toLowerCase() + " as requested",
                    partial:
                      namesAmount
                        ? "Approve an adjusted allowance amount"
                        : "Approve a portion of the " + label.toLowerCase(),
                    completion: "Return for missing information or documents",
                    rejected: "Reject the " + label.toLowerCase() + " request",
                  }
            }
          >
            {kind === "medical" && decisionFields}
          </DecisionChoice>

          {kind !== "medical" && (
            <div className="space-y-4">
              <h3 className={HEADING}>Decision</h3>
              {decisionFields}
            </div>
          )}

          {/* Where the case stands now. Only a trip made for a case has a
              file to bring up to date, and only an approved one gets it. */}
          {courtLinked && decision && !refusing && (
            <div className="space-y-4">
              <h3 className={HEADING}>File Update</h3>
              <div className="form-grid">
                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-update-date">Update Date</FieldLabel>
                  <Input
                    required
                    id="ent-update-date"
                    type="date"
                    value={payment.updateDate}
                    onChange={(e) => setPay("updateDate", e.target.value)}
                    disabled={settled}
                  />
                </div>
                <div className="form-field span-9 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-update">Update</FieldLabel>
                  <Textarea
                    required
                    id="ent-update"
                    rows={1}
                    maxLength={NOTES_LIMIT}
                    value={payment.updateText}
                    onChange={(e) => setPay("updateText", e.target.value)}
                    disabled={settled}
                    placeholder="Enter the update on the file"
                    className="min-h-9 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* How the money actually reaches them. A refused request has none
              of this: there is nothing to pay, and so nothing to ask. */}
          {decision && !refusing && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={HEADING}>
                Expense &amp; Disbursement Details
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
              decision === "partial" &&
                "border-decision-partial-ink bg-decision-partial",
              returning && "border-frame-alt/50 bg-decision-partial/40",
              decision === "rejected" && "border-red-500/50 bg-decision-rejected",
              !decision && "bg-card"
            )}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:[&>*+*]:border-s">
              {namesAmount && (
                <Fact icon={FileText} label="Request No.">
                  {requestNo}
                </Fact>
              )}
              {courtLinked ? (
                <Fact icon={FileText} label="File No.">
                  {draft.fileNo || "-"}
                </Fact>
              ) : (
                <Fact icon={CalendarDays} label="Request Date">
                  {draft.requestDate ? formatDate(draft.requestDate) : "-"}
                  {attachedName && (
                    <span className="mt-0.5 block text-primary">{attachedName}</span>
                  )}
                </Fact>
              )}
              {namesAmount ? null : mode === "hours" ? (
                <Fact icon={CalendarDays} label="Month">
                  {monthName ? monthName + " " + draft.year : "-"}
                </Fact>
              ) : (
                <Fact icon={FileText} label="Request Type">
                  {label}
                </Fact>
              )}
              <Fact icon={User} label="Employee Name">
                {whose}
              </Fact>
              {courtLinked ? (
                <Fact icon={CalendarDays} label="Travel Date">
                  {draft.travelDate ? formatDate(draft.travelDate) : "-"}
                </Fact>
              ) : namesAmount ? (
                <Fact icon={Banknote} label="Requested Amount">
                  {amountValue(amount) + " OMR"}
                </Fact>
              ) : mode === "hours" ? (
                <Fact icon={Clock} label="Approved Hours">
                  {approvedHours ? approvedHours + " Hours" : "-"}
                </Fact>
              ) : (
                <Fact icon={Landmark} label="Bank / Account">
                  {employee?.bankName
                    ? employee.bankName + " - " + employee.accountNumber
                    : "-"}
                </Fact>
              )}
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
              {/* The paper the request is made on hangs off its number. */}
              <Field id="ent-request-no" label="Request No.">
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    id="ent-request-no"
                    readOnly
                    tabIndex={-1}
                    value={requestNo}
                    className="min-w-0 flex-1 cursor-default"
                  />
                  {kind !== "transport" && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        asChild
                        title={
                          receipt ? receipt.name + " attached" : "Upload a supporting document"
                        }
                        className={cn(
                          "shrink-0",
                          receipt && "border-green-600 text-green-600"
                        )}
                      >
                        <label htmlFor="ent-request-file" className="cursor-pointer">
                          {receipt ? (
                            <FileCheck className="h-4 w-4" />
                          ) : (
                            <UploadIcon className="h-4 w-4" />
                          )}
                          <span className="sr-only">Upload a supporting document</span>
                        </label>
                      </Button>
                      <Input
                        id="ent-request-file"
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && setReceipt(e.target.files[0])}
                      />
                    </>
                  )}
                </div>
              </Field>
              {kind === "medical" ? (
                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-request-date">Request Date</FieldLabel>
                  <Input
                    required
                    id="ent-request-date"
                    type="date"
                    value={draft.requestDate}
                    max={todayIso()}
                    onChange={(e) => set("requestDate", e.target.value)}
                  />
                </div>
              ) : (
                <Booked
                  id="ent-request-date"
                  label="Request Date"
                  value={formatDate(draft.requestDate)}
                />
              )}
              <Booked id="ent-employee" label="Employee Name" value={whose} />

              {/* Which year the request belongs to: the balance being drawn
                  on, or the month the overtime was worked in. */}
              {(mode === "leaveDays" || mode === "hours") && (
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
            {/* Days off a leave balance. */}
            {mode === "leaveDays" && (
              <>
                {/* Not a choice: only annual leave is encashable. Sick leave
                    is there to be taken and unpaid leave is worth nothing, so
                    offering either would be offering a mistake. */}
                <Booked
                  id="ent-available"
                  label="Available Leave Balance"
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

            {/* A month's overtime, at the employee's ordinary hourly rate.
                The rate is read off the salary, never typed, so the amount
                below cannot disagree with the pay it is worked out from. */}
            {mode === "hours" && (
              <>
                <div
                  data-required="true"
                  className="form-field span-3 flex h-full flex-col justify-end gap-2"
                >
                  <FieldLabel htmlFor="ent-month">Month</FieldLabel>
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

                <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-hours">Overtime Hours</FieldLabel>
                  <Input
                    required
                    id="ent-hours"
                    inputMode="decimal"
                    value={draft.hours}
                    onChange={(e) =>
                      set("hours", e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0"
                  />
                </div>

                <Booked
                  id="ent-rate"
                  label="Hourly Rate (OMR)"
                  value={amountValue(hourlyRate(employee?.salary))}
                />
              </>
            )}

            {/* A sum the employee names. Transport asks for it in its own
                section, under the choice of what kind of trip it was. */}
            {mode === "amount" && kind !== "transport" && (
              <div className="form-field span-3 flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="ent-amount">Requested Amount (OMR)</FieldLabel>
                <Input
                  required
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
          </div>

          {kind === "transport" && (
            <div className="space-y-4">
              <h3 className={HEADING}>{label} Details</h3>

              {/* General or for a case. The choice decides what else is
                  asked, so it comes first and the fields follow it. */}
              <div
                role="radiogroup"
                aria-label="Kind of transport"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {[
                  { value: TRANSPORT_GENERAL, title: "General" },
                  { value: TRANSPORT_COURT, title: "Court-Linked" },
                ].map((option) => {
                  const picked = draft.transportType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={picked}
                      onClick={() => set("transportType", option.value)}
                      className={cn(
                        "flex items-center gap-3 rounded-field border px-4 py-3 text-start font-medium transition-colors",
                        picked
                          ? "border-primary bg-secondary text-primary"
                          : "border-field-border hover:bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          picked ? "border-primary" : "border-muted-foreground/50"
                        )}
                      >
                        {picked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                      {option.title}
                    </button>
                  );
                })}
              </div>
              <p className="helper-text">
                When General is selected, only Requested Amount is shown.
              </p>

              <div className="form-grid form-grid-3">
                {courtLinked && (
                  <>
                    <div className="form-field flex h-full flex-col justify-end gap-2">
                      <FieldLabel htmlFor="ent-file-no">File No.</FieldLabel>
                      <Input
                        required
                        id="ent-file-no"
                        value={draft.fileNo}
                        onChange={(e) => set("fileNo", e.target.value)}
                        placeholder="Enter the case file number"
                      />
                    </div>
                    <div className="form-field flex h-full flex-col justify-end gap-2">
                      <FieldLabel htmlFor="ent-travel-date">Travel Date</FieldLabel>
                      <Input
                        required
                        id="ent-travel-date"
                        type="date"
                        value={draft.travelDate}
                        max={todayIso()}
                        onChange={(e) => set("travelDate", e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div className="form-field flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="ent-amount">Requested Amount (OMR)</FieldLabel>
                  <Input
                    required
                    id="ent-amount"
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(e) =>
                      set("amount", e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className={HEADING}>
              {kind === "transport" ? "Employee Comment" : "Reason / Notes"}
            </h3>
            <Textarea
              id="ent-reason-notes"
              rows={3}
              maxLength={NOTES_LIMIT}
              value={draft.reason}
              onChange={(e) => set("reason", e.target.value)}
              required={reasonRequired}
              placeholder={
                kind === "transport"
                  ? "Add details of the transport allowance request (optional)"
                  : "Enter the reason for requesting " + label.toLowerCase()
              }
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
                variant={returning ? "outline" : "destructive"}
                className={cn(
                  returning &&
                    "border-frame-alt text-frame-alt hover:bg-decision-partial/40"
                )}
                onClick={reject}
                disabled={!reason.trim()}
              >
                <Save className="me-2 h-4 w-4" />
                {returning ? "Return to Employee" : "Confirm Rejection"}
              </Button>
            )
          ) : (
            !settled && (
              <Button type="button" onClick={disburse}>
                <Save className="me-2 h-4 w-4" />
                Approve &amp; Pay
              </Button>
            )
          )
        ) : (
          <Button type="button" onClick={submit}>
            <Save className="me-2 h-4 w-4" />
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
