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
import AiSearch from "@/components/shared/AiSearch";
import FormHeading from "@/components/shared/FormHeading";
import UploadIcon from "@/components/shared/UploadIcon";
import { EmptyState } from "@/components/shared/panels";
import { RequestSteps } from "@/components/shared/RequestSteps";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { FileCheck, Gavel, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViolations } from "@/lib/violations/context";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import { formatDate } from "../loanData";
import { Rial } from "@/components/shared/Rial";
import {
  VIOLATION_STAGES,
  VIOLATION_TYPES,
  INVESTIGATION_RESULTS,
  PENALTY_TYPES,
  DEDUCTION_PENALTY,
  NO_PENALTY,
  APPEAL_OUTCOMES,
  CANCELLING_OUTCOME,
  VIOLATION_STATUS_TONE,
  stagesDone,
  nextStage,
  violationsFor,
} from "../violationData";

const DESCRIPTION_LIMIT = 1000;

const today = () => new Date().toISOString().slice(0, 10);

/** What every stage's fields start from, for a record not yet opened. */
const draftFrom = (record) => ({
  date: record?.date || today(),
  type: record?.type || "",
  description: record?.description || "",
  documentName: record?.documentName || "",
  investigationStart: record?.investigationStart || "",
  response: record?.response || "",
  responseDocument: record?.responseDocument || "",
  investigationResult: record?.investigationResult || "",
  penaltyType: record?.penaltyType || "",
  deductionAmount: record?.deductionAmount || "",
  decisionReasons: record?.decisionReasons || "",
  decisionDocument: record?.decisionDocument || "",
  penaltyDate: record?.penaltyDate || "",
  appealDate: record?.appealDate || today(),
  appealGrounds: record?.appealGrounds || "",
  appealDocument: record?.appealDocument || "",
  appealOutcome: record?.appealOutcome || "",
  outcomeReasons: record?.outcomeReasons || "",
  outcomeDate: record?.outcomeDate || today(),
});

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
    </Label>
  );
}

function Choice({ id, label, required, value, onChange, placeholder, options }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** A fact already settled at an earlier stage: shown, never asked for again. */
function Settled({ id, label, value }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value || ""}
        className="cursor-default bg-locked text-muted-foreground"
      />
    </div>
  );
}

function DateField({ id, label, required, value, onChange }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** A file picked for a stage: the name is what the record keeps. */
function FileField({ id, label, value, onChange }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <label
        htmlFor={id}
        className={cn(
          "flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm",
          value ? "border-green-600 text-green-700" : "text-muted-foreground"
        )}
      >
        {value ? (
          <FileCheck className="h-4 w-4 shrink-0" />
        ) : (
          <UploadIcon className="h-4 w-4 shrink-0 text-primary" />
        )}
        <span className="truncate">{value || "Choose file to upload"}</span>
      </label>
      <Input
        id={id}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0].name)}
      />
    </div>
  );
}

