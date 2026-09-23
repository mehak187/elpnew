import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import FormHeading from "@/components/shared/FormHeading";
import { RequestSteps } from "@/components/shared/RequestSteps";
import {
  Group,
  Row,
  Field,
  Locked,
  Counted,
  Decision,
  Attach,
  FieldError,
  useRequiredFields,
} from "@/components/shared/formFields";
import {
  RecordTable,
  HeadRow,
  Th,
  Row as TableRow,
  Td,
  RecordLink,
} from "@/components/shared/RecordTable";
import { Send, History, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REQUEST_TYPES,
  COMMENT_LIMIT,
  DECISION_COMMENT_LIMIT,
  APPROVED,
  REJECTED,
  REQUEST_STATUS_TONE,
  initialGeneralRequests,
  requestsFor,
  nextRequestNo,
  shortDate,
  todayIso,
} from "../generalRequestData";

const emptyDraft = { requestType: "", comment: "" };
const emptyDecision = { answer: "", comment: "" };

/** Who answers a general request, written on it so the trail says who did. */
const DECIDED_BY = "Admin Department";

/**
 * Anything an employee asks the administration for that has no form of its
 * own, and what became of it.
 *
 * Two halves, like every other request in the system: the employee writes it,
 * and the administration answers. The second half cannot be opened until
 * there is a request to answer, and once answered the first half is only read
 * back - a decision taken on one request must not be able to end up filed
 * against a different one.
 *
 * Every button here says type="button": the section sits inside the employee
 * record's own form, and a plain button would submit the whole record.
 */
