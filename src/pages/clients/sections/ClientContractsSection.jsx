import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTable from "@/components/shared/DataTable";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { Upload, FileText, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTRACT_TYPES } from "@/lib/constants";
import { formatDate, dayOffset } from "@/pages/firm/firmData";
import { clientContracts, clientLinkedCases } from "../clientMockData";

/**
 * A contract is spent once the end date it carries has arrived. Until then it
 * is live, even if an end date is already agreed.
 */
const isCancelled = (contract) =>
  Boolean(contract.endDate) && contract.endDate <= dayOffset(0);

/**
 * Live contracts first, spent ones beneath them.
 *
 * Whoever opens this page is nearly always after the agreement in force, so the
 * ones that have run out are pushed under it rather than mixed in by date.
 */
const byStanding = (a, b) => {
  const spent = Number(isCancelled(a)) - Number(isCancelled(b));
  return spent || b.startDate.localeCompare(a.startDate);
};

const emptyContract = {
  contractType: "General",
  caseFileNo: "",
  title: "",
  startDate: "",
  endDate: "",
  notes: "",
};

export default function ClientContractsSection() {
  const [contracts, setContracts] = useState(clientContracts);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(emptyContract);
  const [editing, setEditing] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const isSpecific = draft.contractType === "Specific";

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  const canSave =
    file && draft.startDate && (!isSpecific || draft.caseFileNo);

  const handleSave = () => {
    setContracts((prev) => [
      ...prev,
      {
        ...draft,
        id: prev.reduce((max, c) => Math.max(max, c.id), 0) + 1,
        serial: prev.reduce((max, c) => Math.max(max, c.serial), 0) + 1,
        caseFileNo: isSpecific ? draft.caseFileNo : null,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
      },
    ]);
    setFile(null);
    setDraft(emptyContract);
  };

  const saveEdit = () => {
    setContracts((prev) =>
      prev.map((c) => (c.id === editing.id ? editing : c))
    );
    setEditing(null);
  };

  const rows = [...contracts].sort(byStanding);

  const columns = [
    {
      key: "serial",
      header: "Serial No.",
      width: "12%",
      render: (value, row) => (
        <div>
          <button
            type="button"
            onClick={() => setEditing({ ...row })}
            className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {value}
          </button>
          {isCancelled(row) && (
            <div className="mt-1">
              <Badge variant="destructive">Cancelled</Badge>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {formatDate(row.endDate)}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "contractType",
      header: "Contract Type",
      width: "14%",
      cellClassName: "font-medium",
      render: (value, row) => (
        <div>
          <span className="block">{value}</span>
          {row.caseFileNo && (
            <span className="block text-xs text-muted-foreground">
              Case file {row.caseFileNo}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      width: "12%",
      render: (value) => formatDate(value) || "-",
    },
    {
      key: "endDate",
      header: "Contract End Date",
      width: "13%",
      render: (value) =>
        value ? (
          formatDate(value)
        ) : (
          <span className="text-muted-foreground">Open ended</span>
        ),
    },
    {
      key: "fileName",
      header: "Contract Document",
      width: "25%",
      render: (value, row) => (
        <button
          type="button"
          onClick={() =>
            window.open(row.fileUrl, "_blank", "noopener,noreferrer")
          }
          className="flex items-start gap-2 rounded text-left text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <FileText className="h-4 w-4 shrink-0" />
          {value}
        </button>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      width: "24%",
      render: (value, row) => (
        <span className="text-muted-foreground">
          {row.title ? row.title + ". " : ""}
          {value || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Add a contract */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type *</Label>
              <div className="flex gap-2">
                <Select
                  value={draft.contractType}
                  onValueChange={(value) => setField("contractType", value)}
                >
                  <SelectTrigger id="contractType" className="flex-1">
                    <SelectValue placeholder="Please Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* The attached file's name lives in the tooltip, so the
                    control stays the size of an icon either way. */}
                {file ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-green-600 text-green-600 hover:text-destructive"
                    title={file.name + " - click to remove"}
                    onClick={() => setFile(null)}
                  >
                    <FileCheck className="h-4 w-4" />
                    <span className="sr-only">
                      {file.name} attached. Remove it.
                    </span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Upload contract"
                    asChild
                  >
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <span className="sr-only">Upload contract</span>
                      <Input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files[0] && setFile(e.target.files[0])
                        }
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>

            {/* A specific contract is written for one case, so it names it */}
            {isSpecific && (
              <div className="space-y-2">
                <Label htmlFor="caseFileNo">Case File Number *</Label>
                <SearchableSelect
                  id="caseFileNo"
                  value={draft.caseFileNo}
                  onValueChange={(value) => setField("caseFileNo", value)}
                  options={clientLinkedCases.map((c) => ({
                    value: c.fileNo,
                    label: c.fileNo + " - " + c.opponent,
                  }))}
                  placeholder="Select case file"
                  searchPlaceholder="Search file number or opponent..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="contractStart">Start Date *</Label>
              <Input
                id="contractStart"
                type="date"
                value={draft.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractEnd">Contract End Date</Label>
              <Input
                id="contractEnd"
                type="date"
                value={draft.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractTitle">Contract</Label>
              <Input
                id="contractTitle"
                value={draft.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Original, renewal, amendment..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractNotes">Note</Label>
              <Input
                id="contractNotes"
                value={draft.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Add a note about this contract"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={!canSave}>
              Save Contract
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search contracts..."
        enableColumnSearch={false}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* The serial number opens the contract for reading and editing */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract {editing?.serial}</DialogTitle>
            <DialogDescription>
              {editing && isCancelled(editing)
                ? "Cancelled on " + formatDate(editing.endDate)
                : "In force"}
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* The case file only exists for a specific contract, so the type
                  takes the whole row when there is nothing to sit beside it. */}
              <div
                className={cn(
                  "space-y-2",
                  editing.contractType !== "Specific" && "sm:col-span-2"
                )}
              >
                <Label htmlFor="editType">Contract Type</Label>
                <Select
                  value={editing.contractType}
                  onValueChange={(value) =>
                    setEditing({
                      ...editing,
                      contractType: value,
                      caseFileNo: value === "Specific" ? editing.caseFileNo : null,
                    })
                  }
                >
                  <SelectTrigger id="editType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editing.contractType === "Specific" && (
                <div className="space-y-2">
                  <Label htmlFor="editCaseFile">Case File Number</Label>
                  <SearchableSelect
                    id="editCaseFile"
                    value={editing.caseFileNo || ""}
                    onValueChange={(value) =>
                      setEditing({ ...editing, caseFileNo: value })
                    }
                    options={clientLinkedCases.map((c) => ({
                      value: c.fileNo,
                      label: c.fileNo + " - " + c.opponent,
                    }))}
                    placeholder="Select case file"
                    searchPlaceholder="Search file number or opponent..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="editStart">Start Date</Label>
                <Input
                  id="editStart"
                  type="date"
                  value={editing.startDate}
                  onChange={(e) =>
                    setEditing({ ...editing, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEnd">Contract End Date</Label>
                <Input
                  id="editEnd"
                  type="date"
                  value={editing.endDate}
                  onChange={(e) =>
                    setEditing({ ...editing, endDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="editTitle">Contract</Label>
                <Input
                  id="editTitle"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="editNotes">Note</Label>
                <Input
                  id="editNotes"
                  value={editing.notes}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Contract Document</Label>
                <button
                  type="button"
                  onClick={() =>
                    window.open(editing.fileUrl, "_blank", "noopener,noreferrer")
                  }
                  className="flex h-9 w-full items-center gap-2 rounded-md border bg-muted/40 px-3 text-left text-sm text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{editing.fileName}</span>
                </button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
