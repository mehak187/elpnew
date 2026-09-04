import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/shared/DataTable";
import { cn } from "@/lib/utils";
import { clientLinkedCases } from "../clientMockData";

const ALL_STAGES = "all";
const CLOSED = "closed";

/**
 * The tabs above the table, in the order a case moves through them.
 *
 * `matches` is what each tab counts and filters by. Closed is last and cuts
 * across the rest: a case that has finished still belongs to the level it
 * ended at, so it is counted in both places on purpose.
 */
const STAGES = [
  { key: ALL_STAGES, label: "All Cases", matches: () => true },
  { key: "Primary", label: "Primary" },
  { key: "Appeal", label: "Appeal" },
  { key: "Supreme", label: "Supreme" },
  { key: "Execution", label: "Execution" },
  { key: CLOSED, label: "Closed", matches: (c) => c.caseStatus === "Closed" },
];

const matcher = (stage) =>
  stage.matches || ((c) => c.litigationLevel === stage.key);

/**
 * The levels a file collects a number at, in the order it collects them.
 *
 * Read off the tabs rather than written out again, so the two can never
 * fall out of step.
 */
const LEVELS = STAGES.filter(
  (s) => s.key !== ALL_STAGES && s.key !== CLOSED
).map((s) => s.key);

/** The numbers a file carries, oldest level first. */
const numbersOf = (row) =>
  LEVELS.filter((level) => row.caseNumbers?.[level]).map((level) => [
    level,
    row.caseNumbers[level],
  ]);

/**
 * Whether the file is still running.
 *
 * Closed is grey rather than red: a finished file is not a problem, it is
 * simply finished.
 */
function FileStatus({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          status === "Active" ? "bg-green-500" : "bg-muted-foreground"
        )}
      />
      <span className="text-muted-foreground">{status}</span>
    </span>
  );
}

/** A labelled line inside a cell: what it is, then what it says. */
function DetailLine({ label, children }) {
  return (
    <p className="text-xs">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{children}</span>
    </p>
  );
}

/**
 * The cases a client has running, counted by the stage they have reached.
 *
 * The tabs are the filter as well as the summary - the same strip Company
 * Profile uses for Bank Accounts - so the count and the list it stands for
 * can never disagree.
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

  // No Client column here - every row already belongs to the client on
  // screen. One row is one file: everything the file has been through is in
  // the row, so its history reads without opening it.
  const columns = [
    {
      key: "fileNo",
      header: "File No.",
      width: "10%",
      exportValue: (row) => row.fileNo + " (" + row.caseStatus + ")",
      render: (value, row) => (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/litigation")}
            className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {value}
          </button>
          <FileStatus status={row.caseStatus} />
        </div>
      ),
    },
    { key: "opponent", header: "Opponent", width: "16%" },
    {
      // Every number the same file has been given as it moved up. One file
      // is registered afresh at each level, so the numbers belong together.
      key: "caseNumbers",
      header: "Case Numbers",
      width: "18%",
      exportValue: (row) =>
        numbersOf(row)
          .map(([level, no]) => level + ": " + no)
          .join(" | "),
      render: (_, row) => (
        <div className="space-y-0.5">
          {numbersOf(row).map(([level, no]) => (
            <DetailLine key={level} label={level}>
              {no}
            </DetailLine>
          ))}
        </div>
      ),
    },
    {
      // Where the file stands now, and what is happening at that level.
      key: "litigationLevel",
      header: "Case Level",
      width: "14%",
      exportValue: (row) =>
        [row.litigationLevel, row.caseStatus, row.caseStage].join(" - "),
      render: (value, row) => (
        <div className="space-y-1">
          <p className="font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">
            {row.caseStatus} &bull; {row.caseStage}
          </p>
        </div>
      ),
    },
    {
      key: "court",
      header: "Court Details",
      width: "24%",
      exportValue: (row) =>
        [row.court, row.governorate, row.location].join(" - "),
      render: (_, row) => (
        <div className="space-y-0.5">
          <DetailLine label="Court">{row.court}</DetailLine>
          <DetailLine label="Governorate">{row.governorate}</DetailLine>
          <DetailLine label="Location">{row.location}</DetailLine>
        </div>
      ),
    },
    {
      key: "update",
      header: "Latest Update",
      width: "18%",
      exportValue: (row) => row.updateDate + " - " + (row.update || "-"),
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
      {/* One compact strip rather than six large boxes: the stages are a
          choice of what to list, and each carries its own count. */}
      <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg border p-1">
        {STAGES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => choose(option.key)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              stage === option.key
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            {option.label}
            {/* Dimmed rather than a second colour, so it reads as part of
                the label on both the selected tab and the rest. */}
            <span className="ml-1.5 opacity-70">
              ({clientLinkedCases.filter(matcher(option)).length})
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
