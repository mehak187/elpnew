import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Rial } from "@/components/shared/Rial";
import { FileText, FileImage, Users, HandHeart, FileCheck } from "lucide-react";
import { amount, formatDate } from "../loanData";
import {
  DEFAULT_ASSISTANCE_BOOKING,
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
      {required && <span className="text-destructive"> *</span>}
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
export default function AssistanceSection({ adding, onCloseAdd }) {
  const [records, setRecords] = useState(assistanceRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [proof, setProof] = useState(null);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  // What a request needs: what it is for, how much, and why. How it will
  // be paid is the office's business once the request is granted.
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
          title="Add Assistance Request"
          note="Submit a request for financial assistance. Your request will be reviewed and processed by the office."
          onBack={onCloseAdd}
        />

        <Panel title="Assistance Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
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
                className="cursor-default bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-category">Category</FieldLabel>
              <Input
                id="assistance-category"
                value={draft.category}
                readOnly
                tabIndex={-1}
                className="cursor-default bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-subcategory" required>
                Subcategory
              </FieldLabel>
              <div className="flex gap-2">
                <Select
                  value={draft.subcategory}
                  onValueChange={(value) => set("subcategory", value)}
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
              {proof && (
                <p className="truncate text-xs text-green-700">{proof.name}</p>
              )}
            </div>

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

        <Panel title="Request Details">
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
          <Button variant="outline" onClick={onCloseAdd}>
            Cancel
          </Button>
          <Button type="button" onClick={saveRecord} disabled={!canSave}>
            Submit Assistance Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      {records.length === 0 ? (
        <div className="p-6">
          <EmptyState>No assistance has been requested yet.</EmptyState>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b bg-secondary/60 text-left text-primary">
                  {/* Widths are set here rather than left to the browser, so
                      the two columns that carry sentences get the room and
                      the dates and figures stay on one line. */}
                  <th className="p-3 font-semibold" style={{ width: "6%" }}>
                    No.
                  </th>
                  <th
                    className="whitespace-nowrap p-3 font-semibold"
                    style={{ width: "12%" }}
                  >
                    Request Date
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "24%" }}>
                    Assistance Details
                  </th>
                  <th
                    className="whitespace-nowrap p-3 text-right font-semibold"
                    style={{ width: "13%" }}
                  >
                    Amount (<Rial />)
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "25%" }}>
                    Payment Details
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "20%" }}>
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((record, index) => {
                  const status = statusOf(record);

                  return (
                    <tr
                      key={record.id}
                      className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                    >
                      {/* The row number opens the document the request was
                          made with, when one was attached. */}
                      <td className="p-3 font-medium text-primary">
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
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {formatDate(record.requestDate)}
                      </td>

                      {/* What was asked for, why, and where it has got to */}
                      <td className="p-3">
                        <span className="block font-semibold text-primary">
                          {record.subcategory}
                        </span>
                        <span className="block text-muted-foreground">
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
                      </td>

                      <td className="whitespace-nowrap p-3 text-right font-semibold">
                        {amount(record.amount)}
                      </td>

                      {/* Nothing is shown here until money has actually
                          moved: an unpaid request has no payment to describe. */}
                      <td className="p-3">
                        {record.paymentDate ? (
                          <>
                            <span className="block font-semibold text-primary">
                              {record.method}
                            </span>
                            <span className="block text-muted-foreground">
                              {record.account}
                            </span>
                            <span className="block text-muted-foreground">
                              {formatDate(record.paymentDate)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
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
    </div>
  );
}