import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus, Eye, Edit, Trash2 } from "lucide-react";

const employees = [
  { id: 1, emp_id: "1", name: "Mohammed Al Yahyaei", branch: "Muscat", dateOfJoining: "2020-01-15", gender: "Male", nationality: "Oman", department: "Partner", designation: "Partner", salary: "2500.000", status: "Active" },
  { id: 2, emp_id: "2", name: "Fatima Al Rashdi", branch: "Muscat", dateOfJoining: "2021-03-20", gender: "Female", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "2000.000", status: "Active" },
  { id: 3, emp_id: "3", name: "Ahmed Al Balushi", branch: "Salalah", dateOfJoining: "2022-06-10", gender: "Male", nationality: "Oman", department: "Lawyer", designation: "Supervisor", salary: "800.000", status: "On Leave" },
  { id: 4, emp_id: "4", name: "Sarah Al Lawati", branch: "Muscat", dateOfJoining: "2019-09-05", gender: "Female", nationality: "Oman", department: "Administrative", designation: "Administrative", salary: "650.000", status: "Active" },
  { id: 5, emp_id: "5", name: "Rajesh Kumar", branch: "Salalah", dateOfJoining: "2023-02-28", gender: "Male", nationality: "India", department: "Accountant", designation: "Accountant", salary: "1200.000", status: "Inactive" },
  { id: 6, emp_id: "6", name: "Khalid Al Hinai", branch: "Muscat", dateOfJoining: "2018-04-12", gender: "Male", nationality: "Oman", department: "Partner", designation: "Partner", salary: "3000.000", status: "Active" },
  { id: 7, emp_id: "7", name: "Aisha Al Kindi", branch: "Muscat", dateOfJoining: "2021-08-01", gender: "Female", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "1800.000", status: "Active" },
  { id: 8, emp_id: "8", name: "Salim Al Rawahi", branch: "Salalah", dateOfJoining: "2020-11-15", gender: "Male", nationality: "Oman", department: "Advisor", designation: "Advisor", salary: "2200.000", status: "Active" },
  { id: 9, emp_id: "9", name: "Layla Al Habsi", branch: "Muscat", dateOfJoining: "2022-02-20", gender: "Female", nationality: "Oman", department: "Administrative", designation: "Administrative", salary: "600.000", status: "Active" },
  { id: 10, emp_id: "10", name: "Hamad Al Busaidi", branch: "Salalah", dateOfJoining: "2019-07-08", gender: "Male", nationality: "Oman", department: "Lawyer", designation: "Supervisor", salary: "1500.000", status: "Active" },
  { id: 11, emp_id: "11", name: "Maryam Al Harthi", branch: "Muscat", dateOfJoining: "2023-01-10", gender: "Female", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "1600.000", status: "Active" },
  { id: 12, emp_id: "12", name: "Yousuf Al Wahaibi", branch: "Muscat", dateOfJoining: "2017-09-25", gender: "Male", nationality: "Oman", department: "Partner", designation: "Partner", salary: "3500.000", status: "Active" },
  { id: 13, emp_id: "13", name: "Nadia Al Siyabi", branch: "Salalah", dateOfJoining: "2021-05-18", gender: "Female", nationality: "Oman", department: "Accountant", designation: "Accountant", salary: "900.000", status: "Active" },
  { id: 14, emp_id: "14", name: "Omar Al Maskari", branch: "Muscat", dateOfJoining: "2020-03-30", gender: "Male", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "1700.000", status: "On Leave" },
  { id: 15, emp_id: "15", name: "Huda Al Jabri", branch: "Muscat", dateOfJoining: "2022-09-12", gender: "Female", nationality: "Oman", department: "Administrative", designation: "Administrative", salary: "550.000", status: "Active" },
  { id: 16, emp_id: "16", name: "Imran Sheikh", branch: "Salalah", dateOfJoining: "2021-11-22", gender: "Male", nationality: "Pakistan", department: "Lawyer", designation: "Litigation", salary: "1400.000", status: "Active" },
  { id: 17, emp_id: "17", name: "Amina Al Farsi", branch: "Muscat", dateOfJoining: "2019-12-05", gender: "Female", nationality: "Oman", department: "Advisor", designation: "Advisor", salary: "2100.000", status: "Active" },
  { id: 18, emp_id: "18", name: "Hassan Al Zadjali", branch: "Salalah", dateOfJoining: "2020-08-17", gender: "Male", nationality: "Oman", department: "Lawyer", designation: "Supervisor", salary: "1450.000", status: "Terminated" },
  { id: 19, emp_id: "19", name: "Zainab Al Hosni", branch: "Muscat", dateOfJoining: "2023-04-03", gender: "Female", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "1550.000", status: "Active" },
  { id: 20, emp_id: "20", name: "Abdul Rahman", branch: "Muscat", dateOfJoining: "2018-06-14", gender: "Male", nationality: "Egypt", department: "Accountant", designation: "Accountant", salary: "1100.000", status: "Active" },
  { id: 21, emp_id: "21", name: "Sumaya Al Riyami", branch: "Salalah", dateOfJoining: "2022-07-25", gender: "Female", nationality: "Oman", department: "Administrative", designation: "Administrative", salary: "580.000", status: "Active" },
  { id: 22, emp_id: "22", name: "Tariq Al Ghafri", branch: "Muscat", dateOfJoining: "2019-02-11", gender: "Male", nationality: "Oman", department: "Partner", designation: "Partner", salary: "2800.000", status: "Active" },
  { id: 23, emp_id: "23", name: "Reem Al Mahrouqi", branch: "Muscat", dateOfJoining: "2021-10-08", gender: "Female", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "1650.000", status: "Inactive" },
  { id: 24, emp_id: "24", name: "Nasir Al Shukri", branch: "Salalah", dateOfJoining: "2020-05-20", gender: "Male", nationality: "Oman", department: "Advisor", designation: "Advisor", salary: "2000.000", status: "Active" },
  { id: 25, emp_id: "25", name: "Priya Sharma", branch: "Muscat", dateOfJoining: "2022-12-01", gender: "Female", nationality: "India", department: "Administrative", designation: "Administrative", salary: "620.000", status: "Active" },
];

