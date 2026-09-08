import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import SummaryStrip from "@/components/shared/SummaryStrip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import { Wallet, Plus } from "lucide-react";
import { useExpenses } from "@/lib/expenses/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { expenseColumns } from "./expenseColumns";
import { expenseRecords, money } from "./expenseData";

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


/**
 * A total, sitting on the filter it applies.
 *
 * The count sits beside the label because the two answer different questions -
 * how many expenses of this kind there are, and what they came to. A total on
 * its own cannot tell one large expense from twenty small ones.
 */

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

  const columns = expenseColumns({ accountFor });

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

      {/* Each cell is also the filter for the table below it */}
      <SummaryStrip
        items={GROUPS.map((option) => {
          const matching = records.filter(option.match);
          return {
            key: option.key,
            label: option.label,
            count: matching.length,
            value: money(matching.reduce((sum, row) => sum + row.total, 0)),
            selected: group === option.key,
            onClick: () => {
              setGroup(option.key);
              setCurrentPage(1);
            },
          };
        })}
      />

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
