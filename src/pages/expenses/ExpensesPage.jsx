import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import { Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/lib/expenses/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { findType, linkLabel } from "./links";
import {
  expenseRecords,
  settlement,
  formatDate,
  money,
} from "./expenseData";

/**
 * The boxes above the table, and the filters for it.
 *
 * "All Expenses" receives everything; each of the others is the same table
 * again, narrowed to one kind of expense.
 */
const GROUPS = [
  { key: "all", label: "All Expenses", match: () => true },
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
    // Salaries are a subcategory rather than a type of their own, so they are
    // read off the classification instead of the type.
    key: "salaries",
    label: "Salaries",
    match: (row) =>
      row.lines.some((l) => l.typeKey === "employee" && l.path[1] === "Salaries"),
  },
  {
    key: "office",
    label: "Office Expenses",
    match: (row) => row.lines.some((l) => l.typeKey === "office"),
  },
  {
    key: "admin-financial",
    label: "Administrative & Financial Expenses",
    match: (row) => row.lines.some((l) => l.typeKey === "admin-financial"),
  },
  {
    key: "marketing",
    label: "Marketing & Business Development",
    match: (row) => row.lines.some((l) => l.typeKey === "marketing"),
  },
  {
    key: "donations",
    label: "Donations & Assistance",
    match: (row) => row.lines.some((l) => l.typeKey === "donations"),
  },
  {
    key: "partner",
    label: "Partner Expenses",
    match: (row) => row.lines.some((l) => l.typeKey === "partner"),
  },
  {
    key: "other",
    label: "Other Expenses",
    match: (row) => row.lines.some((l) => l.typeKey === "other"),
  },
];

/** Amounts here are read against invoices, so they carry the currency and fils. */
const omr = (amount) =>
  "OMR " +
  Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

/**
 * A total, sitting on the filter it applies.
 *
 * The count sits beside the label because the two answer different questions -
 * how many expenses of this kind there are, and what they came to. A total on
 * its own cannot tell one large expense from twenty small ones.
 */
function SummaryTile({ label, count, amount, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
        selected ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold text-primary">{count}</p>
      </div>
      <p className="mt-1 text-lg font-semibold">{money(amount)}</p>
    </button>
  );
}

/** One field inside a stacked column. */
function Line({ label, children }) {
  return (
    <p className="leading-tight">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <span className="block">{children}</span>
    </p>
  );
}

