import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AiSearch from "@/components/shared/AiSearch";
import { DecisionChoice } from "@/components/shared/RequestSteps";
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
import { amountValue } from "@/lib/money";
import { firmToday } from "@/lib/expiry";
import { smartSearch } from "@/lib/search/smartSearch";
import { Check, FileText, History, Info, Plus, Wallet } from "lucide-react";
import { useAdvances } from "@/lib/advances/context";
import { amount, formatDate } from "../loanData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYING_ACCOUNTS } from "@/pages/firm/firmData";
import {
  ADVANCE_BOOKING,
  ADVANCE_PURPOSES,
  ADVANCE_STATUS_CHIP,
  ADVANCE_STATUS_TONE,
  OTHER_PURPOSE,
  advancesFor,
  deductedFrom,
  nextAdvanceNo,
  outstandingAdvance,
} from "../advanceSalaryData";

const REASON_LIMIT = 500;

/**
 * The months an advance can come out of: this one and the two after it, as
 * the employee picks between them. Each is kept as its month and year.
 */
const deductOptions = (today = new Date()) =>
  [0, 1, 2].map((ahead) => {
    const at = new Date(today.getFullYear(), today.getMonth() + ahead, 1);
    return {
      month: at.toLocaleDateString("en-GB", { month: "long" }),
      year: String(at.getFullYear()),
    };
  });

const emptyDraft = () => {
  const [first] = deductOptions();
  return {
    amount: "",
    deductMonth: first.month,
    deductYear: first.year,
    purpose: "",
    reason: "",
  };
};

