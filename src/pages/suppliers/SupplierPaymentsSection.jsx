import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/shared/DataTable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpenses } from "@/lib/expenses/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { expenseRecords } from "@/pages/expenses/expenseData";
import { expenseColumns } from "@/pages/expenses/expenseColumns";

/** Amounts here are read against invoices, so they carry the currency and fils. */
const omr = (amount) =>
  "OMR " +
  Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

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
 * Everything the firm has spent with one supplier.
 *
 * The rows are the same expense records the Expenses page shows, read through
 * the same columns - narrowed to this supplier and without the Supplier column,
 * which would repeat the page's own subject on every row. Nothing is held here,
 * so a supplier's ledger cannot drift from the firm's.
 */
export default function SupplierPaymentsSection({ supplier }) {
  const navigate = useNavigate();
  const { expenses, invoices } = useExpenses();
  const { suppliers } = useSuppliers();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const accountFor = (name) => suppliers.find((s) => s.name === name) || null;

  const rows = expenseRecords(expenses, invoices)
    .filter((record) => record.supplier === supplier.name)
    // Newest first to read, though the numbers were given oldest first.
    .slice()
    .reverse();

  const total = rows.reduce((sum, row) => sum + row.total, 0);

  const columns = expenseColumns({ accountFor, includeSupplier: false });

  return (
    <div className="space-y-6">
      {/* The count and the total sit with the title: a total on its own cannot
          tell one large expense from twenty small ones. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="border-l-4 border-primary pl-3 text-lg font-bold text-primary">
            Supplier Payments
          </h2>
          <span className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "expense" : "expenses"}
          </span>
          <span className="text-sm font-bold text-primary">{omr(total)}</span>
        </div>

        <Button type="button" onClick={() => navigate("/expenses/create")}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Who is being paid, before what they have been paid. Read only: the
          supplier is edited on Supplier Information, and one record edited in
          two places is two records waiting to disagree. */}
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

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Ask about this supplier's expenses..."
            exportFileName="supplier-expenses.csv"
            enableColumnSearch={false}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
