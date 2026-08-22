import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusDot } from "@/components/shared/panels";
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
      width: "8%",
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
    { key: "opponent", header: "Opponent", width: "20%" },
    {
      // The widest column: this is what the page is actually for.
      key: "court",
      header: "Case Details",
      width: "46%",
      render: (_, row) => (
        <div className="space-y-1">
          <p className="font-medium">{row.court}</p>
          <p className="text-xs text-muted-foreground">
            {row.litigationLevel} &middot; Stage {row.stageNumber} &middot;{" "}
            {row.caseStage}
          </p>
          <StatusDot
            status={row.caseStatus}
            isGood={row.caseStatus === "Active"}
          />
        </div>
      ),
    },
    {
      key: "update",
      header: "Update",
      width: "26%",
      render: (value, row) => (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{row.updateDate}</p>
          <p>{value || "-"}</p>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={clientLinkedCases}
      searchPlaceholder="Search cases..."
      enableColumnSearch={false}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
    />
  );
}
