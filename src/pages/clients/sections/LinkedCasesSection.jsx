import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import { clientLinkedCases } from "../clientMockData";

export default function LinkedCasesSection() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // No Client column here - every row already belongs to the client on screen.
  const columns = [
    {
      key: "fileNo",
      header: "File No.",
      width: "10%",
      render: (value) => (
        <button
          type="button"
          onClick={() => navigate("/litigation")}
          className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          {value}
        </button>
      ),
    },
    { key: "opponent", header: "Opponent", width: "22%" },
    { key: "caseDetails", header: "Case Details", width: "26%" },
    {
      key: "stage",
      header: "Stage | Status",
      width: "22%",
      render: (value, row) => (
        <div className="space-y-1">
          <Badge variant="secondary">{value}</Badge>
          <p className="text-xs text-muted-foreground">{row.status}</p>
        </div>
      ),
    },
    { key: "updateDate", header: "Update Date", width: "12%" },
    {
      key: "update",
      header: "Update",
      width: "18%",
      render: (value) => value || <span className="text-muted-foreground">-</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={clientLinkedCases}
      searchPlaceholder="Search linked cases..."
      enableColumnSearch={false}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
    />
  );
}
