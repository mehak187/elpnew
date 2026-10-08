import {
  useState } from "react";
import { Button } from "@/components/ui/button";
import RequestTable from "@/components/shared/RequestTable";
import { Input } from "@/components/ui/input";
import { Bordered, EmptyState } from "@/components/shared/panels";
import {
  FieldLabel,
  Settled,
  Said,
  Choice,
  Field,
  Attach,
  checkRequired,
} from "@/components/shared/formFields";
import { amountValue, money } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nextAssistanceNo } from "../assistanceData";
import { DecisionChoice } from "@/components/shared/RequestSteps";
import { AdvanceSteps, longDate } from "./AdvanceSalarySection";
import AssistanceOverview from "./AssistanceOverview";
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
import {
  FileText,
  FileImage,
  Plus,
  HandHeart,
  X,
  FilePenLine,
  CloudUpload,
  Clock,
  ChevronRight,
} from "lucide-react";
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
// The employee says why at more length than the decision answers.
const COMMENT_LIMIT = 500;

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
/** "ASR-008" asked in 2026, as the head of the request reads it: "AS 08/2026". */
const shortAssistanceNo = (requestNo, on) => {
  const count = String(requestNo).split("-").pop();
  return /^\d+$/.test(count)
    ? "AS " + String(Number(count)).padStart(2, "0") + "/" + String(on).slice(0, 4)
    : requestNo;
};

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
  // Which stage of the request is open, and what management decided.
  const [stage, setStage] = useState("request");
  const [decision, setDecision] = useState("");
  // The request that has been submitted and is now being decided, and how
  // management means to settle it.
  const [openId, setOpenId] = useState(null);
  const [review, setReview] = useState(emptyReview);
  const [receipt, setReceipt] = useState(null);
  // History, open over the form.
  const [showHistory, setShowHistory] = useState(false);
  // Every request, opened from the head of the list.
  const [showAll, setShowAll] = useState(false);

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
    if (!checkRequired() || !canSave) return;
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
    setStage("decision");
  };

  /**
   * The decision confirmed. What is approved is prepared for disbursement -
   * the money itself has not moved, so the request reads Approved rather than
   * Paid until a payment is actually recorded against it.
   */
  const confirmDecision = () => {
    if (!checkRequired() || !canConfirm) return;
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

  // Newest request first, read off the date it was made - and only this
  // person's. What the firm gave a colleague, and why they had to ask for it,
  // is nobody else's business.
  const rows = records
    .filter((record) => record.employee === employee?.name)
    .sort(
      (a, b) =>
        String(b.requestDate).localeCompare(String(a.requestDate)) ||
        b.id - a.id
    )
    .map((record, index) => ({ ...record, no: index + 1, status: statusOf(record) }));

  const columns = [
    {
      // A request waiting on a decision carries its temporary number and
      // opens back into the form; a decided one takes its place in the run.
      key: "no",
      header: "No.",
      width: "8%",
      render: (value, record) =>
        record.status === "Pending" || record.status === "Rejected" ? (
          <button
            type="button"
            onClick={() => track(record)}
            className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {record.requestNo || value}
          </button>
        ) : (
          <span className="font-medium text-primary">{value}</span>
        ),
    },
    {
      key: "requestDate",
      header: "Request Date",
      width: "12%",
      render: (value) => <span className="whitespace-nowrap text-primary">{formatDate(value)}</span>,
    },
    {
      // What was asked for, who for, and why, with the paper it was made with.
      key: "subcategory",
      header: "Assistance Details",
      width: "22%",
      render: (value, record) => (
        <>
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-primary">{value}</span>
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
                <span className="sr-only">Open {record.proof}</span>
              </button>
            )}
          </span>
          <span className="block text-xs text-muted-foreground">{record.purpose}</span>
        </>
      ),
    },
    {
      key: "amount",
      header: "Amount (OMR)",
      width: "12%",
      render: (value) => <span className="whitespace-nowrap font-bold text-green-700">{amountValue(value)}</span>,
    },
    {
      // Nothing until a payment has been settled on.
      key: "method",
      header: "Payment Details",
      width: "20%",
      render: (value, record) =>
        value ? (
          <>
            <span className="block font-semibold text-primary">{value}</span>
            <span className="block text-xs text-muted-foreground">
              {record.reference || record.account}
            </span>
            {(record.paymentDate || record.disbursementDate) && (
              <span className="block text-xs text-muted-foreground">
                {formatDate(record.paymentDate || record.disbursementDate)}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "notes",
      header: "Notes",
      width: "16%",
      render: (value) => <span className="text-muted-foreground">{value || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "10%",
      render: (value) => (
        <span className={cn("block w-fit rounded-md px-2.5 py-0.5 text-xs font-semibold", STATUS_CHIP[value])}>
          {value}
        </span>
      ),
    },
  ];

  // Adding takes over the section: the list describes assistance already
  // given, and none of it helps while a new request is being written.
  // The form opens over the page rather than pushing it down: the list it is
  // filed into stays where it was, behind it.
  const form = (
      <div className="space-y-6">
        {/* The request's head: what it is, then whose it is, when it was
            asked and its number - the close button beyond them. */}
        <div className="flex flex-wrap items-start gap-4 pe-16">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary"
          >
            <HandHeart className="size-7" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-2xl font-bold text-primary">Assistance Request</DialogTitle>
            <DialogDescription className="text-sm text-primary/75">
              {stage === "request"
                ? "Submit a new assistance request with the required details and supporting documents."
                : "Review the request and record your decision."}
            </DialogDescription>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-3 pt-2 text-sm text-primary">
            <span>{employee?.empNo || ""}</span>
            <span aria-hidden="true" className="h-5 w-px bg-container-border" />
            <span>{employee?.name || ""}</span>
            <span aria-hidden="true" className="h-5 w-px bg-container-border" />
            <span>{longDate(requestedOn)}</span>
            <span aria-hidden="true" className="h-5 w-px bg-container-border" />
            <span className="rounded-md bg-primary/10 px-3 py-1.5 text-base font-bold text-primary">
              {shortAssistanceNo(requestNo, requestedOn)}
            </span>
          </div>
          <DialogClose className="absolute end-5 top-5 rounded-md p-1 text-primary transition-colors hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-7" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* The three stages. Disbursement is asked for with the decision
            until its own stage is designed, so the third opens the second. */}
        <AdvanceSteps
          active={stage}
          onChange={(key) => setStage(key === "finance" ? "decision" : key)}
          steps={[
            {
              key: "request",
              title: "Assistance Request",
              note: "Enter assistance details and upload documents",
              done: Boolean(openId),
            },
            {
              key: "decision",
              title: "Management Comment",
              note: "Review and approve",
              done: Boolean(decision),
              disabled: !openId,
            },
            {
              key: "finance",
              title: "Disbursement Actions",
              note: "Financial department processing",
              done: Boolean(review.reference),
              disabled: !openId || !granting,
            },
          ]}
        />

        {stage === "decision" ? (
          <>
            {/* Who asked, and for what. Read off the request rather than
                asked for again. */}
            <Bordered title="Request Information">
              <div className="form-grid">
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
              notes={{
                full: "Approve the assistance as requested",
                rejected: "Reject the assistance request",
              }}
            />

            {/* Nothing is granted and nothing leaves the firm on a refusal,
                so both are asked about only once something is approved. */}
            {granting && (
              <Bordered title="Assistance Approval & Disbursement">
                <div className="form-grid">
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
                  placeholder={
                    refusing
                      ? "Enter the reason for rejection"
                      : "Add management comment (optional)"
                  }
                />
                <p className="text-end text-xs text-muted-foreground">
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
                <div className="form-grid lg:[&>*+*]:border-s">
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
          {/* What it is for, the paper that backs it, how much, and why. */}
          <section className="space-y-4 rounded-xl border p-4 sm:p-5">
            <h3 className="flex items-center gap-3 text-lg font-bold text-primary">
              <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-lg bg-blue-50">
                <FilePenLine className="size-6" strokeWidth={1.5} />
              </span>
              Request Details
            </h3>
            {/* One row: the type with its paper beside it, the amount, and why.
                Each sits in a cell of its own - the form's fields bring their
                twelve-column spans, which mean nothing outside that grid. */}
            <div className="grid items-start gap-4 md:grid-cols-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Choice
                    id="assistance-subcategory"
                    label="Assistance Type"
                    value={draft.subcategory}
                    onChange={(value) => value && set("subcategory", value)}
                    placeholder="Select assistance type"
                    options={subcategoriesOf(draft.expenseType, draft.category)}
                  />
                </div>
                {/* The supporting document, beside what it supports. */}
                <label
                  className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-blue-50/60 text-primary transition-colors hover:bg-blue-50 focus-within:ring-2 focus-within:ring-ring"
                  title={proof ? proof.name : "Upload supporting document"}
                >
                  <CloudUpload className="size-6" aria-hidden="true" />
                  <span className="sr-only">Upload supporting document</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) setProof(file);
                    }}
                  />
                </label>
              </div>

              <div>
                <Field id="assistance-amount" label="Requested Amount (OMR)" required>
                  <div className="relative">
                    <Input
                      id="assistance-amount"
                      inputMode="decimal"
                      className="pe-14"
                      value={draft.amount}
                      onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="0.000"
                    />
                    <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Rial />
                    </span>
                  </div>
                </Field>
              </div>

              <div>
                <Field id="assistance-notes" label="Employee Comment" required>
                  <Textarea
                    id="assistance-notes"
                    maxLength={COMMENT_LIMIT}
                    value={draft.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Enter the reason for this assistance request..."
                  />
                  <p className="-mt-1 text-end text-xs text-muted-foreground">
                    {draft.notes.length}/{COMMENT_LIMIT}
                  </p>
                </Field>
              </div>
            </div>
            {attachedName && (
              <p className="flex items-center gap-1.5 text-sm text-primary">
                {isImage(attachedName) ? (
                  <FileImage className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                )}
                {attachedName}
              </p>
            )}
          </section>
        </>
        )}

        {/* Plain buttons: this form sits inside the employee form, which a
            submit button here would send instead. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Everything asked for before, over this window. */}
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex w-full items-center gap-4 rounded-xl border bg-blue-50/40 px-4 py-3 text-start transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:min-w-md"
          >
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <Clock className="size-6" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-primary">History</span>
              <span className="block text-sm text-primary/75">
                View this request timeline and employee&apos;s previous requests
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden="true" />
          </button>

          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="min-w-36" onClick={closeForm}>
              Cancel
            </Button>
            {stage === "decision" ? (
              <Button
                type="button"
                onClick={confirmDecision}
              >
                Save
              </Button>
            ) : (
              <Button type="button" className="min-w-48" onClick={saveRecord}>
                Submit Request
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
        <DialogContent hideClose className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
          {form}
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assistance History · {employee?.name}</DialogTitle>
                <DialogDescription>Every assistance request this employee has made.</DialogDescription>
              </DialogHeader>
              <RequestTable
                rows={rows}
                columns={columns}
                searchPlaceholder="Search by request no., type or purpose..."
                itemLabel="assistance requests"
                exportFileName="assistance.csv"
                filterBy={[
                  { key: "status", label: "Status" },
                  { key: "subcategory", label: "Assistance Type" },
                ]}
              />
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      {/* Who may ask for how much, a reading of the past requests, and the
          way to ask - over the list itself. */}
      <AssistanceOverview
        rows={rows}
        employee={employee}
        onNew={addLabel && !adding ? onOpenAdd : null}
        // The suggested sum, written into a new request for the employee to
        // confirm or change - never submitted on its own.
        onApply={
          addLabel && !adding
            ? (suggested) => {
                setDraft({ ...emptyDraft, amount: String(suggested) });
                onOpenAdd?.();
              }
            : null
        }
        onOpen={adding ? null : track}
        onViewAll={() => setShowAll(true)}
      />

      {/* The asking is done from the head of the view above, not from here. */}
      <RequestTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search by request no., type or purpose..."
        itemLabel="assistance requests"
        exportFileName="assistance.csv"
        filterBy={[
          { key: "status", label: "Status" },
          { key: "subcategory", label: "Assistance Type" },
        ]}
      />

      {/* Every request, over the page. */}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assistance History · {employee?.name}</DialogTitle>
            <DialogDescription>Every assistance request this employee has made.</DialogDescription>
          </DialogHeader>
          <RequestTable
            rows={rows}
            columns={columns}
            searchPlaceholder="Search by request no., type or purpose..."
            itemLabel="assistance requests"
            exportFileName="assistance.csv"
            filterBy={[
              { key: "status", label: "Status" },
              { key: "subcategory", label: "Assistance Type" },
            ]}
          />
        </DialogContent>
      </Dialog>
      </CardContent>
    </Card>
  );
}