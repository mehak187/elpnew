import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/shared/DataTable";
import { cn } from "@/lib/utils";
import { clientLinkedCases } from "../clientMockData";

const ALL_STAGES = "all";
const CLOSED = "closed";

/**
 * The boxes above the table, in the order a case moves through them.
 *
 * `matches` is what each box counts and filters by. Closed is last and cuts
 * across the rest: a case that has finished still belongs to the level it
 * ended at, so it is counted in both places on purpose.
 */
const STAGES = [
  { key: ALL_STAGES, label: "All Stages", matches: () => true },
  { key: "Primary", label: "Primary" },
  { key: "Appeal", label: "Appeal" },
  { key: "Supreme", label: "Supreme" },
  { key: "Execution", label: "Execution" },
  { key: CLOSED, label: "Closed", matches: (c) => c.caseStatus === "Closed" },
];

const matcher = (stage) =>
  stage.matches || ((c) => c.litigationLevel === stage.key);

/**
 * The cases a client has running, counted by the stage they have reached.
 *
 * The boxes are the filter as well as the summary - the same pattern the bank
 * cards use on Company Profile - so the count and the list it stands for can
 * never disagree.
 */
export default function LinkedCasesSection() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stage, setStage] = useState(ALL_STAGES);

  const choose = (key) => {
    setStage(key);
    setCurrentPage(1);
  };

  const selected = STAGES.find((s) => s.key === stage) || STAGES[0];
  const shown = clientLinkedCases.filter(matcher(selected));

  // No Client column here - every row already belongs to the client on screen.
  const columns = [
    {
      key: "fileNo",
      header: "# No.",
      width: "8%",
      render: (value, row) => (
        <span className="flex items-center gap-2">
          {/* Standing as a dot, so the number keeps the column to itself */}
          <span
            title={row.caseStatus}
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              row.caseStatus === "Active" ? "bg-green-500" : "bg-muted-foreground"
            )}
          />
          <button
            type="button"
            onClick={() => navigate("/litigation")}
            className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {value}
          </button>
        </span>
      ),
    },
    { key: "opponent", header: "Opponent", width: "20%" },
    {
      // The widest column: this is what the page is actually for.
      key: "court",
      header: "Case Details",
      width: "46%",
      exportValue: (row) =>
        [row.court, row.litigationLevel + " Stage", row.caseStage].join(" - "),
      render: (_, row) => (
        <div className="space-y-1">
          <p className="font-semibold">{row.court}</p>
          <p className="text-xs text-muted-foreground">
            {row.litigationLevel} Stage &bull; {row.caseStage}
          </p>
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => choose(option.key)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              stage === option.key
                ? "border-primary bg-secondary"
                : "hover:bg-muted/50"
            )}
          >
            {/* Named first, counted below - the same way a bank card reads */}
            <span className="block text-sm text-muted-foreground">
              {option.label}
            </span>
            <span className="mt-2 block text-xl font-bold text-primary">
              {clientLinkedCases.filter(matcher(option)).length}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={shown}
        searchPlaceholder="Search cases..."
        enableColumnSearch={false}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
