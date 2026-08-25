import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import ActiveFilters from "@/components/shared/ActiveFilters";
import { Scale, Plus, Eye, Edit } from "lucide-react";
import { useListFilter } from "@/lib/useListFilter";
import { dayOffset, daysUntil } from "@/pages/dashboard/dashboardData";

const FILTERS = {
  status: { label: "Status", match: (row, value) => row.status === value },
  stage: { label: "Stage", match: (row, value) => row.stage === value },
  branch: { label: "Branch", match: (row, value) => row.branch === value },
  type: { label: "Type", match: (row, value) => row.case_type === value },
  client: { label: "Client", match: (row, value) => row.client === value },
  // Cases opened within the given number of days.
  newWithin: {
    label: "Opened",
    display: (value) => "last " + value + " days",
    match: (row, value) => Math.abs(daysUntil(row.opened_at)) <= Number(value),
  },
};

const cases = [
  { id: 1, case_no: "2024/001", client: "ABC Holdings LLC", case_type: "Civil", court: "Primary Court - Muscat", branch: "Muscat", stage: "Under Litigation", status: "Active", opened_at: dayOffset(-8) },
  { id: 2, case_no: "2024/002", client: "XYZ Investments", case_type: "Commercial", court: "Commercial Court", branch: "Muscat", stage: "Registration", status: "Active", opened_at: dayOffset(-3) },
  { id: 3, case_no: "2024/003", client: "Ali Mohammed", case_type: "Labor", court: "Primary Court - Salalah", branch: "Salalah", stage: "Judgment Issued", status: "Active", opened_at: dayOffset(-120) },
  { id: 4, case_no: "2024/004", client: "Global Trade Co", case_type: "Civil", court: "Appeal Court", branch: "Muscat", stage: "Execution", status: "Active", opened_at: dayOffset(-200) },
  { id: 5, case_no: "2023/015", client: "Tech Ventures Ltd", case_type: "Commercial", court: "Supreme Court", branch: "Muscat", stage: "Closed", status: "Closed", opened_at: dayOffset(-410) },
  { id: 6, case_no: "2024/006", client: "Gulf Construction Co", case_type: "Commercial", court: "Primary Court - Salalah", branch: "Salalah", stage: "Under Litigation", status: "Active", opened_at: dayOffset(-45) },
  { id: 7, case_no: "2024/007", client: "Salalah Port Services", case_type: "Civil", court: "Primary Court - Salalah", branch: "Salalah", stage: "Registration", status: "Active", opened_at: dayOffset(-12) },
  { id: 8, case_no: "2024/008", client: "Nizwa Cement Factory", case_type: "Labor", court: "Labour Court", branch: "Sohar", stage: "Under Litigation", status: "Active", opened_at: dayOffset(-18) },
  { id: 9, case_no: "2024/009", client: "Al Madina Trading", case_type: "Commercial", court: "Appeal Court", branch: "Muscat", stage: "Appeal", status: "Active", opened_at: dayOffset(-95) },
  { id: 10, case_no: "2024/010", client: "Muscat Finance LLC", case_type: "Civil", court: "Primary Court - Muscat", branch: "Muscat", stage: "Execution", status: "Active", opened_at: dayOffset(-150) },
  { id: 11, case_no: "2023/022", client: "Fatima Rashid", case_type: "Personal Status", court: "Family Court", branch: "Muscat", stage: "Closed", status: "Closed", opened_at: dayOffset(-380) },
  { id: 12, case_no: "2023/031", client: "Ahmed Al Lawati", case_type: "Civil", court: "Primary Court - Muscat", branch: "Muscat", stage: "Closed", status: "Closed", opened_at: dayOffset(-300) },
  { id: 13, case_no: "2024/013", client: "Sohar Aluminium Co", case_type: "Commercial", court: "Commercial Court", branch: "Sohar", stage: "Registration", status: "Active", opened_at: dayOffset(-9) },
  { id: 14, case_no: "2023/044", client: "Global Trade Co", case_type: "Commercial", court: "Supreme Court", branch: "Sohar", stage: "Closed", status: "Closed", opened_at: dayOffset(-260) },
  { id: 15, case_no: "2024/015", client: "ABC Holdings LLC", case_type: "Commercial", court: "Primary Court - Muscat", branch: "Muscat", stage: "Reserved for Judgment", status: "Active", opened_at: dayOffset(-70) },
  { id: 16, case_no: "2023/052", client: "XYZ Investments", case_type: "Commercial", court: "Supreme Court", branch: "Muscat", stage: "Supreme Court", status: "Active", opened_at: dayOffset(-330) },
];

// The eight stages the client specified, in order.
const STAGE_VARIANT = {
  Registration: "secondary",
  "Under Litigation": "brand",
  "Reserved for Judgment": "warning",
  "Judgment Issued": "warning",
  Appeal: "default",
  "Supreme Court": "default",
  Execution: "default",
  Closed: "outline",
};

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
        variant={STAGE_VARIANT[value] || "outline"}
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
    disableFilter: true,
    render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Open hearing">
          <Link to={"/litigation/" + row.id + "/hearing"}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">Open case {row.case_no}</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Post judgement">
          <Link to={"/litigation/" + row.id + "/judgement"}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit case {row.case_no}</span>
          </Link>
        </Button>
      </div>
    )
  },
];

export default function LitigationList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const { active, apply, clear } = useListFilter(FILTERS);

  const visibleCases = apply(cases);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-primary">
            <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Running Cases
            </h1>
            <p className="text-xs sm:text-sm text-primary/75">
              Manage litigation cases
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/litigation/register')}>
          <Plus className="mr-2 h-4 w-4" />
          Register Case
        </Button>
      </div>

      <ActiveFilters
        filters={active}
        onClear={clear}
        resultCount={visibleCases.length}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={visibleCases}
            searchPlaceholder="Search cases..."
            currentPage={currentPage}
            totalPages={Math.ceil(visibleCases.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
