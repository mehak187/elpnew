import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { DEDICATED_TYPES } from "@/lib/expenses/taxonomy";
import { useExpenses } from "@/lib/expenses/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { findType } from "./links";
import {
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
  const navigate = useNavigate();
  const { invoices, updateInvoice } = useExpenses();
  const { suppliers } = useSuppliers();

  // Where this supplier is paid, taken from the supplier record.
  const accountFor = (name) => suppliers.find((s) => s.name === name) || null;

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

  const record = (invoice, status, action, note = "") =>
    updateInvoice(invoice.id, {
      status,
      history: [
        ...invoice.history,
        { at: dayOffset(0), by: "Current user", action, reason: note },
      ],
    });

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

    const updated = {
      ...payingFor,
      payments: [
        ...payingFor.payments,
        { id: payingFor.payments.length + 1, ...payment, amount },
      ],
    };
    updateInvoice(payingFor.id, {
      payments: updated.payments,
      status: settlementStatus(updated),
      history: [
        ...payingFor.history,
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
    });
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
        <Button onClick={() => navigate("/expense-requests/create")}>
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

                {["finance", "approved", "partiallyPaid"].includes(
                  invoice.status
                ) &&
                  accountFor(invoice.supplier) && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                      <span className="font-medium">Supplier Account</span>
                      <span>
                        <span className="text-muted-foreground">Bank </span>
                        {accountFor(invoice.supplier).bank || "-"}
                      </span>
                      <span>
                        <span className="text-muted-foreground">Account </span>
                        {accountFor(invoice.supplier).accountNumber || "-"}
                      </span>
                    </div>
                  )}

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
          {payingFor && accountFor(payingFor.supplier) && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <p className="mb-1 font-medium">
                Pay {payingFor.supplier}
              </p>
              <p className="text-muted-foreground">
                {accountFor(payingFor.supplier).bank || "-"} &middot;{" "}
                {accountFor(payingFor.supplier).accountNumber || "-"}
              </p>
            </div>
          )}

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
