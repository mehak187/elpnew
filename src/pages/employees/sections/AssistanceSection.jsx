import {
  useState } from "react";
import { Button } from "@/components/ui/button";
import AiSearch from "@/components/shared/AiSearch";
import { Input } from "@/components/ui/input";
import { Bordered, EmptyState } from "@/components/shared/panels";
import {
  FieldLabel,
  Settled,
  Said,
  Choice,
  Attach,
} from "@/components/shared/formFields";
import { smartSearch } from "@/lib/search/smartSearch";
import { amountValue, money } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nextAssistanceNo } from "../assistanceData";
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import { Card, CardContent } from "@/components/ui/card";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Rial } from "@/components/shared/Rial";
import { FileText, FileImage, History, Plus } from "lucide-react";
import { formatDate } from "../loanData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYING_ACCOUNTS } from "@/pages/firm/firmData";
import {
  DEFAULT_ASSISTANCE_BOOKING,
  subcategoriesOf,
  assistanceRecords,
  statusOf,
  STATUS_CHIP,
} from "../assistanceData";

const NOTES_LIMIT = 300;
const PAGE_SIZE = 10;

const emptyDraft = {
  ...DEFAULT_ASSISTANCE_BOOKING,
  amount: "",
  method: "",
  account: "",
  paymentDate: "",
  notes: "",
};

/** What management fills in once it has decided what to grant. */
const emptyReview = {
  approved: "",
  method: "",
  // One choice for where it leaves from: the account carries its bank.
  bankAccount: "",
  paymentDate: "",
  reference: "",
  notes: "",
};

const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const isImage = (name) =>
  IMAGE_TYPES.some((ext) => String(name).toLowerCase().endsWith(ext));


/**
 * Money the firm gives away, and the form that adds to it.
 *
 * Cash has no account to choose, so choosing it settles the account field
 * rather than leaving a bank picker open over a payment that never touched one.
 */
