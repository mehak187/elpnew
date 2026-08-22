import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Upload, FileText, X, Trash2 } from "lucide-react";
import {
  DOCUMENT_TYPES,
  DOCUMENT_EXPIRY_LABELS,
  DOCUMENT_STATUSES,
} from "@/lib/constants";
import { clientDocuments, officeFiles } from "../clientMockData";

const emptyUpload = {
  documentType: "",
  expiryDate: "",
  notes: "",
  linkedFileNo: "",
};

export default function DocumentsSection({ formData, onChange }) {
  const [documents, setDocuments] = useState(clientDocuments);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(emptyUpload);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Expiry only applies to the two document types that carry one.
  const expiryLabel = DOCUMENT_EXPIRY_LABELS[draft.documentType];
  const needsOfficeFile = draft.documentType === "Special Contract";
  // A power of attorney carries the client's own POA number and expiry, so
  // those two fields are edited here and in Basic Info as one value.
  const isPowerOfAttorney = draft.documentType === "Power of Attorney";

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  const handleFileChange = (e) => {
    const chosen = e.target.files[0];
    if (chosen) setFile(chosen);
  };

  const removeDocument = (id) =>
    setDocuments((prev) => prev.filter((d) => d.id !== id));

  const handleSave = () => {
    setDocuments((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        documentType: draft.documentType,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadDate: new Date().toISOString().slice(0, 10),
        expiryDate: isPowerOfAttorney ? formData.poaExpiryDate : draft.expiryDate,
        status: DOCUMENT_STATUSES[0],
        notes: draft.notes,
        linkedFileNo: draft.linkedFileNo || null,
      },
    ]);
    setFile(null);
    setDraft(emptyUpload);
  };

  const canSave =
    file &&
    draft.documentType &&
    (!needsOfficeFile || draft.linkedFileNo) &&
    (!isPowerOfAttorney || (formData.poaNo && formData.poaExpiryDate));

  const columns = [
    {
      key: "documentType",
      header: "Document Type",
      width: "20%",
      cellClassName: "font-medium",
    },
    { key: "uploadDate", header: "Upload Date", width: "14%" },
    {
      key: "fileName",
      header: "Uploaded Document",
      width: "24%",
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
      width: "34%",
      render: (value, row) => (
        <span className="text-muted-foreground">
          {row.linkedFileNo ? "File " + row.linkedFileNo + ". " : ""}
          {value || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Delete",
      width: "8%",
      disableFilter: true,
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            title="Delete document"
            onClick={() => removeDocument(row.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {row.fileName}</span>
          </Button>
        </div>
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

{/* A power of attorney reads and writes the client's own POA fields, so
                editing either here or in Basic Info changes the same value. */}
            {isPowerOfAttorney && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="documentPoaNo">POA No. *</Label>
                  <Input
                    id="documentPoaNo"
                    name="poaNo"
                    value={formData.poaNo}
                    onChange={onChange}
                    placeholder="Enter POA number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentPoaExpiry">POA Expiry Date *</Label>
                  <Input
                    id="documentPoaExpiry"
                    name="poaExpiryDate"
                    type="date"
                    value={formData.poaExpiryDate}
                    onChange={onChange}
                  />
                </div>
              </>
            )}

            {/* Expiry date, for the other type that carries one */}
            {expiryLabel && !isPowerOfAttorney && (
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
