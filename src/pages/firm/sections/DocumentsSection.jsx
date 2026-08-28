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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/panels";
import { Upload, FileCheck, FileText, Trash2 } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import {
  DOCUMENT_TYPES,
  GENERAL_BRANCH,
  DOCUMENT_STATUS_VARIANT,
  branchLabel,
  documentStatus,
  formatDate,
} from "../firmData";

const emptyDraft = {
  branch: GENERAL_BRANCH,
  type: "",
  expiryDate: "",
  notes: "",
};

/**
 * The company's own paperwork.
 *
 * A document either covers the whole company or one branch, so the branch
 * picker leads with General. Status is never typed in - it is read off the
 * expiry date every render, so a document cannot sit in the list claiming to be
 * valid after its date has passed.
 */
export default function DocumentsSection({ canEdit }) {
  const { documents, branches, addDocument, updateDocument, removeDocument } =
    useFirm();

  const [draft, setDraft] = useState(emptyDraft);
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null);

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  const canSave = canEdit && file && draft.type;

  const handleSave = () => {
    if (!canSave) return;
    addDocument({
      branchId: draft.branch === GENERAL_BRANCH ? null : Number(draft.branch),
      type: draft.type,
      expiryDate: draft.expiryDate,
      notes: draft.notes,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
    });
    setDraft(emptyDraft);
    setFile(null);
  };

  const saveEdit = () => {
    updateDocument(editing.id, {
      branchId: editing.branchId,
      type: editing.type,
      expiryDate: editing.expiryDate,
      notes: editing.notes,
    });
    setEditing(null);
  };

  const open = (document) =>
    window.open(document.fileUrl, "_blank", "noopener,noreferrer");

  return (
    <div className="space-y-6">
      {/* Add a document */}
      {canEdit && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="documentBranch">Branch</Label>
                <Select
                  value={draft.branch}
                  onValueChange={(value) => setField("branch", value)}
                >
                  <SelectTrigger id="documentBranch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* General first: most papers cover the whole company */}
                    <SelectItem value={GENERAL_BRANCH}>General</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <div className="flex gap-2">
                  <Select
                    value={draft.type}
                    onValueChange={(value) => setField("type", value)}
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

                  {/* The file name lives in the tooltip, so the control stays
                      the size of an icon either way. */}
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
                      title="Upload document"
                      asChild
                    >
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span className="sr-only">Upload document</span>
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

              <div className="space-y-2">
                <Label htmlFor="documentExpiry">Document Expiry Date</Label>
                <Input
                  id="documentExpiry"
                  type="date"
                  value={draft.expiryDate}
                  onChange={(e) => setField("expiryDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNotes">Notes</Label>
                <Input
                  id="documentNotes"
                  value={draft.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Anything worth recording"
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
      )}

      {/* What is on file */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          {documents.length === 0 ? (
            <div className="p-6">
              <EmptyState>No documents on file yet.</EmptyState>
            </div>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-semibold">Document ID</th>
                  <th className="p-3 font-semibold">Branch</th>
                  <th className="p-3 font-semibold">Document Type</th>
                  <th className="p-3 font-semibold">Document</th>
                  <th className="p-3 font-semibold">Expiry Date</th>
                  <th className="p-3 font-semibold">Notes</th>
                  <th className="p-3 font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => {
                  const status = documentStatus(document);
                  return (
                    <tr
                      key={document.id}
                      className="border-b transition-colors last:border-0 hover:bg-primary/10"
                    >
                      {/* The reference opens the document for editing */}
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...document })}
                          className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {document.docId}
                        </button>
                      </td>
                      <td className="p-3">
                        {branchLabel(branches, document.branchId)}
                      </td>
                      <td className="p-3 font-medium">{document.type}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => open(document)}
                          className="inline-flex items-center gap-1.5 rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          {document.fileName}
                        </button>
                      </td>
                      <td className="p-3">
                        {document.expiryDate ? (
                          <span className="flex flex-col gap-1">
                            {formatDate(document.expiryDate)}
                            {status !== "Active" && (
                              <Badge variant={DOCUMENT_STATUS_VARIANT[status]}>
                                {status}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            No expiry
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {document.notes || "-"}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          title="Delete document"
                          disabled={!canEdit}
                          onClick={() => removeDocument(document.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">
                            Delete {document.docId}
                          </span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* The document reference opens its details for reading and editing */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(next) => !next && setEditing(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.docId}</DialogTitle>
            <DialogDescription>{editing?.fileName}</DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editBranch">Branch</Label>
                <Select
                  value={
                    editing.branchId ? String(editing.branchId) : GENERAL_BRANCH
                  }
                  onValueChange={(value) =>
                    setEditing({
                      ...editing,
                      branchId: value === GENERAL_BRANCH ? null : Number(value),
                    })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger id="editBranch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERAL_BRANCH}>General</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editType">Document Type</Label>
                <Select
                  value={editing.type}
                  onValueChange={(value) =>
                    setEditing({ ...editing, type: value })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger id="editType">
                    <SelectValue />
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
                <Label htmlFor="editExpiry">Document Expiry Date</Label>
                <Input
                  id="editExpiry"
                  type="date"
                  value={editing.expiryDate}
                  onChange={(e) =>
                    setEditing({ ...editing, expiryDate: e.target.value })
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label>Document</Label>
                <button
                  type="button"
                  onClick={() => open(editing)}
                  className="flex h-9 w-full items-center gap-2 rounded-md border bg-muted/40 px-3 text-left text-sm text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{editing.fileName}</span>
                </button>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editing.notes}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Close
            </Button>
            {canEdit && <Button onClick={saveEdit}>Save Changes</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
