import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { employeeRecords } from "./employeeData";

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
              STATUS_DOT[row.status] || "bg-muted-foreground"
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
      width: "20%",
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
      header: "Date of Joining",
      width: "12%",
      render: (value) => new Date(value).toLocaleDateString("en-GB"),
    },
    {
      key: "branch",
      header: "Branch",
      width: "10%",
    },
    {
      key: "department",
      header: "Department",
      width: "14%",
    },
    {
      key: "designation",
      header: "Designation",
      width: "16%",
    },
    {
      key: "role",
      header: "Role",
      width: "16%",
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
