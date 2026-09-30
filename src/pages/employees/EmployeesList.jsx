import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import { useLeaves } from "@/lib/leaves/context";
import { onLeaveToday, annualLeaveLeft } from "./leaveData";
import DataTable from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import FilterPanel from "@/components/shared/FilterPanel";
import {
  Users,
  Eye,
  AlertCircle,
  AlertTriangle,
  Briefcase,
  MapPin,
  Building2,
  Globe,
  CalendarDays,
  UserRoundCog,
  Scale,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IdStatusDot, isEndedStatus } from "@/components/shared/panels";
import {
  employeeRecords,
  netSalary,
  amount,
  documentsFor,
  documentStatus,
} from "./employeeData";

/** A fact with its heading beside it, where the pair fits on one line. */
/**
 * A label and its value, side by side on one line.
 *
 * Laid out rather than run together as text: a value set with a space after
 * the label can be pushed onto a line of its own when the column narrows, and
 * a date sitting under "Date of Joining:" reads as two facts rather than one.
 * The value keeps to one line for the same reason.
 */
function Inline({ label, children, strong }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-1 leading-tight",
        strong && "text-primary"
      )}
    >
      <span className="font-semibold">{label}</span>
      <span className={cn("whitespace-nowrap", strong && "font-semibold")}>
        {children || "-"}
      </span>
    </p>
  );
}

/** An amount as it is written everywhere: the figure, then the currency. */
const money = (value) => amount(value);

/** A label and its value on one line, for the stacked cells. */
const Fact = ({ label, children }) => (
  <p className="text-xs text-primary/75">
    <span className="font-semibold">{label}:</span> {children}
  </p>
);

/** A date as the firm writes them. */
const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d && m && y ? d + "/" + m + "/" + y : iso;
};

/**
 * The one document worth showing in a row, and how many others are waiting.
 *
 * Expired before expiring soon, because a paper that has run out stops work
 * while one about to run out only threatens to. Papers in order are not
 * mentioned at all: a column that lists every document is a column nobody
 * reads, and the point of this one is to be scanned.
 */
const RANK = { Expired: 0, "Expiring Soon": 1 };

function criticalDocument(employeeId) {
  const flagged = documentsFor(employeeId)
    .map((doc) => ({ ...doc, status: documentStatus(doc) }))
    .filter((doc) => doc.status in RANK)
    .sort((a, b) => RANK[a.status] - RANK[b.status]);

  if (!flagged.length) return null;
  return { document: flagged[0], more: flagged.length - 1 };
}

/** Rows with a paper that has run out are read first, before anything else. */
const byUrgency = (a, b) => {
  const rank = (row) => {
    const alert = criticalDocument(row.id);
    return alert ? RANK[alert.document.status] : 2;
  };
  return rank(a) - rank(b);
};

const employees = employeeRecords;

/** Every value a column actually holds, in the order they were first met. */
const valuesOf = (key) =>
  employees.map((row) => row[key]).filter((v, i, all) => v && all.indexOf(v) === i);

/** "All", then whatever the records hold, as the panel wants its options. */
const optionsOf = (key) => [
  { value: "all", label: "All" },
  ...valuesOf(key).map((one) => ({ value: one, label: one })),
];

/**
 * The questions this list can be narrowed by.
 *
 * Branch and Department read their choices from the records themselves, so a
 * new one appears here without an edit. The last group is the General
 * Manager's alone: it is left out of the array entirely rather than merely
 * greyed, because a filter nobody may use is still a filter that says what
 * the system holds.
 */
