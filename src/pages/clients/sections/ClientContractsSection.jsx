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
import DataTable from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/panels";
import { FileSignature, Paperclip, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/pages/firm/firmData";
import { clientDocuments, officeFiles } from "../clientMockData";

/**
 * The two agreements the firm signs with a client.
 *
 * A general contract covers the relationship; a special contract is written for
 * one matter, so it carries the office file number that matter is filed under.
 */
const CONTRACT_TYPES = ["General Contract", "Special Contract"];

const emptyContract = {
  documentType: "General Contract",
  fileName: "",
  signedDate: "",
  expiryDate: "",
  linkedFileNo: "",
  notes: "",
};

const STATUS_VARIANT = {
  Valid: "success",
  "Expiring Soon": "warning",
  Expired: "destructive",
  "Not Required": "outline",
};

export default function ClientContractsSection() {
  // Contracts live in the client's documents; this is the same record read
  // through the one lens, not a second copy of it.
  const [contracts, setContracts] = useState(() =>
    clientDocuments.filter((doc) => CONTRACT_TYPES.includes(doc.documentType))
  );
  const [draft, setDraft] = useState(emptyContract);
  const [adding, setAdding] = useState(false);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const isSpecial = draft.documentType === "Special Contract";
  const canSave = draft.fileName.trim() && draft.signedDate;

  const save = () => {
    if (!canSave) return;
    setContracts((prev) => [
      ...prev,
      {
        ...draft,
        id: prev.reduce((max, c) => Math.max(max, c.id), 0) + 1,
        uploadDate: draft.signedDate,
        status: "Valid",
        linkedFileNo: isSpecial ? draft.linkedFileNo : null,
      },
    ]);
    setDraft(emptyContract);
    setAdding(false);
  };

  const columns = [
    {
      key: "documentType",
      header: "Contract Type",
      width: "18%",
      cellClassName: "font-medium",
    },
    {
      key: "fileName",
      header: "Document",
      width: "22%",
      render: (value, row) =>
        value ? (
          <a
            href={row.fileUrl || "#"}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Paperclip className="h-3.5 w-3.5" />
            {value}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "uploadDate",
      header: "Signed On",
      width: "13%",
      render: (value) => formatDate(value) || "-",
    },
    {
      key: "expiryDate",
      header: "Expires",
      width: "13%",
      render: (value) =>
        value ? formatDate(value) : <span className="text-muted-foreground">Open ended</span>,
    },
    {
      key: "linkedFileNo",
      header: "Office File No.",
      width: "14%",
      render: (value) =>
        value ? (
          <Badge variant="secondary">{value}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "12%",
      render: (value) => (
        <Badge variant={STATUS_VARIANT[value] || "outline"}>{value}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "8%",
      disableFilter: true,
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            title="Remove contract"
            onClick={() =>
              setContracts((prev) => prev.filter((c) => c.id !== row.id))
            }
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove contract</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <FileSignature className="h-4 w-4 text-secondary-foreground" />
          </div>
          <h2 className="font-semibold text-primary">Client Contracts</h2>
        </div>
        <Button size="sm" onClick={() => setAdding((open) => !open)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Contract
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="contractType">Contract Type *</Label>
                <Select
                  value={draft.documentType}
                  onValueChange={(value) => set("documentType", value)}
                >
                  <SelectTrigger id="contractType">
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

              <div className="space-y-2">
                <Label htmlFor="contractSigned">Signed On *</Label>
                <Input
                  id="contractSigned"
                  type="date"
                  value={draft.signedDate}
                  onChange={(e) => set("signedDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractExpiry">Expiry Date</Label>
                <Input
                  id="contractExpiry"
                  type="date"
                  value={draft.expiryDate}
                  onChange={(e) => set("expiryDate", e.target.value)}
                />
              </div>

              {/* A special contract is written for one matter, so it says which */}
              {isSpecial && (
                <div className="space-y-2">
                  <Label htmlFor="contractFile">Office File No.</Label>
                  <Select
                    value={draft.linkedFileNo}
                    onValueChange={(value) => set("linkedFileNo", value)}
                  >
                    <SelectTrigger id="contractFile">
                      <SelectValue placeholder="Please Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {officeFiles.map((file) => (
                        <SelectItem key={file.fileNo} value={file.fileNo}>
                          {file.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Contract Copy *</Label>
                {draft.fileName ? (
                  <div className="flex h-9 items-center justify-between gap-2 rounded-md bg-muted px-3">
                    <span className="truncate text-sm">{draft.fileName}</span>
                    <button
                      type="button"
                      onClick={() => set("fileName", "")}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      &times;
                      <span className="sr-only">Remove file</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/50">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attach contract
                    <Input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files[0] && set("fileName", e.target.files[0].name)
                      }
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contractNotes">Notes</Label>
                <Input
                  id="contractNotes"
                  value={draft.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Anything worth recording about this contract"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(emptyContract);
                  setAdding(false);
                }}
              >
                Cancel
              </Button>
              <Button disabled={!canSave} onClick={save}>
                Save Contract
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 sm:p-6">
          {contracts.length === 0 ? (
            <EmptyState>No contracts signed with this client yet.</EmptyState>
          ) : (
            <DataTable
              columns={columns}
              data={contracts}
              searchPlaceholder="Search contracts..."
              exportFileName="client-contracts.csv"
              enableColumnSearch={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
