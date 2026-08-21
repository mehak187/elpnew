import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { EXPENSE_TYPES } from "@/lib/expenses/taxonomy";
import { useExpenses } from "@/lib/expenses/context";
import { findType, linkLabel } from "./links";
import { formatDate, money } from "./expenseData";

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { expenses, removeExpense } = useExpenses();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");

  // Flattened for the table, so search and export see plain text.
  const rows = expenses
    .map((expense) => ({
      ...expense,
      typeName: findType(expense.typeKey)?.name || "",
      category: expense.path[0] || "",
      subcategory: expense.path[1] || "",
      linkedTo: linkLabel(expense.linkKind, expense.linkId),
    }))
    .filter((expense) => typeFilter === "all" || expense.typeKey === typeFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = rows.reduce((sum, e) => sum + e.amount, 0);

  const columns = [
    {
      key: "date",
      header: "Date",
      width: "10%",
      render: (value) => formatDate(value),
    },
    {
      key: "typeName",
      header: "Expense Type",
      width: "20%",
      cellClassName: "font-medium",
      filterComponent: (
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EXPENSE_TYPES.map((type) => (
              <SelectItem key={type.key} value={type.key}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    { key: "category", header: "Category", width: "16%" },
    { key: "subcategory", header: "Subcategory", width: "16%" },
    {
      key: "linkedTo",
      header: "Linked To",
      width: "14%",
      render: (value) =>
        value ? (
          <Badge variant="secondary">{value}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "description",
      header: "Description",
      width: "16%",
      render: (value) =>
        value || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "amount",
      header: "Amount",
      width: "10%",
      className: "text-right",
      cellClassName: "text-right font-semibold",
      render: (value) => money(value),
    },
    {
      key: "actions",
      header: "Actions",
      width: "8%",
      disableFilter: true,
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            title="Delete expense"
            onClick={() => removeExpense(row.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete expense</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-secondary p-2 sm:p-3">
            <Wallet className="h-5 w-5 text-secondary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Expenses
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
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

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Search expenses..."
            exportFileName="expenses.csv"
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
