import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import DataTable from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import FilterPanel from "@/components/shared/FilterPanel";
import {
  Users,
  Eye,
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
  totalAllowances,
  totalDeductions,
  amount,
  hasDocuments,
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
const matches = (row, filters) =>
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
        return (row.status === "On Leave") === (value === "on");
      // Either mark, or both; a paper only has to be in one of them.
      case "documentStatus":
        return documentsFor(row.id).some((doc) => value.includes(documentStatus(doc)));
      default:
        return row[key] === value;
    }
  });


export default function EmployeesList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  // Standard: the document group is the general manager's. Left out of the
  // list entirely for anybody else - the server enforces the same rule, this
  // only keeps the panel honest about it.
  const fields = filterFields(CURRENT_USER.role === "admin");

  const shown = employees.filter((row) => matches(row, filters));
  const columns = [
    {
      key: "empNo",
      header: "Employee No.",
      width: "12%",
      render: (value, row) => (
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row.id}`);
            }}
            className="numeric-value font-medium text-record-link underline-offset-2 hover:underline"
          >
            {value}
          </button>
          {/* Only somebody who has stopped working here says so. */}
          <IdStatusDot status={row.status} />
        </span>
      ),
    },
    {
      // Who they are and where they work, read together: one person, one cell.
      key: "name",
      header: "Employee Name",
      subHeader: "(Nationality • Gender + Joining Date + Branch)",
      width: "32%",
      exportValue: (row) =>
        row.name +
        " (" +
        row.nationality +
        " · " +
        row.gender +
        ") · " +
        new Date(row.dateOfJoining).toLocaleDateString("en-GB") +
        " · " +
        row.branch,
      render: (value, row) => (
        <div className="space-y-1 text-sm">
          <span className="block font-semibold">{value}</span>
          <span className="block text-xs text-muted-foreground">
            {row.nationality} &bull; {row.gender}
          </span>
          <Inline label="Date of Joining:">
            {new Date(row.dateOfJoining).toLocaleDateString("en-GB")}
          </Inline>
          <Inline label="Branch:">{row.branch}</Inline>
        </div>
      ),
    },
    {
      key: "department",
      header: "Job Details",
      subHeader: "(Department + Designation + Role)",
      width: "26%",
      exportValue: (row) =>
        [row.department, row.designation, row.role].join(" · "),
      render: (_, row) => (
        <div className="space-y-1 text-sm">
          <Inline label="Department:">{row.department}</Inline>
          <Inline label="Designation:">{row.designation}</Inline>
          <Inline label="Role:">{row.role}</Inline>
        </div>
      ),
    },
    {
      key: "salary",
      header: "Financial Details",
      subHeader: "(Basic Salary • Allowances • Deductions • Net Salary)",
      width: "30%",
      exportValue: (row) =>
        [
          "Basic " + amount(row.salary),
          "Allowances " + amount(totalAllowances(row)),
          "Deductions " + amount(totalDeductions(row)),
          "Net " + amount(netSalary(row)),
        ].join(" · "),
      // The net is worked out from the three above it, never stored, so the
      // total on a row can never disagree with its parts.
      sortValue: (row) => netSalary(row),
      render: (_, row) => (
        <div className="space-y-1 text-sm">
          <Inline label="Basic Salary:">{money(row.salary)}</Inline>
          <Inline label="Allowances:">{money(totalAllowances(row))}</Inline>
          <Inline label="Deductions:">{money(totalDeductions(row))}</Inline>
          {/* Set apart by the space above it and the weight it is written
              in: a rule inside a cell reads as a line of the table, and the
              table has none until the pointer is on it. */}
          <div className="pt-2">
            <Inline label="Net Salary:" strong>
              {money(netSalary(row))}
            </Inline>
          </div>
        </div>
      ),
    },
    {
      key: "documents",
      header: "Documents",
      width: "9%",
      // The eye is offered only where there is something to look at; a dash
      // says plainly that nothing has been filed, rather than leaving a gap
      // that reads as a column still loading.
      render: (value, row) =>
        hasDocuments(row.id) ? (
          <button
            type="button"
            title="View documents"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/employees/" + row.id);
            }}
            className="text-primary transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Eye strokeWidth={1.5} className="size-[18px]" />
            <span className="sr-only">View documents for {row.name}</span>
          </button>
        ) : (
          <span aria-label="No documents" className="text-muted-foreground">
            &ndash;
          </span>
        ),
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
