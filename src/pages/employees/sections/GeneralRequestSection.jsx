import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/panels";
import FormHeading from "@/components/shared/FormHeading";
import { Send, History } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUBJECT_LIMIT,
  DETAILS_LIMIT,
  REQUEST_STATUS_TONE,
  initialGeneralRequests,
  requestsFor,
  nextRequestNo,
  shortDate,
  todayIso,
} from "../generalRequestData";

const emptyDraft = { subject: "", details: "" };

/**
 * Anything an employee asks the administration for that has no form of its
 * own, and what became of it.
 *
 * The form is open from the start rather than behind a button: asking is the
 * whole point of the page, and a request is two fields long. What has been
 * asked before sits underneath, so a new request is written knowing what the
 * last similar one was told.
 *
 * Every button here says type="button": the section sits inside the employee
 * record's own form, and a plain button would submit the whole record.
 */
export default function GeneralRequestSection({ employee }) {
  const [requests, setRequests] = useState(initialGeneralRequests);
  const [draft, setDraft] = useState(emptyDraft);

  const mine = requestsFor(requests, employee.name);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const canSubmit = draft.subject.trim() && draft.details.trim();

  const submit = () => {
    if (!canSubmit) return;
    const date = todayIso();
    setRequests((prev) => [
      ...prev,
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        employee: employee.name,
        requestNo: nextRequestNo(prev, date),
        subject: draft.subject.trim(),
        details: draft.details.trim(),
        date,
        // Not decided yet, so it says so and nothing more.
        status: "Pending",
        remarks: "",
        reviewedBy: "",
      },
    ]);
    setDraft(emptyDraft);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <FormHeading title="Submit a New Request" icon={Send} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="requestSubject">
                Request Subject
                <span className="whitespace-nowrap text-destructive">&nbsp;*</span>
              </Label>
              <div className="relative">
                <Input
                  id="requestSubject"
                  maxLength={SUBJECT_LIMIT}
                  value={draft.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder="e.g. Parking Card"
                  className="pr-14"
                  autoComplete="off"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {draft.subject.length}/{SUBJECT_LIMIT}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestDetails">
                Request Details
                <span className="whitespace-nowrap text-destructive">&nbsp;*</span>
              </Label>
              <Textarea
                id="requestDetails"
                rows={5}
                maxLength={DETAILS_LIMIT}
                value={draft.details}
                onChange={(e) => set("details", e.target.value)}
                placeholder="Write your request here..."
              />
              <p className="-mt-1 text-right text-xs text-muted-foreground">
                {draft.details.length}/{DETAILS_LIMIT}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Nothing to close - the form stays open - so Cancel clears it. */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(emptyDraft)}
              disabled={!draft.subject && !draft.details}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={!canSubmit}>
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <FormHeading title="Previous Requests" icon={History} />

          {mine.length === 0 ? (
            <EmptyState>No requests have been submitted yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b bg-secondary/60 text-left text-primary">
                    <th className="p-3 font-semibold" style={{ width: "4%" }}>
                      #
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "13%" }}>
                      Request No.
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "13%" }}>
                      Subject
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "22%" }}>
                      Details
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "11%" }}>
                      Request Date
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "10%" }}>
                      Status
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "15%" }}>
                      Remarks
                    </th>
                    <th className="p-3 font-semibold" style={{ width: "12%" }}>
                      Reviewed By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((request, index) => (
                    <tr
                      key={request.id}
                      className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                    >
                      <td className="p-3">{index + 1}</td>
                      <td className="whitespace-nowrap p-3 font-medium text-primary">
                        {request.requestNo}
                      </td>
                      <td className="p-3">{request.subject}</td>
                      <td className="p-3">{request.details}</td>
                      <td className="whitespace-nowrap p-3">
                        {shortDate(request.date)}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                            REQUEST_STATUS_TONE[request.status]
                          )}
                        >
                          {request.status}
                        </span>
                      </td>
                      {/* Blank until someone has decided, so nothing
                          suggests an answer that has not been given. */}
                      <td className="p-3">{request.remarks || "-"}</td>
                      <td className="p-3">{request.reviewedBy || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
