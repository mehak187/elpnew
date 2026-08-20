import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import ActiveFilters from "@/components/shared/ActiveFilters";
import { useListFilter } from "@/lib/useListFilter";

const FILTERS = {
  status: { label: "Status", match: (row, value) => row.status === value },
  client: { label: "Client", match: (row, value) => row.client === value },
};
import { Wallet, Plus, Eye, Edit, FileText } from "lucide-react";

const invoices = [
  { id: 1, invoice_no: "INV/2024/001", client: "ABC Holdings LLC", amount: "OMR 2,500.000", date: "2024-12-01", due_date: "2024-12-31", status: "Paid" },
  { id: 2, invoice_no: "INV/2024/002", client: "XYZ Investments", amount: "OMR 5,000.000", date: "2024-12-05", due_date: "2025-01-05", status: "Pending" },
  { id: 3, invoice_no: "INV/2024/003", client: "Global Trade Co", amount: "OMR 3,750.000", date: "2024-12-10", due_date: "2025-01-10", status: "Pending" },
  { id: 4, invoice_no: "INV/2024/004", client: "Tech Ventures Ltd", amount: "OMR 1,200.000", date: "2024-11-15", due_date: "2024-12-15", status: "Overdue" },
  { id: 5, invoice_no: "INV/2024/005", client: "Ali Mohammed", amount: "OMR 800.000", date: "2024-11-20", due_date: "2024-12-20", status: "Paid" },
];

const columns = [
  { key: "invoice_no", header: "Invoice No.", width: "12%", cellClassName: "text-left font-medium" },
  { key: "client", header: "Client", width: "20%" },
  { key: "amount", header: "Amount", width: "12%", cellClassName: "text-right font-medium" },
  { key: "date", header: "Invoice Date", width: "12%" },
  { key: "due_date", header: "Due Date", width: "12%" },
  {
    key: "status",
    header: "Status",
    width: "10%",
    render: (value) => (
      <Badge
        variant={
          value === "Paid"
            ? "success"
            : value === "Pending"
            ? "warning"
            : "destructive"
        }
      >
        {value}
      </Badge>
    )
  },
  {
    key: "actions",
    header: "Actions",
    width: "12%",
    render: () => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FileText className="h-4 w-4" />
        </Button>
      </div>
    )
  },
];

export default function InvoicesList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const { active, apply, clear } = useListFilter(FILTERS);

  const visibleInvoices = apply(invoices);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-secondary">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Invoices
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage billing and invoices
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/finance/invoices/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <ActiveFilters
        filters={active}
        onClear={clear}
        resultCount={visibleInvoices.length}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={visibleInvoices}
            searchPlaceholder="Search invoices..."
            currentPage={currentPage}
            totalPages={Math.ceil(visibleInvoices.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