export default function AssistanceSection({
  employee,
  adding,
  onCloseAdd,
  // Opening a request from the list puts the section back into adding, so
  // the window over the page is the one that shows it.
  onOpenAdd,
  // The words on the button that opens the form, over the list it adds to.
  addLabel = "Add Assistance",
  // Management decides a request; on My Profile the decision is only read.
  canDecide = true,
}) {
  const [records, setRecords] = useState(assistanceRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [proof, setProof] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  // Which stage of the request is open, and what management decided.
  const [stage, setStage] = useState("request");
  const [decision, setDecision] = useState("");
  // The request that has been submitted and is now being decided, and how
  // management means to settle it.
  const [openId, setOpenId] = useState(null);
  const [review, setReview] = useState(emptyReview);
  const [receipt, setReceipt] = useState(null);

  const open = records.find((record) => record.id === openId) || null;

  // The number this request carries, the day it was asked on, and whatever
  // was attached to it - each read off the open request, or settled fresh
  // for one being written now.
  const requestNo = open?.requestNo || nextAssistanceNo(records);
  const requestedOn =
    open?.requestDate || new Date().toISOString().slice(0, 10);
  const attachedName = proof?.name || open?.proof || "";
  const setReviewField = (name, value) =>
    setReview((prev) => ({ ...prev, [name]: value }));

  // What was asked for, what is being granted, and the day it is decided.
  const requestedAmount = Number(open?.amount ?? draft.amount) || 0;
  const decidedOn = open?.decisionDate || new Date().toISOString().slice(0, 10);

  // Only a partial approval changes what was asked for; a rejection has
  // nothing to pay, so there is nothing to prepare.
  const amending = decision === "partial";
  const granting = decision === "full" || decision === "partial";
  const refusing = decision === "rejected";
  const approvedAmount = amending
    ? Number(review.approved) || 0
    : requestedAmount;

  // A refusal is settled by its reason alone; a grant has to say how the
  // money leaves before it can be saved.
  const canConfirm =
    Boolean(decision) &&
    canDecide &&
    (refusing
      ? Boolean(review.notes.trim())
      : approvedAmount > 0 &&
        approvedAmount <= requestedAmount &&
        review.method &&
        review.bankAccount &&
        review.paymentDate &&
        review.reference.trim());

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  // What a request needs: what it is for, who it is for, how much, and why.
  // How it will be paid is the office's business once the request is granted.
  const canSave =
    draft.subcategory && Number(draft.amount) > 0 && draft.notes.trim();

  /**
   * The request submitted. It is on record straight away, waiting for a
   * decision, and the form moves on to the stage that gives one.
   */
  const saveRecord = () => {
    if (!canSave) return;
    const id = records.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    setRecords((prev) => [
      {
        id,
        // On the list straight away, under a temporary number, waiting on a
        // decision.
        requestNo,
        requestDate: new Date().toISOString().slice(0, 10),
        decision: "Pending",
        paymentDate: "",
        expenseType: draft.expenseType,
        category: draft.category,
        subcategory: draft.subcategory,
        // Whose record it was asked from.
        employee: employee?.name || "",
        purpose: draft.notes.trim(),
        amount: Number(draft.amount),
        method: "",
        account: "",
        proof: proof ? proof.name : "",
        proofUrl: proof ? URL.createObjectURL(proof) : "",
        notes: draft.notes,
      },
      ...prev,
    ]);
    setOpenId(id);
    // Management decides on what was asked for, until it grants something else.
    setReview({ ...emptyReview, approved: draft.amount });
    setPage(1);
    setStage("decision");
  };

  /**
   * The decision confirmed. What is approved is prepared for disbursement -
   * the money itself has not moved, so the request reads Approved rather than
   * Paid until a payment is actually recorded against it.
   */
  const confirmDecision = () => {
    if (!decision || !openId || !canDecide) return;
    const granted = decision !== "rejected";
    setRecords((prev) =>
      prev.map((record) =>
        record.id === openId
          ? {
              ...record,
              decision: granted ? "Approved" : "Rejected",
              rejectionReason: granted ? "" : review.notes.trim(),
              amount: approvedAmount,
              decisionDate: decidedOn,
              managementComment: review.notes.trim(),
              method: granted ? review.method : "",
              bankAccount: granted ? review.bankAccount : "",
              account: granted ? review.bankAccount : "",
              reference: granted ? review.reference.trim() : "",
              receipt: granted ? receipt?.name || "" : "",
              disbursementDate: granted ? review.paymentDate : "",
              paymentNotes: review.notes.trim(),
            }
          : record
      )
    );
    closeForm();
  };

  /** A request opened back off the list, to be followed or decided. */
  const track = (record) => {
    setOpenId(record.id);
    setStage("decision");
    const status = statusOf(record);
    setDecision(
      status === "Rejected" ? "rejected" : status === "Pending" ? "" : "full"
    );
    setDraft({
      ...emptyDraft,
      subcategory: record.subcategory,
      amount: String(record.amount),
      notes: record.purpose || record.notes || "",
    });
    setReview({
      approved: String(record.amount),
      method: record.method || "",
      bankAccount: record.bankAccount || "",
      paymentDate: record.paymentDate || "",
      reference: record.reference || "",
      notes: record.managementComment || "",
    });
    onOpenAdd?.();
  };

  /** Leaving the form, by any way out, starts the next request afresh. */
  const closeForm = () => {
    setDraft(emptyDraft);
    setProof(null);
    setStage("request");
    setDecision("");
    setOpenId(null);
    setReview(emptyReview);
    onCloseAdd();
  };

  const openProof = (record) => {
    if (record.proofUrl) {
      window.open(record.proofUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Newest request first, read off the date it was made.
  const ordered = smartSearch(
    [...records].sort(
      (a, b) =>
        String(b.requestDate).localeCompare(String(a.requestDate)) || b.id - a.id
    ),
    query
  );

  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const shown = ordered.slice(start, start + PAGE_SIZE);

  // Adding takes over the section: the list describes assistance already
  // given, and none of it helps while a new request is being written.
  // The form opens over the page rather than pushing it down: the list it is
  // filed into stays where it was, behind it.
  const form = (
      <div className="space-y-6">
        {/* The two stages of the request. Either header opens its stage. */}
        <RequestSteps
          active={stage}
          onChange={setStage}
          steps={[
            {
              key: "request",
              title: "Assistance Request",
              note: canSave
                ? "Assistance details and supporting document completed"
                : "Enter assistance details and supporting document",
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
            {/* Who asked, and for what. Read off the request rather than
                asked for again. */}
            <Bordered title="Request Information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                <div className="flex h-full flex-col justify-end gap-2">
                  <Settled
                    id="decision-no"
                    label="Request No."
                    value={requestNo}
                  />
                  {attachedName && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm text-primary no-underline hover:text-primary/70"
                      title={"Open " + attachedName}
                    >
                      {isImage(attachedName) ? (
                        <FileImage className="h-4 w-4 shrink-0 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                      )}
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
                  value={open?.employee || employee?.name || ""}
                />
                <Settled
                  id="decision-type"
                  label="Assistance Type"
                  value={open?.subcategory || draft.subcategory || ""}
                />
              </div>
            </Bordered>

            {/* What the employee said for themselves, as they wrote it. */}
            <Bordered title="Employee Comment">
              <Textarea
                id="decision-employee-comment"
                readOnly
                tabIndex={-1}
                rows={2}
                className="cursor-default bg-locked text-muted-foreground"
                value={open?.purpose || draft.notes}
              />
            </Bordered>

            <DecisionChoice
              value={decision}
              onChange={setDecision}
              disabled={!canDecide}
              notes={{
                full: "Approve the assistance as requested",
                rejected: "Reject the assistance request",
              }}
            />

            {/* Nothing is granted and nothing leaves the firm on a refusal,
                so both are asked about only once something is approved. */}
            {granting && (
              <Bordered title="Assistance Approval & Disbursement">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                  <Settled
                    id="decision-expense-type"
                    label="Expense Type"
                    value={open?.expenseType || draft.expenseType}
                  />
                  <Settled
                    id="decision-category"
                    label="Category"
                    value={open?.category || draft.category}
                  />
                  <Settled
                    id="decision-subcategory"
                    label="Subcategory"
                    value={open?.subcategory || draft.subcategory}
                  />
                  <Settled
                    id="decision-requested"
                    label="Requested Amount"
                    value={money(requestedAmount)}
                  />

                  {/* The one figure a partial approval changes. A full
                      approval grants what was asked for, so there it is
                      only shown. */}
                  {amending ? (
                    <div className="flex h-full flex-col justify-end gap-2">
                      <FieldLabel htmlFor="decision-approved" required>
                        Approved Amount (<Rial />)
                      </FieldLabel>
                      <Input
                        id="decision-approved"
                        inputMode="decimal"
                        value={review.approved}
                        onChange={(e) =>
                          setReviewField(
                            "approved",
                            e.target.value.replace(/[^\d.]/g, "")
                          )
                        }
                        placeholder="0.000"
                        className={cn(
                          Number(review.approved) > requestedAmount &&
                            "border-destructive"
                        )}
                      />
                    </div>
                  ) : (
                    <Settled
                      id="decision-approved"
                      label="Approved Amount"
                      value={money(approvedAmount)}
                      payable
                    />
                  )}

                  <Choice
                    id="decision-method"
                    label="Payment Method"
                    value={review.method}
                    onChange={(value) => value && setReviewField("method", value)}
                    placeholder="Select method"
                    options={PAYMENT_METHODS}
                    disabled={!canDecide}
                  />

                  {/* One choice, not two: the account carries the bank it is
                      held at, so they cannot be set to disagree. */}
                  <Choice
                    id="decision-bank"
                    label="Bank Account"
                    value={review.bankAccount}
                    onChange={(value) => value && setReviewField("bankAccount", value)}
                    placeholder="Select bank account"
                    options={PAYING_ACCOUNTS}
                    disabled={!canDecide}
                  />

                  <div className="flex h-full flex-col justify-end gap-2">
                    <FieldLabel htmlFor="decision-pay-date" required>
                      Payment Date
                    </FieldLabel>
                    <Input
                      id="decision-pay-date"
                      type="date"
                      value={review.paymentDate}
                      onChange={(e) => setReviewField("paymentDate", e.target.value)}
                      disabled={!canDecide}
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
                        value={review.reference}
                        onChange={(e) => setReviewField("reference", e.target.value)}
                        placeholder="TRX-0000-00000"
                        disabled={!canDecide}
                      />
                      <Attach
                        file={receipt}
                        onPick={setReceipt}
                        label="transfer receipt"
                      />
                    </div>
                  </div>

                  <Settled
                    id="decision-decided-on"
                    label="Decision Date"
                    value={formatDate(decidedOn)}
                  />
                </div>
              </Bordered>
            )}

            {/* A refusal is only as good as its reason, so there the comment
                is required; on an approval it is a note. */}
            <Bordered
              title={
                <>
                  Management Comment
                  {refusing && (
                    <span className="whitespace-nowrap text-destructive">&nbsp;*</span>
                  )}
                </>
              }
            >
              <div className="space-y-2">
                <Textarea
                  id="decision-notes"
                  rows={3}
                  maxLength={NOTES_LIMIT}
                  value={review.notes}
                  onChange={(e) => setReviewField("notes", e.target.value)}
                  disabled={!canDecide}
                  placeholder={
                    refusing
                      ? "Enter the reason for rejection"
                      : "Add management comment (optional)"
                  }
                />
                <p className="text-right text-xs text-muted-foreground">
                  {review.notes.length} / {NOTES_LIMIT}
                </p>
              </div>
            </Bordered>

            {/* Who is being paid and where it lands, in one line to be read
                against the transfer above before it is confirmed. */}
            {granting && (
              <div className="rounded-lg border border-green-600/40 bg-green-50/50 p-4">
                <p className="mb-3 flex items-center gap-2 font-semibold text-green-700">
                  <span
                    aria-hidden="true"
                    className="h-5 w-1 shrink-0 rounded-full bg-green-600"
                  />
                  Assistance Approval &amp; Transfer Summary
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
                  <Said label="Employee Name" value={employee?.name || ""} />
                  <Said label="Bank Name" value={employee?.bankName || ""} />
                  <Said
                    label="Employee Account Number"
                    value={employee?.accountNumber || ""}
                  />
                  <Said
                    label="Approved Amount"
                    value={money(approvedAmount)}
                    settled
                  />
                </div>
              </div>
            )}
          </>
        ) : (
        <>
          {/* Who is asking, under what number, for what and how much. The
              paper that backs the request hangs under the number, so it
              costs no field of its own. */}
          <Bordered title="Request Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="assistance-no">Request No.</FieldLabel>
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    id="assistance-no"
                    readOnly
                    tabIndex={-1}
                    value={requestNo}
                    className="min-w-0 flex-1 cursor-default bg-locked text-muted-foreground"
                  />
                  <Attach
                    file={proof}
                    onPick={setProof}
                    label="supporting document"
                  />
                </div>
                {attachedName && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm text-primary no-underline hover:text-primary/70"
                    title={"Open " + attachedName}
                  >
                    {isImage(attachedName) ? (
                      <FileImage className="h-4 w-4 shrink-0 text-blue-600" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                    )}
                    {attachedName}
                  </button>
                )}
              </div>

              <Settled
                id="assistance-date"
                label="Request Date"
                value={formatDate(requestedOn)}
              />

              <Choice
                id="assistance-subcategory"
                label="Assistance Type"
                value={draft.subcategory}
                onChange={(value) => value && set("subcategory", value)}
                placeholder="Select Assistance Type"
                options={subcategoriesOf(draft.expenseType, draft.category)}
              />

              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="assistance-amount" required>
                  Requested Amount
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="assistance-amount"
                    inputMode="decimal"
                    className="pr-12"
                    value={draft.amount}
                    onChange={(e) =>
                      set("amount", e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.000"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Rial />
                  </span>
                </div>
              </div>
            </div>
          </Bordered>

          <Bordered title="Request Details">
            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-notes" required>
                Employee Comment
              </FieldLabel>
              <Textarea
                id="assistance-notes"
                rows={4}
                maxLength={NOTES_LIMIT}
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Explain the reason for this assistance request"
              />
              <p className="text-right text-xs text-muted-foreground">
                {draft.notes.length} / {NOTES_LIMIT}
              </p>
            </div>
          </Bordered>
        </>
        )}

        {/* Plain buttons: this form sits inside the employee form, which a
            submit button here would send instead. */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          {/* What has been given before is the list behind this form. */}
          <Button type="button" variant="ghost" onClick={closeForm}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            {stage === "decision" ? (
              <Button
                type="button"
                onClick={confirmDecision}
                disabled={!canConfirm}
              >
                Save
              </Button>
            ) : (
              <Button type="button" onClick={saveRecord} disabled={!canSave}>
                Save
              </Button>
            )}
          </div>
        </div>
      </div>
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
      {/* Opened over the page, so the list it is filed into stays behind. */}
      <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {stage === "decision"
                ? "Assistance Management Decision"
                : "Add Assistance Request"}
            </DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>

      {/* The search on the left, where every list in the system has it, and
          the way to add on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AiSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Ask about assistance..."
        />
        {addLabel && !adding && (
          <Button type="button" className="ml-auto" onClick={onOpenAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>

      {ordered.length === 0 ? (
        <EmptyState>No assistance has been requested yet.</EmptyState>
      ) : (
        <>
          <RecordTable minWidth={960}>
              <HeadRow>
                  {/* Widths are set here rather than left to the browser, so
                      the two columns that carry sentences get the room and
                      the dates and figures stay on one line. */}
                  <Th width="6%">No.</Th>
                  <Th width="12%">Request Date</Th>
                  <Th width="24%">Assistance Details</Th>
                  {/* The unit is said once, in the heading, so the figures
                      under it can be read against each other. */}
                  <Th width="13%" className="text-right">
                    Amount (OMR)
                  </Th>
                  <Th width="25%">Payment Details</Th>
                  <Th width="20%">Notes</Th>
              </HeadRow>
              <tbody>
                {shown.map((record, index) => {
                  const status = statusOf(record);

                  return (
                    <Row key={record.id}>
                      {/* A request waiting on a decision carries its
                          temporary number and opens back into the form; a
                          decided one simply takes its place in the run. The
                          paper it was made with is beside what it is for,
                          not beside the number. */}
                      <Td className="whitespace-nowrap font-medium text-primary">
                        {status === "Pending" || status === "Rejected" ? (
                          <button
                            type="button"
                            onClick={() => track(record)}
                            className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {record.requestNo || start + index + 1}
                          </button>
                        ) : (
                          start + index + 1
                        )}

                        {/* Where it stands, under the number it belongs to. */}
                        <span
                          className={cn(
                            "mt-1 block w-fit rounded-md px-2.5 py-0.5 text-xs font-semibold",
                            STATUS_CHIP[status]
                          )}
                        >
                          {status}
                        </span>
                      </Td>

                      <Td className="whitespace-nowrap text-primary">
                        {formatDate(record.requestDate)}
                      </Td>

                      {/* What was asked for, who for, and why. Where it has
                          got to is said under its number. */}
                      <Td className="text-left">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-primary">
                            {record.subcategory}
                          </span>
                          {/* The paper the request was made with, beside what
                              it was made for. */}
                          {record.proof && (
                            <button
                              type="button"
                              onClick={() => openProof(record)}
                              title={record.proof}
                              className="rounded focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {isImage(record.proof) ? (
                                <FileImage className="h-4 w-4 shrink-0 text-green-600" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0 text-red-600" />
                              )}
                              <span className="sr-only">
                                Open {record.proof}
                              </span>
                            </button>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {record.purpose}
                        </span>
                      </Td>

                      <Td className="whitespace-nowrap text-right font-bold text-green-700">
                        {amountValue(record.amount)}
                      </Td>

                      {/* Nothing is shown here until a payment has been
                          settled on: a request nobody has decided has none. */}
                      <Td className="text-left">
                        {record.method ? (
                          <>
                            <span className="block font-semibold text-primary">
                              {record.method}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {record.reference || record.account}
                            </span>
                            {(record.paymentDate || record.disbursementDate) && (
                              <span className="block text-xs text-muted-foreground">
                                {formatDate(
                                  record.paymentDate || record.disbursementDate
                                )}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </Td>

                      <Td className="text-left text-muted-foreground">
                        {record.notes || "-"}
                      </Td>
                    </Row>
                  );
                })}
              </tbody>
          </RecordTable>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
            <span>
              Showing {start + 1} to{" "}
              {Math.min(start + PAGE_SIZE, ordered.length)} of {ordered.length}{" "}
              entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ‹<span className="sr-only">Previous page</span>
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={n === currentPage ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                ›<span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        </>
      )}
      </CardContent>
    </Card>
  );
}