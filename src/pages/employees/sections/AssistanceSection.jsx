import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Rial } from "@/components/shared/Rial";
import { cn } from "@/lib/utils";
import { Save, FileText, FileImage } from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { useFirm } from "@/lib/firm/context";
import { maskAccountNumber } from "@/pages/firm/firmData";
import UploadBox from "./UploadBox";
import { amount, formatDate } from "../loanData";
import {
  ASSISTANCE_CLASSIFICATION,
  categoriesOf,
  subcategoriesOf,
  descriptionsOf,
  assistanceRecords,
  CASH_ACCOUNT,
} from "../assistanceData";

const NOTES_LIMIT = 300;
const PAGE_SIZE = 5;

const emptyDraft = {
  expenseType: "",
  category: "",
  subcategory: "",
  description: "",
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

/** A numbered heading, ruled off from the fields below it. */
function Step({ number, title }) {
  return (
    <p className="border-b pb-2 text-sm font-semibold text-primary">
      {number}. {title}
    </p>
  );
}

const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const isImage = (name) =>
  IMAGE_TYPES.some((ext) => String(name).toLowerCase().endsWith(ext));

/** "Bank Muscat - Shatti Al Qurum (6789)" */
const accountLabel = (account) =>
  `${account.bankName} - ${account.bankBranch} (${maskAccountNumber(
    account.accountNumber
  ).slice(-4)})`;

/**
 * Money the firm gives away, and the form that adds to it.
 *
 * Cash has no account to choose, so choosing it settles the account field
 * rather than leaving a bank picker open over a payment that never touched one.
 */
export default function AssistanceSection() {
  const { bankAccounts } = useFirm();

  const [records, setRecords] = useState(assistanceRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [proof, setProof] = useState(null);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  // Choosing at one level of the classification clears everything below it.
  const setExpenseType = (value) =>
    setDraft((prev) => ({
      ...prev,
      expenseType: value,
      category: "",
      subcategory: "",
      description: "",
    }));
  const setCategory = (value) =>
    setDraft((prev) => ({ ...prev, category: value, subcategory: "", description: "" }));
  const setSubcategory = (value) =>
    setDraft((prev) => ({ ...prev, subcategory: value, description: "" }));

  const paidInCash = draft.method === "Cash";
  const setMethod = (value) =>
    setDraft((prev) => ({
      ...prev,
      method: value,
      account: value === "Cash" ? CASH_ACCOUNT : "",
    }));

  const descriptions = descriptionsOf(
    draft.expenseType,
    draft.category,
    draft.subcategory
  );

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.subcategory &&
    Number(draft.amount) > 0 &&
    draft.method &&
    draft.account &&
    draft.paymentDate &&
    proof;

  const save = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        paymentDate: draft.paymentDate,
        expenseType: draft.expenseType,
        category: draft.category,
        subcategory: draft.subcategory,
        description: draft.description,
        amount: Number(draft.amount),
        method: draft.method,
        account: draft.account,
        proof: proof.name,
        proofUrl: URL.createObjectURL(proof),
        notes: draft.notes,
      },
      ...prev,
    ]);
    setDraft(emptyDraft);
    setProof(null);
    setPage(1);
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

  return (
    <div className="space-y-6">
      {/* Give assistance */}
      <div className="rounded-lg border p-4">
        <p className="mb-4 font-semibold text-primary">Add Assistance</p>

        <div className="space-y-4">
          <Step number="1" title="Expense Classification" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-expense-type" required>
                Expense Type
              </FieldLabel>
              <Select value={draft.expenseType} onValueChange={setExpenseType}>
                <SelectTrigger id="assistance-expense-type">
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSISTANCE_CLASSIFICATION.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-category" required>
                Category
              </FieldLabel>
              <Select
                value={draft.category}
                onValueChange={setCategory}
                disabled={!draft.expenseType}
              >
                <SelectTrigger id="assistance-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesOf(draft.expenseType).map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-subcategory" required>
                Subcategory
              </FieldLabel>
              <Select
                value={draft.subcategory}
                onValueChange={setSubcategory}
                disabled={!draft.category}
              >
                <SelectTrigger id="assistance-subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategoriesOf(draft.expenseType, draft.category).map((sub) => (
                    <SelectItem key={sub.name} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-description">
                Expense Description (Optional)
              </FieldLabel>
              <Select
                value={draft.description}
                onValueChange={(value) => set("description", value)}
                disabled={descriptions.length === 0}
              >
                <SelectTrigger id="assistance-description">
                  <SelectValue placeholder="Select description" />
                </SelectTrigger>
                <SelectContent>
                  {descriptions.map((option) => (
                    <SelectItem key={option.name} value={option.name}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Step number="2" title="Assistance Details" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-amount" required>
                Assistance Amount (<Rial />)
              </FieldLabel>
              <Input
                id="assistance-amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={draft.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-method" required>
                Payment Method
              </FieldLabel>
              <Select value={draft.method} onValueChange={setMethod}>
                <SelectTrigger id="assistance-method">
                  <SelectValue placeholder="Select payment method" />
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
              <FieldLabel htmlFor="assistance-account" required>
                Bank / Account
              </FieldLabel>
              <Select
                value={draft.account}
                onValueChange={(value) => set("account", value)}
                disabled={paidInCash}
              >
                <SelectTrigger id="assistance-account">
                  <SelectValue placeholder="Select bank or account" />
                </SelectTrigger>
                <SelectContent>
                  {paidInCash ? (
                    <SelectItem value={CASH_ACCOUNT}>{CASH_ACCOUNT}</SelectItem>
                  ) : (
                    bankAccounts.map((option) => (
                      <SelectItem key={option.id} value={accountLabel(option)}>
                        {accountLabel(option)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="assistance-date" required>
                Payment Date
              </FieldLabel>
              <Input
                id="assistance-date"
                type="date"
                value={draft.paymentDate}
                onChange={(e) => set("paymentDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required>Transfer Proof</FieldLabel>
              <UploadBox file={proof} onSelect={setProof} />
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-notes">Notes</FieldLabel>
            <div className="relative">
              <Input
                id="assistance-notes"
                maxLength={NOTES_LIMIT}
                placeholder="Enter notes (optional)"
                className="h-16 pr-16"
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
              <span className="pointer-events-none absolute bottom-1.5 right-3 text-xs text-muted-foreground">
                {draft.notes.length}/{NOTES_LIMIT}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={save} disabled={!canSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Assistance
            </Button>
          </div>
        </div>
      </div>

      {/* What has been given */}
      <div className="rounded-lg border">
        <p className="border-b p-4 font-semibold text-primary">Assistance List</p>

        {records.length === 0 ? (
          <div className="p-6">
            <EmptyState>No assistance recorded yet.</EmptyState>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[900px] border text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="p-3 font-semibold">No.</th>
                    <th className="p-3 font-semibold">Payment Date</th>
                    <th className="p-3 font-semibold">
                      Expense Type
                      <span className="block font-normal">
                        Category / Subcategory
                      </span>
                    </th>
                    <th className="p-3 font-semibold">
                      Amount (<Rial />)
                    </th>
                    <th className="p-3 font-semibold">
                      Payment Method
                      <span className="block font-normal">Bank / Account</span>
                    </th>
                    <th className="p-3 font-semibold">Transfer Proof</th>
                    <th className="p-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b transition-colors last:border-0 hover:bg-primary/10"
                    >
                      {/* The row number opens the proof it stands for */}
                      <td className="p-3 align-top">
                        <button
                          type="button"
                          onClick={() => openProof(record)}
                          className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {start + index + 1}
                        </button>
                      </td>
                      <td className="whitespace-nowrap p-3 align-top">
                        {formatDate(record.paymentDate)}
                      </td>
                      <td className="p-3 align-top">
                        <span className="block font-semibold">
                          {record.expenseType}
                        </span>
                        <span className="block text-muted-foreground">
                          {record.category} / {record.subcategory}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-3 align-top">
                        {amount(record.amount)}
                      </td>
                      <td className="p-3 align-top">
                        <span className="block font-semibold">
                          {record.method}
                        </span>
                        <span className="block text-muted-foreground">
                          {record.account}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <button
                          type="button"
                          onClick={() => openProof(record)}
                          className="inline-flex items-center gap-1.5 rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {isImage(record.proof) ? (
                            <FileImage
                              className={cn("h-4 w-4 shrink-0 text-green-600")}
                            />
                          ) : (
                            <FileText
                              className={cn("h-4 w-4 shrink-0 text-red-600")}
                            />
                          )}
                          {record.proof}
                        </button>
                      </td>
                      <td className="p-3 align-top text-muted-foreground">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
