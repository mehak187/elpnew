import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import FormHeading from "@/components/shared/FormHeading";
import Panel from "@/components/shared/Panel";
import { RequestSteps, DecisionChoice } from "@/components/shared/RequestSteps";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { Rial } from "@/components/shared/Rial";
import { cn } from "@/lib/utils";
import { CalendarClock, ClipboardList } from "lucide-react";
import { useAdvances } from "@/lib/advances/context";
import { amount, formatDate } from "../loanData";
import { PAYMENT_MONTHS, PAYMENT_YEARS } from "../payrollData";
import {
  ADVANCE_STATUS_TONE,
  advancesFor,
  deductedFrom,
} from "../advanceSalaryData";

const REASON_LIMIT = 300;

const emptyDraft = () => ({
  amount: "",
  deductMonth: "",
  deductYear: String(new Date().getFullYear()),
  reason: "",
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

/**
 * Asking for part of next month's salary now.
 *
 * The salary itself is not asked about: it is on the page above, and the form
 * shows what it comes to so the amount being asked for can be judged against
 * it. What the employee settles is how much, which month it comes out of, and
 * why.
 */
export function AdvanceSalaryForm({
  employee,
  net,
  onClose,
  // An advance is asked for on My Profile, where the decision is only read.
  canDecide = false,
}) {
  const { addAdvance } = useAdvances();
  const [draft, setDraft] = useState(emptyDraft);
  // Which stage of the request is open, and what management decided.
  const [stage, setStage] = useState("request");
  const [decision, setDecision] = useState("");

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const canSubmit =
    Number(draft.amount) > 0 &&
    draft.deductMonth &&
    draft.deductYear &&
    draft.reason.trim();

  const submit = () => {
    if (!canSubmit) return;
    addAdvance({
      employee: employee?.name || "",
      requestedOn: new Date().toISOString().slice(0, 10),
      amount: Number(draft.amount),
      deductMonth: draft.deductMonth,
      deductYear: draft.deductYear,
      reason: draft.reason.trim(),
    });
    setDraft(emptyDraft());
    onClose();
  };

  return (
    <div className="space-y-6">
      <FormHeading
        icon={CalendarClock}
        title="Request Salary Advance"
        note="Ask for part of your salary in advance. Your request will be reviewed and processed by the office."
        onBack={onClose}
      />

      {/* The two stages of the request. Either header opens its stage. */}
      <RequestSteps
        active={stage}
        onChange={setStage}
        steps={[
          {
            key: "request",
            title: "Salary Advance Request",
            note: "Submit advance details and the month it is deducted from",
            done: Boolean(canSubmit),
          },
          {
            key: "decision",
            title: "Management Decision",
            note: "Review and approval decision",
            done: Boolean(decision),
          },
        ]}
      />

      {stage === "decision" ? (
        <DecisionChoice
          subject="salary advance"
          value={decision}
          onChange={setDecision}
          disabled={!canDecide}
        />
      ) : (
      <>
      <Panel title="Advance Salary Application" icon={CalendarClock}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {/* Read off the salary above rather than asked for again, so the
              request is judged against the figure the office already holds. */}
          <div className="space-y-2">
            {/* Shown, not typed - so the figure itself carries the currency. */}
            <FieldLabel htmlFor="advance-net">Net Monthly Salary</FieldLabel>
            <Input
              id="advance-net"
              value={amount(net)}
              readOnly
              tabIndex={-1}
              className="cursor-default bg-locked text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="advance-amount" required>
              Requested Amount (<Rial />)
            </FieldLabel>
            <Input
              id="advance-amount"
              inputMode="decimal"
              value={draft.amount}
              onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0.000"
            />
          </div>

          {/* An advance is not a loan: it comes back out of one month's pay,
              and the employee says which. */}
          <div className="space-y-2">
            <FieldLabel htmlFor="advance-month" required>
              Deduct From Month
            </FieldLabel>
            <Select
              value={draft.deductMonth}
              onValueChange={(value) => value && set("deductMonth", value)}
            >
              <SelectTrigger id="advance-month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {/* The months are stored short and read long, the way the
                    payroll form lists them. */}
                {PAYMENT_MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.label}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="advance-year" required>
              Year
            </FieldLabel>
            <Select
              value={draft.deductYear}
              onValueChange={(value) => value && set("deductYear", value)}
            >
              <SelectTrigger id="advance-year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel title="Request Details" icon={ClipboardList}>
        <div className="space-y-2">
          <FieldLabel htmlFor="advance-reason" required>
            Request Details / Notes
          </FieldLabel>
          <Textarea
            id="advance-reason"
            rows={4}
            maxLength={REASON_LIMIT}
            value={draft.reason}
            onChange={(e) => set("reason", e.target.value)}
            placeholder="Please explain the reason for your request..."
          />
          <p className="text-right text-xs text-muted-foreground">
            {draft.reason.length} / {REASON_LIMIT}
          </p>
        </div>
      </Panel>
      </>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        {/* Plain buttons: this form sits inside the employee form. */}
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={!canSubmit}>
          Submit Request
        </Button>
      </div>
    </div>
  );
}

/**
 * The advances this employee has asked for, and what became of them.
 *
 * It sits between the salary and the payments made against it, which is where
 * an advance belongs: asked for out of the salary above, settled in one of the
 * months below.
 */
export function AdvanceRequests({ employee }) {
  const { advances } = useAdvances();
  const mine = advancesFor(advances, employee?.name);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <p className="mb-4 text-base font-bold text-primary">
          Advance Salary Requests
        </p>

        {mine.length === 0 ? (
          <EmptyState>No salary advance has been requested yet.</EmptyState>
        ) : (
          <RecordTable minWidth={860}>
            <HeadRow>
              <Th width="6%">No.</Th>
              <Th width="14%">Request Date</Th>
              {/* No unit in the heading: every figure below carries it. */}
              <Th width="16%" className="text-right">
                Requested Amount
              </Th>
              <Th width="16%">Deducted From</Th>
              <Th width="34%">Request Details</Th>
              <Th width="14%">Status</Th>
            </HeadRow>
            <tbody>
              {mine.map((advance, index) => (
                <Row key={advance.id}>
                  <Td className="font-medium text-primary">{index + 1}</Td>
                  <Td className="whitespace-nowrap text-primary">
                    {formatDate(advance.requestedOn)}
                  </Td>
                  <Td className="whitespace-nowrap text-right font-bold text-green-700">
                    {amount(advance.amount)}
                  </Td>
                  <Td className="whitespace-nowrap text-primary">
                    {deductedFrom(advance)}
                  </Td>
                  <Td className="text-left text-muted-foreground">
                    {advance.reason}
                  </Td>
                  <Td
                    className={cn(
                      "font-semibold",
                      ADVANCE_STATUS_TONE[advance.status]
                    )}
                  >
                    {advance.status}
                  </Td>
                </Row>
              ))}
            </tbody>
          </RecordTable>
        )}
      </CardContent>
    </Card>
  );
}
