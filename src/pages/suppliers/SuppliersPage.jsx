import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import { Truck, Plus, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";
import { useSuppliers } from "@/lib/suppliers/context";

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { suppliers } = useSuppliers();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const columns = [
    {
      // The dot carries the status, so the table does not need a column for it.
      key: "supplierId",
      header: "Supplier ID",
      width: "14%",
      render: (value, row) => (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            title={row.status}
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              row.status === "Active" ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <button
            type="button"
            onClick={() => navigate("/suppliers/" + row.id)}
            className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {value}
          </button>
          <span className="sr-only">{row.status}</span>
        </span>
      ),
    },
    {
      key: "name",
      header: "Supplier Name",
      width: "24%",
      exportValue: (row) => row.name + " | " + row.category,
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{row.category}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", width: "16%" },
    {
      key: "bank",
      header: "Supplier Account",
      width: "22%",
      exportValue: (row) =>
        (row.bank || "-") + " | " + (row.accountNumber || "-"),
      render: (_, row) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-medium">{row.bank || "-"}</p>
          <p className="text-muted-foreground">{row.accountNumber || "-"}</p>
        </div>
      ),
    },
    {
      // CR, TIN and VAT belong together - they are all the supplier's numbers.
      key: "taxIdentificationNumber",
      header: "Tax Details",
      width: "24%",
      exportValue: (row) =>
        "CR " +
        (row.commercialRegistration || "-") +
        " | TIN " +
        (row.taxIdentificationNumber || "-") +
        " | VAT " +
        (row.vatNumber || "-"),
      render: (_, row) => (
        <div className="space-y-0.5 text-xs">
          <p>
            <span className="text-muted-foreground">CR </span>
            {row.commercialRegistration || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">TIN </span>
            {row.taxIdentificationNumber || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">VAT </span>
            {row.vatNumber || "-"}
          </p>
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
            <Truck className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Suppliers
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              Manage your suppliers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(toCsv(columns, suppliers), "suppliers.csv")
            }
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            Export
          </Button>
          <Button onClick={() => navigate("/suppliers/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={suppliers}
            searchPlaceholder="Ask anything..."
            showExport={false}
            enableColumnSearch={false}
            currentPage={currentPage}
            totalPages={Math.ceil(suppliers.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
