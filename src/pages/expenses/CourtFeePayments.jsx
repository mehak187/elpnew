import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import { Briefcase, Plus } from "lucide-react";
import { useExpenses } from "@/lib/expenses/context";
import { judicialTotals } from "./judicialData";
import { formatDate, money } from "./expenseData";

/** One field inside a stacked column. */
function Line({ label, children }) {
  return (
    <p className="leading-tight">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <span className="block">{children || "-"}</span>
    </p>
  );
}

/**
 * Judicial authority expenses.
 *
 * Every row is one payment made to a court on a case's behalf, so the table
 * reads across the case it belongs to, what the money was for, and the transfer
 * it went out on - each of those kept together in its own column rather than
 * spread over a dozen narrow ones.
 */
export default function CourtFeePayments() {
  const navigate = useNavigate();
  const { judicialExpenses } = useExpenses();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const tiles = judicialTotals(judicialExpenses);
  const all = tiles[0];

  const columns = [
    {
      key: "branch",
      header: "Branch",
      subHeader: "(Office Branch)",
      width: "8%",
      cellClassName: "font-medium",
    },
    {
      key: "client",
      header: "Case Parties",
      subHeader: "(Client / Opponent)",
      width: "13%",
      exportValue: (row) => row.client + " / " + row.opponent,
      render: (_, row) => (
        <div className="space-y-1.5 text-xs">
          <Line label="Client:">
            <span className="font-medium">{row.client}</span>
          </Line>
          <Line label="Opponent:">{row.opponent}</Line>
        </div>
      ),
    },
    {
      key: "caseNo",
      header: "Case Details",
      subHeader: "(Court · Level · Number · Location)",
      width: "16%",
      exportValue: (row) =>
        [row.court, row.level, row.caseNo, row.location].join(" · "),
      render: (_, row) => (
        <div className="space-y-1.5 text-xs">
          <Line label="Court:">{row.court}</Line>
          <Line label="Level:">{row.level}</Line>
          <Line label="Case No.:">{row.caseNo}</Line>
          <Line label="Location:">{row.location}</Line>
        </div>
      ),
    },
    {
      key: "expenseType",
      header: "Expense Details",
      subHeader: "(Type · Category · Subcategory)",
      width: "15%",
      exportValue: (row) =>
        [row.expenseType, row.category, row.subcategory].join(" · "),
      render: (_, row) => (
        <div className="space-y-1.5 text-xs">
          <Line label="Expense Type:">
            <span className="font-medium">{row.expenseType}</span>
          </Line>
          <Line label="Category:">{row.category}</Line>
          <Line label="Subcategory:">{row.subcategory}</Line>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount Paid to Court",
      subHeader: "(Payment Amount)",
      width: "12%",
      render: (value) => (
        <p className="text-lg font-bold text-primary">{money(value)}</p>
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment Details",
      subHeader: "(Method · Bank · Account · Receipt)",
      width: "16%",
      exportValue: (row) =>
        [row.paymentMethod, row.bank, row.accountNo].join(" · "),
      render: (_, row) => (
        <div className="space-y-1.5 text-xs">
          <Line label="Payment Method:">{row.paymentMethod}</Line>
          <Line label="Bank:">{row.bank}</Line>
          <Line label="Account No.:">{row.accountNo}</Line>
          <Line label="Payment Receipt:">
            <a
              href={row.receipt}
              onClick={(event) => event.preventDefault()}
              title={row.receipt}
              className="text-primary underline-offset-2 hover:underline"
            >
              View Payment Receipt
            </a>
          </Line>
        </div>
      ),
    },
    {
      key: "status",
      header: "Transaction Tracking",
      subHeader: "(Submitted · Approved · Status)",
      width: "16%",
      exportValue: (row) =>
        row.submittedBy + " · " + row.approvedBy + " · " + row.status,
      render: (_, row) => (
        <div className="space-y-1.5 text-xs">
          <Line label="Submitted By:">
            {row.submittedBy}
            <span className="block text-muted-foreground">
              {formatDate(row.submittedAt)} - {row.submittedTime}
            </span>
          </Line>
          <Line label="Approved By:">
            {row.approvedBy}
            <span className="block text-muted-foreground">
              {formatDate(row.approvedAt)} - {row.approvedTime}
            </span>
          </Line>
          <Line label="Status:">
            <Badge variant={row.status === "Approved" ? "success" : "warning"}>
              {row.status}
            </Badge>
          </Line>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Briefcase className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Judicial Authority Expenses
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              {all.count} expenses · {money(all.amount)}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/court-fee-payments/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* What the firm has paid the courts, by what it was paid for */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {tile.label}
              </p>
              <p className="text-lg font-bold text-primary">{tile.count}</p>
            </div>
            <p className="mt-1 text-lg font-semibold">{money(tile.amount)}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={judicialExpenses}
            searchPlaceholder="Ask anything..."
            exportFileName="judicial-authority-expenses.csv"
            enableColumnSearch={false}
            itemLabel="expenses"
            onAdd={() => navigate("/court-fee-payments/create")}
            addLabel="Add Expense"
            currentPage={currentPage}
            totalPages={Math.ceil(judicialExpenses.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
