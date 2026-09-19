import {
  useState } from "react";
import UploadIcon from "@/components/shared/UploadIcon";
import { Button } from "@/components/ui/button";
import AiSearch from "@/components/shared/AiSearch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import { smartSearch } from "@/lib/search/smartSearch";
import { amountValue } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nextRequestNo } from "../requestFlow";
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
import { FileText, FileImage, FileCheck, Plus } from "lucide-react";
import { formatDate } from "../loanData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYMENT_SOURCES, DEFAULT_BANK } from "../payrollData";
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
  bank: DEFAULT_BANK,
  accountNo: "",
  paymentDate: "",
  reference: "",
  notes: "",
};

/** The button says what it is about to do, not merely that it saves. */
const CONFIRM_LABEL = {
  full: "Confirm Full Approval",
  partial: "Confirm Partial Approval",
  rejected: "Confirm Rejection",
};

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
    </Label>
  );
}

/** A fact the decision reads off the request rather than asking for again. */
function Locked({ id, label, value }) {
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
  const setReviewField = (name, value) =>
    setReview((prev) => ({ ...prev, [name]: value }));

  // Only a partial approval changes what was asked for; a rejection has
  // nothing to pay, so there is nothing to prepare.
  const amending = decision === "partial";
  const granting = decision === "full" || decision === "partial";
  const canConfirm =
    Boolean(decision) &&
    canDecide &&
    (!granting ||
      ((!amending || Number(review.approved) > 0) &&
        review.method &&
        review.paymentDate));

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
        requestNo: nextRequestNo(records),
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
              amount:
                decision === "partial" ? Number(review.approved) : record.amount,
              method: granted ? review.method : "",
              bank: granted ? review.bank : "",
              accountNo: granted ? review.accountNo : "",
              account: granted ? review.bank : "",
              reference: granted ? review.reference.trim() : "",
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
      bank: record.bank || DEFAULT_BANK,
      accountNo: record.accountNo || "",
      paymentDate: record.disbursementDate || record.paymentDate || "",
      reference: record.reference || "",
      notes: record.paymentNotes || "",
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
              note: "Submit assistance details and supporting documents",
              done: Boolean(canSave),
            },
            {
              key: "decision",
              title: "Management Decision",
              note: "Review and approval decision",
              done: Boolean(decision),
            },
          ]}
        />

        {stage === "decision" ? (
          <>
            <DecisionChoice
              subject="assistance"
              value={decision}
              onChange={setDecision}
              disabled={!canDecide}
            />

            {/* What is being decided, read off the request rather than asked
                for again. Only the amount can be changed, and only where the
                approval is a partial one. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Locked
                id="decision-employee"
                label="Employee"
                value={open?.employee || employee?.name || ""}
              />
              <Locked
                id="decision-type"
                label="Assistance Type"
                value={open?.subcategory || ""}
              />
              <div className="space-y-2">
                <FieldLabel htmlFor="decision-approved" required>
                  Approved Amount (<Rial />)
                </FieldLabel>
                <Input
                  id="decision-approved"
                  inputMode="decimal"
                  readOnly={!amending}
                  tabIndex={amending ? undefined : -1}
                  className={cn(
                    !amending && "cursor-default bg-locked text-muted-foreground"
                  )}
                  value={
                    amending ? review.approved : amountValue(Number(review.approved))
                  }
                  onChange={(e) =>
                    setReviewField("approved", e.target.value.replace(/[^\d.]/g, ""))
                  }
                />
              </div>
            </div>

            {/* How the money will actually reach them. A refused request has
                none of this: there is nothing to pay. */}
            {granting && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary">
                  Disbursement Details
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                  <div className="space-y-2">
                    <FieldLabel htmlFor="decision-method" required>
                      Payment Method
                    </FieldLabel>
                    <Select
                      value={review.method}
                      onValueChange={(value) => value && setReviewField("method", value)}
                    >
                      <SelectTrigger id="decision-method">
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
                    <FieldLabel htmlFor="decision-bank">Bank</FieldLabel>
                    <Select
                      value={review.bank}
                      onValueChange={(value) => value && setReviewField("bank", value)}
                    >
                      <SelectTrigger id="decision-bank">
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
                    <FieldLabel htmlFor="decision-account">Account No.</FieldLabel>
                    <Input
                      id="decision-account"
                      value={review.accountNo}
                      onChange={(e) => setReviewField("accountNo", e.target.value)}
                      placeholder="Enter the account the money goes to"
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="decision-date" required>
                      Payment Date
                    </FieldLabel>
                    <Input
                      id="decision-date"
                      type="date"
                      value={review.paymentDate}
                      onChange={(e) => setReviewField("paymentDate", e.target.value)}
                    />
                  </div>

                  {/* What the bank called the payment, and the proof of it. */}
                  <div className="space-y-2 sm:col-span-1 lg:col-span-2">
                    <FieldLabel htmlFor="decision-reference">
                      Payment Reference
                    </FieldLabel>
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <Input
                        id="decision-reference"
                        className="min-w-0 flex-1"
                        value={review.reference}
                        onChange={(e) => setReviewField("reference", e.target.value)}
                        placeholder="AST-0000-00000"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                        title={
                          receipt
                            ? receipt.name + " attached"
                            : "Attach payment receipt"
                        }
                        className={cn(
                          "shrink-0",
                          receipt && "border-green-600 text-green-600"
                        )}
                      >
                        <label htmlFor="decision-receipt" className="cursor-pointer">
                          {receipt ? (
                            <FileCheck className="h-4 w-4" />
                          ) : (
                            <UploadIcon className="h-4 w-4" />
                          )}
                          <span className="sr-only">Attach payment receipt</span>
                        </label>
                      </Button>
                      <Input
                        id="decision-receipt"
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files[0] && setReceipt(e.target.files[0])
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-1 lg:col-span-2">
                    <FieldLabel htmlFor="decision-notes">Payment Notes</FieldLabel>
                    <Textarea
                      id="decision-notes"
                      rows={3}
                      maxLength={NOTES_LIMIT}
                      value={review.notes}
                      onChange={(e) => setReviewField("notes", e.target.value)}
                      placeholder="Enter payment notes"
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {review.notes.length} / {NOTES_LIMIT}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
        <>
        <h3 className="text-base font-semibold text-primary">
          Assistance Request
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {/* Where the money comes from is not a choice: assistance is booked
              to Employee Expenses under Assistance, always. It is shown so the
              request says what it will be charged to. */}
          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-expense-type">
              Expense Type
            </FieldLabel>
            <Input
              id="assistance-expense-type"
              value={draft.expenseType}
              readOnly
              tabIndex={-1}
              className="cursor-default bg-locked text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-category">Category</FieldLabel>
            <Input
              id="assistance-category"
              value={draft.category}
              readOnly
              tabIndex={-1}
              className="cursor-default bg-locked text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-subcategory" required>
              Subcategory
            </FieldLabel>
            <Select
              value={draft.subcategory}
              onValueChange={(value) => value && set("subcategory", value)}
            >
              <SelectTrigger id="assistance-subcategory">
                <SelectValue placeholder="Select Subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategoriesOf(draft.expenseType, draft.category).map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* The paper that backs the request travels with what it is for,
              rather than costing a field of its own. */}
          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-amount" required>
              Requested Amount (<Rial />)
            </FieldLabel>
            <div className="flex w-full min-w-0 items-center gap-2">
              <Input
                id="assistance-amount"
                inputMode="decimal"
                className="min-w-0 flex-1"
                value={draft.amount}
                onChange={(e) =>
                  set("amount", e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="0.000"
              />
              <Button
                variant="outline"
                size="icon"
                asChild
                title={
                  proof ? proof.name + " attached" : "Attach supporting document"
                }
                className={cn(
                  "shrink-0",
                  proof && "border-green-600 text-green-600"
                )}
              >
                <label htmlFor="assistance-proof" className="cursor-pointer">
                  {proof ? (
                    <FileCheck className="h-4 w-4" />
                  ) : (
                    <UploadIcon className="h-4 w-4" />
                  )}
                  <span className="sr-only">Attach supporting document</span>
                </label>
              </Button>
              <Input
                id="assistance-proof"
                type="file"
                className="hidden"
                onChange={(e) => e.target.files[0] && setProof(e.target.files[0])}
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-4">
            <FieldLabel htmlFor="assistance-notes" required>
              Request Details / Notes
            </FieldLabel>
            <Textarea
              id="assistance-notes"
              rows={4}
              maxLength={NOTES_LIMIT}
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Please explain the reason for your request..."
            />
            <p className="text-right text-xs text-muted-foreground">
              {draft.notes.length} / {NOTES_LIMIT}
            </p>
          </div>
        </div>
        </>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          {/* A plain button: this form sits inside the employee form. */}
          <Button type="button" variant="outline" onClick={closeForm}>
            Cancel
          </Button>
          {stage === "decision" ? (
            <Button
              type="button"
              onClick={confirmDecision}
              disabled={!canConfirm}
            >
              {CONFIRM_LABEL[decision] || "Confirm Decision"}
            </Button>
          ) : (
            <Button type="button" onClick={saveRecord} disabled={!canSave}>
              Save and Submit Request
            </Button>
          )}
        </div>
      </div>
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
      {/* Opened over the page, so the list it is filed into stays behind. */}
      <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {open
                ? "Assistance " + (open.requestNo || "")
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