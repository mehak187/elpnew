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
import { useLeaves } from "@/lib/leaves/context";
import {
  LEAVE_STATUS_TONE,
  canTakeAdvance,
  chargedYear,
  leaveTypeLabel,
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
  // Shared with every other page that reads leave, so a request asked for here
  // is still there after the page moves away and back.
  const { leaves, addLeave } = useLeaves();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const mine = leavesFor(leaves, employee.name);
  const years = [
    ...new Set([thisYear(), ...leaveYearsFor(leaves, employee.name)]),
  ].sort((a, b) => b.localeCompare(a));

  /**
   * The years a new request can be charged to: this one, and next year only
   * once this year's annual leave is gone - that is what an advance is for.
   */
  const nextYear = String(Number(thisYear()) + 1);
  const advanceOffered = canTakeAdvance(leaves, employee.name, thisYear());
  const requestYears = advanceOffered ? [thisYear(), nextYear] : [thisYear()];

  // Leave is granted a year at a time, so the list is read a year at a time.
  const [year, setYear] = useState(thisYear);

  /**
   * While a request is being written, the list below it narrows to the kind of
   * leave being asked for - what is already on record for that type is what
   * the new request has to be judged against. Closing the form puts the whole
   * year back.
   */
  const shownType = adding ? draft.type : "";
  const shownCategory = adding ? draft.category : "";
  const filteredBy = shownType || shownCategory;

  const rows = mine.filter(
    (leave) =>
      chargedYear(leave) === year &&
      (!shownCategory || leave.category === shownCategory) &&
      (!shownType || leave.type === shownType)
  );

  /** A type belongs to one category, so changing the category clears it. */
  const chooseCategory = (value) =>
    setDraft((prev) => ({ ...prev, category: value, type: "" }));

  /**
   * The year follows the start date on its own - except on an advance, where
   * the year is the point: the days are taken now and charged to next year,
   * and the kind of leave is settled by that choice.
   */
  const setField = (name, value) =>
    setDraft((prev) => {
      if (name === "year") {
        return value === nextYear
          ? { ...prev, year: value, category: "Regular Leave", type: "Annual Leave" }
          : { ...prev, year: value };
      }
      const chargedToNextYear = prev.year === nextYear;
      return {
        ...prev,
        [name]: value,
        ...(name === "from" && value && !chargedToNextYear
          ? { year: leaveYear(value) }
          : {}),
      };
    });

  const close = () => {
    setAdding(false);
    setDraft(emptyDraft());
  };

  const save = () => {
    // A new request has not been decided on: the store says so, and nothing
    // here suggests otherwise.
    addLeave({ ...draft, employee: employee.name });
    setYear(draft.year);
    close();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        {/* No heading here: the page above is already called Leaves. */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Leave is granted a year at a time, so the year is a choice rather
              than a column repeated down every row. */}
          {/* Empty values are ignored: Radix keeps a hidden native select and
              reports "" whenever the list it was built from changes - and the
              list grows the moment a leave is charged to another year. */}
          <Select value={year} onValueChange={(value) => value && setYear(value)}>
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
          years={requestYears}
          advanceYear={nextYear}
          onChange={setField}
          onCategory={chooseCategory}
          onSubmit={save}
          onCancel={close}
        />
      )}

      {filteredBy && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-primary">{filteredBy}</span>{" "}
          in {year} only
        </p>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState>
                {filteredBy
                  ? "No " + filteredBy + " has been requested in " + year + "."
                  : "No leave has been requested for " + year + "."}
              </EmptyState>
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
                        {/* An advance is annual leave charged to another year,
                            so the row says which year it came out of. */}
                        <p className="font-semibold text-primary">
                          {leaveTypeLabel(leave)}
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
