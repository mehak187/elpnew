import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ReceiptText,
  Plus,
  Trash2,
  Paperclip,
  ArrowRight,
  Info,
  Check,
  Undo2,
  X,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/panels";
import {
  GENERAL_TYPES,
  DEDICATED_TYPES,
  isPathComplete,
} from "@/lib/expenses/taxonomy";
import ExpenseClassificationPicker from "./ExpenseClassificationPicker";
import { findType } from "./links";
import {
  initialInvoices,
  suppliers,
  PAYMENT_METHODS,
  CREATOR_ROLES,
  STATUS,
  STATUS_VARIANT,
  firstReviewFor,
  routeFor,
  invoiceNet,
  invoiceTax,
  invoiceTotal,
  amountPaid,
  settlementStatus,
  lineTotal,
  dayOffset,
  formatDate,
  money,
} from "./expenseData";

const emptyLine = () => ({
  id: Math.floor(performance.now() * 1000),
  typeKey: "",
  path: [],
  linkKind: null,
  linkId: null,
  description: "",
  amountBeforeTax: "",
  taxAmount: "",
});

const emptyInvoice = () => ({
  invoiceDate: dayOffset(0),
  invoiceNumber: "",
  supplier: "",
  invoiceFile: "",
  supportingDocuments: [],
  notes: "",
  creatorRole: "employee",
  lines: [emptyLine()],
});

/** The route this invoice takes, with the step it has reached marked. */
function Route({ invoice }) {
  const steps = routeFor(invoice.creatorRole);
  const settled = ["paid", "partiallyPaid"].includes(invoice.status);
  const at = settled
    ? steps.length - 1
    : steps.findIndex((s) => s.key === invoice.status);

  if (["rejected", "returned"].includes(invoice.status)) {
    return (
      <div
        className={cn(
          "rounded-md border-l-4 px-3 py-2 text-xs",
          invoice.status === "rejected"
            ? "border-l-red-500 bg-red-50 text-red-800"
            : "border-l-amber-500 bg-amber-50 text-amber-900"
        )}
      >
        <span className="font-semibold">{STATUS[invoice.status]}: </span>
        {invoice.history[invoice.history.length - 1]?.reason || "No reason given."}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => (
        <span key={step.key} className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              i < at
                ? "bg-green-50 text-green-700"
                : i === at
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground"
            )}
          >
            {i < at && <Check className="h-3 w-3" />}
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          )}
        </span>
      ))}
    </div>
  );
}

