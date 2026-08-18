import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import { Briefcase, Plus, Eye, Edit } from "lucide-react";

const corporateMatters = [
  { id: 1, ref_no: "CORP/2024/001", client: "ABC Holdings LLC", matter_type: "Company Formation", status: "In Progress", created_date: "2024-12-01" },
  { id: 2, ref_no: "CORP/2024/002", client: "XYZ Investments", matter_type: "Contract Review", status: "Completed", created_date: "2024-11-15" },
  { id: 3, ref_no: "CORP/2024/003", client: "Global Trade Co", matter_type: "Merger & Acquisition", status: "Pending", created_date: "2024-12-10" },
  { id: 4, ref_no: "CORP/2024/004", client: "Tech Ventures Ltd", matter_type: "Due Diligence", status: "In Progress", created_date: "2024-12-05" },
  { id: 5, ref_no: "CORP/2024/005", client: "ABC Holdings LLC", matter_type: "License Renewal", status: "Completed", created_date: "2024-10-20" },
];

const columns = [
  { key: "ref_no", header: "Reference No.", width: "15%", cellClassName: "text-left font-medium" },
  { key: "client", header: "Client", width: "20%" },
  { key: "matter_type", header: "Matter Type", width: "18%" },
  { key: "created_date", header: "Created Date", width: "12%" },
  {
    key: "status",
    header: "Status",
    width: "12%",
    render: (value) => (
      <Badge
        variant={
          value === "Completed"
            ? "success"
            : value === "In Progress"
            ? "brand"
            : "outline"
        }
      >
        {value}
      </Badge>
    )
  },
  {
    key: "actions",
    header: "Actions",
    width: "13%",
    render: () => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    )
  },
];

export default function CorporateList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-secondary">
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Corporate Matters
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage corporate legal matters
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/corporate/create')}>
          <Plus className="mr-2 h-4 w-4" />
          New Matter
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={corporateMatters}
            searchPlaceholder="Search corporate matters..."
            currentPage={currentPage}
            totalPages={Math.ceil(corporateMatters.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
