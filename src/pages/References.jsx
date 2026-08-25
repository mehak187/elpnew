import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import RecordDialog from "@/components/shared/RecordDialog";
import { BookOpen, Plus, Eye, Edit, Trash2 } from "lucide-react";

const references = [
  { id: 1, category: "Courts", name: "Primary Court - Muscat", code: "PC-MUS", status: "Active" },
  { id: 2, category: "Courts", name: "Primary Court - Salalah", code: "PC-SAL", status: "Active" },
  { id: 3, category: "Courts", name: "Commercial Court", code: "COMM", status: "Active" },
  { id: 4, category: "Courts", name: "Appeal Court", code: "APP", status: "Active" },
  { id: 5, category: "Courts", name: "Supreme Court", code: "SUP", status: "Active" },
  { id: 6, category: "Case Types", name: "Civil", code: "CIV", status: "Active" },
  { id: 7, category: "Case Types", name: "Commercial", code: "COM", status: "Active" },
  { id: 8, category: "Case Types", name: "Labor", code: "LAB", status: "Active" },
  { id: 9, category: "Case Types", name: "Criminal", code: "CRM", status: "Active" },
  { id: 10, category: "Case Types", name: "Family", code: "FAM", status: "Active" },
  { id: 11, category: "Departments", name: "Litigation", code: "LIT", status: "Active" },
  { id: 12, category: "Departments", name: "Corporate", code: "CORP", status: "Active" },
  { id: 13, category: "Departments", name: "Administration", code: "ADM", status: "Active" },
  { id: 14, category: "Branches", name: "Muscat", code: "MUS", status: "Active" },
  { id: 15, category: "Branches", name: "Salalah", code: "SAL", status: "Active" },
  { id: 16, category: "Branches", name: "Sohar", code: "SOH", status: "Inactive" },
];

const buildColumns = (onEdit, onDelete) => [
  {
    key: "category",
    header: "Category",
    width: "18%",
    render: (value) => (
      <Badge variant="outline">{value}</Badge>
    )
  },
  { key: "name", header: "Name", width: "30%", cellClassName: "text-left font-medium" },
  { key: "code", header: "Code", width: "12%", cellClassName: "font-mono" },
  {
    key: "status",
    header: "Status",
    width: "12%",
    render: (value) => (
      <Badge variant={value === "Active" ? "success" : "secondary"}>
        {value}
      </Badge>
    )
  },
  {
    key: "actions",
    header: "Actions",
    width: "18%",
    disableFilter: true,
    render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Edit reference"
          onClick={() => onEdit(row)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          title="Delete reference"
          onClick={() => onDelete(row)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  },
];

const categories = ["All", "Courts", "Case Types", "Departments", "Branches"];

const REFERENCE_FIELDS = [
  { key: "category", label: "Category" },
  { key: "name", label: "Name" },
  { key: "code", label: "Code" },
  { key: "status", label: "Status" },
];

const blankReference = {
  id: null,
  category: "Courts",
  name: "",
  code: "",
  status: "Active",
};

export default function References() {
  const [rows, setRows] = useState(references);
  const [selected, setSelected] = useState(null);

  const columns = buildColumns(
    (row) => setSelected(row),
    (row) => setRows((prev) => prev.filter((r) => r.id !== row.id))
  );

  const saveReference = (record) => {
    setRows((prev) =>
      record.id
        ? prev.map((r) => (r.id === record.id ? record : r))
        : [
            ...prev,
            {
              ...record,
              id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
            },
          ]
    );
  };
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredData = selectedCategory === "All"
    ? rows
    : rows.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-primary">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              References
            </h1>
            <p className="text-xs sm:text-sm text-primary/75">
              Manage system reference data
            </p>
          </div>
        </div>
        <Button onClick={() => setSelected({ ...blankReference, id: 0 })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reference
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <RecordDialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected && selected.id ? "Edit Reference" : "Add Reference"}
        record={selected}
        fields={REFERENCE_FIELDS}
        onSave={(record) =>
          saveReference(record.id ? record : { ...record, id: null })
        }
      />

      {/* Data Table */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search references..."
            currentPage={currentPage}
            totalPages={Math.ceil(filteredData.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