const filterFields = (canSeeDocuments) =>
  [
    {
      key: "status",
      label: "Employment Status",
      icon: Briefcase,
      type: "radio",
      options: [
        { value: "all", label: "All" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
    { key: "branch", label: "Branch", icon: MapPin, type: "radio", options: optionsOf("branch") },
    {
      key: "department",
      label: "Department",
      icon: Building2,
      type: "radio",
      options: optionsOf("department"),
    },
    {
      key: "gender",
      label: "Gender",
      icon: Users,
      type: "radio",
      options: [
        { value: "all", label: "All" },
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
      ],
    },
    {
      key: "nationality",
      label: "Nationality",
      icon: Globe,
      type: "radio",
      options: [
        { value: "all", label: "All" },
        { value: "Omani", label: "Omani" },
        { value: "Non-Omani", label: "Non-Omani" },
      ],
    },
    {
      key: "leave",
      label: "Leave Status",
      icon: CalendarDays,
      type: "radio",
      options: [
        { value: "all", label: "All" },
        { value: "on", label: "On Leave" },
        { value: "off", label: "Not on Leave" },
      ],
    },
    canSeeDocuments && {
      key: "documentStatus",
      label: "Document Status",
      note: "General manager only",
      icon: UserRoundCog,
      type: "checkbox",
      // Either, both, or neither: neither is no document filter at all.
      options: [
        { value: "Expired", label: "Expired" },
        { value: "Expiring Soon", label: "Expiring Soon" },
      ],
    },
    {
      key: "practiceLevel",
      label: "Legal Practice Level",
      icon: Scale,
      type: "radio",
      // Only lawyers are admitted to a court, so choosing a level narrows the
      // list to lawyers by the same stroke.
      options: [
        { value: "all", label: "All" },
        { value: "Trainee", label: "Trainee" },
        { value: "Primary", label: "Primary" },
        { value: "Appeal", label: "Appeal" },
        { value: "Supreme", label: "Supreme" },
      ],
    },
    {
      key: "access",
      label: "Access Level",
      icon: KeyRound,
      placeholder: "Under construction",
    },
  ].filter(Boolean);

/** A record kept only if it answers to every filter in force. */
const matches = (row, filters, leaves) =>
  Object.entries(filters).every(([key, value]) => {
    if (!value || value === "all" || (Array.isArray(value) && !value.length)) return true;

    switch (key) {
      // Inactive covers everyone no longer working, however they left.
      case "status":
        return value === "Inactive" ? isEndedStatus(row.status) : row.status === value;
      case "nationality":
        return value === "Omani"
          ? row.nationality === "Omani"
          : row.nationality !== "Omani";
      // Approved leave covering today, which the record carries as a standing.
      case "leave":
        return onLeaveToday(leaves, row.name) === (value === "on");
      // Either mark, or both; a paper only has to be in one of them.
      case "documentStatus":
        return documentsFor(row.id).some((doc) => value.includes(documentStatus(doc)));
      default:
        return row[key] === value;
    }
  });


export default function EmployeesList() {
  const navigate = useNavigate();
  const { leaves } = useLeaves();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  // Standard: the document group is the general manager's. Left out of the
  // list entirely for anybody else - the server enforces the same rule, this
  // only keeps the panel honest about it.
  // Access level, document alerts and practice level are the general
  // manager's to read. The server enforces the same rule; this only keeps the
  // page from printing what it should not.
  const canSeeRestricted = CURRENT_USER.role === "admin";
  const fields = filterFields(canSeeRestricted);

  const shown = employees
    .filter((row) => matches(row, filters, leaves))
    .sort(byUrgency);
  const columns = [
    {
      key: "empNo",
      header: "Employee No.",
      width: "11%",
      render: (value, row) => (
        <button
          type="button"
          onClick={() => navigate("/employees/" + row.id)}
          className="numeric-value font-semibold text-record-link transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {value}
        </button>
      ),
    },
    {
      key: "name",
      header: "Employee",
      width: "19%",
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-primary">{value}</p>
          <p className="text-xs text-muted-foreground">
            {row.nationality} <span className="px-1">|</span> {row.gender}
          </p>
          <p className="text-xs text-primary/75">
            <span className="font-semibold">Status:</span> {row.status}
          </p>
        </div>
      ),
    },
    {
      key: "designation",
      header: "Employment Details",
      width: "23%",
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-primary">{value}</p>
          <Fact label="Department">{row.department}</Fact>
          <Fact label="Branch">{row.branch} Branch</Fact>
          <Fact label="Contract">{row.contractType}</Fact>
          {/* Only lawyers hold one, and only the general manager may read it. */}
          {canSeeRestricted && row.practiceLevel && (
            <Fact label="Practice level">{row.practiceLevel}</Fact>
          )}
        </div>
      ),
    },
    {
      key: "salary",
      header: "Net Salary",
      width: "12%",
      sortValue: (row) => netSalary(row),
      render: (value, row) => (
        <span className="font-semibold text-emerald-700">{money(netSalary(row))}</span>
      ),
    },
    {
      key: "leave",
      header: "Leave",
      width: "10%",
      sortValue: (row) => annualLeaveLeft(leaves, row.name) ?? -1,
      render: (value, row) => {
        const left = annualLeaveLeft(leaves, row.name);
        return (
          <div className="space-y-1">
            <p className="text-primary">
              {left === null ? "\u2013" : left + " days"}
            </p>
            {/* Approved leave covering today, worked out from the requests
                themselves rather than read off a standing on the record. */}
            {onLeaveToday(leaves, row.name) && (
              <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                On leave
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "access",
      header: (
        <span className="flex flex-col">
          Access Level
          <span className="text-xs font-normal text-muted-foreground">
            Under construction
          </span>
        </span>
      ),
      width: "10%",
      render: () => <span className="text-muted-foreground">&ndash;</span>,
    },
    {
      key: "documents",
      header: "Documents",
      width: "15%",
      // One paper only: the one nearest to costing the firm something.
      // Everything else is counted, not listed, because a column that lists
      // six documents is a column nobody reads.
      render: (value, row) => {
        const alert = criticalDocument(row.id);
        if (!alert) return <span className="text-muted-foreground">&ndash;</span>;

        const expired = alert.document.status === "Expired";
        return (
          <div className="flex gap-2">
            <Eye
              strokeWidth={1.5}
              aria-hidden="true"
              className="mt-0.5 size-[18px] shrink-0 text-primary"
            />
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium text-primary">
                {alert.document.type}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  expired
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {expired ? (
                  <AlertCircle className="size-3" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="size-3" aria-hidden="true" />
                )}
                {alert.document.status}
              </span>
              <p className="text-xs text-muted-foreground">
                {expired ? "Expired" : "Expires"} {formatDate(alert.document.expiry)}
              </p>
              {alert.more > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  +{alert.more} more document{alert.more === 1 ? "" : "s"} needs action
                </p>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={Users}
        title="Employees"
        note="Manage employee information"
        onAdd={() => navigate("/employees/create")}
        addLabel="Add Employee"
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={shown}
            keepOrder
            // Anyone who has left is kept, at the foot of the list.
            endedRow={(row) => isEndedStatus(row.status)}
            searchPlaceholder="Search employee by name, ID, department..."
            enableColumnSearch={false}
            enableSorting
            currentPage={currentPage}
            totalPages={Math.ceil(shown.length / pageSize)}
            filters={
              <FilterPanel
                fields={fields}
                value={filters}
                onChange={(next) => {
                  setFilters(next);
                  // A narrowed list is read from its first page.
                  setCurrentPage(1);
                }}
              />
            }
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
