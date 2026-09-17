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
import FormHeading from "@/components/shared/FormHeading";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { Plus, CalendarCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
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
  remainingBalance,
  workflowLabel,
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

  // Newest first: the latest request is the one most likely being looked for.
  const rows = mine
    .filter(
      (leave) =>
        chargedYear(leave) === year &&
        (!shownCategory || leave.category === shownCategory) &&
        (!shownType || leave.type === shownType)
    )
    // The newest request first: the one just made is the one being looked for.
    .sort((a, b) => b.id - a.id);

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
      {/* One heading at a time: the section's row - heading on the left, the
          way to add on the right - gives way to the form's own heading while
          a request is being written. */}
      {adding ? (
        <FormHeading
          icon={CalendarCheck}
          title="Add New Leave"
          note="Submit a new leave request"
          onBack={close}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormHeading icon={CalendarCheck} title="Leave Requests History" />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Leave is granted a year at a time, so the year is a choice
                rather than a column repeated down every row. Empty values are
                ignored: Radix reports "" whenever its list changes. */}
            <Select value={year} onValueChange={(value) => value && setYear(value)}>
              <SelectTrigger className="w-28" aria-label="Leave year">
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

            <Button type="button" onClick={() => setAdding(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add New Leave
            </Button>
          </div>
        </div>
      )}

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
            <RecordTable minWidth={1040}>
              <HeadRow>
                <Th width="10%">Leave No.</Th>
                <Th width="18%">Leave Details</Th>
                <Th width="22%">Leave Period</Th>
                <Th width="20%">Approval Workflow</Th>
                <Th width="15%">Balance</Th>
                <Th width="15%">Status</Th>
              </HeadRow>
              <tbody>
                {rows.map((leave) => {
                  const Icon = STATUS_ICON[leave.status];
                  const days = leaveDays(leave.from, leave.to);
                  // What was left before this request, and what it leaves
                  // behind - both counted off the record, never stored.
                  const balance = remainingBalance(
                    leaves,
                    employee.name,
                    leave.type,
                    chargedYear(leave)
                  );

                  return (
                    <Row key={leave.id}>
                      <Td className="whitespace-nowrap font-bold text-primary">
                        {leave.leaveNo || "-"}
                      </Td>

                      {/* An advance is annual leave charged to another year,
                          so the row says which year it came out of. */}
                      <Td>
                        <span className="block font-semibold text-primary">
                          {leave.category}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {leaveTypeLabel(leave)}
                        </span>
                      </Td>

                      {/* The two dates and what they come to, as one period. */}
                      <Td className="whitespace-nowrap">
                        {formatDate(leave.from)} – {formatDate(leave.to)}
                        <span className="px-1.5 text-muted-foreground">/</span>
                        {days} {days === 1 ? "Day" : "Days"}
                      </Td>

                      <Td>
                        {workflowLabel(leave)}
                        {/* Management's note sits with the decision it
                            explains, rather than in a column of its own. */}
                        {leave.comments && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {leave.comments}
                          </span>
                        )}
                      </Td>

                      <Td className="whitespace-nowrap">
                        {balance && !balance.expired
                          ? balance.allowance -
                            (balance.allowance - balance.remaining) +
                            " Days / " +
                            Math.max(balance.remaining - days, 0) +
                            " Days"
                          : "-"}
                      </Td>

                      <Td className="text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            LEAVE_STATUS_TONE[leave.status]
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {leave.status}
                        </span>
                      </Td>
                    </Row>
                  );
                })}
              </tbody>
            </RecordTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