/** A step in the trail, blank when nobody took it. */
function Step({ label, by, at }) {
  if (!by) return null;
  return (
    <Line label={label}>
      {by}
      <span className="block text-muted-foreground">{formatDate(at)}</span>
    </Line>
  );
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { expenses, invoices } = useExpenses();
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

  const columns = [
    {
      key: "expenseNo",
      header: "Expense ID",
      width: "6%",
      render: (value) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier Details",
      subHeader: "(Supplier Information)",
      width: "16%",
      exportValue: (row) =>
        row.supplier || linkLabel(row.linkKind, row.linkId) || "Recorded directly",
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
          <div className="space-y-1.5 text-xs">
            <Line label="Supplier ID:">
              <span className="text-primary">{account?.supplierId || "-"}</span>
            </Line>
            <p className="font-semibold text-primary">{value}</p>
            <Line label="Bank:">{account?.bank || "-"}</Line>
            <Line label="Account No.:">{account?.accountNumber || "-"}</Line>
            <Line label="Income Tax No.:">
              {account?.taxIdentificationNumber || "-"}
            </Line>
            <Line label="VAT No.:">{account?.vatNumber || "-"}</Line>
            <Line label="Commercial Registration:">
              {account?.commercialRegistration || "-"}
            </Line>
          </div>
        );
      },
    },
    {
      key: "lines",
      header: "Expense Details",
      subHeader: "(Expense Information)",
      width: "16%",
      exportValue: (row) =>
        row.lines
          .map(
            (l) => findType(l.typeKey)?.name + " · " + l.path.join(" / ")
          )
          .join(" | "),
      render: (value) => (
        <div className="space-y-2 text-xs">
          {value.map((line) => (
            <div key={line.id} className="space-y-1.5">
              <Line label="Expense Type:">
                <span className="font-medium">
                  {findType(line.typeKey)?.name}
                </span>
              </Line>
              <Line label="Category:">{line.path[0] || "-"}</Line>
              <Line label="Sub Category:">{line.path[1] || "-"}</Line>
              {line.description && (
                <Line label="Note:">{line.description}</Line>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "date",
      header: "Invoice Details",
      subHeader: "(Invoice Date · Number · View Invoice)",
      width: "13%",
      exportValue: (row) =>
        formatDate(row.date) + (row.invoiceNumber ? " · " + row.invoiceNumber : ""),
      render: (value, row) => (
        <div className="space-y-1.5 text-xs">
          <Line label="Invoice Date:">{formatDate(value)}</Line>
          <Line label="Invoice Number:">
            <span className="text-primary">{row.invoiceNumber || "-"}</span>
          </Line>
          {row.source === "request" && (
            <Line label="View Invoice:">
              {row.invoiceFile ? (
                <a
                  href={row.invoiceFile}
                  onClick={(event) => event.preventDefault()}
                  title={row.invoiceFile}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Click to view invoice
                </a>
              ) : (
                <span className="text-muted-foreground">No invoice copy</span>
              )}
            </Line>
          )}
        </div>
      ),
    },
    {
      key: "total",
      header: "Invoice Amount",
      subHeader: "(Invoice Information)",
      width: "14%",
      render: (value, row) => {
        const state = settlement(row.paid, row.total);
        const rate = row.net ? Math.round((row.tax / row.net) * 100) : 0;
        return (
          <div className="space-y-1.5 text-xs">
            <p className="text-base font-bold text-primary">{omr(value)}</p>
            <Line label="Total Amount (Incl. VAT):">{omr(value)}</Line>
            <Line label="Amount Before VAT:">{omr(row.net)}</Line>
            <Line label={"VAT Amount (" + rate + "%):"}>{omr(row.tax)}</Line>
            <Badge variant={state.variant}>{state.label}</Badge>
          </div>
        );
      },
    },
    {
      key: "payments",
      header: "Payment Details",
      subHeader: "(Payment Information)",
      width: "17%",
      exportValue: (row) =>
        row.payments.map((p) => formatDate(p.date) + " " + p.amount).join(" | "),
      render: (value, row) =>
        value.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <div className="space-y-2 text-xs">
            {value.map((payment) => (
              <div key={payment.id} className="space-y-1.5">
                <Line label="Payment Date:">{formatDate(payment.date)}</Line>
                <Line label="Amount Paid:">{omr(payment.amount)}</Line>
                {payment.method && (
                  <Line label="Payment Method:">{payment.method}</Line>
                )}
                {payment.fromAccount && (
                  <Line label="Transferred From:">{payment.fromAccount}</Line>
                )}
                {row.supplier && (
                  <Line label="Transferred To:">{row.supplier}</Line>
                )}
                {payment.document && (
                  <Line label="Payment Proof:">
                    <a
                      href={payment.document}
                      onClick={(event) => event.preventDefault()}
                      title={payment.document}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Click to view proof
                    </a>
                  </Line>
                )}
              </div>
            ))}
          </div>
        ),
    },
    {
      key: "createdBy",
      header: "Request Tracking",
      subHeader: "(Request · Approval · Authorization · Payment)",
      width: "18%",
      exportValue: (row) =>
        row.tracking
          ? [
              row.tracking.requested.by,
              row.tracking.accountant.by,
              row.tracking.finance.by,
              row.tracking.paid.by,
            ]
              .filter(Boolean)
              .join(" · ")
          : "Recorded directly",
      render: (_, row) => {
        if (!row.tracking) {
          return (
            <span className="text-xs text-muted-foreground">
              Recorded directly on {formatDate(row.date)}
            </span>
          );
        }
        return (
          <div className="space-y-1.5 text-xs">
            <Step
              label="Requested By:"
              by={row.tracking.requested.by}
              at={row.tracking.requested.at}
            />
            <Step
              label="Approved By Accountant:"
              by={row.tracking.accountant.by}
              at={row.tracking.accountant.at}
            />
            <Step
              label="Approved By Finance Manager:"
              by={row.tracking.finance.by}
              at={row.tracking.finance.at}
            />
            <Step
              label="Paid By:"
              by={row.tracking.paid.by}
              at={row.tracking.paid.at}
            />
          </div>
        );
      },
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
            itemLabel="expenses"
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
