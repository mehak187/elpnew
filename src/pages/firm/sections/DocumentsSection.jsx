import { useMemo, useState } from "react";
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
import { Plus, Search, FileText, X, AlertTriangle } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import {
  DOCUMENT_TYPES,
  RELATED_TO_KINDS,
  DOCUMENT_STATUS_VARIANT,
  EXPIRY_WARNING_DAYS,
  documentStatus,
  daysUntil,
  formatDate,
  clients,
  cases,
} from "../firmData";

const emptyDraft = {
  name: "",
  type: "",
  documentDate: "",
  issueDate: "",
  expiryDate: "",
  relatedKind: "firm",
  relatedId: "",
  notes: "",
};

const relatedLabel = (document) => {
  if (document.relatedKind === "client") {
    const client = clients.find((c) => c.id === Number(document.relatedId));
    return client ? "Client: " + client.name : "Client";
  }
  if (document.relatedKind === "case") {
    const legalCase = cases.find((c) => c.id === Number(document.relatedId));
    return legalCase ? "Case: " + legalCase.caseNo : "Case";
  }
  return "The Law Firm";
};

/**
 * Section 2 of the specification.
 *
 * Status is never typed in - it is derived from the expiry date every render,
 * so a document cannot sit in the list claiming to be Active after its date has
 * passed. Documents without an expiry date simply stay Active.
 */
