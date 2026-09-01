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
import { FileText, FileImage, Users, HandHeart, Upload, FileCheck } from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { useFirm } from "@/lib/firm/context";
import { maskAccountNumber } from "@/pages/firm/firmData";
import { amount, formatDate } from "../loanData";
import {
  ASSISTANCE_BOOKING,
  DEFAULT_ASSISTANCE_BOOKING,
  categoriesOf,
  subcategoriesOf,
  assistanceRecords,
  CASH_ACCOUNT,
} from "../assistanceData";

const NOTES_LIMIT = 300;
const PAGE_SIZE = 5;

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
export default function AssistanceSection({ adding, onCloseAdd }) {
  const { bankAccounts } = useFirm();

  const [records, setRecords] = useState(assistanceRecords);
  const [draft, setDraft] = useState(emptyDraft);
  const [proof, setProof] = useState(null);
  const [page, setPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const paidInCash = draft.method === "Cash";
  const setMethod = (value) =>
    setDraft((prev) => ({
      ...prev,
      method: value,
      account: value === "Cash" ? CASH_ACCOUNT : "",
    }));

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.subcategory &&
    Number(draft.amount) > 0 &&
    draft.method &&
    draft.account &&
    draft.paymentDate &&
    draft.notes.trim() &&
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
  // given, and none of it helps while a new payment is being entered.
  if (adding) {
    return (
      <div className="space-y-6 rounded-lg border p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-expense-type" required>
              Expense Type
            </FieldLabel>
            <Select
              value={draft.expenseType}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  expenseType: value,
                  category: "",
                  subcategory: "",
                }))
              }
            >
              <SelectTrigger id="assistance-expense-type">
                {/* Laid out inline: the trigger clamps every span child to one
                    line with display:-webkit-box, which beats a flex utility. */}
                <span
                  style={{ display: "flex" }}
                  className="min-w-0 items-center gap-2"
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Select expense type" />
                </span>
              </SelectTrigger>
              <SelectContent>
                {ASSISTANCE_BOOKING.map((type) => (
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
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, category: value, subcategory: "" }))
              }
              disabled={!draft.expenseType}
            >
              <SelectTrigger id="assistance-category">
                <span
                  style={{ display: "flex" }}
                  className="min-w-0 items-center gap-2"
                >
                  <HandHeart className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Select category" />
                </span>
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
              onValueChange={(value) => set("subcategory", value)}
              disabled={!draft.category}
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-method" required>
              Payment Method
            </FieldLabel>
            <Select value={draft.method} onValueChange={setMethod}>
              <SelectTrigger id="assistance-method">
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
            <FieldLabel htmlFor="assistance-account" required>
              Bank / Account
            </FieldLabel>
            {/* Cash has no account to choose, so choosing it settles the field
                rather than leaving a bank picker open over a payment that never
                touched one. */}
            <Select
              value={draft.account}
              onValueChange={(value) => set("account", value)}
              disabled={paidInCash}
            >
              <SelectTrigger id="assistance-account">
                <SelectValue placeholder="Select bank account" />
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor="assistance-amount" required>
              Amount
            </FieldLabel>
            <div className="relative">
              <Input
                id="assistance-amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                className="pr-12"
                value={draft.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Rial />
              </span>
            </div>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <FieldLabel htmlFor="assistance-notes" required>
              Payment Reference / Notes
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="assistance-notes"
                maxLength={NOTES_LIMIT}
                placeholder="Enter reference or notes"
                className="flex-1"
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
              {/* The file name lives in the tooltip, so the control stays
                  icon-sized either way. */}
              {proof ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-green-600 text-green-600 hover:text-destructive"
                  title={proof.name + " - click to remove"}
                  onClick={() => setProof(null)}
                >
                  <FileCheck className="h-4 w-4" />
                  <span className="sr-only">{proof.name} attached. Remove it.</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  title="Upload transfer proof"
                  asChild
                >
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Upload transfer proof</span>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && setProof(e.target.files[0])}
                    />
                  </label>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onCloseAdd}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Save Assistance Request
          </Button>
        </div>
      </div>
    );

  }

  return (
    <div className="space-y-6">
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
                    {/* Widths are set here rather than left to the browser,
                        and the proof sits with the payment it evidences: six
                        columns fit, seven do not. */}
                    <th className="p-3 font-semibold" style={{ width: "5%" }}>
                      No.
                    </th>
                    <th className="whitespace-nowrap p-3 font-semibold" style={{ width: "11%" }}>
                      Payment Date
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "24%" }}>
                      Expense Type
                      <span className="block font-normal">
                        Category / Subcategory
                      </span>
                    </th>
                    <th className="whitespace-nowrap p-3 font-semibold" style={{ width: "10%" }}>
                      Amount (<Rial />)
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "30%" }}>
                      Payment Method
                      <span className="block font-normal">Bank / Account</span>
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "20%" }}>
                      Notes
                    </th>
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
                        {record.proof && (
                          <button
                            type="button"
                            onClick={() => openProof(record)}
                            className="mt-1 inline-flex items-center gap-1.5 rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {isImage(record.proof) ? (
                              <FileImage className="h-4 w-4 shrink-0 text-green-600" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-red-600" />
                            )}
                            {record.proof}
                          </button>
                        )}
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
