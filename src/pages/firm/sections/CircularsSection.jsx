import {
  useState } from "react";
import UploadIcon from "@/components/shared/UploadIcon";
import { Button } from "@/components/ui/button";
import FormHeading from "@/components/shared/FormHeading";
import AiSearch from "@/components/shared/AiSearch";
import { Card,
  CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/shared/panels";
import {
  Plus,
  Lock,
  Search,
  FileSpreadsheet,
  Ban,
  FileCheck,
  FileText,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import {
  useCirculars,
  TARGET_GROUPS,
  ACTIVE,
  STATUS_LABEL,
  STATUS_TONE,
  nextCircularNo,
  acknowledgementCount,
  formatDate,
  today,
} from "@/lib/circulars/context";
import CircularDetails from "./CircularDetails";
import { useFirm } from "@/lib/firm/context";
import { GENERAL_BRANCH } from "../firmData";

const CONTENT_LIMIT = 1000;

/** How much of a circular the list shows before it has to be opened. */
const PREVIEW_LIMIT = 90;

const preview = (content) =>
  content.length > PREVIEW_LIMIT
    ? content.slice(0, PREVIEW_LIMIT).trimEnd() + " ..."
    : content;

const emptyDraft = {
  date: today(),
  targetGroup: "All Employees",
  // Most circulars are the whole company's business, so General leads.
  branch: GENERAL_BRANCH,
  content: "",
};

/** The office a circular is for, as it reads on the page. */
const branchLabelFor = (circular, branches) => {
  if (!circular.branch || circular.branch === GENERAL_BRANCH) return "General";
  const branch = branches.find((b) => String(b.id) === String(circular.branch));
  return branch ? branch.name : "General";
};

/** A required field, with the mark that says so. */
function FieldLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="whitespace-nowrap text-destructive">&nbsp;*</span>
    </Label>
  );
}

/**
 * The firm's circulars, and who has read them.
 *
 * A circular is never edited: correcting one issues a new circular with a new
 * number and date, marks the old one superseded, and links the two. The old
 * circular and every acknowledgement against it stay exactly as they were,
 * because the whole value of a circular is being able to prove afterwards what
 * was said, when, and who saw it.
 */
