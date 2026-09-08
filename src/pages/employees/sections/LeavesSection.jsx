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
import BackButton from "@/components/shared/BackButton";
import { EmptyState } from "@/components/shared/panels";
import {
  Plus,
  CalendarDays,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/pages/firm/firmData";
import {
  ABSENCE_CATEGORIES,
  LEAVE_STATUS_TONE,
  initialLeaves,
  leaveDays,
  leaveYear,
  leavesFor,
} from "../leaveData";

const STATUS_ICON = {
  Pending: Clock,
  Approved: CheckCircle2,
  Rejected: XCircle,
};

const emptyDraft = {
  category: "",
  type: "",
  from: "",
  to: "",
  reason: "",
};

/** A column heading with the mark that goes with it. */
function Head({ icon, children, width }) {
  const Icon = icon;
  return (
    <th className="p-3 text-left font-semibold text-primary" style={{ width }}>
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {children}
      </span>
    </th>
  );
}

/**
 * Leave asked for, and what was decided about it.
 *
 * The request is the employee's half - what kind of absence, when, and why.
 * The decision is management's, and stays blank until one is made, so nothing
 * on the row can suggest an answer that has not been given.
 */
export default function LeavesSection({ employee }) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const rows = leavesFor(leaves, employee.name);

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  /** A type belongs to one category, so changing the category clears it. */
  const chooseCategory = (value) =>
    setDraft((prev) => ({ ...prev, category: value, type: "" }));

  const close = () => {
    setAdding(false);
    setDraft(emptyDraft);
  };

  const days = leaveDays(draft.from, draft.to);

  const canSave =
    draft.category && draft.type && draft.from && draft.to && days > 0;

  const save = () => {
    if (!canSave) return;
    setLeaves((prev) => [
      ...prev,
      {
        ...draft,
        id: prev.reduce((max, l) => Math.max(max, l.id), 0) + 1,
        employee: employee.name,
        // A new request has not been decided, so it says so and nothing more.
        status: "Pending",
        decidedAt: "",
        comments: "",
      },
    ]);
    close();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-base font-semibold text-primary">Leaves</h2>
          <p className="text-xs text-muted-foreground">
            View and track your leave requests and their status
          </p>
        </div>
        <Button type="button" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Leave Request
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <BackButton onBack={close} />
              <p className="font-semibold text-primary">New Leave Request</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="absenceCategory">
                  Absence Category<span className="text-destructive"> *</span>
                </Label>
                <Select value={draft.category} onValueChange={chooseCategory}>
                  <SelectTrigger id="absenceCategory">
                    <SelectValue placeholder="Please Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ABSENCE_CATEGORIES).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="absenceType">
                  Absence Type<span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) => setField("type", value)}
                  disabled={!draft.category}
                >
                  <SelectTrigger id="absenceType">
                    <SelectValue
                      placeholder={
                        draft.category
                          ? "Please Select"
                          : "Select a category first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(ABSENCE_CATEGORIES[draft.category] || []).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveFrom">
                  From Date<span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="leaveFrom"
                  type="date"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => setField("from", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveTo">
                  To Date<span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="leaveTo"
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => setField("to", e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <Label htmlFor="leaveReason">Reason</Label>
                <Textarea
                  id="leaveReason"
                  rows={2}
                  value={draft.reason}
                  onChange={(e) => setField("reason", e.target.value)}
                  placeholder="Why the leave is being asked for"
                />
              </div>
            </div>

            {/* Counted from the dates, never typed: leaving on the 1st and
                returning on the 5th is five days away, not four. */}
            <p className="rounded-lg border border-primary/30 bg-secondary p-4 text-sm text-primary">
              {days > 0
                ? days + (days === 1 ? " day" : " days") + " of leave requested."
                : "Choose a From and To date to see how many days this is."}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={!canSave}>
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState>No leave has been requested yet.</EmptyState>
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <Head icon={FileText} width="20%">
                    Absence Details
                  </Head>
                  <Head icon={CalendarDays} width="22%">
                    Leave Period
                  </Head>
                  <Head icon={MessageSquare} width="16%">
                    Reason
                  </Head>
                  <Head icon={CheckCircle2} width="18%">
                    Decision Details
                  </Head>
                  <Head icon={MessageSquare} width="24%">
                    Management Comments
                  </Head>
                </tr>
              </thead>
              <tbody>
                {rows.map((leave) => {
                  const Icon = STATUS_ICON[leave.status];
                  const days = leaveDays(leave.from, leave.to);

                  return (
                    <tr
                      key={leave.id}
                      className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                    >
                      {/* What kind of absence, and the year it is charged to */}
                      <td className="p-3">
                        <p className="font-semibold text-primary">
                          {leave.category}
                        </p>
                        <p className="text-muted-foreground">{leave.type}</p>
                        <p className="text-muted-foreground">
                          {leaveYear(leave.from)}
                        </p>
                      </td>

                      <td className="p-3">
                        <p className="flex flex-wrap items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {formatDate(leave.from)}
                          <span className="text-muted-foreground">-</span>
                          {formatDate(leave.to)}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {days} {days === 1 ? "Day" : "Days"}
                        </p>
                      </td>

                      <td className="p-3">{leave.reason || "-"}</td>

                      {/* Blank until a decision is made, so nothing suggests
                          an answer that has not been given. */}
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            LEAVE_STATUS_TONE[leave.status]
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {leave.status}
                        </span>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {leave.decidedAt ? (
                            <>
                              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                              {formatDate(leave.decidedAt)}
                            </>
                          ) : (
                            "-"
                          )}
                        </p>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {leave.comments || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
