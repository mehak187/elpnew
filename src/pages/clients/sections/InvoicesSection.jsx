import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/shared/DataTable";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_VARIANT } from "@/lib/constants";
import { withRial } from "@/components/shared/money";
import { clientInvoices } from "../clientMockData";

const money = (amount) =>
  withRial(amount.toLocaleString("en-GB", { minimumFractionDigits: 0 }));

/**
 * The three views of this client's billing.
 *
 * `match` decides both what a box counts and what the table shows when it is
 * selected, so the figure on the box and the rows below can never disagree.
 * Anything not settled counts as unpaid, including the outstanding half of a
 * partly paid invoice.
 */
const VIEWS = [
  {
    key: "all",
    label: "Total Invoices",
    match: () => true,
    tone: "text-primary",
  },
  {
    key: "paid",
    label: "Paid Invoices",
    match: (invoice) => invoice.status === "Paid",
    tone: "text-green-600",
  },
  {
    key: "unpaid",
    label: "Unpaid Invoices",
    match: (invoice) =>
      ["Unpaid", "Overdue", "Partially Paid"].includes(invoice.status),
    tone: "text-red-600",
  },
];

export default function InvoicesSection() {
  const [view, setView] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const active = VIEWS.find((v) => v.key === view);

  let rows = clientInvoices.filter(active.match);
  // Chasing money starts with whatever has been owed the longest.
  if (view === "unpaid") {
    rows = [...rows].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  const columns = [
    { key: "date", header: "Date", width: "11%" },
    {
      key: "invoiceNo",
      header: "Invoice No.",
      width: "15%",
      cellClassName: "font-medium",
    },
    { key: "dueDate", header: "Due Date", width: "11%" },
    { key: "details", header: "Details", width: "22%" },
    {
      key: "amount",
      header: "Invoice Amount",
      width: "15%",
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
      width: "12%",
      render: (value) => (
        <Badge variant={INVOICE_STATUS_VARIANT[value]}>{value}</Badge>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      width: "14%",
      render: (value) =>
        value || <span className="text-muted-foreground">-</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Each box is also the filter for the table below it */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {VIEWS.map((option) => {
          const matching = clientInvoices.filter(option.match);
          const total = matching.reduce((sum, i) => sum + i.amount, 0);
          const selected = view === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setView(option.key);
                setCurrentPage(1);
              }}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                selected ? "border-primary bg-secondary" : "hover:bg-muted/50"
              )}
            >
              <p className="text-xs text-muted-foreground">{option.label}</p>
              <p className={cn("mt-1 text-2xl font-bold", option.tone)}>
                {matching.length}
              </p>
              <p className="mt-1 text-sm font-medium">{money(total)}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Search invoices..."
            exportFileName="client-invoices.csv"
            enableColumnSearch={false}
            currentPage={currentPage}
            totalPages={Math.ceil(rows.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
