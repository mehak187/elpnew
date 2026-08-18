import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import DataTable from "@/components/shared/DataTable";
import { Calendar, ListTodo } from "lucide-react";

// Sample data
const tasks = [
  {
    id: 1,
    task: "Prepare documents for case 2024/001",
    case_no: "2024/001",
    due_date: "2025-01-15",
    priority: "High",
    status: "Pending",
    completed: false,
  },
  {
    id: 2,
    task: "Review contract for ABC Corporation",
    case_no: "CORP/2024/001",
    due_date: "2025-01-10",
    priority: "Medium",
    status: "In Progress",
    completed: false,
  },
  {
    id: 3,
    task: "File appeal documents",
    case_no: "2024/002",
    due_date: "2025-01-20",
    priority: "High",
    status: "Pending",
    completed: false,
  },
  {
    id: 4,
    task: "Client meeting preparation",
    case_no: "2024/003",
    due_date: "2024-12-28",
    priority: "Low",
    status: "Completed",
    completed: true,
  },
];

const columns = [
  {
    key: "completed",
    header: "",
    width: "5%",
    render: (value) => (
      <Checkbox checked={value} className="mx-auto" />
    ),
  },
  { key: "task", header: "Task", width: "35%", cellClassName: "text-left" },
  { key: "case_no", header: "Case No.", width: "12%" },
  {
    key: "due_date",
    header: "Due Date",
    width: "12%",
    render: (value) => (
      <span className="flex items-center justify-center gap-1">
        <Calendar className="h-3 w-3" />
        {value}
      </span>
    ),
  },
  {
    key: "priority",
    header: "Priority",
    width: "10%",
    render: (value) => (
      <Badge
        variant={
          value === "High"
            ? "destructive"
            : value === "Medium"
            ? "warning"
            : "secondary"
        }
      >
        {value}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "12%",
    render: (value) => (
      <Badge
        variant={
          value === "Completed"
            ? "success"
            : value === "In Progress"
            ? "brand"
            : "outline"
        }
      >
        {value}
      </Badge>
    ),
  },
];

export default function Tasks() {
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 sm:p-3 rounded-xl bg-secondary">
          <ListTodo className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            My Tasks
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track and manage your assigned tasks
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={tasks}
            searchPlaceholder="Search tasks..."
            currentPage={currentPage}
            totalPages={Math.ceil(tasks.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            showExport={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
