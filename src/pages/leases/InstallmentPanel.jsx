import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Coins, FileText, Landmark, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, Worked, Attach } from "./fields";
import {
  CHEQUE,
  INSTALLMENT_STATUS,
  RENT_EXPENSE_TYPE,
  RENT_CATEGORY,
  rentSubcategoryOf,
  addressOf,
  paymentFacts,
  omr,
  shortDate,
  todayIso,
} from "./leaseData";

/** A label and its value on one line, the value pushed to the right edge. */
export function AmountLine({ label, value, strong }) {
  return (
    <p className={cn("flex justify-between gap-4", strong && "font-semibold text-primary")}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </p>
  );
}

/** A titled box of label - value lines. */
function DetailCard({ icon, title, children }) {
  const Icon = icon;
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <p className="flex items-center gap-2 border-b bg-secondary/60 px-3 py-2 text-sm font-semibold text-primary">
        <Icon className="h-4 w-4 shrink-0" />
        {title}
      </p>
      <div className="space-y-1.5 p-3 text-sm">{children}</div>
    </div>
  );
}

/** Label - value lines whose values all start at the same edge. */
function DetailLines({ lines }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
      {lines.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="whitespace-nowrap text-muted-foreground">{label}</dt>
          <dd className="min-w-0 wrap-break-word">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const NOTE_LIMIT = 500;
const EMPTY_ENTRY = { paidOn: "", transactionNo: "", receiptFile: "", note: "" };

/**
 * One installment of a lease: the property it is for, where it is booked,
 * what it comes to and how it is paid - with its payment recorded underneath.
 *
 * It opens from the lease's payment schedule, and shows up by itself among the
 * pending disbursements once the installment falls due. Several can be on one
 * page, so every field id carries the lease and the installment.
 *
 * The payment date is what marks the installment paid. Clear empties the
 * entry, so saving after it takes a payment recorded by mistake back off.
 */
export default function InstallmentPanel({ id, className, row, lease, branchName, bankAccounts, count, onSave }) {
  const [entry, setEntry] = useState(() => ({
    paidOn: row.payment?.paidOn || "",
    transactionNo: row.payment?.transactionNo || "",
    receiptFile: row.payment?.receiptFile || "",
    note: row.note,
  }));
  const [error, setError] = useState("");
  const status = INSTALLMENT_STATUS[row.status];
  const vatExempt = lease.vatApplied === false;
  const byCheque = lease.method === CHEQUE;
  const fieldId = (name) => name + "-" + lease.id + "-" + row.no;

  const set = (name, value) => setEntry((prev) => ({ ...prev, [name]: value }));

  const clear = () => {
    setEntry(EMPTY_ENTRY);
    setError("");
  };

  const save = () => {
    const transactionNo = entry.transactionNo.trim();
    if (!entry.paidOn && (transactionNo || entry.receiptFile)) {
      setError("Enter the payment date for this payment.");
      return;
    }
    setError("");
    onSave({
      payment: entry.paidOn
        ? { paidOn: entry.paidOn, transactionNo, receiptFile: entry.receiptFile }
        : null,
      note: entry.note.trim(),
    });
  };

  return (
    <div
      id={id}
      data-installment={lease.id + "-" + row.no}
      className={cn(
        "scroll-mt-24 space-y-4 rounded-xl border bg-secondary/30 p-4 sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <h3 className="text-lg font-semibold text-primary">
          Installment {row.no} Details
        </h3>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
            status.pill
          )}
        >
          <span className={cn("h-2.5 w-2.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6",
          // Transaction No. shares its row with the upload button, so it gets a little more room.
          byCheque
            ? "lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.4fr)]"
            : "lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]"
        )}
      >
        <Worked id={fieldId("installmentNo")} label="Installment No." value={"Installment " + row.no} />
        <Worked id={fieldId("installmentDue")} label="Due Date" value={shortDate(row.due)} />
        {byCheque && (
          <Worked id={fieldId("installmentChequeNo")} label="Cheque No." value={row.chequeNo || "-"} />
        )}
        <Field>
          <FieldLabel htmlFor={fieldId("installmentPaidOn")}>Payment Date</FieldLabel>
          <Input
            id={fieldId("installmentPaidOn")}
            type="date"
            value={entry.paidOn}
            max={todayIso()}
            onChange={(e) => set("paidOn", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fieldId("installmentTransactionNo")}>Transaction No.</FieldLabel>
          <div className="flex gap-2">
            <Input
              id={fieldId("installmentTransactionNo")}
              value={entry.transactionNo}
              onChange={(e) => set("transactionNo", e.target.value)}
              placeholder="Enter transaction number"
              autoComplete="off"
              className="min-w-0 flex-1"
            />
            <Attach
              id={fieldId("installmentReceipt")}
              file={entry.receiptFile}
              onFile={(name) => set("receiptFile", name)}
              what="payment receipt"
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailCard icon={Building2} title="Leased Property Details">
          <DetailLines
            lines={[
              ["Property Type:", lease.propertyType || "-"],
              ["Address:", addressOf(lease) || "-"],
              ["Branch:", branchName],
              ["Landlord:", lease.landlord || "-"],
            ]}
          />
        </DetailCard>

        <DetailCard icon={FileText} title="Payment Details">
          <DetailLines
            lines={[
              ["Expense Type:", RENT_EXPENSE_TYPE],
              ["Category:", RENT_CATEGORY],
              ["Subcategory:", rentSubcategoryOf(lease.propertyType)],
            ]}
          />
        </DetailCard>

        <DetailCard icon={Coins} title="Amount Details">
          <AmountLine label="Rental Amount (OMR):" value={omr(row.rentPart)} />
          <AmountLine label={vatExempt ? "VAT (exempt):" : "VAT (5%):"} value={omr(row.vat)} />
          <div className="border-t pt-2">
            <AmountLine label="Total Amount (OMR):" value={omr(row.amount)} strong />
          </div>
        </DetailCard>

        <DetailCard icon={Landmark} title="Payment Method & Details">
          <DetailLines
            lines={[
              ["Payment Method:", lease.method || "-"],
              ...paymentFacts(lease, row, bankAccounts, count).map((fact) => [
                fact.label + ":",
                fact.value,
              ]),
            ]}
          />
        </DetailCard>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Label
          htmlFor={fieldId("installmentNote")}
          className="flex shrink-0 items-center gap-2 text-primary"
        >
          <FileText className="h-5 w-5" />
          Notes
        </Label>
        <div className="relative min-w-0 flex-1">
          <Input
            id={fieldId("installmentNote")}
            value={entry.note}
            maxLength={NOTE_LIMIT}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Enter notes for this installment..."
            autoComplete="off"
            className="pr-20"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {entry.note.length}/{NOTE_LIMIT}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={save}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button type="button" variant="outline" onClick={clear}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
