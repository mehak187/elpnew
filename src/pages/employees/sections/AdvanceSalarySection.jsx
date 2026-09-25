import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AiSearch from "@/components/shared/AiSearch";
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import { Card, CardContent } from "@/components/ui/card";
import { Bordered, EmptyState } from "@/components/shared/panels";
import {
  FieldLabel,
  Settled,
  Choice,
  Attach,
  checkRequired,
} from "@/components/shared/formFields";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
  RecordLink,
} from "@/components/shared/RecordTable";
import { Rial } from "@/components/shared/Rial";
import { cn } from "@/lib/utils";
import { smartSearch } from "@/lib/search/smartSearch";
import { FileText, History, Plus } from "lucide-react";
import { useAdvances } from "@/lib/advances/context";
import { amount, formatDate } from "../loanData";
import { PAYMENT_MONTHS, PAYMENT_YEARS } from "../payrollData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYING_ACCOUNTS } from "@/pages/firm/firmData";
import {
  ADVANCE_BOOKING,
  ADVANCE_STATUS_CHIP,
  ADVANCE_STATUS_TONE,
  advancesFor,
  deductedFrom,
  nextAdvanceNo,
  outstandingAdvance,
} from "../advanceSalaryData";

const REASON_LIMIT = 500;

const emptyDraft = () => ({
  amount: "",
  deductMonth: "",
  deductYear: String(new Date().getFullYear()),
  reason: "",
});

/**
 * Asking for part of next month's salary now.
 *
 * The salary itself is not asked about: the form reads it off the record and
 * works out what may be asked for and what is left afterwards, so the amount
 * being requested can be judged without anyone doing the arithmetic. What the
 * employee settles is how much, which month it comes out of, and why.
 */