export default function EmployeesList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    if (branchFilter !== "all" && employee.branch !== branchFilter) return false;
    if (genderFilter !== "all" && employee.gender !== genderFilter) return false;
    if (nationalityFilter !== "all" && employee.nationality !== nationalityFilter) return false;
    if (departmentFilter !== "all" && employee.department !== departmentFilter) return false;
    if (designationFilter !== "all" && employee.designation !== designationFilter) return false;
    if (statusFilter !== "all" && employee.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    { key: "emp_id", header: "Employee No.", width: "9%", cellClassName: "text-left font-medium" },
    { key: "name", header: "Employee Name", width: "15%" },
    {
      key: "branch",
      header: "Branch",
      width: "9%",
      filterComponent: (
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value="Muscat">Muscat</SelectItem>
            <SelectItem value="Salalah">Salalah</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: "dateOfJoining",
      header: "Date of Joining",
      width: "11%",
      render: (value) => new Date(value).toLocaleDateString('en-GB')
    },
    {
      key: "gender",
      header: "Gender",
      width: "8%",
      filterComponent: (
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: "nationality",
      header: "Nationality",
      width: "10%",
      filterComponent: (
        <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Oman">Oman</SelectItem>
            <SelectItem value="UAE">UAE</SelectItem>
            <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
            <SelectItem value="India">India</SelectItem>
            <SelectItem value="Pakistan">Pakistan</SelectItem>
            <SelectItem value="Bangladesh">Bangladesh</SelectItem>
            <SelectItem value="Philippines">Philippines</SelectItem>
            <SelectItem value="Egypt">Egypt</SelectItem>
            <SelectItem value="Jordan">Jordan</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: "department",
      header: "Department",
      width: "10%",
      filterComponent: (
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Partner">Partner</SelectItem>
            <SelectItem value="Advisor">Advisor</SelectItem>
            <SelectItem value="Lawyer">Lawyer</SelectItem>
            <SelectItem value="Administrative">Administrative</SelectItem>
            <SelectItem value="Accountant">Accountant</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: "designation",
      header: "Designation",
      width: "11%",
      filterComponent: (
        <Select value={designationFilter} onValueChange={setDesignationFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Partner">Partner</SelectItem>
            <SelectItem value="Advisor">Advisor</SelectItem>
            <SelectItem value="Litigation">Litigation</SelectItem>
            <SelectItem value="Supervisor">Supervisor</SelectItem>
            <SelectItem value="Accountant">Accountant</SelectItem>
            <SelectItem value="Administrative">Administrative</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: "salary",
      header: "Salary",
      width: "7%",
      render: (value) => `${parseFloat(value).toFixed(2)}`
    },
    {
      key: "status",
      header: "Status",
      width: "8%",
      render: (value) => {
        const variants = {
          "Active": "success",
          "Inactive": "secondary",
          "On Leave": "warning",
          "Terminated": "destructive"
        };
        return (
          <Badge variant={variants[value] || "default"}>
            {value}
          </Badge>
        );
      },
      filterComponent: (
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
            <SelectItem value="Terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "8%",
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row.id}/edit`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Delete employee:", row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-secondary">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Employees
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage employee records
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
            data={filteredEmployees}
            searchPlaceholder="Search employees..."
            currentPage={currentPage}
            totalPages={Math.ceil(filteredEmployees.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