export default function GeneralInvoices() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState(emptyInvoice());
  const [error, setError] = useState("");

  // Reason capture for a return or rejection, and the payment dialog.
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState("");
  const [payingFor, setPayingFor] = useState(null);
  const [payment, setPayment] = useState({
    date: dayOffset(0),
    amount: "",
    method: "",
    reference: "",
  });

  const updateLine = (id, changes) =>
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    }));

  const lineComplete = (line) => {
    const type = findType(line.typeKey);
    const classified = isPathComplete(type, line.path);
    const described = type?.requiresDescription
      ? line.description.trim().length > 0
      : true;
    return classified && described && Number(line.amountBeforeTax) > 0;
  };

  const draftNet = draft.lines.reduce(
    (sum, l) => sum + (Number(l.amountBeforeTax) || 0),
    0
  );
  const draftTax = draft.lines.reduce(
    (sum, l) => sum + (Number(l.taxAmount) || 0),
    0
  );

  const submit = () => {
    if (!draft.invoiceNumber.trim()) return setError("Enter the invoice number.");
    if (!draft.supplier) return setError("Select the supplier.");
    if (!draft.invoiceFile) return setError("Attach the invoice.");
    if (!draft.lines.every(lineComplete))
      return setError(
        "Every row needs a full classification and an amount before tax. Other Expenses also needs a description."
      );

    // An admin-raised invoice skips the accountant entirely.
    const status = firstReviewFor(draft.creatorRole);

    setInvoices((prev) => [
      {
        ...draft,
        id: prev.reduce((max, i) => Math.max(max, i.id), 0) + 1,
        reference: "GIN-2026-" + String(prev.length + 1).padStart(3, "0"),
        createdBy: "Mohammed Al Yahyaei",
        status,
        payments: [],
        history: [
          {
            at: dayOffset(0),
            by: "Mohammed Al Yahyaei",
            action:
              draft.creatorRole === "admin"
                ? "Submitted by Admin - accountant step skipped"
                : "Submitted",
            reason: "",
          },
        ],
        lines: draft.lines.map((l) => ({
          ...l,
          amountBeforeTax: Number(l.amountBeforeTax),
          taxAmount: Number(l.taxAmount) || 0,
        })),
      },
      ...prev,
    ]);
    setDraft(emptyInvoice());
    setComposing(false);
    setError("");
  };

  const record = (invoice, status, action, note = "") =>
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoice.id
          ? {
              ...i,
              status,
              history: [
                ...i.history,
                { at: dayOffset(0), by: "Current user", action, reason: note },
              ],
            }
          : i
      )
    );

  const approve = (invoice) => {
    if (invoice.status === "accountant") {
      record(invoice, "finance", "Approved by Accountant");
    } else if (invoice.status === "finance") {
      record(invoice, "approved", "Approved for Payment");
    }
  };

  const savePayment = () => {
    const amount = Number(payment.amount);
    if (!(amount > 0) || !payment.method) return;

    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id !== payingFor.id) return i;
        const updated = {
          ...i,
          payments: [
            ...i.payments,
            { id: i.payments.length + 1, ...payment, amount },
          ],
        };
        return {
          ...updated,
          status: settlementStatus(updated),
          history: [
            ...i.history,
            {
              at: payment.date,
              by: "Finance",
              action:
                settlementStatus(updated) === "paid"
                  ? "Payment recorded in full"
                  : "Part payment recorded",
              reason: "",
            },
          ],
        };
      })
    );
    setPayingFor(null);
    setPayment({ date: dayOffset(0), amount: "", method: "", reference: "" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-secondary p-2 sm:p-3">
            <ReceiptText className="h-5 w-5 text-secondary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Expense Requests
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              General invoices and general company expenses
            </p>
          </div>
        </div>
        <Button onClick={() => setComposing((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New General Invoice
        </Button>
      </div>

      {/* The two routes, stated once */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          {CREATOR_ROLES.map((role) => (
            <div key={role.key} className="rounded-md border p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Raised by {role.label}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {routeFor(role.key).map((step, i, all) => (
                  <span key={step.key} className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{step.label}</span>
                    {i < all.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* What this page deliberately does not cover */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>Entered on their own pages, not here:</span>
        {DEDICATED_TYPES.map((type) => (
          <Badge key={type.key} variant="outline">
            {type.name} → {type.recordedOn}
          </Badge>
        ))}
      </div>

      {/* --------------------------------------------------- new invoice */}
      {composing && (
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={draft.invoiceDate}
                  onChange={(e) =>
                    setDraft({ ...draft, invoiceDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  value={draft.invoiceNumber}
                  onChange={(e) =>
                    setDraft({ ...draft, invoiceNumber: e.target.value })
                  }
                  placeholder="Supplier invoice number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                  value={draft.supplier}
                  onValueChange={(value) => setDraft({ ...draft, supplier: value })}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Please Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attach Invoice *</Label>
                {draft.invoiceFile ? (
                  <div className="flex h-9 items-center justify-between gap-2 rounded-md bg-muted px-3">
                    <span className="truncate text-sm">{draft.invoiceFile}</span>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, invoiceFile: "" })}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Remove invoice</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/50">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attach invoice
                    <Input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files[0] &&
                        setDraft({ ...draft, invoiceFile: e.target.files[0].name })
                      }
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/50">
                  <Paperclip className="h-3.5 w-3.5" />
                  {draft.supportingDocuments.length
                    ? draft.supportingDocuments.length + " attached"
                    : "Add documents"}
                  <Input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files[0] &&
                      setDraft({
                        ...draft,
                        supportingDocuments: [
                          ...draft.supportingDocuments,
                          e.target.files[0].name,
                        ],
                      })
                    }
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creatorRole">Raised By *</Label>
                <Select
                  value={draft.creatorRole}
                  onValueChange={(value) =>
                    setDraft({ ...draft, creatorRole: value })
                  }
                >
                  <SelectTrigger id="creatorRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATOR_ROLES.map((role) => (
                      <SelectItem key={role.key} value={role.key}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Classification and amounts, one row per expense line */}
            <div className="space-y-4">
              {draft.lines.map((line, index) => {
                const type = findType(line.typeKey);
                // Amounts and notes stay hidden until the row is classified.
                const classified = isPathComplete(type, line.path);
                return (
                  <div key={line.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Row {index + 1}</p>
                      <div className="flex items-center gap-3">
                        {classified && (
                          <span className="text-xs text-muted-foreground">
                            Line total {money(lineTotal(line))}
                          </span>
                        )}
                        {draft.lines.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                lines: draft.lines.filter((l) => l.id !== line.id),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove row {index + 1}</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <ExpenseClassificationPicker
                        types={GENERAL_TYPES}
                        idPrefix={"line-" + line.id}
                        value={line}
                        onChange={(next) => updateLine(line.id, next)}
                      />

                      {classified && (
                      <div className="space-y-2">
                        <Label htmlFor={"net-" + line.id}>
                          Amount Before Tax (OMR) *
                        </Label>
                        <Input
                          id={"net-" + line.id}
                          type="number"
                          min="0"
                          value={line.amountBeforeTax}
                          onChange={(e) =>
                            updateLine(line.id, { amountBeforeTax: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                      )}

                      {classified && (
                      <div className="space-y-2">
                        <Label htmlFor={"tax-" + line.id}>Tax Amount (OMR)</Label>
                        <Input
                          id={"tax-" + line.id}
                          type="number"
                          min="0"
                          value={line.taxAmount}
                          onChange={(e) =>
                            updateLine(line.id, { taxAmount: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                      )}

                      {classified && (
                      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                        <Label htmlFor={"desc-" + line.id}>
                          Expense Description / Notes
                          {type?.requiresDescription && " *"}
                        </Label>
                        <Input
                          id={"desc-" + line.id}
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, { description: e.target.value })
                          }
                          placeholder={
                            type?.requiresDescription
                              ? "Required - explain this expense"
                              : "What is being claimed"
                          }
                          className={cn(
                            type?.requiresDescription &&
                              !line.description.trim() &&
                              "border-amber-400"
                          )}
                        />
                      </div>
                      )}

                      {!classified && (
                        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
                          Choose the expense type, category and subcategory to
                          continue.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraft({ ...draft, lines: [...draft.lines, emptyLine()] })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Row
              </Button>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Before tax {money(draftNet)} · Tax {money(draftTax)} ·{" "}
                </span>
                <span className="font-bold text-primary">
                  Total {money(draftNet + draftTax)}
                </span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setComposing(false)}>
                Cancel
              </Button>
              <Button onClick={submit}>Submit Invoice</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------- invoices */}
      <div className="space-y-4">
        {invoices.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <EmptyState>No general invoices yet.</EmptyState>
            </CardContent>
          </Card>
        )}

        {invoices.map((invoice) => {
          const total = invoiceTotal(invoice);
          const paid = amountPaid(invoice);
          const canApprove = ["accountant", "finance"].includes(invoice.status);
          const canPay = ["approved", "partiallyPaid"].includes(invoice.status);

          return (
            <Card key={invoice.id}>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-primary">
                        {invoice.supplier}
                      </h3>
                      <Badge variant={STATUS_VARIANT[invoice.status]}>
                        {STATUS[invoice.status]}
                      </Badge>
                      {invoice.creatorRole === "admin" && (
                        <Badge variant="outline">Admin raised</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {invoice.reference} · Invoice {invoice.invoiceNumber} ·{" "}
                      {formatDate(invoice.invoiceDate)} · {invoice.createdBy}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                      {invoice.invoiceFile && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Paperclip className="h-3 w-3" />
                          {invoice.invoiceFile}
                        </span>
                      )}
                      {invoice.supportingDocuments.map((doc) => (
                        <span
                          key={doc}
                          className="inline-flex items-center gap-1 text-muted-foreground"
                        >
                          <Paperclip className="h-3 w-3" />
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {money(total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Net {money(invoiceNet(invoice))} · Tax{" "}
                      {money(invoiceTax(invoice))}
                    </p>
                    {paid > 0 && (
                      <p className="text-xs font-medium text-green-600">
                        Paid {money(paid)} of {money(total)}
                      </p>
                    )}
                  </div>
                </div>

                <Route invoice={invoice} />

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Expense Type</th>
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 font-medium">Subcategory</th>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 text-right font-medium">Before Tax</th>
                        <th className="pb-2 text-right font-medium">Tax</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line) => (
                        <tr key={line.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">
                            {findType(line.typeKey)?.name}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {line.path[0]}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {line.path[1] || "-"}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {line.description || "-"}
                          </td>
                          <td className="py-2 text-right">
                            {money(line.amountBeforeTax)}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">
                            {money(line.taxAmount)}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {money(lineTotal(line))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payments recorded so far */}
                {invoice.payments.length > 0 && (
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="mb-2 text-xs font-semibold">Payments</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {invoice.payments.map((p) => (
                        <li key={p.id} className="flex justify-between gap-3">
                          <span>
                            {formatDate(p.date)} · {p.method}
                            {p.reference && " · " + p.reference}
                          </span>
                          <span className="font-medium text-foreground">
                            {money(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Trail of who did what, and why */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    History ({invoice.history.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {invoice.history.map((entry, i) => (
                      <li key={i} className="text-muted-foreground">
                        {formatDate(entry.at)} · {entry.by} · {entry.action}
                        {entry.reason && (
                          <span className="text-foreground"> - {entry.reason}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>

                {/* Actions available at this step */}
                <div className="flex flex-wrap justify-end gap-2">
                  {canApprove && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReasonFor({ invoice, kind: "returned" });
                          setReason("");
                        }}
                      >
                        <Undo2 className="mr-1.5 h-4 w-4" />
                        Return for Correction
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setReasonFor({ invoice, kind: "rejected" });
                          setReason("");
                        }}
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => approve(invoice)}>
                        <Check className="mr-1.5 h-4 w-4" />
                        {invoice.status === "accountant"
                          ? "Approve"
                          : "Approve for Payment"}
                      </Button>
                    </>
                  )}

                  {canPay && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setPayingFor(invoice);
                        setPayment({
                          date: dayOffset(0),
                          amount: String(total - paid),
                          method: "",
                          reference: "",
                        });
                      }}
                    >
                      <Banknote className="mr-1.5 h-4 w-4" />
                      Record Payment
                    </Button>
                  )}

                  {invoice.status === "returned" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        record(
                          invoice,
                          firstReviewFor(invoice.creatorRole),
                          "Resubmitted after correction"
                        )
                      }
                    >
                      Resubmit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reason is compulsory for a return or a rejection */}
      <Dialog
        open={Boolean(reasonFor)}
        onOpenChange={(open) => !open && setReasonFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reasonFor?.kind === "rejected"
                ? "Reject invoice"
                : "Return for correction"}
            </DialogTitle>
            <DialogDescription>
              The reason is recorded against the invoice and shown to whoever
              raised it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="decisionReason">Reason *</Label>
            <Textarea
              id="decisionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain what needs correcting, or why this is rejected"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim()}
              onClick={() => {
                record(
                  reasonFor.invoice,
                  reasonFor.kind,
                  reasonFor.kind === "rejected"
                    ? "Rejected"
                    : "Returned for Correction",
                  reason.trim()
                );
                setReasonFor(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment details the document asks to be recorded */}
      <Dialog
        open={Boolean(payingFor)}
        onOpenChange={(open) => !open && setPayingFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {payingFor &&
                "Outstanding " +
                  money(invoiceTotal(payingFor) - amountPaid(payingFor)) +
                  " of " +
                  money(invoiceTotal(payingFor))}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={payment.date}
                onChange={(e) => setPayment({ ...payment, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount Paid (OMR) *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="1"
                value={payment.amount}
                onChange={(e) =>
                  setPayment({ ...payment, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={payment.method}
                onValueChange={(value) =>
                  setPayment({ ...payment, method: value })
                }
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Please Select" />
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
              <Label htmlFor="paymentReference">Transaction / Reference No.</Label>
              <Input
                id="paymentReference"
                value={payment.reference}
                onChange={(e) =>
                  setPayment({ ...payment, reference: e.target.value })
                }
                placeholder="If available"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={!(Number(payment.amount) > 0) || !payment.method}
              onClick={savePayment}
            >
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
