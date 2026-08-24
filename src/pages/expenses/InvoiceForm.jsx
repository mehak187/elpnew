import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  ReceiptText,
  FileText,
  CreditCard,
  Plus,
  Trash2,
  Paperclip,
  FileX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GENERAL_TYPES, isPathComplete } from "@/lib/expenses/taxonomy";
import ExpenseClassificationPicker from "./ExpenseClassificationPicker";
import { findType } from "./links";
import { dayOffset, money } from "./expenseData";
import { useSuppliers } from "@/lib/suppliers/context";
import NewSupplierDialog from "@/pages/suppliers/NewSupplierDialog";

/** A titled block of fields, with an optional action in its header. */
function FormSection({ icon: Icon, title, action, children }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-2">
            {Icon && <Icon className="h-4 w-4 text-secondary-foreground" />}
          </div>
          <h2 className="font-semibold text-primary">{title}</h2>
        </div>
        {action}
      </div>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  );
}

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

const lineTotalOf = (line) =>
  (Number(line.amountBeforeTax) || 0) + (Number(line.taxAmount) || 0);

export default function InvoiceForm({ onCancel, onSubmit }) {
  // Only suppliers still in use can be billed against.
  const { suppliers } = useSuppliers();
  const activeSuppliers = suppliers.filter((s) => s.status === "Active");
  const [invoiceDate, setInvoiceDate] = useState(dayOffset(0));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceFile, setInvoiceFile] = useState("");
  // Whether a copy of the supplier invoice is coming, decided here rather than
  // deferred: a request with no invoice behind it has to say so up front.
  const [invoiceCopy, setInvoiceCopy] = useState("upload");
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState("");

  const noInvoice = invoiceCopy === "none";

  const updateLine = (id, changes) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...changes } : l)));

  const lineComplete = (line) => {
    const type = findType(line.typeKey);
    const described = type?.requiresDescription
      ? line.description.trim().length > 0
      : true;
    return (
      isPathComplete(type, line.path) &&
      described &&
      Number(line.amountBeforeTax) > 0
    );
  };

  // Nothing below the invoice data is asked for until the invoice itself is
  // identified - there is no point classifying an expense against a supplier
  // and a document that have not been named yet.
  const invoiceDataComplete =
    Boolean(invoiceDate) &&
    invoiceNumber.trim().length > 0 &&
    Boolean(supplier) &&
    (noInvoice || Boolean(invoiceFile));

  const net = lines.reduce((sum, l) => sum + (Number(l.amountBeforeTax) || 0), 0);
  const tax = lines.reduce((sum, l) => sum + (Number(l.taxAmount) || 0), 0);
  const total = net + tax;

  const submit = () => {
    if (!invoiceNumber.trim()) return setError("Enter the invoice number.");
    if (!supplier) return setError("Select the supplier.");
    if (!noInvoice && !invoiceFile)
      return setError("Upload the invoice copy, or mark it as no invoice.");
    if (!lines.every(lineComplete))
      return setError(
        "Every row needs a full classification and an amount before tax. Other Expenses also needs a description."
      );

    onSubmit({
      invoiceDate,
      invoiceNumber,
      supplier,
      invoiceFile: noInvoice ? "" : invoiceFile,
      noInvoice,
      lines: lines.map((l) => ({
        ...l,
        amountBeforeTax: Number(l.amountBeforeTax),
        taxAmount: Number(l.taxAmount) || 0,
      })),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ------------------------------------------------------ Invoice Data */}
      <FormSection icon={ReceiptText} title="Invoice Data">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Invoice Date *</Label>
            <Input
              id="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>

          {/* The invoice copy sits with the number it belongs to. Whether one
              is coming is settled here rather than deferred. */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <div className="flex gap-1.5">
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Invoice no."
                className="min-w-0 flex-1"
              />
              <label
                title="Upload Invoice Copy"
                className={cn(
                  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium",
                  noInvoice
                    ? "text-muted-foreground hover:bg-muted/50"
                    : "border-primary bg-primary text-primary-foreground"
                )}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Upload Copy
                <Input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files[0]) return;
                    setInvoiceCopy("upload");
                    setInvoiceFile(e.target.files[0].name);
                  }}
                />
              </label>
              <Button
                type="button"
                title="No Invoice"
                variant={noInvoice ? "default" : "outline"}
                className="h-9 shrink-0 gap-1 px-2.5 text-xs"
                onClick={() => {
                  setInvoiceCopy("none");
                  setInvoiceFile("");
                }}
              >
                <FileX className="h-3.5 w-3.5" />
                No Invoice
              </Button>
            </div>

            {noInvoice && (
              <p className="text-xs text-muted-foreground">
                Raised without a supplier invoice.
              </p>
            )}
            {!noInvoice && invoiceFile && (
              <div className="flex h-8 items-center justify-between gap-2 rounded-md bg-muted px-3">
                <span className="truncate text-xs">{invoiceFile}</span>
                <button
                  type="button"
                  onClick={() => setInvoiceFile("")}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove invoice</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier *</Label>
            <div className="flex gap-2">
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger id="supplier" className="flex-1">
                  <SelectValue placeholder="Please Select" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                title="Add a new supplier"
                onClick={() => setAddingSupplier(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add a new supplier</span>
              </Button>
            </div>
          </div>

        </div>
      </FormSection>

      <NewSupplierDialog
        open={addingSupplier}
        onOpenChange={setAddingSupplier}
        onCreated={setSupplier}
      />

      {!invoiceDataComplete && (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Fill in the invoice data above to carry on with the expense details.
        </p>
      )}

      {/* --------------------------------------------------- Expense Details */}
      {invoiceDataComplete && (
        <FormSection
          icon={FileText}
          title="Expense Details"
          action={
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Add a row"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              <Plus className="h-4 w-4" />
            </Button>
          }
        >
          <div className="space-y-5">
            {lines.map((line, index) => {
              const type = findType(line.typeKey);
              const classified = isPathComplete(type, line.path);

              return (
                <div
                  key={line.id}
                  className={cn(index > 0 && "border-t pt-5", "space-y-4")}
                >
                  {lines.length > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">
                        Row {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.id !== line.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove row {index + 1}</span>
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <ExpenseClassificationPicker
                      types={GENERAL_TYPES}
                      idPrefix={"line-" + line.id}
                      value={line}
                      onChange={(next) => updateLine(line.id, next)}
                    />

                    {classified && (
                      <>
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
                            placeholder="0.00"
                          />
                        </div>

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
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={"linetotal-" + line.id}>
                            Total Amount (OMR)
                          </Label>
                          <Input
                            id={"linetotal-" + line.id}
                            value={lineTotalOf(line).toFixed(2)}
                            readOnly
                            disabled
                            className="bg-muted"
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2 lg:col-span-4">
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
                            placeholder="What is being claimed"
                            className={cn(
                              type?.requiresDescription &&
                                !line.description.trim() &&
                                "border-amber-400"
                            )}
                          />
                        </div>
                      </>
                    )}

                    {!classified && (
                      <p className="self-end pb-2 text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
                        Choose the expense type, category and subcategory to
                        continue.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </FormSection>
      )}

      {/* ------------------------------------------------------------ Totals */}
      {invoiceDataComplete && (
        <FormSection icon={CreditCard} title="Total Amount">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="netTotal">Amount Before Tax (OMR)</Label>
              <Input
                id="netTotal"
                value={net.toFixed(2)}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxTotal">Tax Amount (OMR)</Label>
              <Input
                id="taxTotal"
                value={tax.toFixed(2)}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceTotal">Total Amount (OMR)</Label>
              <Input
                id="invoiceTotal"
                value={total.toFixed(2)}
                readOnly
                disabled
                className="bg-muted font-bold text-primary"
              />
            </div>
          </div>
        </FormSection>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {invoiceDataComplete && (
          <Button onClick={submit}>
            Submit Request &mdash; {money(total)}
          </Button>
        )}
      </div>
    </div>
  );
}
