import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import { Plus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/pages/firm/firmData";
import LeaveForm from "./LeaveForm";
import {
  LEAVE_STATUS_TONE,
  initialLeaves,
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

const thisYear = () => String(new Date().getFullYear());

const emptyDraft = () => ({
  category: "",
  type: "",
  from: "",
  to: "",
  year: thisYear(),
  reason: "",
  replacement: "",
});

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
  const years = [
    ...new Set([thisYear(), ...leaveYearsFor(leaves, employee.name)]),
  ].sort((a, b) => b.localeCompare(a));

  // Leave is granted a year at a time, so the list is read a year at a time.
  const [year, setYear] = useState(thisYear);

  const rows = mine.filter((leave) => leaveYear(leave.from) === year);

  /** A type belongs to one category, so changing the category clears it. */
  const chooseCategory = (value) =>
    setDraft((prev) => ({ ...prev, category: value, type: "" }));

  /**
   * The year follows the start date on its own.
   *
   * Leave is charged to the year it begins in, so leaving both to be typed
   * would be asking the same question twice - and letting the two disagree.
   */
  const setField = (name, value) =>
    setDraft((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "from" && value ? { year: leaveYear(value) } : {}),
    }));

  const close = () => {
    setAdding(false);
    setDraft(emptyDraft());
  };

  const save = () => {
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
    setYear(draft.year);
    close();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="border-l-4 border-primary pl-3 text-lg font-bold text-primary">Leaves</h2>

          {/* Leave is granted a year at a time, so the year is a choice rather
              than a column repeated down every row. */}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 w-28" aria-label="Leave year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((option) => (
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
        <LeaveForm
          employee={employee}
          leaves={leaves}
          draft={draft}
          years={years}
          onChange={setField}
          onCategory={chooseCategory}
          onSubmit={save}
          onCancel={close}
        />
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
                      <td className="p-3">
                        <p>{leave.reason || "-"}</p>
                        {/* Who is covering, with the request it belongs
                            to rather than in a column of its own. */}
                        {leave.replacement && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Covered by {leave.replacement}
                          </p>
                        )}
                      </td>

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
