import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/shared/DataTable";
import { INVOICE_STATUS_VARIANT } from "@/lib/constants";
import { clientInvoices } from "../clientMockData";

const money = (amount) =>
  "OMR " + amount.toLocaleString("en-GB", { minimumFractionDigits: 0 });

// Cancelled invoices are counted but carry no money, so they are left out of
// every total rather than inflating what the client appears to owe.
function summarise(invoices) {
  const live = invoices.filter((i) => i.status !== "Cancelled");
  const totalAmount = live.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = live.reduce((sum, i) => sum + i.paidAmount, 0);
  const overdueAmount = live
    .filter((i) => i.status === "Overdue")
    .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

  return {
    totalInvoices: invoices.length,
    totalAmount,
    paidAmount,
    outstandingAmount: totalAmount - paidAmount,
    overdueAmount,
  };
}

function SummaryTile({ label, value, tone }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <p className="text-xs leading-snug text-muted-foreground">{label}</p>
        <p className={"mt-2 text-lg font-bold " + (tone || "text-primary")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function InvoicesSection() {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const summary = summarise(clientInvoices);

  const columns = [
    { key: "date", header: "Date", width: "12%" },
    {
      key: "invoiceNo",
      header: "Invoice No.",
      width: "16%",
      cellClassName: "font-medium",
    },
    { key: "details", header: "Details", width: "26%" },
    {
      key: "amount",
      header: "Invoice Amount",
      width: "16%",
      className: "text-right",
      cellClassName: "text-right",
      render: (value, row) => (
        <div>
          <p className="font-medium">{money(value)}</p>
          {row.paidAmount > 0 && row.paidAmount < value && (
            <p className="text-xs text-muted-foreground">
              {money(row.paidAmount)} paid
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "14%",
      render: (value) => (
        <Badge variant={INVOICE_STATUS_VARIANT[value]}>{value}</Badge>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      width: "16%",
      render: (value) =>
        value || <span className="text-muted-foreground">-</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Financial position with this client at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryTile label="Total Invoices" value={summary.totalInvoices} />
        <SummaryTile label="Total Amount" value={money(summary.totalAmount)} />
        <SummaryTile
          label="Paid Amount"
          value={money(summary.paidAmount)}
          tone="text-green-600"
        />
        <SummaryTile
          label="Outstanding Amount"
          value={money(summary.outstandingAmount)}
          tone="text-amber-600"
        />
        <SummaryTile
          label="Overdue Amount"
          value={money(summary.overdueAmount)}
          tone="text-red-600"
        />
      </div>

      <DataTable
        columns={columns}
        data={clientInvoices}
        searchPlaceholder="Search invoices..."
        enableColumnSearch={false}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