/** "03 Oct 2026", as the head of the request gives its date. */
const longDate = (iso) =>
  new Date(iso + "T00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** The red mark of a field that must be answered. */
function Star() {
  return (
    <span aria-hidden="true" className="ms-1 text-destructive">
      *
    </span>
  );
}

/**
 * The three stages of the request as numbered circles on one line: the open
 * one filled, a finished one ticked, and the line between them filling as
 * the request moves along. A stage that cannot be opened yet is greyed.
 */
function AdvanceSteps({ steps, active, onChange }) {
  const at = steps.findIndex((step) => step.key === active);
  return (
    <ol className="flex items-start rounded-xl border bg-blue-50/40 px-4 py-5 sm:px-8">
      {steps.map((step, index) => {
        const open = index === at;
        const done = step.done && !open;
        const last = index === steps.length - 1;
        return (
          <li key={step.key} className="relative flex flex-1 flex-col items-center">
            {!last && (
              <span
                aria-hidden="true"
                className="absolute start-[calc(50%+2rem)] end-[calc(-50%+2rem)] top-6 h-0.5 overflow-hidden rounded-full bg-slate-200"
              >
                <span
                  className={cn(
                    "block h-full bg-blue-600",
                    index < at ? "w-full" : open ? "w-1/2" : "w-0"
                  )}
                />
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(step.key)}
              disabled={step.disabled}
              aria-current={open ? "step" : undefined}
              className="flex flex-col items-center gap-2 rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full text-lg font-semibold",
                  open
                    ? "bg-blue-600 text-white"
                    : done
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-primary",
                  step.disabled && "opacity-60"
                )}
              >
                {done ? <Check className="size-6" aria-label="Done" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-center text-sm sm:text-base",
                  open ? "font-bold text-primary" : "text-primary/75",
                  step.disabled && "opacity-60"
                )}
              >
                {step.title}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** One figure the form works out rather than asks for, large in its box. */
function Figure({ label, value }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-primary">{label}</p>
      <p className="flex h-14 items-center gap-2 rounded-lg bg-blue-50/70 px-5">
        <span className="text-2xl font-bold text-primary">{amountValue(value)}</span>
        <Rial className="text-sm text-muted-foreground" />
      </p>
    </div>
  );
}

/**
 * Asking for part of a month's salary now.
 *
 * The salary itself is not asked about: the form reads it off the record and
 * works out what is left afterwards, so the amount being requested can be
 * judged without anyone doing the arithmetic. What the employee settles is
 * which month it comes out of, how much, and why.
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
          purpose: openRequest.purpose || "",
          reason: openRequest.reason,
        }
      : emptyDraft()
  );
  const requestNo = openRequest?.requestNo || nextAdvanceNo(advances);
  const requestedOn =
    openRequest?.requestedOn || firmToday();

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

  // Whatever an earlier request had attached to it.
  const attachedName = openRequest?.attachment || "";

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setPaid = (name, value) => setPay((prev) => ({ ...prev, [name]: value }));

  // What is already owed on earlier advances, and so what is left to ask for:
  // an advance cannot be taken twice out of the same salary.
  const basic = Number(employee?.salary) || 0;
  const outstanding = outstandingAdvance(advances, employee?.name);
  const limit = Math.max(0, Number((net - outstanding).toFixed(3)));
  const requested = Number(draft.amount) || 0;
  const overLimit = requested > limit;

  // A full approval grants what was asked for; only a partial approval sets
  // a figure of its own, so only there is the amount typed.
  const rejected = decision === "rejected";
  // Handed back rather than answered: nothing is granted and nothing is
  // refused, so the request goes on waiting under its own number.
  const returning = decision === "completion";
  const amending = decision === "partial";
  // Only something granted reaches the financial department.
  const granted = Boolean(decision) && !rejected && !returning;
  const approvedAmount = amending ? Number(approved) || 0 : requested;
  const afterDeduction = Number(
    (net - (stage === "request" ? requested : approvedAmount)).toFixed(3)
  );

  // "Other" is a purpose only once it is said what it is, in the remarks.
  const specifying = draft.purpose === OTHER_PURPOSE;
  const canSubmit =
    requested > 0 &&
    !overLimit &&
    draft.deductMonth &&
    draft.deductYear &&
    draft.purpose &&
    (!specifying || draft.reason.trim());

  // Nothing leaves the firm on a refusal or a hand-back, so neither has to
  // say how; an approval does, before it can be saved.
  const canSave =
    canDecide &&
    Boolean(decision) &&
    (!granted ||
      (approvedAmount > 0 &&
        approvedAmount <= requested &&
        pay.method &&
        pay.bankAccount &&
        pay.paymentDate &&
        pay.reference.trim()));

  const submit = () => {
    if (!checkRequired() || !canSubmit) return;
    addAdvance({
      requestNo,
      employee: employee?.name || "",
      requestedOn,
      amount: requested,
      deductMonth: draft.deductMonth,
      deductYear: draft.deductYear,
      purpose: draft.purpose,
      reason: draft.reason.trim(),
    });
    setDraft(emptyDraft());
    onClose();
  };

  const saveDecision = () => {
    if (!canSave || !openRequest) return;
    decideAdvance(openRequest.id, {
      decision,
      // A hand-back leaves the request where it was: still waiting, with
      // what is missing written on it.
      status: rejected ? "Rejected" : returning ? "Pending" : "Approved",
      approvedAmount: granted ? approvedAmount : 0,
      managementComment: comment.trim(),
      decidedOn: new Date().toISOString().slice(0, 10),
      ...(granted
        ? {
            ...ADVANCE_BOOKING,
            method: pay.method,
            bankAccount: pay.bankAccount,
            paymentDate: pay.paymentDate,
            reference: pay.reference.trim(),
            receipt: receipt?.name || "",
          }
        : {}),
    });
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* The request's head: what it is and its number, then whose it is and
          when it was asked - the close button sits beyond them. */}
      <div className="flex flex-wrap items-start gap-4 pe-8">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary"
        >
          <Wallet className="size-7" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle className="text-2xl font-bold text-primary">
              Salary Advance Request
            </DialogTitle>
            <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {requestNo}
            </span>
            {/* What may be asked for, kept a click away: the figures behind
                the limit the amount is checked against. */}
            <PopoverPrimitive.Root>
              <PopoverPrimitive.Trigger asChild>
                <button
                  type="button"
                  className="rounded-full text-primary/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Info className="size-6" aria-hidden="true" />
                  <span className="sr-only">Advance limit details</span>
                </button>
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  align="start"
                  sideOffset={8}
                  className="z-50 w-72 space-y-2 rounded-lg border bg-popover p-4 text-sm shadow-md"
                >
                  {[
                    ["Current Basic Salary", basic],
                    ["Current Net Salary", net],
                    ["Outstanding Salary Advance", outstanding],
                    ["Eligible Advance Limit", limit],
                  ].map(([label, value]) => (
                    <p key={label} className="flex justify-between gap-4">
                      <span className="text-primary/75">{label}</span>
                      <span className="font-semibold text-primary">
                        {amountValue(value)} <Rial />
                      </span>
                    </p>
                  ))}
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
          </div>
          <DialogDescription className="text-sm text-primary/75">
            Request a salary advance for the selected month.
          </DialogDescription>
        </div>
        <p className="ms-auto flex flex-wrap items-center gap-3 pt-2 text-sm text-primary">
          <span>
            {employee?.empNo || ""} <span className="px-1">|</span> {employee?.name || ""}
          </span>
          <span aria-hidden="true" className="h-5 w-px bg-container-border" />
          <span>{longDate(requestedOn)}</span>
        </p>
      </div>

      <AdvanceSteps
        active={stage}
        onChange={setStage}
        steps={[
          { key: "request", title: "Submit Request", done: Boolean(openRequest) },
          {
            key: "decision",
            title: "Management Comment",
            done: Boolean(openRequest?.decision),
            // Nothing can be decided until there is a request to decide: a
            // new one is saved first, and opened back off the list.
            disabled: !openRequest,
          },
          {
            key: "finance",
            title: "Financial Department Actions",
            done: Boolean(openRequest?.reference),
            // Only an advance that was granted is paid out.
            disabled: !openRequest || !granted,
          },
        ]}
      />

      {stage === "request" && (
        <div className="space-y-6 rounded-xl border p-4 sm:p-6">
          {/* The salary it comes out of, which month, how much, and what is
              left - each beside the next, divided by a rule. */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-container-border xl:[&>*:not(:first-child)]:ps-6">
            <Figure
              label={draft.deductMonth + " " + draft.deductYear + " Salary"}
              value={net}
            />

            {/* An advance is not a loan: it comes back out of one month's
                pay, and the employee says which. */}
            <div className="space-y-2">
              <p id="advance-month-label" className="text-sm font-semibold text-primary">
                Deduct From Salary Of
                <Star />
              </p>
              <div
                role="radiogroup"
                aria-labelledby="advance-month-label"
                className="grid h-14 grid-cols-3 overflow-hidden rounded-lg border"
              >
                {deductOptions().map((option) => {
                  const chosen =
                    draft.deductMonth === option.month && draft.deductYear === option.year;
                  return (
                    <button
                      key={option.month + option.year}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          deductMonth: option.month,
                          deductYear: option.year,
                        }))
                      }
                      className={cn(
                        "border-s px-1 text-xs transition-colors first:border-s-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        chosen ? "bg-blue-600 text-white" : "text-primary hover:bg-menu-hover"
                      )}
                    >
                      {option.month} {option.year}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-field space-y-2">
              <Label htmlFor="advance-amount" className="font-semibold">
                Advance Amount (<Rial />)
                <Star />
              </Label>
              <div className="relative">
                <Input
                  id="advance-amount"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.000"
                  required
                  aria-invalid={overLimit || undefined}
                  className={cn("h-14 pe-16 text-lg", overLimit && "border-destructive")}
                />
                <Rial className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
              </div>
              {overLimit && (
                <p className="text-xs text-destructive">
                  More than the eligible limit of {amount(limit)}
                </p>
              )}
            </div>

            <Figure label="Remaining Salary After Deduction" value={afterDeduction} />
          </div>

          <div className="grid gap-6 border-t pt-6 md:grid-cols-[1fr_2fr] md:divide-x md:divide-container-border md:[&>*:last-child]:ps-6">
            <div className="form-field space-y-2" data-required="true">
              <Label htmlFor="advance-purpose" className="font-semibold">
                Purpose
                <Star />
              </Label>
              <Select value={draft.purpose} onValueChange={(value) => value && set("purpose", value)}>
                <SelectTrigger id="advance-purpose">
                  <SelectValue placeholder="Select a purpose" />
                </SelectTrigger>
                <SelectContent>
                  {ADVANCE_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {purpose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional, except where the purpose is "Other": then this is
                where it is said. */}
            <div className="form-field space-y-2">
              <Label htmlFor="advance-reason" className="font-semibold">
                {specifying ? (
                  <>
                    Additional Remarks
                    <Star />
                  </>
                ) : (
                  "Additional Remarks (Optional)"
                )}
              </Label>
              <Textarea
                id="advance-reason"
                rows={3}
                maxLength={REASON_LIMIT}
                value={draft.reason}
                onChange={(e) => set("reason", e.target.value)}
                required={specifying}
                placeholder={specifying ? "Please specify the purpose..." : "Enter your remarks..."}
              />
              <p className="text-end text-xs text-muted-foreground">
                {draft.reason.length}/{REASON_LIMIT}
              </p>
            </div>
          </div>
        </div>
      )}

      {stage === "decision" && (
        <>
          {/* What was asked for, read off the request rather than asked for
              again. Whatever was attached hangs under it. */}
          <Bordered title="Salary Advance Request Details">
            <div className="form-grid">
              <Settled
                id="advance-requested"
                label="Requested Advance Amount"
                value={amount(requested)}
              />
              <Settled
                id="advance-month-said"
                label="Deduct From Salary Of"
                value={deductedFrom(draft)}
              />
              <Settled
                id="advance-purpose-said"
                label="Purpose"
                value={draft.purpose || "-"}
              />
              <Settled
                id="advance-after-said"
                label="Estimated Salary After Deduction"
                value={amount(afterDeduction)}
              />
            </div>
            {(draft.reason || attachedName) && (
              <div className="mt-4 space-y-2 text-sm">
                {draft.reason && (
                  <p className="text-primary">
                    <span className="font-semibold">Remarks: </span>
                    {draft.reason}
                  </p>
                )}
                {attachedName && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-primary no-underline hover:text-primary/70"
                    title={"Open " + attachedName}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                    {attachedName}
                  </button>
                )}
              </div>
            )}
          </Bordered>

          <DecisionChoice
            value={decision}
            onChange={setDecision}
            disabled={!canDecide}
          />

          {/* A refusal is only as good as its reason; on an approval the
              comment is a note. */}
          <Bordered title="Management Comment">
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
      )}

      {/* What the financial department does with an advance that was
          granted: how much goes out, how, and the proof it did. */}
      {stage === "finance" && (
        <Bordered title="Expense & Disbursement Details">
          <div className="form-grid">
            <Settled id="advance-expense-type" label="Expense Type" value={pay.expenseType} />
            <Settled id="advance-category" label="Category" value={pay.category} />
            <Settled id="advance-subcategory" label="Subcategory" value={pay.subcategory} />

            {/* The one figure a partial approval changes. A full approval
                grants what was asked for, so there it is only shown. */}
            {amending ? (
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="advance-approved">
                  Approved Amount (<Rial />)
                </FieldLabel>
                <Input
                  id="advance-approved"
                  inputMode="decimal"
                  value={approved}
                  onChange={(e) => setApproved(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.000"
                  className={cn(approvedAmount > requested && "border-destructive")}
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

            {/* One choice, not two: the account carries the bank it is held
                at, so they cannot be set to disagree. */}
            <Choice
              id="advance-bank"
              label="Bank Account"
              value={pay.bankAccount}
              onChange={(value) => value && setPaid("bankAccount", value)}
              placeholder="Select bank account"
              options={PAYING_ACCOUNTS}
            />

            <div className="flex h-full flex-col justify-end gap-2">
              <FieldLabel htmlFor="advance-pay-date">Payment Date</FieldLabel>
              <Input
                id="advance-pay-date"
                type="date"
                value={pay.paymentDate}
                onChange={(e) => setPaid("paymentDate", e.target.value)}
              />
            </div>

            {/* What the bank called the transfer, and the proof of it. */}
            <div className="flex h-full flex-col justify-end gap-2">
              <FieldLabel htmlFor="advance-reference">Transfer No.</FieldLabel>
              <div className="flex w-full min-w-0 items-center gap-2">
                <Input
                  id="advance-reference"
                  className="min-w-0 flex-1"
                  value={pay.reference}
                  onChange={(e) => setPaid("reference", e.target.value)}
                  placeholder="TRX-0000-00000"
                />
                <Attach file={receipt} onPick={setReceipt} label="transfer receipt" />
              </div>
            </div>
          </div>
        </Bordered>
      )}

      {/* Plain buttons: this form sits inside the employee form, which either
          would otherwise submit. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50/50 px-4 py-4">
        {/* What was decided before is the list behind this form - offered
            where a decision is being read, not where one is being written. */}
        {stage !== "request" && (
          <Button type="button" variant="ghost" onClick={onClose}>
            <History className="me-2 h-4 w-4" />
            History
          </Button>
        )}

        <div className="ms-auto flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" className="min-w-36" onClick={onClose}>
            Cancel
          </Button>
          {stage === "request" ? (
            // A request already sent is read here, not sent again.
            !openRequest && (
              <Button type="button" className="min-w-48" onClick={submit}>
                Submit Request
              </Button>
            )
          ) : (
            // The employee asks; only the firm's side answers, so on their
            // own page there is nothing here to press. A grant goes on to
            // the financial department before it is saved.
            canDecide &&
            (stage === "decision" && granted ? (
              <Button type="button" onClick={() => setStage("finance")}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={saveDecision}>
                Save
              </Button>
            ))
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
                    {advance.purpose && (
                      <span className="block font-medium text-primary">{advance.purpose}</span>
                    )}
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
