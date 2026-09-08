import { CalendarPlus, Database } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  ABSENCE_CATEGORIES,
  typesIn,
  entitlementOf,
  leaveDays,
  remainingBalance,
} from "../leaveData";

/** How each category is coloured wherever its types are listed. */
const CATEGORY_TONE = {
  "Regular Leave": {
    heading: "text-red-600",
    card: "border-red-200 bg-red-50/60",
    bullet: "border-red-300",
  },
  "Family Leave": {
    heading: "text-purple-600",
    card: "border-purple-200 bg-purple-50/60",
    bullet: "border-purple-300",
  },
  "Special Leave": {
    heading: "text-green-700",
    card: "border-green-200 bg-green-50/60",
    bullet: "border-green-300",
  },
};

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
 * The leave on offer, laid out so the choice can be made without opening a
 * dropdown to find out what each type is worth.
 *
 * The same list the pickers are built from, so it can never fall out of step
 * with them - and clicking a line is another way of choosing it.
 */
function CategoryCards({ selectedType, onChoose }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {ABSENCE_CATEGORIES.map((category) => {
        const tone = CATEGORY_TONE[category.name];
        return (
          <div
            key={category.name}
            className={cn("rounded-lg border", tone.card)}
          >
            <p
              className={cn(
                "border-b px-4 py-2 text-sm font-semibold",
                tone.heading
              )}
            >
              {category.name}
            </p>
            <div className="space-y-2 p-4">
              {category.types.map((type) => {
                const chosen = selectedType === type.name;
                return (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() => onChoose(category.name, type.name)}
                    className="flex w-full items-center gap-2 rounded text-left text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full border-2",
                        chosen
                          ? "border-primary bg-primary"
                          : cn("bg-white", tone.bullet)
                      )}
                    />
                    <span className={cn("flex-1", chosen && "font-semibold")}>
                      {type.name}
                    </span>
                    <span className="text-muted-foreground">
                      &mdash; {type.entitlement}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
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
      <div className="flex items-center gap-3 border-b pb-3">
        <BackButton onBack={onCancel} />
        <span className="rounded-lg bg-secondary p-2 text-primary">
          <CalendarPlus className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-bold text-primary">Add New Leave</p>
          <p className="text-xs text-muted-foreground">
            Submit a new leave request
          </p>
        </div>
      </div>

      <Step
        number="1"
        title="Leave Category and Type"
        note="Select the leave category and type to see your remaining balance"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="leaveCategory">
              Leave Category<span className="text-destructive"> *</span>
            </Label>
            <Select value={draft.category} onValueChange={onCategory}>
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
              Leave Type<span className="text-destructive"> *</span>
            </Label>
            <Select
              value={draft.type}
              onValueChange={(value) => onChange("type", value)}
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

          {/* Counted off the approved requests, never stored: a balance held
              as a number is a second copy of the leave already taken. */}
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-secondary p-4">
            <span className="shrink-0 rounded-lg bg-white p-2 text-primary">
              <Database className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Remaining Balance</p>
              <p className="text-2xl font-bold text-primary">
                {!draft.type
                  ? "-"
                  : balance
                    ? balance.remaining + " Days"
                    : entitlement}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {draft.type
                  ? "(" + draft.type + " - " + draft.year + ")"
                  : "Choose a leave type"}
              </p>
            </div>
          </div>
        </div>

        <CategoryCards
          selectedType={draft.type}
          onChoose={(category, type) => {
            onCategory(category);
            onChange("type", type);
          }}
        />
      </Step>

      <Step
        number="2"
        title="Leave Period and Details"
        note="Specify the leave period and provide additional details"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="leaveFrom">
              From Date<span className="text-destructive"> *</span>
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
              To Date<span className="text-destructive"> *</span>
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
              className="cursor-default bg-muted text-muted-foreground"
              value={days > 0 ? days + (days === 1 ? " Day" : " Days") : ""}
              placeholder="Auto calculated"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveYearField">
              Year<span className="text-destructive"> *</span>
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

          <div className="space-y-2 sm:col-span-2 lg:col-span-4">
            <Label htmlFor="leaveReason">
              Reason / Notes<span className="text-destructive"> *</span>
            </Label>
            <Textarea
              id="leaveReason"
              rows={3}
              value={draft.reason}
              onChange={(e) => onChange("reason", e.target.value)}
              placeholder="Enter the reason for your leave request..."
            />
          </div>
        </div>

        {days > 0 && balance && days > balance.remaining && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            This is {days} {days === 1 ? "day" : "days"} against a remaining
            balance of {balance.remaining}. It can be submitted, but management
            will have to decide whether to allow it.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={onCancel}>
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
