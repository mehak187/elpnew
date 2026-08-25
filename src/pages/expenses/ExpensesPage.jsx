import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import { Wallet, Plus, Paperclip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/lib/expenses/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { findType, linkLabel } from "./links";
import {
  expenseRecords,
  isApprovedRequest,
  settlement,
  invoiceTotal,
  formatDate,
  money,
} from "./expenseData";

/**
 * The boxes above the table, each one also the filter for it.
 *
 * "Awaiting Approval" is the odd one out: it counts what has not arrived here
 * yet, so it reads from the requests rather than the expenses and sends you to
 * the request list instead of filtering.
 */
const GROUPS = [
  { key: "all", label: "All Expenses", match: () => true },
  {
    key: "court",
    label: "Court Expenses",
    match: (row) => row.lines.some((l) => l.typeKey === "court-case"),
  },
  {
    key: "general",
    label: "General Expenses",
    match: (row) =>
      row.lines.some((l) =>
        ["office", "admin-financial", "marketing", "donations", "other"].includes(
          l.typeKey
        )
      ),
  },
  {
    key: "employee",
    label: "Employee Expenses",
    match: (row) =>
      row.lines.some((l) => ["employee", "advances-loans"].includes(l.typeKey)),
  },
  {
    key: "asset",
    label: "Asset Expenses",
    match: (row) => row.lines.some((l) => l.typeKey === "fixed-assets"),
  },
];

/** A count and a total, sitting on the filter it applies. */
function SummaryTile({ label, count, amount, selected, onClick, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
        selected ? "border-primary bg-secondary" : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn("text-lg font-bold", tone || "text-primary")}>{count}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{money(amount)}</p>
    </button>
  );
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { expenses, invoices, removeExpense } = useExpenses();
  const { suppliers } = useSuppliers();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [group, setGroup] = useState("all");

  const accountFor = (name) => suppliers.find((s) => s.name === name) || null;

  const records = expenseRecords(expenses, invoices);
  const rows = records
    .filter(GROUPS.find((g) => g.key === group)?.match || (() => true))
    // Newest first to read, though the numbers were given oldest first.
    .slice()
    .reverse();

  const total = rows.reduce((sum, row) => sum + row.total, 0);

  // What has not reached this table yet.
  const awaiting = invoices.filter((i) => !isApprovedRequest(i));
  const awaitingTotal = awaiting.reduce((sum, i) => sum + invoiceTotal(i), 0);

  const columns = [
    {
      key: "expenseNo",
      header: "Expense ID",
      width: "8%",
      cellClassName: "font-medium",
      render: (value, row) => (
        <div>
          <span className="block">{value}</span>
          {row.reference && (
            <span className="block text-xs text-muted-foreground">
              {row.reference}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      width: "14%",
      render: (value, row) => {
        if (!value) {
          const link = linkLabel(row.linkKind, row.linkId);
          return link ? (
            <Badge variant="secondary">{link}</Badge>
          ) : (
            <span className="text-muted-foreground">Recorded directly</span>
          );
        }
        const account = accountFor(value);
        return (
          <div>
            <span className="block">{value}</span>
            <span className="block text-xs text-muted-foreground">
              {account?.bank || "-"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {account?.accountNumber || "-"}
            </span>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Invoice Date / Number",
      width: "13%",
      render: (value, row) => (
        <div className="text-muted-foreground">
          <span className="block text-foreground">{formatDate(value)}</span>
          {row.invoiceNumber && (
            <span className="block text-xs">{row.invoiceNumber}</span>
          )}
          {row.source === "request" &&
            (row.invoiceFile ? (
              <span
                title={row.invoiceFile}
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary"
              >
                <Paperclip className="h-3 w-3" />
                Invoice
              </span>
            ) : (
              <span className="text-xs">No invoice copy</span>
            ))}
        </div>
      ),
    },
    {
      key: "lines",
      header: "Invoice Details",
      width: "20%",
      render: (value) => (
        <div className="space-y-1 text-xs text-muted-foreground">
          {value.map((line) => (
            <div key={line.id}>
              <span className="block font-medium text-foreground">
                {findType(line.typeKey)?.name}
              </span>
              <span className="block">{line.path.join(" / ")}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "total",
      header: "Invoice Amount",
      width: "11%",
      className: "text-right",
      cellClassName: "text-right",
      render: (value, row) => (
        <div>
          <span className="block font-semibold">{money(value)}</span>
          <span className="block text-xs text-muted-foreground">
            Net {money(row.net)}
          </span>
          <span className="block text-xs text-muted-foreground">
            VAT {money(row.tax)}
          </span>
        </div>
      ),
    },
    {
      key: "paid",
      header: "Status",
      width: "9%",
      render: (value, row) => {
        const state = settlement(value, row.total);
        return <Badge variant={state.variant}>{state.label}</Badge>;
      },
    },
    {
      key: "payments",
      header: "Payment Details",
      width: "15%",
      disableFilter: true,
      render: (value) =>
        value.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {value.map((payment) => (
              <div key={payment.id}>
                <span className="block text-foreground">
                  {formatDate(payment.date)} · {money(payment.amount)}
                </span>
                {payment.fromAccount && (
                  <span className="block">{payment.fromAccount}</span>
                )}
                {payment.reference && <span className="block">{payment.reference}</span>}
                {payment.document && (
                  <span
                    title={payment.document}
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    <Paperclip className="h-3 w-3" />
                    Receipt
                  </span>
                )}
              </div>
            ))}
          </div>
        ),
    },
    {
      key: "createdBy",
      header: "Transaction Audit Trail",
      width: "14%",
      disableFilter: true,
      render: (value, row) => (
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {value ? (
            <span className="block">
              Raised by <span className="text-foreground">{value}</span>
            </span>
          ) : (
            <span className="block">Recorded directly</span>
          )}
          <span className="block">{formatDate(row.createdAt)}</span>
          {row.approvedBy && (
            <>
              <span className="block pt-1">
                Approved by <span className="text-foreground">{row.approvedBy}</span>
              </span>
              <span className="block">{formatDate(row.approvedAt)}</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "5%",
      disableFilter: true,
      render: (_, row) =>
        row.source === "expense" ? (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              title="Delete expense"
              onClick={() => removeExpense(row.expenseId)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete expense</span>
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Wallet className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Expenses
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              {rows.length} {rows.length === 1 ? "expense" : "expenses"} &middot;{" "}
              {money(total)}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/expenses/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Each box is also the filter for the table below it */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <SummaryTile
          label="Awaiting Approval"
          count={awaiting.length}
          amount={awaitingTotal}
          tone="text-amber-600"
          onClick={() => navigate("/expense-requests")}
        />
        {GROUPS.map((option) => {
          const matching = records.filter(option.match);
          return (
            <SummaryTile
              key={option.key}
              label={option.label}
              count={matching.length}
              amount={matching.reduce((sum, row) => sum + row.total, 0)}
              selected={group === option.key}
              onClick={() => {
                setGroup(option.key);
                setCurrentPage(1);
              }}
            />
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Search expenses..."
            exportFileName="expenses.csv"
            enableColumnSearch={false}
            onAdd={() => navigate("/expenses/create")}
            addLabel="Add Expense"
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
