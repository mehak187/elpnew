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
import {
  Upload,
  FileText,
  FileCheck,
  Trash2,
  Plus,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { expiryState, EXPIRY_LABEL } from "@/lib/expiry";
import { clientDocuments } from "../clientMockData";

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
 * Only these three do. Everything else is a file with a note, so nothing extra
 * is asked for.
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

/** Today as a plain YYYY-MM-DD in the user's own timezone. */
const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const emptyUpload = {
  documentType: "",
  documentDate: "",
  expiryDate: "",
  notes: "",
};

/**
 * An expiry date and what it means.
 *
 * The state is said in words as well as colour: a red date on its own tells
 * anyone who cannot see it nothing at all, and tells everyone else only that
 * something is wrong - not whether the paper has weeks left or has already
 * lapsed.
 */
function ExpiryLine({ date }) {
  const state = expiryState(date);

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="text-muted-foreground">Expiry Date:</span>
      <span
        className={cn(
          state === "expired" ? "font-semibold text-red-600" : "font-medium"
        )}
      >
        {date || "-"}
      </span>

      {state !== "none" && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-medium",
            state === "valid" && "text-green-600",
            state === "soon" && "text-amber-600",
            state === "expired" && "text-red-600"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              state === "valid" && "bg-green-500",
              state === "soon" && "bg-amber-500",
              state === "expired" && "bg-red-500"
            )}
          />
          {EXPIRY_LABEL[state]}
        </span>
      )}
    </p>
  );
}

/** One fact in the details panel. */
function Detail({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

/**
 * The papers filed against a client.
 *
 * Status is never stored - it is read off the expiry date every render, so a
 * document cannot sit in the list calling itself valid after its date has
 * passed.
 *
 * Deleting is deliberately not a button in every row. A row is opened first,
 * read, and only then deleted, so a paper cannot be thrown away by a stray
 * click on a table of near-identical lines.
 */
export default function DocumentsSection({ formData, onChange }) {
  const [documents, setDocuments] = useState(clientDocuments);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(emptyUpload);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const linked = LINKED_FIELDS[draft.documentType];
  const opened = documents.find((d) => d.id === openId) || null;

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  const handleFileChange = (e) => {
    const chosen = e.target.files[0];
    if (chosen) setFile(chosen);
  };

  const closeForm = () => {
    setAdding(false);
    setFile(null);
    setDraft(emptyUpload);
  };

  const removeDocument = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setOpenId(null);
  };

  const handleSave = () => {
    setDocuments((prev) => {
      const next = prev.reduce((max, d) => Math.max(max, d.serial), 0) + 1;
      return [
        ...prev,
        {
          id: next,
          serial: next,
          documentType: draft.documentType,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          documentDate: draft.documentDate,
          expiryDate: linked ? formData[linked.expiryField] : draft.expiryDate,
          notes: draft.notes,
          linkedFileNo: null,
        },
      ];
    });
    closeForm();
  };

  const canSave =
    file &&
    draft.documentType &&
    draft.documentDate &&
    (!linked || linked.fields.every((field) => formData[field.name]));

  const openFile = (document) =>
    window.open(document.fileUrl, "_blank", "noopener,noreferrer");

  const columns = [
    {
      key: "serial",
      header: "Serial No.",
      width: "10%",
      render: (value, row) => (
        <button
          type="button"
          onClick={() => setOpenId(row.id === openId ? null : row.id)}
          className="rounded font-semibold text-primary underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {value}
        </button>
      ),
    },
    {
      key: "documentDate",
      header: "Document Date",
      subHeader: "(Actual Date)",
      width: "14%",
    },
    {
      // The type and the life left in it read as one thing: what the paper is
      // and whether it still counts.
      key: "documentType",
      header: "Document Type",
      subHeader: "(Expiry Date & Status)",
      width: "30%",
      exportValue: (row) =>
        row.documentType +
        " - " +
        (row.expiryDate
          ? row.expiryDate + " (" + EXPIRY_LABEL[expiryState(row.expiryDate)] + ")"
          : "no expiry"),
      render: (value, row) => (
        <div className="space-y-1">
          <p className="font-medium">{value}</p>
          <ExpiryLine date={row.expiryDate} />
        </div>
      ),
    },
    {
      key: "fileName",
      header: "Document",
      width: "22%",
      render: (value, row) => (
        <button
          type="button"
          onClick={() => openFile(row)}
          className="flex items-start gap-2 rounded text-left text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <FileText className="mt-0.5 h-4 w-4 shrink-0" />
          {value}
        </button>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      width: "24%",
      render: (value) => (
        <span className="text-muted-foreground">{value || "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {/* The form takes the place above the table only while it is being
          filled in, so the list is what the page normally shows. */}
      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

              {/* The date on the paper, not the day it reached the office. */}
              <div className="space-y-2">
                <Label htmlFor="documentDate">Document Date *</Label>
                <Input
                  id="documentDate"
                  type="date"
                  max={todayIso()}
                  value={draft.documentDate}
                  onChange={(e) => setField("documentDate", e.target.value)}
                />
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

              {/* A type that carries no client field brings its own expiry. */}
              {!linked && (
                <div className="space-y-2">
                  <Label htmlFor="documentExpiry">Expiry Date</Label>
                  <Input
                    id="documentExpiry"
                    type="date"
                    value={draft.expiryDate}
                    onChange={(e) => setField("expiryDate", e.target.value)}
                  />
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={!canSave}>
                Save Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="flex items-start gap-2 rounded-md border-l-4 border-l-blue-500 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Note:</span> Click on the Serial No.
          to view the document details in the section above the table. In the
          document details, you will find the option to delete the document.
        </span>
      </p>

      {/* The opened document, above the table it was opened from. */}
      {opened && (
        <Card className="border-primary/40">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-primary">
                Document {opened.serial} &mdash; {opened.documentType}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Close details"
                onClick={() => setOpenId(null)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close details</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Document Date">{opened.documentDate}</Detail>
              <Detail label="Expiry &amp; Status">
                <ExpiryLine date={opened.expiryDate} />
              </Detail>
              <Detail label="Document">
                <button
                  type="button"
                  onClick={() => openFile(opened)}
                  className="flex items-center gap-2 rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  {opened.fileName}
                </button>
              </Detail>
              <Detail label="Notes">
                <span className="font-normal text-muted-foreground">
                  {opened.notes || "-"}
                </span>
              </Detail>
            </div>

            <div className="flex justify-end border-t pt-3">
              <Button
                type="button"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => removeDocument(opened.id)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      <p className="flex items-start gap-2 rounded-md border-l-4 border-l-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Important:</span> When adding or
          uploading a document, the field &ldquo;Upload Date&rdquo; is now shown
          as &ldquo;Document Date&rdquo;. Please enter the actual date of the
          document, not the upload date.
        </span>
      </p>
    </div>
  );
}
