import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import { Gavel, Plus, ArrowLeft, Calendar, Save } from "lucide-react";

const hearings = [
  { id: 1, date: "2024-12-15", type: "First Hearing", outcome: "Adjourned", next_date: "2025-01-10", notes: "Documents submitted" },
  { id: 2, date: "2025-01-10", type: "Evidence Submission", outcome: "Pending", next_date: "-", notes: "Awaiting expert report" },
];

const columns = [
  { key: "date", header: "Hearing Date", width: "15%", cellClassName: "font-medium" },
  { key: "type", header: "Hearing Type", width: "18%" },
  {
    key: "outcome",
    header: "Outcome",
    width: "12%",
    render: (value) => (
      <Badge variant={value === "Adjourned" ? "warning" : "outline"}>
        {value}
      </Badge>
    )
  },
  { key: "next_date", header: "Next Date", width: "15%" },
  { key: "notes", header: "Notes", width: "30%", cellClassName: "text-left" },
];

export default function CourtHearing() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    type: "",
    outcome: "",
    next_date: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Adding hearing:", formData);
    setShowForm(false);
    setFormData({ date: "", type: "", outcome: "", next_date: "", notes: "" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary text-primary hover:bg-accent" onClick={() => navigate("/litigation")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="p-2 sm:p-3 rounded-xl bg-primary">
          <Gavel className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            Court Hearings
          </h1>
          <p className="text-xs sm:text-sm text-primary/75">
            Case No: {id || "2024/001"} - Manage court hearing sessions
          </p>
        </div>
      </div>

      {/* Case Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="font-medium">ABC Holdings LLC</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Case Type</p>
              <p className="font-medium">Civil</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Court</p>
              <p className="font-medium">Primary Court - Muscat</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="brand">Court Hearing</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Hearing Form */}
      {showForm && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-semibold text-primary">Add New Hearing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Hearing Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Hearing Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Hearing">First Hearing</SelectItem>
                      <SelectItem value="Evidence Submission">Evidence Submission</SelectItem>
                      <SelectItem value="Witness Examination">Witness Examination</SelectItem>
                      <SelectItem value="Final Arguments">Final Arguments</SelectItem>
                      <SelectItem value="Judgement">Judgement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome">Outcome</Label>
                  <Select
                    value={formData.outcome}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, outcome: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Adjourned">Adjourned</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_date">Next Hearing Date</Label>
                  <Input
                    id="next_date"
                    name="next_date"
                    type="date"
                    value={formData.next_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter hearing notes"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Hearing
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Hearings List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-primary">Hearing History</h3>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Hearing
              </Button>
            )}
          </div>
          <DataTable
            columns={columns}
            data={hearings}
            searchPlaceholder="Search hearings..."
            currentPage={currentPage}
            totalPages={Math.ceil(hearings.length / pageSize)}
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
