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
  Check,
  Undo2,
  X,
  Banknote,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/panels";
import { useExpenses } from "@/lib/expenses/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import { initialBankAccounts } from "@/pages/firm/firmData";
import { findType } from "./links";
import { Rial } from "@/components/shared/Rial";
import {
  PAYMENT_METHODS,
  VIEWER_ROLES,
  ACCOUNTANT_REVIEW_RESULTS,
  FINANCE_ACTIONS,
  STATUS,
  STATUS_VARIANT,
  firstReviewFor,
  routeFor,
  visibleInvoices,
  similarRequests,
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

/**
 * The accountant's decision on a request, taken on the request itself.
 *
 * Only shown to the accountant, and only while the request is sitting at their
 * step. A return or a rejection asks for the note before it will submit.
 */
function AccountantReview({ invoiceId, onDecide }) {
  const [result, setResult] = useState("");
  const [note, setNote] = useState("");

  const chosen = ACCOUNTANT_REVIEW_RESULTS.find((r) => r.key === result);
  const noteRequired = Boolean(chosen?.needsNote);
  const ready = Boolean(chosen) && (!noteRequired || note.trim().length > 0);

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-primary">
        Accountant&apos;s Review
      </p>

      <div className="grid grid-cols-1 gap-4 sm:max-w-md">
        <div className="space-y-2">
          <Label htmlFor={"review-" + invoiceId}>Review Result *</Label>
          <Select
            value={result}
            onValueChange={(value) => {
              setResult(value);
              setNote("");
            }}
          >
            <SelectTrigger id={"review-" + invoiceId}>
              <SelectValue placeholder="Please Select" />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNTANT_REVIEW_RESULTS.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {noteRequired && (
          <div className="space-y-2">
            <Label htmlFor={"note-" + invoiceId}>Accountant&apos;s Note *</Label>
            <Textarea
              id={"note-" + invoiceId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain what needs correcting, or why this is rejected"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!ready}
          onClick={() => onDecide(chosen, note.trim())}
        >
          <Check className="mr-1.5 h-4 w-4" />
          Submit Review
        </Button>
      </div>
    </div>
  );
}

/**
 * The finance manager's decision, and where the money went.
 *
 * Approving releases the payment, so the transfer is recorded in the same
 * breath - which account it left, when, and the reference it carries. Where the
 * supplier is paid comes from the supplier record and is shown, not asked for.
 */
function FinanceApproval({ invoice, supplierAccount, outstanding, onDecide }) {
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const [transfer, setTransfer] = useState({
    bankId: "",
    date: dayOffset(0),
    reference: "",
    document: "",
  });

  const chosen = FINANCE_ACTIONS.find((a) => a.key === action);
  const account = initialBankAccounts.find(
    (a) => String(a.id) === transfer.bankId
  );

  const ready =
    Boolean(chosen) &&
    (!chosen.needsNote || note.trim().length > 0) &&
    (!chosen.needsTransfer || (transfer.bankId && transfer.date));

  const id = (name) => name + "-" + invoice.id;

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-primary">
        Finance Manager Approval
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={id("financeAction")}>Finance Manager Action *</Label>
          <Select
            value={action}
            onValueChange={(value) => {
              setAction(value);
              setNote("");
            }}
          >
            <SelectTrigger id={id("financeAction")}>
              <SelectValue placeholder="Please Select" />
            </SelectTrigger>
            <SelectContent>
              {FINANCE_ACTIONS.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Supplier&apos;s Bank</Label>
          <Input value={supplierAccount?.bank || "-"} readOnly disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>Supplier&apos;s Account Number</Label>
          <Input
            value={supplierAccount?.accountNumber || "-"}
            readOnly
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      {chosen?.needsTransfer && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={id("fromBank")}>Withdrawal Bank *</Label>
            <Select
              value={transfer.bankId}
              onValueChange={(value) => setTransfer({ ...transfer, bankId: value })}
            >
              <SelectTrigger id={id("fromBank")}>
                <SelectValue placeholder="Please Select" />
              </SelectTrigger>
              <SelectContent>
                {initialBankAccounts
                  .filter((a) => a.active)
                  .map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.bankName} - {a.accountName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Transfer From Account Number</Label>
            <Input
              value={account?.accountNumber || "-"}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("withdrawnAt")}>Date of Withdrawal *</Label>
            <Input
              id={id("withdrawnAt")}
              type="date"
              value={transfer.date}
              onChange={(e) => setTransfer({ ...transfer, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("txRef")}>Transaction Number</Label>
            <Input
              id={id("txRef")}
              value={transfer.reference}
              onChange={(e) =>
                setTransfer({ ...transfer, reference: e.target.value })
              }
              placeholder="If available"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Bank Transfer Document</Label>
            {transfer.document ? (
              <div className="flex h-9 items-center justify-between gap-2 rounded-md bg-muted px-3">
                <span className="truncate text-sm">{transfer.document}</span>
                <button
                  type="button"
                  onClick={() => setTransfer({ ...transfer, document: "" })}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove document</span>
                </button>
              </div>
            ) : (
              <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/50">
                <Paperclip className="h-3.5 w-3.5" />
                Attach transfer document
                <Input
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files[0] &&
                    setTransfer({ ...transfer, document: e.target.files[0].name })
                  }
                />
              </label>
            )}
          </div>
        </div>
      )}

      {chosen?.needsNote && (
        <div className="space-y-2 sm:max-w-md">
          <Label htmlFor={id("financeNote")}>Notes *</Label>
          <Textarea
            id={id("financeNote")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain what needs correcting, or why this is rejected"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {chosen?.needsTransfer && (
          <span className="text-xs text-muted-foreground">
            Paying {money(outstanding)}
          </span>
        )}
        <Button size="sm" disabled={!ready} onClick={() => onDecide(chosen, note.trim(), { ...transfer, account })}>
          <Check className="mr-1.5 h-4 w-4" />
          Submit Decision
        </Button>
      </div>
    </div>
  );
}

/**
 * What has come in before that resembles the request being decided.
 *
 * Each row says why it is here, so a reviewer can tell a repeat supplier
 * invoice apart from the same person claiming the same thing again.
 */
function SupplierHistoryDialog({ invoice, invoices, accountFor, onOpenChange }) {
  const matches = similarRequests(invoices, invoice);

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Previous Requests Like This One</DialogTitle>
          <DialogDescription>
            {invoice.supplier} · raised by {invoice.createdBy}
          </DialogDescription>
        </DialogHeader>

        {matches.length === 0 ? (
          <EmptyState>
            Nothing earlier resembles this request.
          </EmptyState>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Id</th>
                  <th className="pb-2 font-medium">Supplier</th>
                  <th className="pb-2 font-medium">Invoice Date / Number</th>
                  <th className="pb-2 font-medium">Expense Details</th>
                  <th className="pb-2 text-right font-medium">Invoice Amount</th>
                  <th className="pb-2 font-medium">Invoice Status</th>
                  <th className="pb-2 font-medium">Match</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(({ invoice: past, sameSupplier, sameApplicant, sameKind }) => {
                  const account = accountFor(past.supplier);
                  return (
                    <tr key={past.id} className="border-b align-top last:border-0">
                      <td className="py-2 font-medium">
                        {past.reference}
                        {past.requestNo && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {past.requestNo}
                          </span>
                        )}
                      </td>

                      <td className="py-2">
                        <span className="block">{past.supplier}</span>
                        <span className="block text-xs text-muted-foreground">
                          {account?.bank || "-"}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {account?.accountNumber || "-"}
                        </span>
                      </td>

                      <td className="py-2 text-muted-foreground">
                        <span className="block">{formatDate(past.invoiceDate)}</span>
                        <span className="block text-xs">{past.invoiceNumber}</span>
                        {past.invoiceFile ? (
                          <span
                            title={past.invoiceFile}
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary"
                          >
                            <Paperclip className="h-3 w-3" />
                            Invoice
                          </span>
                        ) : (
                          <span className="text-xs">No invoice copy</span>
                        )}
                      </td>

                      <td className="py-2 text-xs text-muted-foreground">
                        {past.lines.map((line) => (
                          <span key={line.id} className="block">
                            {findType(line.typeKey)?.name} · {line.path.join(" / ")}
                          </span>
                        ))}
                      </td>

                      <td className="py-2 text-right">
                        <span className="block font-semibold">
                          {money(invoiceTotal(past))}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Net {money(invoiceNet(past))}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          VAT {money(invoiceTax(past))}
                        </span>
                      </td>

                      <td className="py-2">
                        <Badge variant={STATUS_VARIANT[past.status]}>
                          {STATUS[past.status]}
                        </Badge>
                      </td>

                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {sameSupplier && <Badge variant="outline">Same supplier</Badge>}
                          {sameKind && <Badge variant="outline">Same expense</Badge>}
                          {sameApplicant && <Badge variant="outline">Same applicant</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function GeneralInvoices() {
  const navigate = useNavigate();
  const { invoices, updateInvoice } = useExpenses();
  const { suppliers } = useSuppliers();

  // Where this supplier is paid, taken from the supplier record.
  const accountFor = (name) => suppliers.find((s) => s.name === name) || null;

  // Auth is not wired up yet, so the role is switchable here to make the
  // visibility rules visible. It becomes the signed-in user's role later.
  const [role, setRole] = useState("admin");
  const roleLabel = VIEWER_ROLES.find((r) => r.key === role)?.label || "";
  const visible = visibleInvoices(invoices, role, CURRENT_USER.name);

  // Reason capture for a return or rejection, and the payment dialog.
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState("");
  const [payingFor, setPayingFor] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
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
        { at: dayOffset(0), by: roleLabel, action, reason: note },
      ],
    });

  const approve = (invoice) => {
    if (invoice.status === "accountant") {
      record(invoice, "finance", "Approved by Accountant");
    } else if (invoice.status === "finance") {
      record(invoice, "approved", "Approved for Payment");
    }
  };

  /**
   * The finance manager's decision. Approving settles the invoice and files the
   * transfer against it in one write, so a paid request always carries the
   * record of how it was paid.
   */
  const decideFinance = (invoice, decision, note, transfer) => {
    if (!decision.needsTransfer) {
      return record(invoice, decision.status, decision.action, note);
    }

    const outstanding = invoiceTotal(invoice) - amountPaid(invoice);
    const payments = [
      ...invoice.payments,
      {
        id: invoice.payments.length + 1,
        date: transfer.date,
        amount: outstanding,
        method: "Bank Transfer",
        reference: transfer.reference,
        fromAccount: transfer.account
          ? transfer.account.bankName + " - " + transfer.account.accountNumber
          : "",
        document: transfer.document,
      },
    ];

    updateInvoice(invoice.id, {
      payments,
      status: settlementStatus({ ...invoice, payments }),
      history: [
        ...invoice.history,
        {
          at: transfer.date,
          by: roleLabel,
          action: decision.action + " - payment processed",
          reason: transfer.reference ? "Transaction " + transfer.reference : "",
        },
      ],
    });
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
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <ReceiptText className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Invoice Payment Request
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              General invoices and general company expenses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Viewing as
          </span>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIEWER_ROLES.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/expense-requests/create")}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Payment Request
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------- invoices */}
      <div className="space-y-4">
        {visible.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <EmptyState>
                {role === "admin"
                  ? "No general invoices yet."
                  : "Nothing is waiting for you at the moment."}
              </EmptyState>
            </CardContent>
          </Card>
        )}

        {visible.map((invoice) => {
          const total = invoiceTotal(invoice);
          const paid = amountPaid(invoice);
          const isAdmin = role === "admin";
          // The accountant and the finance manager each decide through their own
          // block, so the loose buttons are not offered to them as well.
          const accountantReview =
            role === "accountant" && invoice.status === "accountant";
          const financeApproval =
            role === "finance" && invoice.status === "finance";
          const canApprove =
            !accountantReview &&
            !financeApproval &&
            ((invoice.status === "accountant" &&
              (isAdmin || role === "accountant")) ||
              (invoice.status === "finance" && (isAdmin || role === "finance")));
          const canPay =
            ["approved", "partiallyPaid"].includes(invoice.status) &&
            (isAdmin || role === "finance");
          // Whoever is judging the request can read what came before it.
          const canReview =
            accountantReview || financeApproval || canApprove || isAdmin;
          const canResubmit =
            invoice.status === "returned" && (isAdmin || role === "employee");

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
                    {/* The number this is chased by, until the money goes out */}
                    {invoice.requestNo && (
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {invoice.requestNo}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {invoice.reference} · Invoice {invoice.invoiceNumber} ·{" "}
                      {formatDate(invoice.invoiceDate)} · {invoice.createdBy}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                      {invoice.invoiceFile ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Paperclip className="h-3 w-3" />
                          {invoice.invoiceFile}
                        </span>
                      ) : (
                        <Badge variant="outline">No invoice copy</Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {money(total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Net {money(invoiceNet(invoice))} · VAT{" "}
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
                        <th className="pb-2 text-right font-medium">Before VAT</th>
                        <th className="pb-2 text-right font-medium">VAT</th>
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
                            {p.fromAccount && " · from " + p.fromAccount}
                            {p.document && (
                              <span className="ml-1 inline-flex items-center gap-1 text-primary">
                                <Paperclip className="h-3 w-3" />
                                {p.document}
                              </span>
                            )}
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

                {canReview && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryFor(invoice)}
                    >
                      <History className="mr-1.5 h-4 w-4" />
                      View Supplier History
                    </Button>
                  </div>
                )}

                {accountantReview && (
                  <AccountantReview
                    invoiceId={invoice.id}
                    onDecide={(decision, note) =>
                      record(invoice, decision.status, decision.action, note)
                    }
                  />
                )}

                {financeApproval && (
                  <FinanceApproval
                    invoice={invoice}
                    supplierAccount={accountFor(invoice.supplier)}
                    outstanding={total - paid}
                    onDecide={(decision, note, transfer) =>
                      decideFinance(invoice, decision, note, transfer)
                    }
                  />
                )}

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

                  {canResubmit && (
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

      {historyFor && (
        <SupplierHistoryDialog
          invoice={historyFor}
          invoices={invoices}
          accountFor={accountFor}
          onOpenChange={(open) => !open && setHistoryFor(null)}
        />
      )}

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
              {payingFor && (
                <>
                  Outstanding{" "}
                  {money(invoiceTotal(payingFor) - amountPaid(payingFor))} of{" "}
                  {money(invoiceTotal(payingFor))}
                </>
              )}
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
              <Label htmlFor="paymentAmount">Amount Paid (<Rial />) *</Label>
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