function LongText({ id, label, required, value, onChange, placeholder, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Textarea
        id={id}
        rows={4}
        maxLength={DESCRIPTION_LIMIT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/** "Attendance  /  16/09/2026" - the two halves of one fact. */
function Pair({ first, second }) {
  if (!first && !second) return <span className="text-muted-foreground">-</span>;
  return (
    <span>
      {first || "-"}
      <span className="px-1.5 text-muted-foreground">/</span>
      {second || "-"}
    </span>
  );
}

/**
 * The violations recorded against one employee, and the penalties that
 * followed.
 *
 * Recording and deciding a violation is the firm's to do, so the process is
 * opened from the Employees page; on My Profile the history is only read.
 */
export default function ViolationsSection({ employee, canEdit = true }) {
  const { violations, nextId, addViolation, updateViolation } = useViolations();

  // The record being worked on: "new" while it is being added, then its id.
  const [openId, setOpenId] = useState(null);
  const [stage, setStage] = useState("violation");
  const [draft, setDraft] = useState(() => draftFrom(null));
  const [query, setQuery] = useState("");

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const record = typeof openId === "number" ? violations.find((v) => v.id === openId) : null;
  const done = stagesDone(record);

  const mine = violationsFor(violations, employee?.name);
  const search = query.trim().toLowerCase();
  const shown = search
    ? mine.filter((v) =>
        [v.violationNo, v.type, v.investigationStatus, v.investigator, v.penaltyType, v.approvedBy, v.status]
          .join(" ")
          .toLowerCase()
          .includes(search)
      )
    : mine;

  const openNew = () => {
    setOpenId("new");
    setStage("violation");
    setDraft(draftFrom(null));
  };

  /** An existing violation opens at the first stage it has not been through. */
  const openRecord = (violation) => {
    setOpenId(violation.id);
    setStage(nextStage(violation));
    setDraft(draftFrom(violation));
  };

  const close = () => {
    setOpenId(null);
    setStage("violation");
    setDraft(draftFrom(null));
  };

  /* ------------------------------------------------ each stage's save */

  const canStart = draft.date && draft.type && draft.description.trim() && draft.investigationStart;

  const saveViolation = () => {
    if (!canStart) return;
    const part = {
      date: draft.date,
      type: draft.type,
      description: draft.description.trim(),
      documentName: draft.documentName,
      investigationStart: draft.investigationStart,
    };
    if (record) {
      updateViolation(record.id, part);
      return;
    }
    // Saving the violation starts the investigation, and the case moves on
    // to the employee's side of it.
    addViolation({
      ...part,
      violationNo: "",
      employee: employee.name,
      investigationStatus: "Under Investigation",
      investigator: CURRENT_USER.name,
      status: "Under Investigation",
    });
    setOpenId(nextId);
    setStage("response");
  };

  const saveResponse = () => {
    if (!record || !draft.response.trim()) return;
    updateViolation(record.id, {
      response: draft.response.trim(),
      responseDocument: draft.responseDocument,
    });
    setStage("decision");
  };

  // A decision needs its result, the penalty, the day it takes effect and the
  // reasons behind it - and an amount where the penalty is a deduction.
  const noPenalty = draft.penaltyType === NO_PENALTY;
  const canDecide =
    draft.investigationResult &&
    draft.penaltyType &&
    draft.penaltyDate &&
    draft.decisionReasons.trim() &&
    (draft.penaltyType !== DEDUCTION_PENALTY || Number(draft.deductionAmount) > 0);

  const saveDecision = () => {
    if (!record || !canDecide) return;
    // The penalty is issued here, which is when the violation is numbered -
    // unless the decision was that no penalty follows, which issues nothing.
    updateViolation(
      record.id,
      {
        investigationResult: draft.investigationResult,
        penaltyType: draft.penaltyType,
        deductionAmount: draft.penaltyType === DEDUCTION_PENALTY ? draft.deductionAmount : "",
        decisionReasons: draft.decisionReasons.trim(),
        decisionDocument: draft.decisionDocument,
        penaltyDate: draft.penaltyDate,
        investigationStatus: "Investigation Completed",
        approvedBy: CURRENT_USER.name,
        // The employee is notified the day the decision is sent.
        approvalDate: today(),
        status: noPenalty ? "Closed" : "Penalty Issued",
      },
      { number: !noPenalty }
    );
    if (noPenalty) close();
    else setStage("appeal");
  };

  const saveAppeal = () => {
    if (!record || !draft.appealGrounds.trim() || !draft.appealDate) return;
    updateViolation(record.id, {
      appealDate: draft.appealDate,
      appealGrounds: draft.appealGrounds.trim(),
      appealDocument: draft.appealDocument,
      status: "Under Appeal",
    });
    setStage("outcome");
  };

  const canApproveOutcome = Boolean(
    draft.appealOutcome && draft.outcomeDate && draft.outcomeReasons.trim()
  );

  const saveOutcome = () => {
    if (!record || !canApproveOutcome) return;
    // Approving the outcome settles the case: the penalty either stands, is
    // modified, or is taken away - and the status follows from that.
    updateViolation(record.id, {
      appealOutcome: draft.appealOutcome,
      outcomeReasons: draft.outcomeReasons.trim(),
      outcomeApprovedBy: CURRENT_USER.name,
      outcomeDate: draft.outcomeDate,
      status: draft.appealOutcome === CANCELLING_OUTCOME ? "Cancelled" : "Closed",
    });
    close();
  };

  /* ------------------------------------------------ the stages */

  const stages = VIOLATION_STAGES.map((s) => ({
    ...s,
    done: done[s.key],
    // Nothing after the violation itself exists until it has been saved.
    disabled: s.key !== "violation" && !record,
  }));

  /**
   * The two buttons under a stage: the way back, and the way on.
   *
   * The first stage has nothing behind it, so its way back leaves the form;
   * every stage after it steps back to the one before.
   */
  const footer = (label, onSave, enabled, previous) => (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
      {/* Plain buttons: this form sits inside the employee form. */}
      <Button
        type="button"
        variant="outline"
        onClick={previous ? () => setStage(previous) : close}
      >
        {previous ? "Previous" : "Cancel"}
      </Button>
      <Button type="button" onClick={onSave} disabled={!enabled}>
        {label}
      </Button>
    </div>
  );

  const stageBody = {
    violation: (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="violation-no">Violation No.</FieldLabel>
            <Input
              id="violation-no"
              readOnly
              tabIndex={-1}
              value={record?.violationNo || ""}
              placeholder="Generated automatically upon penalty approval"
              className="cursor-default bg-locked text-muted-foreground"
            />
          </div>
          <DateField id="violation-date" label="Violation Date" required value={draft.date} onChange={(v) => set("date", v)} />
          <Choice
            id="violation-type"
            label="Violation Type"
            required
            value={draft.type}
            onChange={(v) => set("type", v)}
            placeholder="Select violation type"
            options={VIOLATION_TYPES}
          />
          <FileField id="violation-document" label="Supporting Document" value={draft.documentName} onChange={(v) => set("documentName", v)} />
          <LongText
            id="violation-description"
            label="Violation Description"
            required
            className="sm:col-span-2 lg:col-span-3"
            value={draft.description}
            onChange={(v) => set("description", v)}
            placeholder="Enter a detailed description of the violation"
          />
          <DateField
            id="violation-investigation-start"
            label="Investigation Start Date"
            required
            value={draft.investigationStart}
            onChange={(v) => set("investigationStart", v)}
          />
        </div>
        {footer(record ? "Save" : "Start Investigation", saveViolation, canStart)}
      </>
    ),

    response: (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <LongText
            id="violation-response"
            label="Employee Response"
            required
            className="sm:col-span-2 lg:col-span-3"
            value={draft.response}
            onChange={(v) => set("response", v)}
            placeholder="Enter the employee's response to the violation"
          />
          <FileField id="violation-response-document" label="Supporting Documents" value={draft.responseDocument} onChange={(v) => set("responseDocument", v)} />
        </div>
        {footer("Save", saveResponse, Boolean(draft.response.trim()), "violation")}
      </>
    ),

    decision: (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <Choice
            id="violation-result"
            label="Investigation Result"
            required
            value={draft.investigationResult}
            onChange={(v) => set("investigationResult", v)}
            placeholder="Select result"
            options={INVESTIGATION_RESULTS}
          />
          <Choice
            id="violation-penalty"
            label="Penalty Type"
            required
            value={draft.penaltyType}
            onChange={(v) => set("penaltyType", v)}
            placeholder="Select penalty type"
            options={PENALTY_TYPES}
          />
          {/* Only a deduction has an amount to it. */}
          {draft.penaltyType === DEDUCTION_PENALTY && (
            <div className="space-y-2">
              <FieldLabel htmlFor="violation-deduction" required>
                Deduction Amount (<Rial />)
              </FieldLabel>
              <Input
                id="violation-deduction"
                inputMode="decimal"
                className="text-right"
                value={draft.deductionAmount}
                onChange={(e) => set("deductionAmount", e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.000"
              />
            </div>
          )}
          <DateField
            id="violation-effective-date"
            label="Effective Date"
            required
            value={draft.penaltyDate}
            onChange={(v) => set("penaltyDate", v)}
          />
          <LongText
            id="violation-reasons"
            label="Decision Reasons"
            required
            className="sm:col-span-2 lg:col-span-3"
            value={draft.decisionReasons}
            onChange={(v) => set("decisionReasons", v)}
            placeholder="Enter the reasons for the decision"
          />
          <FileField
            id="violation-decision-document"
            label="Decision Document"
            value={draft.decisionDocument}
            onChange={(v) => set("decisionDocument", v)}
          />
        </div>
        {footer("Save & Send Decision", saveDecision, canDecide, "response")}
      </>
    ),

    appeal: (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {/* What is being appealed against, read off the decision rather than
              asked for again. */}
          <Settled id="violation-appeal-no" label="Violation No." value={record?.violationNo} />
          <Settled id="violation-appeal-penalty" label="Penalty Type" value={record?.penaltyType} />
          <Settled
            id="violation-appeal-decision-date"
            label="Decision Date"
            value={record?.penaltyDate && formatDate(record.penaltyDate)}
          />
          <DateField
            id="violation-appeal-date"
            label="Appeal Date"
            required
            value={draft.appealDate}
            onChange={(v) => set("appealDate", v)}
          />
          <LongText
            id="violation-appeal"
            label="Appeal Grounds"
            required
            className="sm:col-span-2 lg:col-span-3"
            value={draft.appealGrounds}
            onChange={(v) => set("appealGrounds", v)}
            placeholder="Enter the detailed grounds for appealing the decision"
          />
          <FileField
            id="violation-appeal-document"
            label="Supporting Documents"
            value={draft.appealDocument}
            onChange={(v) => set("appealDocument", v)}
          />
        </div>
        {footer(
          "Save & Submit Appeal",
          saveAppeal,
          Boolean(draft.appealGrounds.trim() && draft.appealDate),
          "decision"
        )}
      </>
    ),

    outcome: (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {/* What is being answered, read off the appeal itself. */}
          <Settled id="violation-outcome-no" label="Violation No." value={record?.violationNo} />
          <Settled
            id="violation-outcome-appeal-date"
            label="Appeal Date"
            value={record?.appealDate && formatDate(record.appealDate)}
          />
          <Choice
            id="violation-outcome"
            label="Appeal Outcome"
            required
            value={draft.appealOutcome}
            onChange={(v) => set("appealOutcome", v)}
            placeholder="Select outcome"
            options={APPEAL_OUTCOMES}
          />
          <DateField
            id="violation-outcome-date"
            label="Outcome Date"
            required
            value={draft.outcomeDate}
            onChange={(v) => set("outcomeDate", v)}
          />
          <LongText
            id="violation-outcome-reasons"
            label="Reasons for Appeal Outcome"
            required
            className="sm:col-span-2 lg:col-span-3"
            value={draft.outcomeReasons}
            onChange={(v) => set("outcomeReasons", v)}
            placeholder="Enter the detailed reasons for the appeal outcome"
          />
          {/* Whoever approves it is whoever is signed in. */}
          <Settled
            id="violation-outcome-approver"
            label="Approved By"
            value={CURRENT_USER.name}
          />
        </div>
        {footer("Save & Approve Outcome", saveOutcome, canApproveOutcome, "appeal")}
      </>
    ),
  };

  return (
    <div className="space-y-6">
      {/* One heading at a time: the section's row - heading on the left, the
          way to add on the right - gives way to the process's own heading
          while a violation is open. */}
      {openId ? (
        <FormHeading
          icon={Gavel}
          title="Add Violation or Penalty"
          note={record?.violationNo ? record.violationNo : undefined}
          onBack={close}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormHeading icon={Gavel} title="Violations & Penalties History" />
          {canEdit && (
            <Button type="button" className="ml-auto" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Violation
            </Button>
          )}
        </div>
      )}

      {openId && (
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <RequestSteps
              compact
              active={stage}
              onChange={setStage}
              steps={stages}
            />
            {stageBody[stage]}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <AiSearch value={query} onChange={setQuery} placeholder="Ask AI" />

          {shown.length === 0 ? (
            <EmptyState>
              {mine.length === 0
                ? "No violation has been recorded for this employee."
                : "No violation matches that search."}
            </EmptyState>
          ) : (
            <RecordTable minWidth={1040}>
              <HeadRow>
                <Th width="10%">Violation No.</Th>
                <Th width="19%">Violation Details</Th>
                <Th width="19%">Investigation</Th>
                <Th width="17%">Penalty Details</Th>
                <Th width="19%">Approval &amp; Notification</Th>
                <Th width="16%">Status</Th>
              </HeadRow>
              <tbody>
                {shown.map((violation) => {
                  const tone =
                    VIOLATION_STATUS_TONE[violation.status] ||
                    VIOLATION_STATUS_TONE["Under Investigation"];
                  return (
                    <Row key={violation.id}>
                      {/* The number opens the case at the stage it has reached. */}
                      <Td className="whitespace-nowrap">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openRecord(violation)}
                            className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {violation.violationNo || "Pending"}
                          </button>
                        ) : (
                          <span className="font-bold text-primary">
                            {violation.violationNo || "Pending"}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Pair first={violation.type} second={violation.date && formatDate(violation.date)} />
                      </Td>
                      <Td>
                        <Pair first={violation.investigationStatus} second={violation.investigator} />
                      </Td>
                      <Td>
                        <Pair first={violation.penaltyType} second={violation.penaltyDate && formatDate(violation.penaltyDate)} />
                      </Td>
                      <Td>
                        <Pair first={violation.approvedBy} second={violation.approvalDate && formatDate(violation.approvalDate)} />
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden="true" className={cn("h-3 w-3 shrink-0 rounded-full", tone.dot)} />
                          <span className={cn("whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold", tone.chip)}>
                            {violation.status}
                          </span>
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
