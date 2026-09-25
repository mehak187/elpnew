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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
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
  remainingBalance,
  stageOf,
  workflowLabel,
} from "../leaveData";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";

/** Today, as the review date starts from. */
const thisDay = () => new Date().toISOString().slice(0, 10);

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
export default function LeavesSection({ employee, canReview = true }) {
  // Shared with every other page that reads leave, so a request asked for here
  // is still there after the page moves away and back.
  const { leaves, addLeave, updateLeave } = useLeaves();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  // A request opened from the list to be reviewed, and the stage of it shown.
  const [openId, setOpenId] = useState(null);
  const [stage, setStage] = useState("department");
  const [review, setReview] = useState({ reviewDate: "", decision: "", comments: "" });

  const open = leaves.find((leave) => leave.id === openId) || null;

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
    setOpenId(null);
    setReview({ reviewDate: "", decision: "", comments: "" });
  };

  /** A request opens at the stage it is waiting at. */
  const openReview = (leave) => {
    setAdding(false);
    setOpenId(leave.id);
    setStage(stageOf(leave));
    setReview({
      reviewDate: thisDay(),
      decision: leave.status === "Pending" ? "" : leave.status === "Approved" ? "Approve" : "Reject",
      comments: leave.comments || "",
    });
  };

  const setReviewField = (name, value) =>
    setReview((prev) => ({ ...prev, [name]: value }));

  /**
   * A department that approves passes the request up to management; one that
   * refuses ends it there. Management's answer is the final one either way.
   */
  const decide = () => {
    // Nobody approves their own leave: on the employee's own page the
    // decision is read once it has been given, and never written.
    if (!canReview || !open || !review.decision || !review.reviewDate) return;
    const approved = review.decision === "Approve";

    if (stage === "department") {
      updateLeave(open.id, {
        department: employee.department || "",
        reviewedBy: CURRENT_USER.name,
        reviewDate: review.reviewDate,
        departmentDecision: review.decision,
        departmentComments: review.comments.trim(),
        comments: review.comments.trim(),
        stage: approved ? "management" : "department",
        status: approved ? "Pending" : "Rejected",
        decidedAt: approved ? "" : review.reviewDate,
      });
      if (approved) {
        setStage("management");
        setReview({ reviewDate: thisDay(), decision: "", comments: "" });
        return;
      }
      close();
      return;
    }

    updateLeave(open.id, {
      managementDecidedBy: CURRENT_USER.name,
      managementDecisionDate: review.reviewDate,
      managementDecision: review.decision,
      managementComments: review.comments.trim(),
      comments: review.comments.trim(),
      status: approved ? "Approved" : "Rejected",
      decidedAt: review.reviewDate,
    });
    close();
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
      {/* The year the list is read by, and the way to add to it. Leave is
          granted a year at a time, so the year is a choice rather than a
          column repeated down every row. Empty values are ignored: Radix
          reports "" whenever its list changes. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        {!adding && !open && (
          <Button
            variant="outline"
            type="button"
            className="ms-auto"
            onClick={() => setAdding(true)}
          >
            <Plus className="me-1.5 h-4 w-4" />
            Add New Leave
          </Button>
        )}
      </div>

      {/* Opened over the page, so the list it is filed into stays behind it. */}
      <Dialog open={adding || Boolean(open)} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {open ? "Leave Request " + (open.leaveNo || "") : "Add New Leave"}
            </DialogTitle>
          </DialogHeader>
          <LeaveForm
            employee={employee}
            leaves={leaves}
            draft={open ? review : draft}
            years={requestYears}
            advanceYear={nextYear}
            onChange={open ? setReviewField : setField}
            onCategory={chooseCategory}
            onSubmit={save}
            onCancel={close}
            record={open}
            canReview={canReview}
            stage={open ? stage : "submit"}
            onStage={setStage}
            onDecide={decide}
          />
        </DialogContent>
      </Dialog>

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
                      {/* The number opens the request at the stage it is
                          waiting at, for whoever has to decide it. */}
                      <Td className="whitespace-nowrap">
                        {canReview ? (
                          <button
                            type="button"
                            onClick={() => openReview(leave)}
                            className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {leave.leaveNo || "-"}
                          </button>
                        ) : (
                          <span className="font-bold text-primary">
                            {leave.leaveNo || "-"}
                          </span>
                        )}
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
