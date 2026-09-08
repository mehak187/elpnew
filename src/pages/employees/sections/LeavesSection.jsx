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
import { Plus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/pages/firm/firmData";
import {
  ABSENCE_CATEGORIES,
  LEAVE_STATUS_TONE,
  initialLeaves,
  typesIn,
  entitlementOf,
  leaveDays,
  leaveYear,
  leavesFor,
  leaveYearsFor,
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

  const mine = leavesFor(leaves, employee.name);
  const years = leaveYearsFor(leaves, employee.name);

  // Leave is granted a year at a time, so the list is read a year at a time.
  const [year, setYear] = useState(
    () => years[0] || String(new Date().getFullYear())
  );

  const rows = mine.filter((leave) => leaveYear(leave.from) === year);

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
  const entitlement = entitlementOf(draft.type);

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
    setYear(leaveYear(draft.from));
    close();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-primary">Leaves</h2>

          {/* Leave is granted a year at a time, so the year is a choice rather
              than a column repeated down every row. */}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 w-28" aria-label="Leave year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(years.includes(year) ? years : [year, ...years]).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="button" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add New Leave
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <BackButton onBack={close} />
              <p className="font-semibold text-primary">Add New Leave</p>
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
                    {ABSENCE_CATEGORIES.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">
                  Leave Type<span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) => setField("type", value)}
                  disabled={!draft.category}
                >
                  <SelectTrigger id="leaveType">
                    <SelectValue
                      placeholder={
                        draft.category
                          ? "Please Select"
                          : "Select a category first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {typesIn(draft.category).map((type) => (
                      <SelectItem key={type.name} value={type.name}>
                        {type.name}
                        {/* Opacity rather than a colour, so it stays readable
                            against the highlighted row. */}
                        <span className="opacity-70">
                          {" "}
                          &mdash; {type.entitlement}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {entitlement && (
                  <p className="text-xs text-muted-foreground">
                    Entitlement: {entitlement}
                  </p>
                )}
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
                ? days +
                  (days === 1 ? " day" : " days") +
                  " of leave requested." +
                  (entitlement ? " Entitlement: " + entitlement + "." : "")
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
              <EmptyState>No leave has been requested for {year}.</EmptyState>
            </div>
          ) : (
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-semibold" style={{ width: "20%" }}>
                    Leave Type
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "12%" }}>
                    From Date
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "12%" }}>
                    To Date
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "11%" }}>
                    Number of Days
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "21%" }}>
                    Reason
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "12%" }}>
                    Request Status
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "12%" }}>
                    Decision Date
                  </th>
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
                      <td className="p-3">
                        <p className="font-semibold text-primary">
                          {leave.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leave.category}
                        </p>
                      </td>
                      <td className="whitespace-nowrap p-3">
                        {formatDate(leave.from)}
                      </td>
                      <td className="whitespace-nowrap p-3">
                        {formatDate(leave.to)}
                      </td>
                      {/* Counted from the two dates beside it, never stored */}
                      <td className="p-3 font-medium">
                        {days} {days === 1 ? "Day" : "Days"}
                      </td>
                      <td className="p-3">{leave.reason || "-"}</td>

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
                        {/* Management's note sits with the decision it
                            explains, rather than in a column of its own. */}
                        {leave.comments && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {leave.comments}
                          </p>
                        )}
                      </td>

                      {/* Blank until a decision is made, so nothing suggests
                          an answer that has not been given. */}
                      <td className="whitespace-nowrap p-3">
                        {leave.decidedAt ? formatDate(leave.decidedAt) : "-"}
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
