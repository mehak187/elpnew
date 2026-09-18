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
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import { useLeaves } from "@/lib/leaves/context";
import { formatDate } from "@/pages/firm/firmData";
import { nextRequestNo } from "../requestFlow";
import { typesIn, remainingBalance } from "../leaveData";
import {
  PAYMENT_YEARS,
  PAYMENT_SOURCES,
  SALARY_MONTHS,
  DEFAULT_BANK,
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
} from "../entitlementData";

const NOTES_LIMIT = 300;

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
  bank: DEFAULT_BANK,
  accountNo: "",
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

  const amending = decision === "partial";
  const approvedAmount = amending ? Number(payment.approved || 0) : amount;
  const canDisburse =
    Boolean(decision) &&
    decision !== "rejected" &&
    canDecide &&
    payment.method &&
    payment.paymentDate &&
    (!amending || approvedAmount > 0);

  const close = () => {
    setDraft(emptyDraft());
    setPayment(emptyPayment());
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
              method: payment.method,
              bank: payment.bank,
              accountNo: payment.accountNo,
              paymentDate: payment.paymentDate,
              reference: payment.reference.trim(),
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
      bank: record.bank || DEFAULT_BANK,
      accountNo: record.accountNo || "",
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
            note: "Submit request details",
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
          {/* What is being decided, read off the request rather than asked
              for again. */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-primary">
              Request Summary
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Worked
                id="ent-no"
                label="Request No."
                value={open?.entitlementNo || open?.requestNo || ""}
              />
              <Worked
                id="ent-date"
                label="Request Date"
                value={draft.requestDate ? formatDate(draft.requestDate) : ""}
              />
              <Worked
                id="ent-measure"
                label={
                  mode === "leaveDays"
                    ? "Days Requested"
                    : mode === "hours"
                      ? "Hours Worked"
                      : "Requested Amount (OMR)"
                }
                value={
                  mode === "leaveDays"
                    ? days + " Days"
                    : mode === "hours"
                      ? (draft.hours || 0) + " Hours"
                      : amountValue(amount)
                }
              />
              <Worked
                id="ent-amount-settled"
                label="Requested Amount (OMR)"
                value={amountValue(amount)}
              />

              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <FieldLabel htmlFor="ent-details">Request Details</FieldLabel>
                <Textarea
                  id="ent-details"
                  readOnly
                  tabIndex={-1}
                  rows={2}
                  className="cursor-default bg-locked text-muted-foreground"
                  value={draft.reason}
                />
              </div>
            </div>
          </div>

          <DecisionChoice
            subject={label.toLowerCase()}
            value={decision}
            onChange={setDecision}
            disabled={!canDecide || settled || refused}
          />

          {/* A refused request says why, and stays as it is. */}
          {refused && (
            <div className="space-y-2">
              <FieldLabel htmlFor="ent-refused">Reason for Rejection</FieldLabel>
              <Textarea
                id="ent-refused"
                readOnly
                tabIndex={-1}
                rows={2}
                className="cursor-default border-destructive/40 bg-destructive/5 text-destructive"
                value={open?.rejectionReason || ""}
              />
            </div>
          )}

          {decision === "rejected" && !refused && (
            <div className="space-y-2">
              <FieldLabel htmlFor="ent-reason" required>
                Reason for Rejection
              </FieldLabel>
              <Textarea
                id="ent-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Say why this request is refused"
              />
            </div>
          )}

          {/* How the money actually reaches them. A refused request has none
              of this: there is nothing to pay. */}
          {decision && decision !== "rejected" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary">
                Payment Details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="ent-approved" required>
                    Approved Amount (OMR)
                  </FieldLabel>
                  <Input
                    id="ent-approved"
                    inputMode="decimal"
                    readOnly={!amending}
                    tabIndex={amending ? undefined : -1}
                    className={cn(
                      !amending && "cursor-default bg-locked text-muted-foreground"
                    )}
                    value={
                      amending ? payment.approved : amountValue(amount)
                    }
                    onChange={(e) =>
                      setPay("approved", e.target.value.replace(/[^\d.]/g, ""))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="ent-method" required>
                    Payment Method
                  </FieldLabel>
                  <Select
                    value={payment.method}
                    onValueChange={(value) => value && setPay("method", value)}
                  >
                    <SelectTrigger id="ent-method">
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
                  <FieldLabel htmlFor="ent-bank">Bank Account</FieldLabel>
                  <Select
                    value={payment.bank}
                    onValueChange={(value) => value && setPay("bank", value)}
                  >
                    <SelectTrigger id="ent-bank">
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

                <div className="space-y-2 sm:col-span-2">
                  <FieldLabel htmlFor="ent-reference">
                    Payment Reference
                  </FieldLabel>
                  <Input
                    id="ent-reference"
                    value={payment.reference}
                    onChange={(e) => setPay("reference", e.target.value)}
                    placeholder="TRX-0000-00000"
                  />
                </div>
              </div>
            </div>
          )}
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

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        {stage === "decision" ? (
          decision === "rejected" ? (
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
                Approve &amp; Disburse
              </Button>
            )
          )
        ) : (
          <Button type="button" onClick={submit} disabled={!canSubmit}>
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
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {open
                ? label + " " + (open.entitlementNo || open.requestNo)
                : label + " Request"}
            </DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>

      {mine.length === 0 ? (
        <EmptyState>
          No {label.toLowerCase()} has been requested yet.
        </EmptyState>
      ) : (
        <RecordTable minWidth={900}>
          <HeadRow>
            <Th width="10%">No.</Th>
            <Th width="14%">Request Date</Th>
            <Th width="28%">Request Details</Th>
            <Th width="12%">Quantity</Th>
            <Th width="16%" className="text-right">
              Amount (OMR)
            </Th>
            <Th width="20%">Status</Th>
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
                      className="rounded font-bold text-primary underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {record.requestNo || index + 1}
                    </button>
                  )}
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

                <Td className="text-center">
                  <span
                    className={cn(
                      "inline-block rounded-md px-3 py-1 text-xs font-semibold",
                      ENTITLEMENT_STATUS_CHIP[record.status]
                    )}
                  >
                    {record.status}
                  </span>
                </Td>
              </Row>
            ))}
          </tbody>
        </RecordTable>
      )}
    </>
  );
}
