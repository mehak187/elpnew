import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import { Upload, FileText, X } from "lucide-react";
import {
  DOCUMENT_TYPES,
  DOCUMENT_EXPIRY_LABELS,
  DOCUMENT_STATUSES,
} from "@/lib/constants";
import { clientDocuments, officeFiles } from "../clientMockData";

const STATUS_VARIANT = {
  Valid: "success",
  "Expiring Soon": "warning",
  Expired: "destructive",
  "Not Required": "secondary",
};

const emptyUpload = {
  documentType: "",
  expiryDate: "",
  notes: "",
  linkedFileNo: "",
};

export default function DocumentsSection() {
  const [documents, setDocuments] = useState(clientDocuments);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(emptyUpload);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Expiry only applies to the two document types that carry one.
  const expiryLabel = DOCUMENT_EXPIRY_LABELS[draft.documentType];
  const needsOfficeFile = draft.documentType === "Special Contract";

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  const handleFileChange = (e) => {
    const chosen = e.target.files[0];
    if (chosen) setFile(chosen);
  };

  const handleSave = () => {
    setDocuments((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        documentType: draft.documentType,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadDate: new Date().toISOString().slice(0, 10),
        expiryDate: draft.expiryDate,
        status: DOCUMENT_STATUSES[0],
        notes: draft.notes,
        linkedFileNo: draft.linkedFileNo || null,
      },
    ]);
    setFile(null);
    setDraft(emptyUpload);
  };

  const canSave =
    file && draft.documentType && (!needsOfficeFile || draft.linkedFileNo);

  const columns = [
    {
      key: "documentType",
      header: "Document Type",
      width: "18%",
      cellClassName: "font-medium",
    },
    {
      key: "fileName",
      header: "Uploaded Document",
      width: "20%",
      render: (value, row) => (
        <button
          type="button"
          onClick={() =>
            window.open(row.fileUrl, "_blank", "noopener,noreferrer")
          }
          className="flex items-start gap-2 text-left text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          <FileText className="h-4 w-4 shrink-0" />
          {value}
        </button>
      ),
    },
    { key: "uploadDate", header: "Upload Date", width: "12%" },
    {
      key: "expiryDate",
      header: "Expiry Date",
      width: "12%",
      render: (value) =>
        value || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "status",
      header: "Document Status",
      width: "14%",
      render: (value) => <Badge variant={STATUS_VARIANT[value]}>{value}</Badge>,
    },
    {
      key: "notes",
      header: "Notes",
      width: "24%",
      render: (value, row) => (
        <span className="text-muted-foreground">
          {row.linkedFileNo ? "File " + row.linkedFileNo + ". " : ""}
          {value || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={draft.documentType}
                onValueChange={(value) => setField("documentType", value)}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Please Select" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload</Label>
              {!file ? (
                <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  Upload File
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex h-9 items-center justify-between gap-2 rounded-md bg-muted px-3">
                  <span className="truncate text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </button>
                </div>
              )}
            </div>

            {/* Expiry date, only for the types that have one */}
            {expiryLabel && (
              <div className="space-y-2">
                <Label htmlFor="documentExpiry">{expiryLabel} *</Label>
                <Input
                  id="documentExpiry"
                  type="date"
                  value={draft.expiryDate}
                  onChange={(e) => setField("expiryDate", e.target.value)}
                />
              </div>
            )}

            {/* A special contract is tied to an office file sequence number */}
            {needsOfficeFile && (
              <div className="space-y-2">
                <Label htmlFor="linkedFileNo">Link to Office File *</Label>
                <Select
                  value={draft.linkedFileNo}
                  onValueChange={(value) => setField("linkedFileNo", value)}
                >
                  <SelectTrigger id="linkedFileNo">
                    <SelectValue placeholder="Select file number" />
                  </SelectTrigger>
                  <SelectContent>
                    {officeFiles.map((officeFile) => (
                      <SelectItem
                        key={officeFile.fileNo}
                        value={officeFile.fileNo}
                      >
                        {officeFile.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes only make sense once there is a document to annotate */}
          {file && (
            <div className="space-y-2">
              <Label htmlFor="documentNotes">Notes</Label>
              <Textarea
                id="documentNotes"
                value={draft.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Add a note about this document"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={!canSave}>
              Save Document
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={documents}
        searchPlaceholder="Search documents..."
        enableColumnSearch={false}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
