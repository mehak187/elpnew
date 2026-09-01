import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { withRial } from "@/lib/money";
import {
  employeeRecords,
  netSalary,
  totalAllowances,
  totalDeductions,
  amount,
} from "./employeeData";

/** A fact with its heading above it, where the pair needs the room. */
function Fact({ label, children }) {
  return (
    <p className="leading-tight">
      <span className="block font-semibold">{label}</span>
      <span className="block">{children || "-"}</span>
    </p>
  );
}

/** A fact with its heading beside it, where the pair fits on one line. */
function Inline({ label, children, strong }) {
  return (
    <p className={cn("leading-tight", strong && "text-primary")}>
      <span className="font-semibold">{label} </span>
      <span className={cn(strong && "font-semibold")}>{children || "-"}</span>
    </p>
  );
}

/** An amount with the Rial sign after it. */
const money = (value) => withRial(amount(value));

/** Standing, shown as a dot beside the employee number. */
const STATUS_DOT = {
  Active: "bg-green-500",
  "On Leave": "bg-amber-500",
  Inactive: "bg-muted-foreground",
  Terminated: "bg-red-500",
};

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
          {/* Standing shown as a dot, so the number keeps the column to itself */}
          <span
            title={row.status}
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              STATUS_DOT[row.status] || "bg-muted-foreground",
            )}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row.id}`);
            }}
            className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {value}
          </button>
        </span>
      ),
    },
    {
      key: "name",
      header: "Employee Name",
      subHeader: "Nationality • Gender",
      width: "18%",
      exportValue: (row) =>
        row.name + " (" + row.nationality + " · " + row.gender + ")",
      render: (value, row) => (
        <div>
          <span className="block font-semibold">{value}</span>
          <span className="block text-xs text-muted-foreground">
            {row.nationality} &bull; {row.gender}
          </span>
        </div>
      ),
    },
    {
      key: "dateOfJoining",
      header: "Employment Details",
      subHeader: "(Joining Date + Branch)",
      width: "18%",
      exportValue: (row) =>
        new Date(row.dateOfJoining).toLocaleDateString("en-GB") +
        " · " +
        row.branch,
      render: (_, row) => (
        <div className="space-y-2 text-sm">
          <Fact label="Date of Joining:">
            {new Date(row.dateOfJoining).toLocaleDateString("en-GB")}
          </Fact>
          <div className="border-t pt-2">
            <Fact label="Branch:">{row.branch}</Fact>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Job Details",
      subHeader: "(Department + Designation + Role)",
      width: "22%",
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
          <div className="mt-2 border-t pt-2">
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
        <Button onClick={() => navigate('/employees/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={employees}
            searchPlaceholder="Search employee by name, ID, department..."
            enableColumnSearch={false}
            enableSorting
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
