import { useState } from "react";
import DataTable from "@/components/shared/DataTable";
import SummaryStrip from "@/components/shared/SummaryStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { withRial } from "@/lib/money";
import { useExpenses } from "@/lib/expenses/context";
import {
  invoiceTotal,
  amountPaid,
  settlement,
  STATUS,
  STATUS_VARIANT,
} from "@/pages/expenses/expenseData";

const money = (amount) =>
  withRial(
    Number(amount || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );

/** One fact about the supplier, as it reads above their payments. */
function Detail({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{children || "-"}</p>
    </div>
  );
}

/**
 * What this supplier has been billed and what has been paid against it.
 *
 * Read off the expense records rather than held here: a payment is recorded
 * once, where it happens, and this page is one more way of looking at the same
 * ledger. Nothing on it can therefore disagree with the Expenses page.
 */
export default function SupplierPaymentsSection({ supplier }) {
  const { invoices } = useExpenses();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Every invoice raised against this supplier, wherever it has got to.
  // A bill still working its way through approval is money the firm owes
  // and the supplier is waiting for, so leaving it out would understate
  // both sides.
  const rows = invoices
    .filter((invoice) => invoice.supplier === supplier.name)
    .map((invoice) => ({
      id: invoice.id,
      reference: invoice.reference,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.invoiceDate,
      lines: invoice.lines,
      status: invoice.status,
      total: invoiceTotal(invoice),
      paid: amountPaid(invoice),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const billed = rows.reduce((sum, row) => sum + row.total, 0);
  const paid = rows.reduce((sum, row) => sum + row.paid, 0);

  const columns = [
    {
      key: "reference",
      header: "Reference",
      width: "16%",
      cellClassName: "font-medium",
      render: (value, row) => (
        <div>
          <p>{value || "-"}</p>
          <p className="text-xs text-muted-foreground">
            {row.invoiceNumber || "No invoice number"}
          </p>
        </div>
      ),
    },
    { key: "date", header: "Date", width: "13%" },
    {
      key: "lines",
      header: "What it was for",
      width: "27%",
      exportValue: (row) =>
        row.lines.map((line) => line.description).filter(Boolean).join(" | "),
      render: (_, row) => (
        <div className="space-y-0.5">
          {row.lines.map((line) => (
            <p key={row.id + "-" + line.id} className="text-xs">
              <span className="font-medium">{line.path.join(" - ")}</span>
              {line.description && (
                <span className="text-muted-foreground">
                  {" "}
                  &bull; {line.description}
                </span>
              )}
            </p>
          ))}
        </div>
      ),
    },
    {
      // Billed, settled, and what is left - the last one worked out here so it
      // can never contradict the two it comes from.
      key: "total",
      header: "Amount",
      width: "22%",
      exportValue: (row) =>
        row.total + " billed, " + row.paid + " paid",
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-medium">{money(value)}</p>
          <p className="text-xs text-green-700">{money(row.paid)} paid</p>
          {row.total - row.paid > 0 && (
            <p className="text-xs text-red-600">
              {money(row.total - row.paid)} outstanding
            </p>
          )}
        </div>
      ),
    },
    {
      // Where the request stands, and beneath it how much of it is
      // settled - two different questions, both worth answering.
      key: "status",
      header: "Status",
      width: "22%",
      exportValue: (row) =>
        STATUS[row.status] + " - " + settlement(row.paid, row.total).label,
      render: (value, row) => {
        const state = settlement(row.paid, row.total);
        return (
          <div className="space-y-1">
            <Badge variant={STATUS_VARIANT[value]}>{STATUS[value]}</Badge>
            <p className="text-xs text-muted-foreground">{state.label}</p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Who is being paid, before what they have been paid. Read only:
          the supplier is edited on Supplier Information, and one record
          edited in two places is two records waiting to disagree. */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <Detail label="Supplier Name">{supplier.name}</Detail>
            <Detail label="Category">{supplier.category}</Detail>
            <Detail label="Commercial Registration (CR)">
              {supplier.commercialRegistration}
            </Detail>
            <Detail label="Tax Identification Number (TIN)">
              {supplier.taxIdentificationNumber}
            </Detail>

            <Detail label="VAT Number">{supplier.vatNumber}</Detail>
            <Detail label="Supplier's Bank">{supplier.bank}</Detail>
            <Detail label="Supplier's Account Number">
              {supplier.accountNumber}
            </Detail>
            <Detail label="Phone Number">{supplier.phone}</Detail>

            <Detail label="Status">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    supplier.status === "Active"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  )}
                />
                {supplier.status}
              </span>
            </Detail>
          </div>
        </CardContent>
      </Card>

      <SummaryStrip
        items={[
          { label: "Billed", count: rows.length, value: money(billed) },
          { label: "Paid", tone: "text-green-600", value: money(paid) },
          {
            label: "Outstanding",
            tone: "text-red-600",
            value: money(billed - paid),
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Ask about this supplier's payments..."
        exportFileName="supplier-payments.csv"
        enableColumnSearch={false}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
