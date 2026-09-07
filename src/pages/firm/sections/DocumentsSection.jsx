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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/panels";
import BackButton from "@/components/shared/BackButton";
import { Upload, FileCheck, FileText, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { expiryState, EXPIRY_LABEL } from "@/lib/expiry";
import { useFirm } from "@/lib/firm/context";
import {
  DOCUMENT_TYPES,
  GENERAL_BRANCH,
  branchLabel,
  formatDate,
} from "../firmData";

/**
 * An expiry date and what it means.
 *
 * The same three states, the same two marks and the same words the client
 * papers use: hollow while the date is only approaching, solid once it has
 * passed. A document that expires is the same problem wherever it is filed,
 * so it is shown the same way.
 */
function ExpiryDate({ date }) {
  const state = expiryState(date);

  if (state === "none") {
    return <span className="text-muted-foreground">No expiry</span>;
  }

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className={cn(
          state === "expired" && "font-semibold text-red-600"
        )}
      >
        {formatDate(date)}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          state === "valid" ? "text-green-600" : "text-red-600"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            state === "expired" ? "bg-red-500" : "border-2 border-red-500",
            state === "valid" && "border-0 bg-green-500"
          )}
        />
        {EXPIRY_LABEL[state]}
      </span>
    </span>
  );
}

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
  // The page is the list until someone asks to add to it.
  const [adding, setAdding] = useState(false);

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
    closeForm();
  };

  const closeForm = () => {
    setAdding(false);
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
      {canEdit && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setAdding(true)}
            disabled={adding}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Document
          </Button>
        </div>
      )}

      {/* The form takes the place of the list while it is being filled in:
          a page is one thing at a time, either the documents on file or the
          form that adds to them. */}
      {canEdit && adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <BackButton onBack={closeForm} />
              <p className="border-l-4 border-primary pl-3 text-lg font-bold text-primary">
                Add Document
              </p>
            </div>

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

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={!canSave}>
                Save Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* The list stays under the form rather than making way for it: a
          new record is judged against the ones already there. */}
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

                </tr>
              </thead>
              <tbody>
                {documents.map((document) => {

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
                        <ExpiryDate date={document.expiryDate} />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {document.notes || "-"}
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

          {/* Deleting is deliberately not a button in every row. A document
              is opened first, read, and only then thrown away - so a licence
              cannot go on a stray click down a column of identical bins. */}
          <DialogFooter className="sm:justify-between">
            {canEdit ? (
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  removeDocument(editing.id);
                  setEditing(null);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Document
              </Button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Close
              </Button>
              {canEdit && <Button onClick={saveEdit}>Save Changes</Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
