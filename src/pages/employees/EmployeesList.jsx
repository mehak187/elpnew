import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { IdStatusDot, isEndedStatus } from "@/components/shared/panels";
import {
  employeeRecords,
  netSalary,
  totalAllowances,
  totalDeductions,
  amount,
} from "./employeeData";

/** A fact with its heading beside it, where the pair fits on one line. */
function Inline({ label, children, strong }) {
  return (
    <p className={cn("leading-tight", strong && "text-primary")}>
      <span className="font-semibold">{label} </span>
      <span className={cn(strong && "font-semibold")}>{children || "-"}</span>
    </p>
  );
}

/** An amount as it is written everywhere: the figure, then the currency. */
const money = (value) => amount(value);

const employees = employeeRecords;

export default function EmployeesList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-primary">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Employees
            </h1>
            <p className="text-xs sm:text-sm text-primary/75">
              Manage employee information
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={employees}
            // Anyone who has left is kept, at the foot of the list.
            endedRow={(row) => isEndedStatus(row.status)}
            searchPlaceholder="Search employee by name, ID, department..."
            enableColumnSearch={false}
            enableSorting
            onAdd={() => navigate("/employees/create")}
            addLabel="Add Employee"
            currentPage={currentPage}
            totalPages={Math.ceil(employees.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
