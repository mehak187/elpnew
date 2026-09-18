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
import { PAYMENT_YEARS } from "../payrollData";
import {
  ENTITLEMENT_EXPENSE_TYPE,
  ENTITLEMENT_CATEGORY,
  ENTITLEMENT_SUBCATEGORY,
  ENTITLEMENT_PENDING,
  ENTITLEMENT_APPROVED,
  ENTITLEMENT_REJECTED,
  ENTITLEMENT_STATUS_CHIP,
  encashmentAmount,
  entitlementsFor,
  nextEntitlementNo,
} from "../entitlementData";

const NOTES_LIMIT = 300;
const KIND = "leaveEncashment";

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDraft = () => ({
  requestDate: todayIso(),
  year: String(new Date().getFullYear()),
  leaveType: "Annual Leave",
  days: "",
  reason: "",
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
 * Leave turned into money.
 *
 * The balance and what the days are worth are both read off records the firm
 * already holds - the leave taken, and the salary in force - so the request
 * cannot be made against a balance or a rate that disagrees with them.
 */
export default function LeaveEncashmentTab({
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
  const [stage, setStage] = useState("request");
  const [decision, setDecision] = useState("");
  const [openId, setOpenId] = useState(null);
  const [reason, setReason] = useState("");

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const open = records.find((row) => row.id === openId) || null;
  const settled = open?.status === ENTITLEMENT_APPROVED;
  const refused = open?.status === ENTITLEMENT_REJECTED;

  const mine = smartSearch(entitlementsFor(records, employee?.name, KIND), query);

  // What is left of the leave being encashed, and what the days it takes are
  // worth - both counted, never stored.
  const balance = remainingBalance(
    leaves,
    employee?.name,
    draft.leaveType,
    draft.year
  );
  const available = balance && !balance.expired ? balance.remaining : 0;
  const days = Number(draft.days || 0);
  const after = Math.max(available - days, 0);
  const exceeded = days > available;
  const amount = encashmentAmount(employee?.salary, days);

  const canSubmit =
    draft.requestDate && draft.year && draft.leaveType && days > 0 && !exceeded &&
    draft.reason.trim();

  const close = () => {
    setDraft(emptyDraft());
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
      leaveType: draft.leaveType,
      days,
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
          kind: KIND,
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
    setStage("decision");
  };

  /** Approved: the request takes the list's own number. */
  const approve = () => {
    if (!openId || !decision || decision === "rejected") return;
    onRecords((prev) =>
      prev.map((row) =>
        row.id === openId
          ? {
              ...row,
              entitlementNo: row.entitlementNo || nextEntitlementNo(prev),
              status: ENTITLEMENT_APPROVED,
              rejectionReason: "",
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
      requestDate: record.requestDate,
      year: record.year,
      leaveType: record.leaveType,
      days: String(record.days),
      reason: record.reason || "",
    });
    onOpenAdd();
  };

  const form = (
    <div className="space-y-6">
      {/* The two stages of the request. Either header opens its stage. */}
      <RequestSteps
        active={stage}
        onChange={setStage}
        steps={[
          {
            key: "request",
            title: "Leave Encashment Request",
            note: "Submit encashment details",
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
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-primary">
              Request Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Worked
                id="enc-no"
                label="Request No."
                value={open?.entitlementNo || open?.requestNo || ""}
              />
              <Worked
                id="enc-date"
                label="Request Date"
                value={draft.requestDate ? formatDate(draft.requestDate) : ""}
              />
              <Worked
                id="enc-days-settled"
                label="Days Requested"
                value={days ? days + " Days" : ""}
              />
              <Worked
                id="enc-amount-settled"
                label="Encashment Amount (OMR)"
                value={amountValue(amount)}
              />

              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <FieldLabel htmlFor="enc-details">Request Details</FieldLabel>
                <Textarea
                  id="enc-details"
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
            subject="encashment"
            value={decision}
            onChange={setDecision}
            disabled={!canDecide || settled || refused}
          />

          {/* A refused request says why, and stays as it is. */}
          {refused && (
            <div className="space-y-2">
              <FieldLabel htmlFor="enc-refused">Reason for Rejection</FieldLabel>
              <Textarea
                id="enc-refused"
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
              <FieldLabel htmlFor="enc-reason" required>
                Reason for Rejection
              </FieldLabel>
              <Textarea
                id="enc-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Say why this request is refused"
              />
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
                id="enc-type"
                label="Expense Type"
                value={ENTITLEMENT_EXPENSE_TYPE}
              />
              <Booked
                id="enc-category"
                label="Category"
                value={ENTITLEMENT_CATEGORY}
              />
              <Booked
                id="enc-subcategory"
                label="Subcategory"
                value={ENTITLEMENT_SUBCATEGORY[KIND]}
              />

              <div className="space-y-2">
                <FieldLabel htmlFor="enc-request-date">Request Date</FieldLabel>
                <Input
                  id="enc-request-date"
                  type="date"
                  value={draft.requestDate}
                  onChange={(e) => set("requestDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="enc-year" required>
                Year
              </FieldLabel>
              <Select
                value={draft.year}
                onValueChange={(value) => value && set("year", value)}
              >
                <SelectTrigger id="enc-year">
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
              <FieldLabel htmlFor="enc-leave-type" required>
                Leave Type
              </FieldLabel>
              <Select
                value={draft.leaveType}
                onValueChange={(value) => value && set("leaveType", value)}
              >
                <SelectTrigger id="enc-leave-type">
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

            {/* Read off the leave already taken, so the request cannot be made
                against a balance the record does not support. */}
            <Worked
              id="enc-available"
              label="Available Leave Balance"
              value={balance ? available + " Days" : "-"}
            />

            <div className="space-y-2">
              <FieldLabel htmlFor="enc-days" required>
                Days Requested for Encashment
              </FieldLabel>
              <Input
                id="enc-days"
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
              id="enc-after"
              label="Balance After Request"
              value={balance ? after + " Days" : "-"}
            />

            <Worked
              id="enc-amount"
              label="Estimated Encashment Amount"
              value={amountValue(amount) + " OMR"}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="enc-reason-notes" required>
              Reason / Notes
            </FieldLabel>
            <Textarea
              id="enc-reason-notes"
              rows={3}
              maxLength={NOTES_LIMIT}
              value={draft.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Enter the reason for requesting leave encashment"
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
              <Button
                type="button"
                onClick={approve}
                disabled={!decision || !canDecide}
              >
                Confirm Decision
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
                ? "Leave Encashment " + (open.entitlementNo || open.requestNo)
                : "Leave Encashment Request"}
            </DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>

      {mine.length === 0 ? (
        <EmptyState>No leave encashment has been requested yet.</EmptyState>
      ) : (
        <RecordTable minWidth={900}>
          <HeadRow>
            <Th width="10%">No.</Th>
            <Th width="14%">Request Date</Th>
            <Th width="26%">Encashment Details</Th>
            <Th width="12%">Days</Th>
            <Th width="16%" className="text-right">
              Amount (OMR)
            </Th>
            <Th width="22%">Status</Th>
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
                    {record.leaveType}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {record.reason}
                  </span>
                </Td>

                <Td className="whitespace-nowrap">{record.days} Days</Td>

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
