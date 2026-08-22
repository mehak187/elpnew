import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import { Upload, FileText, FileCheck, Trash2 } from "lucide-react";
import {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
} from "@/lib/constants";
import { clientDocuments, officeFiles } from "../clientMockData";

/**
 * Document types that carry fields the client record already holds.
 *
 * These are edited here and in Basic Info as one value - not copied - so a
 * change in either place is the same change. Adding another such type means
 * adding a row here and nothing else.
 */
/** The client's reference number and its expiry. Editing them here edits the
 *  client record itself. */
const REFERENCE_FIELDS = {
  expiryField: "referenceExpiryDate",
  fields: [
    {
      name: "referenceNo",
      label: "Reference No.",
      placeholder: "Enter reference number",
    },
    {
      name: "referenceExpiryDate",
      label: "Reference Expiry Date",
      type: "date",
    },
  ],
};

/**
 * Which client fields each document type carries.
 *
 * Only these three do. Instructions, contracts and anything else are just a
 * file with a note, so nothing extra is asked for.
 */
const LINKED_FIELDS = {
  "Power of Attorney": {
    expiryField: "poaExpiryDate",
    fields: [
      { name: "poaNo", label: "POA No.", placeholder: "Enter POA number" },
      { name: "poaExpiryDate", label: "POA Expiry Date", type: "date" },
    ],
  },
  "Commercial Registration": REFERENCE_FIELDS,
  "ID Card": REFERENCE_FIELDS,
};

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

  const needsOfficeFile = draft.documentType === "Special Contract";
  const linked = LINKED_FIELDS[draft.documentType];

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
        expiryDate: linked
          ? formData[linked.expiryField]
          : draft.expiryDate,
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
    (!linked || linked.fields.every((field) => formData[field.name]));

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
              <div className="flex gap-2">
                <Select
                  value={draft.documentType}
                  onValueChange={(value) => setField("documentType", value)}
                >
                  <SelectTrigger id="documentType" className="flex-1">
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
                    title="Upload file"
                    asChild
                  >
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <span className="sr-only">Upload file</span>
                      <Input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>

{/* These read and write the client's own fields, so editing them
                here or in Basic Info changes the same value. */}
            {linked?.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={"document-" + field.name}>
                  {field.label} *
                </Label>
                <Input
                  id={"document-" + field.name}
                  name={field.name}
                  type={field.type || "text"}
                  value={formData[field.name]}
                  onChange={onChange}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

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

            <div className="space-y-2">
              <Label htmlFor="documentNotes">Note</Label>
              <Input
                id="documentNotes"
                value={draft.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Add a note about this document"
              />
            </div>
          </div>

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