export default function DocumentsSection({ initialStatusFilter, canEdit }) {
  const { documents, addDocument, removeDocument } = useFirm();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [file, setFile] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || "all");
  const [relatedFilter, setRelatedFilter] = useState("all");
  const [relatedIdFilter, setRelatedIdFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");

  const setField = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents
      .map((document) => ({ ...document, status: documentStatus(document) }))
      .filter((document) => {
        if (term) {
          const haystack = [
            document.name,
            document.type,
            document.notes,
            relatedLabel(document),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        if (typeFilter !== "all" && document.type !== typeFilter) return false;
        if (statusFilter !== "all" && document.status !== statusFilter) return false;
        if (relatedFilter !== "all" && document.relatedKind !== relatedFilter)
          return false;
        if (
          relatedIdFilter !== "all" &&
          String(document.relatedId) !== relatedIdFilter
        )
          return false;
        if (expiryFilter === "has" && !document.expiryDate) return false;
        if (expiryFilter === "none" && document.expiryDate) return false;
        return true;
      })
      .sort((a, b) => (b.documentDate || "").localeCompare(a.documentDate || ""));
  }, [
    documents,
    search,
    typeFilter,
    statusFilter,
    relatedFilter,
    relatedIdFilter,
    expiryFilter,
  ]);

  // Section 2 asks for notification when a document nears its expiry date.
  const expiringSoon = documents
    .map((document) => ({ ...document, status: documentStatus(document) }))
    .filter((document) => document.status !== "Active");

  const canSave = draft.name && draft.type && draft.documentDate;

  const handleSave = () => {
    addDocument({
      ...draft,
      relatedId: draft.relatedKind === "firm" ? null : Number(draft.relatedId),
      fileName: file ? file.name : "",
      fileUrl: file ? URL.createObjectURL(file) : "",
    });
    setDraft(emptyDraft);
    setFile(null);
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Expiry notifications */}
      {expiringSoon.length > 0 && (
        <div className="space-y-2">
          {expiringSoon.map((document) => {
            const days = daysUntil(document.expiryDate);
            const expired = days < 0;
            return (
              <div
                key={document.id}
                className={
                  "flex items-start gap-2 rounded-md border-l-4 px-3 py-2 text-xs " +
                  (expired
                    ? "border-l-red-500 bg-red-50 text-red-800"
                    : "border-l-amber-500 bg-amber-50 text-amber-900")
                }
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <span className="font-semibold">{document.name}</span>{" "}
                  {expired
                    ? "expired " + Math.abs(days) + " days ago"
                    : "expires in " + days + " days"}{" "}
                  ({formatDate(document.expiryDate)})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={relatedFilter}
            onValueChange={(value) => {
              setRelatedFilter(value);
              setRelatedIdFilter("all");
            }}
          >
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All records</SelectItem>
              {RELATED_TO_KINDS.map((kind) => (
                <SelectItem key={kind.key} value={kind.key}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {relatedFilter === "client" && (
            <Select value={relatedIdFilter} onValueChange={setRelatedIdFilter}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {relatedFilter === "case" && (
            <Select value={relatedIdFilter} onValueChange={setRelatedIdFilter}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cases</SelectItem>
                {cases.map((legalCase) => (
                  <SelectItem key={legalCase.id} value={String(legalCase.id)}>
                    Case {legalCase.caseNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={expiryFilter} onValueChange={setExpiryFilter}>
            <SelectTrigger className="h-9 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any expiry</SelectItem>
              <SelectItem value="has">Has expiry date</SelectItem>
              <SelectItem value="none">No expiry date</SelectItem>
            </SelectContent>
          </Select>

          {canEdit && (
            <Button size="sm" onClick={() => setAdding((v) => !v)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Document
            </Button>
          )}
        </div>
      </div>

      {/* Add document */}
      {adding && canEdit && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="docName">Document Name *</Label>
                <Input
                  id="docName"
                  value={draft.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Enter document name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="docType">Document Type *</Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) => setField("type", value)}
                >
                  <SelectTrigger id="docType">
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
                <Label htmlFor="docDate">Document Date *</Label>
                <Input
                  id="docDate"
                  type="date"
                  value={draft.documentDate}
                  onChange={(e) => setField("documentDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="docIssue">Issue Date</Label>
                <Input
                  id="docIssue"
                  type="date"
                  value={draft.issueDate}
                  onChange={(e) => setField("issueDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="docExpiry">Expiry Date</Label>
                <Input
                  id="docExpiry"
                  type="date"
                  value={draft.expiryDate}
                  onChange={(e) => setField("expiryDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Uploaded Document</Label>
                {!file ? (
                  <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/50">
                    Choose file
                    <Input
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
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

              <div className="space-y-2">
                <Label htmlFor="docRelated">Related To</Label>
                <Select
                  value={draft.relatedKind}
                  onValueChange={(value) => {
                    setField("relatedKind", value);
                    setField("relatedId", "");
                  }}
                >
                  <SelectTrigger id="docRelated">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATED_TO_KINDS.map((kind) => (
                      <SelectItem key={kind.key} value={kind.key}>
                        {kind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {draft.relatedKind === "client" && (
                <div className="space-y-2">
                  <Label htmlFor="docClient">Client *</Label>
                  <Select
                    value={draft.relatedId}
                    onValueChange={(value) => setField("relatedId", value)}
                  >
                    <SelectTrigger id="docClient">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {draft.relatedKind === "case" && (
                <div className="space-y-2">
                  <Label htmlFor="docCase">Case *</Label>
                  <Select
                    value={draft.relatedId}
                    onValueChange={(value) => setField("relatedId", value)}
                  >
                    <SelectTrigger id="docCase">
                      <SelectValue placeholder="Select case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((legalCase) => (
                        <SelectItem key={legalCase.id} value={String(legalCase.id)}>
                          {legalCase.caseNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <Label htmlFor="docNotes">Notes</Label>
                <Textarea
                  id="docNotes"
                  value={draft.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Add a note about this document"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                Save Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document list */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="p-3 font-semibold">Document Name</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Document Date</th>
                <th className="p-3 font-semibold">Issue Date</th>
                <th className="p-3 font-semibold">Expiry Date</th>
                <th className="p-3 font-semibold">Related To</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Notes</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No documents match these filters.
                  </td>
                </tr>
              )}
              {rows.map((document) => (
                <tr key={document.id} className="border-b last:border-0">
                  <td className="p-3">
                    {document.fileUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(document.fileUrl, "_blank", "noopener,noreferrer")
                        }
                        className="flex items-start gap-2 text-left font-medium text-primary underline-offset-2 hover:underline"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        {document.name}
                      </button>
                    ) : (
                      <span className="font-medium">{document.name}</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{document.type}</td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(document.documentDate) || "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(document.issueDate) || "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(document.expiryDate) || "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {relatedLabel(document)}
                  </td>
                  <td className="p-3">
                    <Badge variant={DOCUMENT_STATUS_VARIANT[document.status]}>
                      {document.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {document.notes || "-"}
                  </td>
                  <td className="p-3 text-right">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDocument(document.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove {document.name}</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