export default function CircularsSection({ canEdit }) {
  const { circulars, audit, issueCircular, reviseCircular, cancelCircular } =
    useCirculars();
  const { branches } = useFirm();

  // The circular being corrected, if any. Null while nothing is open.
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  // The written circular itself, when one is attached.
  const [file, setFile] = useState(null);
  const [detailsFor, setDetailsFor] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAudit, setShowAudit] = useState(false);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const circularNo = nextCircularNo(circulars);
  const open = adding || editing;
  // A correction that attaches nothing keeps the paper already on file.
  const attachedName = file ? file.name : editing?.fileName || "";

  const startNew = () => {
    setDraft(emptyDraft);
    setFile(null);
    setEditing(null);
    setAdding(true);
  };

  const startEdit = (circular) => {
    setDraft({
      // A correction is a new circular, so it carries today's date, not the
      // date the original went out.
      date: today(),
      targetGroup: circular.targetGroup,
      branch: circular.branch || GENERAL_BRANCH,
      content: circular.content,
    });
    setFile(null);
    setAdding(false);
    setEditing(circular);
  };

  const close = () => {
    setDraft(emptyDraft);
    setFile(null);
    setAdding(false);
    setEditing(null);
  };

  const canSave =
    canEdit && draft.date && draft.targetGroup && draft.content.trim();

  const save = () => {
    if (!canSave) return;
    const circular = {
      circularNo,
      date: draft.date,
      targetGroup: draft.targetGroup,
      branch: draft.branch,
      content: draft.content.trim(),
      issuedBy: CURRENT_USER.name,
      // A correction that attaches no new paper keeps the old one: the
      // wording changed, the signed document behind it did not.
      fileName: file ? file.name : editing?.fileName || "",
      fileUrl: file ? URL.createObjectURL(file) : editing?.fileUrl || "",
    };
    if (editing) reviseCircular(editing.id, circular);
    else issueCircular(circular);
    close();
  };

  const search = query.trim().toLowerCase();
  const listed = circulars
    .filter((c) =>
      !search
        ? true
        : [c.circularNo, c.title, c.targetGroup, c.content, c.issuedBy]
            .join(" ")
            .toLowerCase()
            .includes(search)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.max(1, Math.ceil(listed.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const shown = listed.slice(start, start + pageSize);

  const exportCirculars = () =>
    downloadCsv(
      toCsv(
        [
          { key: "circularNo", header: "Circular No." },
          { key: "content", header: "Subject / Content" },
          { key: "date", header: "Date", exportValue: (r) => formatDate(r.date) },
          { key: "targetGroup", header: "Target Audience" },
          {
            key: "branch",
            header: "Branch",
            exportValue: (r) => branchLabelFor(r, branches),
          },
          {
            key: "fileName",
            header: "Document",
            exportValue: (r) => r.fileName || "",
          },
          { key: "issuedBy", header: "Issued By" },
          {
            key: "acknowledgement",
            header: "Acknowledgement",
            exportValue: acknowledgementCount,
          },
          {
            key: "status",
            header: "Status",
            exportValue: (r) => STATUS_LABEL[r.status],
          },
        ],
        listed
      ),
      "issued-circulars.csv"
    );

  /* ------------------------------------------------- issuing or correcting */

  // Rendered above the list rather than in place of it: a new circular is
  // numbered after the ones already issued, so they stay in view.
  const form =
    open && canEdit ? (
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-6">
          {/* The way back out of the form, in the same place and with the
              same mark as on every page that opens over another. */}
          <FormHeading
            icon={Megaphone}
            title={editing ? "Correct Circular" : "New Circular"}
          />

          {editing && (
            <p className="rounded-lg border border-primary/30 bg-secondary p-4 text-sm text-primary">
              Saving issues a new circular ({circularNo}) with today's date.{" "}
              {editing.circularNo} stays on record unchanged, marked as
              superseded, and everyone must acknowledge the new version.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="circularNo">Circular Number</Label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  {/* Given by the system: a circular is referred to by its
                      number long after it was issued, so it cannot be
                      typed. */}
                  <Input
                    id="circularNo"
                    readOnly
                    tabIndex={-1}
                    className="bg-muted pr-9"
                    value={circularNo}
                  />
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                </div>

                {/* The written circular, attached to the number it will be
                    filed under. An icon rather than a field of its own: the
                    file name lives in the tooltip, so the control stays the
                    size of a button whether or not anything is attached. */}
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  title={
                    attachedName
                      ? attachedName + " attached - click to replace"
                      : "Upload the written circular"
                  }
                  className={cn(
                    "shrink-0",
                    attachedName && "border-green-600 text-green-600"
                  )}
                >
                  <label htmlFor="circularFile" className="cursor-pointer">
                    {attachedName ? (
                      <FileCheck className="h-4 w-4" />
                    ) : (
                      <UploadIcon className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {attachedName
                        ? attachedName + " attached. Choose another."
                        : "Upload the written circular"}
                    </span>
                  </label>
                </Button>
                <Input
                  id="circularFile"
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files[0] && setFile(e.target.files[0])
                  }
                />
              </div>

              {attachedName && (
                <p className="truncate text-xs text-green-700">
                  {attachedName}
                </p>
              )}
            </div>


            <div className="space-y-2">
              <FieldLabel htmlFor="circularDate">Circular Date</FieldLabel>
              <Input
                id="circularDate"
                type="date"
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>

            {/* Which office the circular is for, asked before which people in
                it: the office narrows the field, the group narrows it again.
                General first, because a circular usually covers the whole
                company. */}
            <div className="space-y-2">
              <Label htmlFor="circularBranch">Branch</Label>
              <Select
                value={draft.branch}
                onValueChange={(value) => set("branch", value)}
              >
                <SelectTrigger id="circularBranch">
                  <SelectValue placeholder="Select branch" />
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
              <FieldLabel htmlFor="targetGroup">Target Group</FieldLabel>
              <Select
                value={draft.targetGroup}
                onValueChange={(value) => set("targetGroup", value)}
              >
                <SelectTrigger id="targetGroup">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="circularContent">Circular Content</FieldLabel>
            <Textarea
              id="circularContent"
              rows={5}
              maxLength={CONTENT_LIMIT}
              placeholder="What the circular says"
              value={draft.content}
              onChange={(e) => set("content", e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {draft.content.length}/{CONTENT_LIMIT}
            </p>
          </div>


          <p className="rounded-lg border border-primary/30 bg-secondary p-4 text-sm text-primary">
            Once issued, everyone in {draft.targetGroup} is stopped at sign-in
            until they acknowledge this circular.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave}>
              {editing ? "Issue Corrected Circular" : "Issue Circular"}
            </Button>
          </div>
        </CardContent>
      </Card>
    ) : null;

  /* ------------------------------------------------------ what is on file */

  return (
    <div className="space-y-6">
      {/* The section's own heading, so the way to add to it sits on the
          same line rather than costing a row of its own. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <h2 className="border-l-4 border-primary pl-3 text-lg font-bold text-primary">Circulars</h2>
        {canEdit && (
          <Button onClick={startNew} disabled={Boolean(open)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Circular
          </Button>
        )}
      </div>

      {/* The same toolbar every table in the system has: search on the left,
          page size and export on the right. Export used to be a second button
          up in the heading as well, which was one action offered twice. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AiSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Ask about circulars..."
        />

        <div className="hidden flex-1 sm:block" />

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-20" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Export to CSV"
            onClick={exportCirculars}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="sr-only">Export to CSV</span>
          </Button>
        </div>
      </div>

      {form}

      <div>
        <p className="mb-2 text-lg font-bold text-primary">Issued Circulars</p>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            {listed.length === 0 ? (
              <div className="p-6">
                <EmptyState>No circulars match that search.</EmptyState>
              </div>
            ) : (
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-semibold" style={{ width: "10%" }}>
                      Circular No.
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "20%" }}>
                      Subject / Content (Preview)
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "9%" }}>
                      Date
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "16%" }}>
                      Target Audience
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "14%" }}>
                      Issued By
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "14%" }}>
                      Acknowledgement
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "13%" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((circular) => (
                    <tr
                      key={circular.id}
                      className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                    >
                      {/* The number opens the circular for correction - but
                          only while it is in force. A superseded or withdrawn
                          circular is history, and history is read only. */}
                      <td className="whitespace-nowrap p-3">
                        {canEdit && circular.status === ACTIVE ? (
                          <button
                            type="button"
                            onClick={() => startEdit(circular)}
                            className="rounded font-semibold text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {circular.circularNo}
                          </button>
                        ) : (
                          <span
                            className="font-semibold text-muted-foreground"
                            title="Read only"
                          >
                            {circular.circularNo}
                          </span>
                        )}
                      </td>
                      {/* Enough of the circular to tell it apart, no more */}
                      <td className="p-3 text-muted-foreground">
                        {preview(circular.content)}
                      </td>
                      <td className="whitespace-nowrap p-3">
                        {formatDate(circular.date)}
                      </td>
                      {/* Who it is for, and at which office - one answer
                          in two parts, so they read together. */}
                      <td className="p-3">
                        <span className="block">{circular.targetGroup}</span>
                        <span className="block text-xs text-muted-foreground">
                          {branchLabelFor(circular, branches)}
                        </span>
                      </td>
                      <td className="p-3">{circular.issuedBy}</td>
                      {/* Counted, never typed */}
                      <td className="p-3">
                        <span className="block font-semibold text-primary">
                          {acknowledgementCount(circular)} Acknowledged
                        </span>
                        <button
                          type="button"
                          onClick={() => setDetailsFor(circular)}
                          className="rounded text-xs text-primary underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          View Details
                        </button>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_TONE[circular.status]
                          )}
                        >
                          {STATUS_LABEL[circular.status]}
                        </span>
                        {canEdit && circular.status === ACTIVE && (
                          <button
                            type="button"
                            onClick={() =>
                              cancelCircular(circular.id, CURRENT_USER.name)
                            }
                            className="mt-1 flex items-center gap-1 rounded text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <Ban className="h-3 w-3 shrink-0" />
                            Cancel circular
                          </button>
                        )}

                        {/* The written circular, where the row's other
                            actions are. Shown only when there is one. */}
                        {circular.fileUrl && (
                          <button
                            type="button"
                            title={"View " + circular.fileName}
                            onClick={() =>
                              window.open(
                                circular.fileUrl,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            className="mt-1 flex items-center gap-1 rounded text-xs text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            View document
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Showing {listed.length === 0 ? 0 : start + 1} to{" "}
            {Math.min(start + pageSize, listed.length)} of {listed.length}{" "}
            entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                variant={n === currentPage ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Everything that has happened, kept whether or not anyone looks */}
      <div>
        <button
          type="button"
          onClick={() => setShowAudit((open) => !open)}
          className="rounded text-sm font-semibold text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {showAudit ? "Hide" : "Show"} audit trail ({audit.length})
        </button>

        {showAudit && (
          <Card className="mt-2">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="p-3 font-semibold">Date &amp; Time</th>
                    <th className="p-3 font-semibold">Action</th>
                    <th className="p-3 font-semibold">Circular No.</th>
                    <th className="p-3 font-semibold">By</th>
                    <th className="p-3 font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {[...audit].reverse().map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap p-3 text-muted-foreground">
                        {entry.at}
                      </td>
                      <td className="p-3 font-medium">{entry.action}</td>
                      <td className="whitespace-nowrap p-3">
                        {entry.circularNo}
                      </td>
                      <td className="p-3">{entry.by}</td>
                      <td className="p-3 text-muted-foreground">
                        {entry.detail || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {detailsFor && (
        <CircularDetails
          circular={detailsFor}
          onOpenChange={(next) => !next && setDetailsFor(null)}
        />
      )}
    </div>
  );
}