export default function GeneralRequestSection({ employee }) {
  const [requests, setRequests] = useState(initialGeneralRequests);
  const [draft, setDraft] = useState(emptyDraft);
  const [decision, setDecision] = useState(emptyDecision);
  const [document, setDocument] = useState(null);
  const [stage, setStage] = useState("request");
  // The request on the list the form is open on, if any.
  const [openId, setOpenId] = useState(null);

  const mine = requestsFor(requests, employee.name);
  const open = requests.find((request) => request.id === openId) || null;
  const settled = Boolean(open) && open.status !== "Pending";

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setAnswer = (name, value) =>
    setDecision((prev) => ({ ...prev, [name]: value }));

  const requestNo = open?.requestNo || nextRequestNo(requests, todayIso());
  const requestDate = open?.date || todayIso();
  const attachment = open ? open.document : document?.name || "";

  /**
   * The request's own required fields, and the decision's.
   *
   * Nothing here is marked in advance: the form says what is missing only
   * once somebody has tried to save it, and stops saying so the moment the
   * field is filled.
   */
  const asked = useRequiredFields({
    grType: draft.requestType,
    grComment: draft.comment,
  });

  /** Refusing and approving both have to say why, so both need a comment. */
  const answered = useRequiredFields({
    grAnswer: decision.answer,
    grRemarks: decision.comment,
  });

  /** Back to a blank request, with nothing carried over from the last one. */
  const clear = () => {
    asked.reset();
    answered.reset();
    setDraft(emptyDraft);
    setDecision(emptyDecision);
    setDocument(null);
    setOpenId(null);
    setStage("request");
  };

  /**
   * The request, on the list straight away under its own number and waiting
   * on the answer. The form moves on to that answer.
   */
  const submit = () => {
    if (!asked.check()) return;
    const date = todayIso();
    const id = requests.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    setRequests((prev) => [
      ...prev,
      {
        id,
        employee: employee.name,
        requestNo: nextRequestNo(prev, date),
        requestType: draft.requestType,
        comment: draft.comment.trim(),
        document: document?.name || "",
        date,
        // Not decided yet, so it says so and nothing more.
        status: "Pending",
        decisionDate: "",
        remarks: "",
        reviewedBy: "",
      },
    ]);
    setOpenId(id);
    setStage("decision");
  };

  /** The answer, against the request it was given on. */
  const decide = () => {
    if (!open || settled || !answered.check()) return;
    setRequests((prev) =>
      prev.map((request) =>
        request.id === openId
          ? {
              ...request,
              status: decision.answer,
              decisionDate: todayIso(),
              remarks: decision.comment.trim(),
              reviewedBy: DECIDED_BY,
            }
          : request
      )
    );
    clear();
  };

  /** A request opened back off the list, to be read or answered. */
  const track = (request) => {
    setOpenId(request.id);
    setDraft({ requestType: request.requestType, comment: request.comment });
    setDecision({
      answer: request.status === "Pending" ? "" : request.status,
      comment: request.remarks || "",
    });
    setDocument(null);
    setStage("decision");
  };

  const refusing = decision.answer === REJECTED;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <FormHeading
            title={open ? "Request " + open.requestNo : "General Request"}
            note={
              open
                ? "Review and record the management decision"
                : "Ask the administration for anything without a form of its own"
            }
            icon={Send}
          />

          {/* The employee writes it; the administration answers. Either
              header opens its own half. */}
          <RequestSteps
            active={stage}
            onChange={setStage}
            steps={[
              {
                key: "request",
                title: "Submit Request",
                note: "Enter request details and supporting document",
                done: Boolean(open),
              },
              {
                key: "decision",
                title: "Management Decision",
                note: "Review and record the management decision",
                done: settled,
                // Nothing to decide until there is a request to decide on.
                disabled: !open,
              },
            ]}
          />

          <Group title="Request Information">
            <Row cols={4}>
              {/* The supporting document hangs off the number rather than
                  standing on its own: it is this request's paper, and a row
                  of its own would leave it belonging to nothing in
                  particular. Once the request is made the paper is read, not
                  replaced. */}
              <Field id="grNo" label="Request No.">
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    id="grNo"
                    readOnly
                    tabIndex={-1}
                    value={requestNo}
                    className="min-w-0 flex-1 cursor-default bg-locked text-muted-foreground"
                  />
                  {!open && (
                    <Attach
                      file={document}
                      onPick={setDocument}
                      label="supporting document"
                    />
                  )}
                </div>
                {attachment && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{attachment}</span>
                  </p>
                )}
              </Field>
              <Locked
                id="grDate"
                label="Request Date"
                value={shortDate(requestDate)}
              />
              <Locked id="grEmployee" label="Employee Name" value={employee.name} />

              {/* Fixed once the request exists: the kind of thing being asked
                  is what it was answered as, so it cannot be rewritten after
                  the fact. */}
              {open ? (
                <Locked
                  id="grType"
                  label="Request Type"
                  value={open.requestType}
                />
              ) : (
                <Field
                  id="grType"
                  label="Request Type"
                  required
                  error={asked.errorFor("grType")}
                >
                  <Select
                    value={draft.requestType}
                    onValueChange={(value) => value && set("requestType", value)}
                  >
                    <SelectTrigger id="grType">
                      <SelectValue placeholder="Select Request Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </Row>
          </Group>

          {stage === "request" ? (
            <Group title="Request Details">
              <Field
                id="grComment"
                label="Employee Comment"
                required
                error={asked.errorFor("grComment")}
              >
                <Counted
                  id="grComment"
                  rows={5}
                  limit={COMMENT_LIMIT}
                  value={draft.comment}
                  onChange={(value) => set("comment", value)}
                  placeholder="Write your request here..."
                />
              </Field>
            </Group>
          ) : (
            <>
              <Group title="Employee Comment">
                <p className="rounded-md bg-locked px-3 py-2 text-sm text-muted-foreground">
                  {open?.comment}
                </p>
              </Group>

              {/* A request already answered is read, not answered again: an
                  editable box that quietly refuses what is typed into it
                  reads as broken, so once decided it stops being a box. */}
              <Group title="Management Decision">
                {settled ? (
                  <Row cols={3}>
                    <Locked
                      id="grAnswer"
                      label="Decision"
                      value={open.status}
                      highlight={open.status === APPROVED}
                    />
                    <Locked
                      id="grDecisionDate"
                      label="Decision Date"
                      value={shortDate(open.decisionDate)}
                    />
                    <Field
                      id="grRemarks"
                      label={
                        open.status === REJECTED
                          ? "Reason for Rejection"
                          : "Management Comment"
                      }
                    >
                      <p className="rounded-md bg-locked px-3 py-2 text-sm text-muted-foreground">
                        {open.remarks || "-"}
                      </p>
                    </Field>
                  </Row>
                ) : (
                  <>
                    <div>
                      <div
                        id="grAnswer"
                        role="radiogroup"
                        tabIndex={-1}
                        aria-label="Management decision"
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                      >
                        <Decision
                          value={APPROVED}
                          chosen={decision.answer}
                          onChoose={(v) => setAnswer("answer", v)}
                        />
                        <Decision
                          value={REJECTED}
                          chosen={decision.answer}
                          onChoose={(v) => setAnswer("answer", v)}
                          tone="bad"
                        />
                      </div>
                      {answered.errorFor("grAnswer") && (
                        <FieldError htmlFor="grAnswer">
                          {answered.errorFor("grAnswer")}
                        </FieldError>
                      )}
                    </div>

                    <Row cols={3}>
                      <Locked
                        id="grDecisionDate"
                        label="Decision Date"
                        value={shortDate(todayIso())}
                      />

                      <div className="sm:col-span-1 lg:col-span-2">
                        <Field
                          id="grRemarks"
                          label={
                            refusing
                              ? "Reason for Rejection"
                              : "Management Comment"
                          }
                          required
                          error={answered.errorFor("grRemarks")}
                        >
                          <Counted
                            id="grRemarks"
                            grow
                            limit={DECISION_COMMENT_LIMIT}
                            value={decision.comment}
                            onChange={(value) => setAnswer("comment", value)}
                            placeholder={
                              refusing
                                ? "Say why this request is refused"
                                : "Enter management comment"
                            }
                          />
                        </Field>
                      </div>
                    </Row>
                  </>
                )}
              </Group>
            </>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clear}
              disabled={!open && !draft.requestType && !draft.comment}
            >
              Cancel
            </Button>

            {stage === "request" ? (
              <Button type="button" onClick={submit} disabled={Boolean(open)}>
                Save
              </Button>
            ) : (
              !settled && (
                <Button
                  type="button"
                  variant={refusing ? "destructive" : "default"}
                  onClick={decide}
                >
                  {refusing ? "Confirm Rejection" : "Save"}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <FormHeading title="Previous Requests" icon={History} />

          {mine.length === 0 ? (
            <EmptyState>No requests have been submitted yet.</EmptyState>
          ) : (
            <RecordTable minWidth={980}>
              <HeadRow>
                <Th width="4%">#</Th>
                <Th width="13%">Request No.</Th>
                <Th width="15%">Request Type</Th>
                <Th width="22%">Employee Comment</Th>
                <Th width="10%">Request Date</Th>
                <Th width="9%">Status</Th>
                <Th width="15%">Management Comment</Th>
                <Th width="12%">Reviewed By</Th>
              </HeadRow>
              <tbody>
                {mine.map((request, index) => (
                  <TableRow key={request.id}>
                    <Td className="font-medium text-primary">{index + 1}</Td>
                    {/* The number is the way back into the request. */}
                    <Td className="whitespace-nowrap">
                      <RecordLink onClick={() => track(request)}>
                        {request.requestNo}
                        </RecordLink>
                    </Td>
                    <Td className="text-start">{request.requestType}</Td>
                    <Td className="text-start">
                      <span className="inline-flex items-start gap-1.5">
                        {request.document && (
                          <Paperclip
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-label="Has a supporting document"
                          />
                        )}
                        {request.comment}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {shortDate(request.date)}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-block whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold",
                          REQUEST_STATUS_TONE[request.status]
                        )}
                      >
                        {request.status}
                      </span>
                    </Td>
                    {/* Blank until someone has decided, so nothing
                        suggests an answer that has not been given. */}
                    <Td className="text-start text-muted-foreground">
                      {request.remarks || "-"}
                    </Td>
                    <Td className="text-muted-foreground">
                      {request.reviewedBy || "-"}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </RecordTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