export function AdvanceSalaryForm({
  employee,
  net,
  onClose,
  // A request opened back off the list, to be followed or decided. A new
  // request has none, and opens on the first stage instead.
  requestId = null,
  // Whoever is deciding, decides here - the same as every other request in
  // the system, which is where this stage is answered from.
  canDecide = true,
}) {
  const { advances, addAdvance, decideAdvance } = useAdvances();
  // The form is mounted afresh each time it opens, so what it opens on is
  // settled once here rather than kept in step with a prop.
  const openRequest = advances.find((a) => a.id === requestId) || null;

  const [draft, setDraft] = useState(() =>
    openRequest
      ? {
          amount: String(openRequest.amount),
          deductMonth: openRequest.deductMonth,
          deductYear: openRequest.deductYear,
          reason: openRequest.reason,
        }
      : emptyDraft()
  );
  // What was attached to the request, if anything was.
  const [attachment, setAttachment] = useState(null);
  const requestNo = openRequest?.requestNo || nextAdvanceNo(advances);
  const requestedOn =
    openRequest?.requestedOn || new Date().toISOString().slice(0, 10);

  // Which stage of the request is open. A request already on the list is
  // opened to be decided, not written again.
  const [stage, setStage] = useState(openRequest ? "decision" : "request");
  const [decision, setDecision] = useState(openRequest?.decision || "");
  const [comment, setComment] = useState(openRequest?.managementComment || "");
  // What is being approved, where that is not simply what was asked for.
  const [approved, setApproved] = useState(
    openRequest?.approvedAmount ? String(openRequest.approvedAmount) : ""
  );
  const [pay, setPay] = useState({
    ...ADVANCE_BOOKING,
    method: openRequest?.method || "",
    bankAccount: openRequest?.bankAccount || "",
    paymentDate: openRequest?.paymentDate || "",
    reference: openRequest?.reference || "",
  });
  const [receipt, setReceipt] = useState(null);

  // What the employee attached, whether it came with the form just filled in
  // or off the request being looked at.
  const attachedName = attachment?.name || openRequest?.attachment || "";

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setPaid = (name, value) => setPay((prev) => ({ ...prev, [name]: value }));

  // What is already owed on earlier advances, and so what is left to ask for:
  // an advance cannot be taken twice out of the same salary.
  const basic = Number(employee?.salary) || 0;
  const outstanding = outstandingAdvance(advances, employee?.name);
  const limit = Math.max(0, Number((net - outstanding).toFixed(3)));
  const requested = Number(draft.amount) || 0;

  // A full approval grants what was asked for; only a partial approval sets
  // a figure of its own, so only there is the amount typed.
  const rejected = decision === "rejected";
  // Handed back rather than answered: nothing is granted and nothing is
  // refused, so the request goes on waiting under its own number.
  const returning = decision === "completion";
  const amending = decision === "partial";
  const approvedAmount = amending ? Number(approved) || 0 : requested;
  const afterDeduction = Number(
    (net - (stage === "decision" ? approvedAmount : requested)).toFixed(3)
  );

  // The comment is not asked for: the three starred fields are the request.
  const canSubmit =
    requested > 0 && requested <= limit && draft.deductMonth && draft.deductYear;

  // Nothing leaves the firm on a refusal or a hand-back, so neither has to
  // say how; an approval does, before it can be saved.
  const canSave =
    canDecide &&
    Boolean(decision) &&
    (rejected || returning
      ? true
      : approvedAmount > 0 &&
        approvedAmount <= requested &&
        pay.method &&
        pay.bankAccount &&
        pay.paymentDate &&
        pay.reference.trim());

  const submit = () => {
    if (!checkRequired() || !canSubmit) return;
    addAdvance({
      requestNo,
      employee: employee?.name || "",
      requestedOn,
      amount: requested,
      deductMonth: draft.deductMonth,
      deductYear: draft.deductYear,
      reason: draft.reason.trim(),
      attachment: attachment?.name || "",
    });
    setDraft(emptyDraft());
    setAttachment(null);
    onClose();
  };

  const saveDecision = () => {
    if (!canSave || !openRequest) return;
    decideAdvance(openRequest.id, {
      decision,
      // A hand-back leaves the request where it was: still waiting, with
      // what is missing written on it.
      status: rejected ? "Rejected" : returning ? "Pending" : "Approved",
      approvedAmount: rejected || returning ? 0 : approvedAmount,
      managementComment: comment.trim(),
      decidedOn: new Date().toISOString().slice(0, 10),
      ...(rejected || returning
        ? {}
        : {
            ...ADVANCE_BOOKING,
            method: pay.method,
            bankAccount: pay.bankAccount,
            paymentDate: pay.paymentDate,
            reference: pay.reference.trim(),
            receipt: receipt?.name || "",
          }),
    });
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* No heading here: the window this opens in is already named after
          the request, and the step below says which half is open. */}
      {/* The two stages of the request. Either header opens its stage. */}
      <RequestSteps
        active={stage}
        onChange={setStage}
        steps={[
          {
            key: "request",
            title: "Submit Request",
            note: "Enter salary advance request details",
            done: Boolean(canSubmit),
          },
          {
            key: "decision",
            title: "Management Decision",
            note: "Review and decide request",
            done: Boolean(decision),
            // Nothing can be decided until there is a request to decide: a
            // new one is saved first, and opened back off the list.
            disabled: !openRequest,
          },
        ]}
      />

      {stage === "decision" ? (
        <>
          {/* Who asked, and under what number. Whatever was attached hangs
              under the number it belongs to rather than in a field of its own. */}
          <Bordered title="Request Information">
            <div className="form-grid">
              <div className="flex h-full flex-col justify-end gap-2">
                <Settled id="advance-no" label="Request No." value={requestNo} />
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
                id="advance-date"
                label="Request Date"
                value={formatDate(requestedOn)}
              />
              <Settled
                id="advance-employee"
                label="Employee Name"
                value={employee?.name || ""}
              />
              <Settled
                id="advance-emp-no"
                label="Employee No."
                value={employee?.empNo || ""}
              />
            </div>
          </Bordered>

          {/* What was asked for, read off the request rather than asked for
              again. */}
          <Bordered title="Salary Advance Request Details">
            <div className="form-grid">
              <Settled
                id="advance-requested"
                label="Requested Advance Amount"
                value={amount(requested)}
              />
              <Settled
                id="advance-month-said"
                label="Deduct From Salary Month"
                value={draft.deductMonth}
              />
              <Settled
                id="advance-year-said"
                label="Year"
                value={draft.deductYear}
              />
              <Settled
                id="advance-after-said"
                label="Estimated Salary After Deduction"
                value={amount(afterDeduction)}
              />
            </div>
          </Bordered>

          <DecisionChoice
            value={decision}
            onChange={setDecision}
            disabled={!canDecide}
          />

          {/* Nothing leaves the firm on a refusal, so the transfer is asked
              about only once something has been approved. */}
          {decision && !rejected && !returning && (
            <Bordered title="Expense & Disbursement Details">
              <div className="form-grid">
                <Settled
                  id="advance-expense-type"
                  label="Expense Type"
                  value={pay.expenseType}
                />
                <Settled
                  id="advance-category"
                  label="Category"
                  value={pay.category}
                />
                <Settled
                  id="advance-subcategory"
                  label="Subcategory"
                  value={pay.subcategory}
                />

                {/* The one figure a partial approval changes. A full approval
                    grants what was asked for, so there it is only shown. */}
                {amending ? (
                  <div className="flex h-full flex-col justify-end gap-2">
                    <FieldLabel htmlFor="advance-approved" required>
                      Approved Amount (<Rial />)
                    </FieldLabel>
                    <Input
                      id="advance-approved"
                      inputMode="decimal"
                      value={approved}
                      onChange={(e) =>
                        setApproved(e.target.value.replace(/[^\d.]/g, ""))
                      }
                      placeholder="0.000"
                      className={cn(
                        approvedAmount > requested && "border-destructive"
                      )}
                    />
                  </div>
                ) : (
                  <Settled
                    id="advance-approved"
                    label="Approved Amount"
                    value={amount(approvedAmount)}
                    payable
                  />
                )}

                <Choice
                  id="advance-method"
                  label="Payment Method"
                  value={pay.method}
                  onChange={(value) => value && setPaid("method", value)}
                  placeholder="Select method"
                  options={PAYMENT_METHODS}
                />

                {/* One choice, not two: the account carries the bank it is
                    held at, so they cannot be set to disagree. */}
                <Choice
                  id="advance-bank"
                  label="Bank Account"
                  value={pay.bankAccount}
                  onChange={(value) => value && setPaid("bankAccount", value)}
                  placeholder="Select bank account"
                  options={PAYING_ACCOUNTS}
                />

                <div className="flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="advance-pay-date" required>
                    Payment Date
                  </FieldLabel>
                  <Input
                    id="advance-pay-date"
                    type="date"
                    value={pay.paymentDate}
                    onChange={(e) => setPaid("paymentDate", e.target.value)}
                  />
                </div>

                {/* What the bank called the transfer, and the proof of it. */}
                <div className="flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="advance-reference" required>
                    Transfer No.
                  </FieldLabel>
                  <div className="flex w-full min-w-0 items-center gap-2">
                    <Input
                      id="advance-reference"
                      className="min-w-0 flex-1"
                      value={pay.reference}
                      onChange={(e) => setPaid("reference", e.target.value)}
                      placeholder="TRX-0000-00000"
                    />
                    <Attach
                      file={receipt}
                      onPick={setReceipt}
                      label="transfer receipt"
                    />
                  </div>
                </div>
              </div>
            </Bordered>
          )}

          {/* A refusal is only as good as its reason, so there the comment is
              required; on an approval it is a note. */}
          <Bordered
            title={
              <>
                Management Comment
              </>
            }
          >
            <div className="space-y-2">
              <Textarea
                id="advance-comment"
                rows={4}
                maxLength={REASON_LIMIT}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  rejected
                    ? "Enter the reason for rejection"
                    : "Enter a note on this decision"
                }
              />
              <p className="text-end text-xs text-muted-foreground">
                {comment.length} / {REASON_LIMIT}
              </p>
            </div>
          </Bordered>
        </>
      ) : (
        <>
          {/* Who is asking, and under what number. None of it is typed: it is
              the employee's own record and the register's next number. */}
          <Bordered title="Request Information">
            <div className="form-grid">
              {/* The number, and whatever backs the request up. The file name
                  lives in the tooltip, so the control stays icon-sized. */}
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="advance-request-no">Request No.</FieldLabel>
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    id="advance-request-no"
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
                id="advance-requested-on"
                label="Request Date"
                value={formatDate(requestedOn)}
              />
              <Settled
                id="advance-employee"
                label="Employee Name"
                value={employee?.name || ""}
              />
              <Settled
                id="advance-emp-no"
                label="Employee No."
                value={employee?.empNo || ""}
              />
            </div>
          </Bordered>

          {/* What may be asked for, and what the month looks like afterwards.
              Only three of these eight are typed; the rest follow. */}
          <Bordered title="Salary Advance Details">
            <div className="form-grid">
              <Settled
                id="advance-basic"
                label="Current Basic Salary"
                value={amount(basic)}
              />
              <Settled
                id="advance-net"
                label="Current Net Salary"
                value={amount(net)}
              />
              <Settled
                id="advance-outstanding"
                label="Outstanding Salary Advance"
                value={amount(outstanding)}
                held={outstanding > 0}
              />
              <Settled
                id="advance-limit"
                label="Eligible Advance Limit"
                value={amount(limit)}
              />

              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="advance-amount" required>
                  Requested Advance Amount (<Rial />)
                </FieldLabel>
                <Input
                  id="advance-amount"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.000"
                  className={cn(requested > limit && "border-destructive")}
                />
              </div>

              {/* An advance is not a loan: it comes back out of one month's
                  pay, and the employee says which. The months are stored
                  short and read long, the way the payroll form lists them. */}
              <Choice
                id="advance-month"
                label="Deduct From Salary Month"
                value={draft.deductMonth}
                onChange={(value) => value && set("deductMonth", value)}
                placeholder="Select month"
                options={PAYMENT_MONTHS.map((month) => month.label)}
              />

              <Choice
                id="advance-year"
                label="Year"
                value={draft.deductYear}
                onChange={(value) => value && set("deductYear", value)}
                placeholder="Select year"
                options={PAYMENT_YEARS}
              />

              <Settled
                id="advance-after"
                label="Estimated Salary After Deduction"
                value={amount(afterDeduction)}
                payable
              />
            </div>
          </Bordered>

          <Bordered title="Employee Comment">
            <div className="space-y-2">
              <Textarea
                id="advance-reason"
                rows={4}
                maxLength={REASON_LIMIT}
                value={draft.reason}
                onChange={(e) => set("reason", e.target.value)}
                placeholder="Enter the reason for requesting a salary advance"
              />
              <p className="text-end text-xs text-muted-foreground">
                {draft.reason.length} / {REASON_LIMIT}
              </p>
            </div>
          </Bordered>
        </>
      )}

      {/* Plain buttons: this form sits inside the employee form, which either
          would otherwise submit. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        {/* What was decided before is the list behind this form - offered
            where a decision is being read, not where one is being written. */}
        {stage === "decision" && (
          <Button type="button" variant="ghost" onClick={onClose}>
            <History className="me-2 h-4 w-4" />
            History
          </Button>
        )}

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {stage === "decision" ? (
            // The employee asks; only the firm's side answers, so on their
            // own page there is nothing here to press.
            canDecide && (
              <Button type="button" onClick={saveDecision}>
                Save
              </Button>
            )
          ) : (
            <Button type="button" onClick={submit}>
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The advances this employee has asked for, and what became of them.
 *
 * It sits between the salary and the payments made against it, which is where
 * an advance belongs: asked for out of the salary above, settled in one of the
 * months below.
 */
export function AdvanceRequests({
  employee,
  onAdd = null,
  addLabel = "",
  // Clicking a request's number opens it back up, to be followed or decided.
  onOpenRequest = null,
}) {
  const { advances } = useAdvances();
  const [query, setQuery] = useState("");
  const mine = advancesFor(advances, employee?.name);
  const shown = smartSearch(mine, query);

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* The search on the left, where every list in the system has it, and
            the way to add on the right. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AiSearch
            value={query}
            onChange={setQuery}
            placeholder="Ask about salary advances..."
          />
          {onAdd && (
            <Button variant="outline" type="button" className="ms-auto" onClick={onAdd}>
              <Plus className="me-2 h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>

        {shown.length === 0 ? (
          <EmptyState>
            {mine.length === 0
              ? "No salary advance has been requested yet."
              : "No salary advance matches that search."}
          </EmptyState>
        ) : (
          <RecordTable minWidth={860}>
            <HeadRow>
              <Th width="14%">Request No.</Th>
              <Th width="14%">Request Date</Th>
              {/* No unit in the heading: every figure below carries it. */}
              <Th width="16%" className="text-end">
                Requested Amount
              </Th>
              <Th width="16%">Deducted From</Th>
              <Th width="40%">Request Details</Th>
            </HeadRow>
            <tbody>
              {shown.map((advance) => (
                <Row key={advance.id}>
                  {/* Where the request stands is said under its own number
                      rather than in a column of its own. */}
                  <Td className="whitespace-nowrap font-medium text-primary">
                    {onOpenRequest ? (
                      <RecordLink onClick={() => onOpenRequest(advance)}>
                        {advance.requestNo}
                        </RecordLink>
                    ) : (
                      advance.requestNo
                    )}
                    <span
                      className={cn(
                        "mt-1 flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold",
                        ADVANCE_STATUS_CHIP[advance.status] ||
                          ADVANCE_STATUS_TONE[advance.status]
                      )}
                    >
                      {advance.status}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-primary">
                    {formatDate(advance.requestedOn)}
                  </Td>
                  <Td className="whitespace-nowrap text-end font-bold text-green-700">
                    {amount(advance.amount)}
                  </Td>
                  <Td className="whitespace-nowrap text-primary">
                    {deductedFrom(advance)}
                  </Td>
                  <Td className="text-start text-muted-foreground">
                    {advance.reason}
                  </Td>
                </Row>
              ))}
            </tbody>
          </RecordTable>
        )}
      </CardContent>
    </Card>
  );
}
