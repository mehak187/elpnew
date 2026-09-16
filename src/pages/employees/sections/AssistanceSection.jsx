import {
  useState } from "react";
import UploadIcon from "@/components/shared/UploadIcon";
import { Button } from "@/components/ui/button";
import FormHeading from "@/components/shared/FormHeading";
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
import Panel from "@/components/shared/Panel";
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
import { FileText,
  FileImage,
  Users,
  HandHeart,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import { amount, formatDate } from "../loanData";
import {
  DEFAULT_ASSISTANCE_BOOKING,
  documentFor,
  subcategoriesOf,
  assistanceRecords,
  statusOf,
  STATUS_TONE,
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

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
    </Label>
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
export default function AssistanceSection({ employee, adding, onCloseAdd }) {
  const [records, setRecords] = useState(assistanceRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [proof, setProof] = useState(null);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  // What a request needs: what it is for, who it is for, how much, and why.
  // How it will be paid is the office's business once the request is granted.
  const canSave =
    draft.subcategory && Number(draft.amount) > 0 && draft.notes.trim();

  const saveRecord = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        requestDate: new Date().toISOString().slice(0, 10),
        decision: "Pending",
        paymentDate: "",
        expenseType: draft.expenseType,
        category: draft.category,
        subcategory: draft.subcategory,
        // The page says who this is: whoever's record it was opened on.
        beneficiary: employee?.name || "",
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
    setDraft(emptyDraft);
    setProof(null);
    setPage(1);
    onCloseAdd();
  };

  const openProof = (record) => {
    if (record.proofUrl) {
      window.open(record.proofUrl, "_blank", "noopener,noreferrer");
    }
  };

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const shown = records.slice(start, start + PAGE_SIZE);

  // Adding takes over the section: the list describes assistance already
  // given, and none of it helps while a new request is being written.
  if (adding) {
    return (
      <div className="space-y-6">
        <FormHeading
          icon={HandHeart}
          title="Add Assistance Request"
          note="Submit a request for financial assistance. Your request will be reviewed and processed by the office."
          onBack={onCloseAdd}
        />

        <Panel title="Assistance Information" icon={HandHeart}>
          {/* Four fields across the row, with Subcategory given the extra room
              its upload button takes. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Where the money comes from is not a choice: assistance is
                booked to Employee Expenses under Assistance, always. It is
                shown so the request says what it will be charged to. */}
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
              <div className="flex gap-2">
                <Select
                  value={draft.subcategory}
                  onValueChange={(value) => value && set("subcategory", value)}
                >
                  <SelectTrigger id="assistance-subcategory" className="flex-1">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriesOf(draft.expenseType, draft.category).map(
                      (sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                {/* Whatever backs the request - a bill, a letter, a report.
                    The file name lives in the tooltip, so the control stays
                    the size of a button either way. */}
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
                  onChange={(e) =>
                    e.target.files[0] && setProof(e.target.files[0])
                  }
                />
              </div>
              {proof ? (
                <p className="truncate text-xs text-green-700">{proof.name}</p>
              ) : (
                // What the office will ask to see, so it comes with the request.
                documentFor(draft.subcategory) && (
                  <p className="text-xs text-muted-foreground">
                    Attach: {documentFor(draft.subcategory)}
                  </p>
                )
              )}
            </div>

            {/* Who the help is for is not asked: this is the employee's own
                page, so the assistance is theirs. The record carries their
                name for the office that pays it. */}

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-amount" required>
                Requested Amount (<Rial />)
              </FieldLabel>
              <Input
                id="assistance-amount"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) =>
                  set("amount", e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="0.000"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Request Details" icon={ClipboardList}>
          <div className="space-y-2">
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
        </Panel>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          {/* A plain button: this form sits inside the employee form. */}
          <Button type="button" variant="outline" onClick={onCloseAdd}>
            Cancel
          </Button>
          <Button type="button" onClick={saveRecord} disabled={!canSave}>
            Submit Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
      {records.length === 0 ? (
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
                  <Th width="13%">
                    Amount (<Rial />)
                  </Th>
                  <Th width="25%">Payment Details</Th>
                  <Th width="20%">Notes</Th>
              </HeadRow>
              <tbody>
                {shown.map((record, index) => {
                  const status = statusOf(record);

                  return (
                    <Row key={record.id}>
                      {/* The row number opens the document the request was
                          made with, when one was attached. */}
                      <Td className="font-medium text-primary">
                        {record.proof ? (
                          <button
                            type="button"
                            onClick={() => openProof(record)}
                            title={record.proof}
                            className="inline-flex items-center gap-1.5 rounded underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {start + index + 1}
                            {isImage(record.proof) ? (
                              <FileImage className="h-4 w-4 shrink-0 text-green-600" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-red-600" />
                            )}
                          </button>
                        ) : (
                          start + index + 1
                        )}
                      </Td>

                      <Td className="whitespace-nowrap text-primary">
                        {formatDate(record.requestDate)}
                      </Td>

                      {/* What was asked for, why, and where it has got to */}
                      <Td className="text-left">
                        <span className="block font-semibold text-primary">
                          {record.subcategory}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {record.purpose}
                        </span>
                        <span
                          className={cn(
                            "block font-semibold",
                            STATUS_TONE[status]
                          )}
                        >
                          {status}
                        </span>
                      </Td>

                      <Td className="whitespace-nowrap font-bold text-green-700">
                        {amount(record.amount)}
                      </Td>

                      {/* Nothing is shown here until money has actually
                          moved: an unpaid request has no payment to describe. */}
                      <Td className="text-left">
                        {record.paymentDate ? (
                          <>
                            <span className="block font-semibold text-primary">
                              {record.method}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {record.account}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {formatDate(record.paymentDate)}
                            </span>
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
              {Math.min(start + PAGE_SIZE, records.length)} of {records.length}{" "}
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