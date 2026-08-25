import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import { StatusDot } from "@/components/shared/panels";
import { Truck, Plus, Trash2, FileSpreadsheet } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";
import { useSuppliers } from "@/lib/suppliers/context";

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { suppliers, removeSupplier } = useSuppliers();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const columns = [
    {
      key: "supplierId",
      header: "Supplier ID",
      width: "10%",
      cellClassName: "font-medium",
    },
    { key: "name", header: "Supplier Name", width: "20%" },
    { key: "category", header: "Category", width: "14%" },
    {
      // CR, TIN and VAT belong together - they are all the supplier's numbers.
      key: "taxIdentificationNumber",
      header: "Tax Numbers",
      width: "20%",
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
    {
      key: "bank",
      header: "Supplier Account",
      width: "17%",
      exportValue: (row) =>
        (row.bank || "-") + " | " + (row.accountNumber || "-"),
      render: (_, row) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-medium">{row.bank || "-"}</p>
          <p className="text-muted-foreground">{row.accountNumber || "-"}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", width: "12%" },
    {
      key: "status",
      header: "Status",
      width: "9%",
      render: (value) => (
        <StatusDot status={value} isGood={value === "Active"} />
      ),
    },
    {
      key: "actions",
      header: "Delete",
      width: "6%",
      disableFilter: true,
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            title="Delete supplier"
            onClick={() => removeSupplier(row.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {row.name}</span>
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
            exportFileName="suppliers.csv"
            enableColumnSearch={false}
            onAdd={() => navigate("/suppliers/create")}
            addLabel="Add Supplier"
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
