import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/shared/DataTable";
import SummaryStrip from "@/components/shared/SummaryStrip";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_DOT } from "@/lib/constants";
import { withRial } from "@/lib/money";
import { formatDate } from "@/pages/firm/firmData";
import { clientInvoices } from "../clientMockData";

const money = (amount) =>
  withRial(amount.toLocaleString("en-GB", { minimumFractionDigits: 0 }));

/** Anything with money still owed against it. */
const isOwed = (invoice) =>
  ["Unpaid", "Overdue", "Partially Paid"].includes(invoice.status);

/** The status as a coloured dot, so the word beside it can stay plain black. */
function StatusDot({ status }) {
  const dot = INVOICE_STATUS_DOT[status] || INVOICE_STATUS_DOT.Cancelled;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border"
        style={{ backgroundColor: dot.fill, borderColor: dot.ring }}
      />
      {status}
    </span>
  );
}

/**
 * The views of this client's billing.
 *
 * `match` decides both what a box counts and what the table shows when it is
 * selected, so the figure on the box and the rows below can never disagree.
 * Anything not settled counts as unpaid, including the outstanding half of a
 * partly paid invoice - so a part payment is counted in both its own box and
 * that one, on purpose.
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
    key: "partial",
    label: "Partially Paid Invoices",
    match: (invoice) => invoice.status === "Partially Paid",
    tone: "text-amber-600",
  },
  {
    key: "unpaid",
    label: "Unpaid Invoices",
    match: isOwed,
    tone: "text-red-600",
  },
  {
    key: "cancelled",
    label: "Cancelled Invoices",
    match: (invoice) => invoice.status === "Cancelled",
    tone: "text-muted-foreground",
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

  // How long the oldest debt has been standing, which is what decides whether
  // this client needs chasing at all.
  const oldestDue = clientInvoices
    .filter(isOwed)
    .map((invoice) => invoice.dueDate)
    .sort()[0];

  const columns = [
    {
      // The invoice is the row, so its number leads - and carries its
      // standing with it rather than in a column of its own.
      key: "invoiceNo",
      header: "Invoice No.",
      width: "18%",
      exportValue: (row) => row.invoiceNo + " (" + row.status + ")",
      render: (value, row) => (
        <div>
          <span className="block font-medium">{value}</span>
          <span className="mt-0.5 block text-xs font-medium">
            <StatusDot status={row.status} />
          </span>
        </div>
      ),
    },
    { key: "date", header: "Invoice Date", width: "14%" },
    { key: "dueDate", header: "Due Date", width: "13%" },
    { key: "details", header: "Details", width: "24%" },
    {
      key: "amount",
      header: "Invoice Amount",
      width: "15%",
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
      key: "notes",
      header: "Notes",
      width: "16%",
      render: (value) =>
        value || <span className="text-muted-foreground">-</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Each cell is also the filter for the table below it, so the
          figure and the rows it stands for can never disagree. */}
      <SummaryStrip
        items={[
          ...VIEWS.map((option) => {
            const matching = clientInvoices.filter(option.match);
            return {
              key: option.key,
              label: option.label,
              count: matching.length,
              tone: option.tone,
              value: money(matching.reduce((sum, i) => sum + i.amount, 0)),
              selected: view === option.key,
              onClick: () => {
                setView(option.key);
                setCurrentPage(1);
              },
            };
          }),
          {
            // A date rather than a count, so it opens what is owed
            // instead of filtering to itself.
            key: "oldest",
            label: "Oldest Unpaid Invoice Date",
            tone: "text-muted-foreground",
            value: (
              <span className="text-amber-600">
                {oldestDue ? formatDate(oldestDue) : "-"}
              </span>
            ),
            note: "Earliest due date",
            onClick: () => {
              setView("unpaid");
              setCurrentPage(1);
            },
          },
        ]}
      />

      <Card>
        <CardContent className="grid grid-cols-1 divide-y p-0 sm:grid-cols-2 sm:divide-x lg:grid-cols-6 lg:divide-y-0">
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
                className="relative px-4 py-3 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
              >
                {/* The count belongs to the name - it says how many of
                    these there are, not a figure of its own. */}
                <p className={cn("text-sm font-semibold", option.tone)}>
                  {option.label} ({matching.length})
                </p>
                <p className="mt-1 text-lg font-bold">{money(total)}</p>
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}

          {/* A date rather than a count, so it opens what is owed instead
              of filtering to itself. */}
          <button
            type="button"
            onClick={() => {
              setView("unpaid");
              setCurrentPage(1);
            }}
            className="px-4 py-3 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
          >
            <p className="text-xs text-muted-foreground">
              Oldest Unpaid Invoice Date
            </p>
            <p className="mt-1 text-base font-bold text-amber-600">
              {oldestDue ? formatDate(oldestDue) : "-"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Earliest due date
            </p>
          </button>
        </CardContent>
      </Card>

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
