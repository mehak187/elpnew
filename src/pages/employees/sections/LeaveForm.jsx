import { Info, CalendarCheck } from "lucide-react";
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
import FormHeading from "@/components/shared/FormHeading";
import { cn } from "@/lib/utils";
import { employeeRecords } from "../employeeData";
import {
  ABSENCE_CATEGORIES,
  typesIn,
  entitlementOf,
  leaveDays,
  remainingBalance,
} from "../leaveData";

/** A reason has to fit on the request, so the form says how much room. */
const NOTES_LIMIT = 500;

/** A numbered step, so a long form reads as two short ones. */
function Step({ number, title, note, children }) {
  return (
    <Card>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {number}
          </span>
          <div>
            <p className="font-semibold text-primary">{title}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * A new leave request.
 *
 * Asked for in two steps: what kind of leave, then when and why. The balance
 * is shown as soon as the type is chosen, because how much is left is the one
 * thing that decides whether the rest of the form is worth filling in.
 */
export default function LeaveForm({
  employee,
  leaves,
  draft,
  onChange,
  onCategory,
  onSubmit,
  onCancel,
  years,
}) {
  const days = leaveDays(draft.from, draft.to);
  const entitlement = entitlementOf(draft.type);
  const balance = remainingBalance(
    leaves,
    employee.name,
    draft.type,
    draft.year
  );
  // What would be left of it once this request is taken - 14 left less 5
  // asked for is 9. Below zero says the request is more than is left.
  const afterRequest = balance ? balance.remaining - Math.max(days, 0) : null;

  const canSave =
    draft.category &&
    draft.type &&
    draft.from &&
    draft.to &&
    draft.year &&
    draft.reason.trim() &&
    days > 0;

  return (
    <div className="space-y-6">
      <div className="border-b pb-3">
        <FormHeading
          icon={CalendarCheck}
          title="Add New Leave"
          note="Submit a new leave request"
        />
      </div>

      <Step
        number="1"
        title="Leave Category and Type"
        note="Select the leave category and type to see your remaining balance"
      >
        {/* The year first: a balance belongs to a year, so it is chosen
            before the leave it will be counted against. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="leaveYearField">
              Year<span className="whitespace-nowrap text-destructive">&nbsp;*</span>
            </Label>
            <Select
              value={draft.year}
              onValueChange={(value) => onChange("year", value)}
            >
              <SelectTrigger id="leaveYearField">
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

          <div className="space-y-2">
            <Label htmlFor="leaveCategory">
              Leave Category<span className="whitespace-nowrap text-destructive">&nbsp;*</span>
            </Label>
            {/* Empty values are ignored: inside the employee's form Radix keeps a
                hidden native select, which reports "" whenever the list it was
                built from changes - and would wipe a choice just made. Nobody
                can pick "nothing" from the list itself. */}
            <Select
              value={draft.category}
              onValueChange={(value) => value && onCategory(value)}
            >
              <SelectTrigger id="leaveCategory">
                <SelectValue placeholder="Select Leave Category" />
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
              Leave Type<span className="whitespace-nowrap text-destructive">&nbsp;*</span>
            </Label>
            <Select
              value={draft.type}
              onValueChange={(value) => value && onChange("type", value)}
              disabled={!draft.category}
            >
              <SelectTrigger id="leaveType">
                <SelectValue
                  placeholder={
                    draft.category
                      ? "Select Leave Type"
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
                    <span className="opacity-70"> &mdash; {type.entitlement}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* What is left of the chosen type this year: the entitlement less
              the approved days already taken - 30 less 16 taken is 14. Counted
              off the approved requests every time, never stored: a balance
              held as a number is a second copy of the leave already taken.
              A type whose length depends on the case (Sick, Bereavement,
              Widowhood) has no count to take away from, so its entitlement is
              shown as it stands. */}
          <div className="space-y-2">
            <Label htmlFor="leaveBalance">Remaining Leave Balance</Label>
            <Input
              id="leaveBalance"
              readOnly
              tabIndex={-1}
              className="cursor-default bg-locked font-semibold text-primary"
              placeholder="Auto calculated"
              value={
                !draft.type
                  ? ""
                  : balance
                    ? balance.remaining +
                      (balance.remaining === 1 ? " Day" : " Days")
                    : entitlement
              }
            />
            {draft.type && (
              <p className="text-xs text-muted-foreground">
                {balance
                  ? balance.allowance +
                    " days entitlement - " +
                    balance.used +
                    " taken in " +
                    draft.year
                  : "Settled when the request is decided"}
              </p>
            )}
          </div>
        </div>
      </Step>

      <Step
        number="2"
        title="Leave Period and Details"
        note="Specify the leave period and provide additional details"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="leaveFrom">
              From Date<span className="whitespace-nowrap text-destructive">&nbsp;*</span>
            </Label>
            <Input
              id="leaveFrom"
              type="date"
              value={draft.from}
              max={draft.to || undefined}
              onChange={(e) => onChange("from", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveTo">
              To Date<span className="whitespace-nowrap text-destructive">&nbsp;*</span>
            </Label>
            <Input
              id="leaveTo"
              type="date"
              value={draft.to}
              min={draft.from || undefined}
              onChange={(e) => onChange("to", e.target.value)}
            />
          </div>

          {/* Counted from the two dates beside it: leaving on the 1st and
              returning on the 5th is five days away, not four. */}
          <div className="space-y-2">
            <Label htmlFor="leaveDays">Number of Days</Label>
            <Input
              id="leaveDays"
              readOnly
              tabIndex={-1}
              className="cursor-default bg-locked text-muted-foreground"
              value={days > 0 ? days + (days === 1 ? " Day" : " Days") : ""}
              placeholder="Auto calculated"
            />
          </div>

          {/* The balance again, now less the days on this request, so the
              effect of the dates is seen beside them. Worked out, never
              stored. A type with no fixed count shows its entitlement. */}
          <div className="space-y-2">
            <Label htmlFor="leaveBalanceAfter">Remaining Leave Balance</Label>
            <Input
              id="leaveBalanceAfter"
              readOnly
              tabIndex={-1}
              className={cn(
                "cursor-default bg-locked font-semibold",
                afterRequest !== null && afterRequest < 0
                  ? "text-destructive"
                  : "text-primary"
              )}
              placeholder="Auto calculated"
              value={
                !draft.type
                  ? ""
                  : balance
                    ? afterRequest + (Math.abs(afterRequest) === 1 ? " Day" : " Days")
                    : entitlement
              }
            />
            {balance && days > 0 && (
              <p className="text-xs text-muted-foreground">
                {balance.remaining} left - {days} on this request
              </p>
            )}
          </div>

          {/* Who covers the work. Optional, because plenty of leave
              needs no cover - but naming someone is what lets the firm
              approve it without stopping to ask. */}
          <div className="space-y-2">
            <Label htmlFor="leaveReplacement">
              Replacement Employee
              <span className="ml-1 font-normal text-muted-foreground">
                (Optional)
              </span>
              <Info
                className="ml-1 inline h-3.5 w-3.5 align-text-top text-muted-foreground"
                aria-hidden="true"
              />
            </Label>
            <Select
              value={draft.replacement}
              onValueChange={(value) => value && onChange("replacement", value)}
            >
              <SelectTrigger
                id="leaveReplacement"
                title="Who covers the work while they are away"
              >
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {/* Nobody covers for themselves. */}
                {employeeRecords
                  .filter((person) => person.name !== employee.name)
                  .map((person) => (
                    <SelectItem key={person.id} value={person.name}>
                      {person.name}
                      <span className="opacity-70">
                        {" "}
                        &mdash; {person.designation}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-4">
            <Label htmlFor="leaveReason">
              Reason / Notes<span className="whitespace-nowrap text-destructive">&nbsp;*</span>
            </Label>
            <Textarea
              id="leaveReason"
              rows={3}
              maxLength={NOTES_LIMIT}
              value={draft.reason}
              onChange={(e) => onChange("reason", e.target.value)}
              placeholder="Enter the reason for your leave request..."
            />
            <p className="-mt-1 text-right text-xs text-muted-foreground">
              {draft.reason.length} / {NOTES_LIMIT}
            </p>
          </div>
        </div>

        {/* No warning about asking for more than is left: the balance beside
            the dates already turns red and shows how far past it the request
            goes, and management decides either way. */}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* type="button": the leave form sits inside the employee record's
              own form, and a plain button there would submit the whole record. */}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={!canSave}>
            Submit Request
          </Button>
        </div>
      </Step>
    </div>
  );
}
