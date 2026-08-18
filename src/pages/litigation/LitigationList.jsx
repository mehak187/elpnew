import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import { Scale, Plus, Eye, Edit } from "lucide-react";

const cases = [
  { id: 1, case_no: "2024/001", client: "ABC Holdings LLC", case_type: "Civil", court: "Primary Court - Muscat", stage: "Court Hearing", status: "Active" },
  { id: 2, case_no: "2024/002", client: "XYZ Investments", case_type: "Commercial", court: "Commercial Court", stage: "Registration", status: "Active" },
  { id: 3, case_no: "2024/003", client: "Ali Mohammed", case_type: "Labor", court: "Primary Court - Salalah", stage: "Post Judgement", status: "Active" },
  { id: 4, case_no: "2024/004", client: "Global Trade Co", case_type: "Civil", court: "Appeal Court", stage: "Execution", status: "Active" },
  { id: 5, case_no: "2023/015", client: "Tech Ventures Ltd", case_type: "Commercial", court: "Supreme Court", stage: "Closed", status: "Closed" },
];

const columns = [
  { key: "case_no", header: "Case No.", width: "10%", cellClassName: "text-left font-medium" },
  { key: "client", header: "Client", width: "18%" },
  {
    key: "case_type",
    header: "Type",
    width: "10%",
    render: (value) => (
      <Badge variant="outline">{value}</Badge>
    )
  },
  { key: "court", header: "Court", width: "18%" },
  {
    key: "stage",
    header: "Stage",
    width: "12%",
    render: (value) => (
      <Badge
        variant={
          value === "Registration"
            ? "secondary"
            : value === "Court Hearing"
            ? "brand"
            : value === "Post Judgement"
            ? "warning"
            : value === "Execution"
            ? "default"
            : "outline"
        }
      >
        {value}
      </Badge>
    )
  },
  {
    key: "status",
    header: "Status",
    width: "10%",
    render: (value) => (
      <Badge variant={value === "Active" ? "success" : "secondary"}>
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
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    )
  },
];

export default function LitigationList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-secondary">
            <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Running Cases
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage litigation cases
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/litigation/register')}>
          <Plus className="mr-2 h-4 w-4" />
          Register Case
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={cases}
            searchPlaceholder="Search cases..."
            currentPage={currentPage}
            totalPages={Math.ceil(cases.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
