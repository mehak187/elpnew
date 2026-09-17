import { Check, PieChart, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The two stages a financial request goes through, as one bar of headers.
 *
 * The employee writes the request; management decides it. Each header opens
 * its own stage below it, for whoever is looking - the employee to see what
 * was decided, the office to decide it. The open stage is filled in; a stage
 * that is done carries a tick instead of its number.
 *
 * `steps` is [{ key, title, note, done, disabled }]. A disabled stage cannot
 * be opened yet - there is nothing in it until an earlier stage is saved.
 */
export function RequestSteps({ steps, active, onChange, compact = false }) {
  // Many stages to a row leave no room for a numbered circle beside each
  // title, so the number goes in front of the title instead.
  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {steps.map((step, index) => {
          const open = step.key === active;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onChange(step.key)}
              disabled={step.disabled}
              aria-current={open ? "step" : undefined}
              className={cn(
                "rounded-md px-3 py-2.5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                open
                  ? "bg-primary text-primary-foreground"
                  : "border border-primary/15 bg-secondary text-primary hover:bg-secondary/70",
                step.disabled && "cursor-not-allowed opacity-60 hover:bg-secondary"
              )}
            >
              <span className="flex items-center justify-center gap-1.5 font-semibold">
                {step.done && !open && (
                  <Check className="h-4 w-4 shrink-0 text-green-600" aria-label="Done" />
                )}
                {index + 1}. {step.title}
              </span>
              <span
                className={cn(
                  "block text-xs",
                  open ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {step.note}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
      {steps.map((step, index) => {
        const open = step.key === active;
        const first = index === 0;
        const last = index === steps.length - 1;

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onChange(step.key)}
            disabled={step.disabled}
            aria-current={open ? "step" : undefined}
            // Side by side, each header points into the next: every one but
            // the last ends in an arrow, and every one but the first takes the
            // notch that arrow sits in. Stacked on a phone they are plain bars.
            className={cn(
              "flex flex-1 items-center gap-4 rounded-md px-5 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !last && "sm:pr-10",
              !first && "sm:-ml-3.5 sm:pl-10",
              first && !last && "sm:[clip-path:polygon(0_0,calc(100%_-_20px)_0,100%_50%,calc(100%_-_20px)_100%,0_100%)]",
              !first && !last && "sm:[clip-path:polygon(0_0,calc(100%_-_20px)_0,100%_50%,calc(100%_-_20px)_100%,0_100%,20px_50%)]",
              last && !first && "sm:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%,20px_50%)]",
              open
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-primary hover:bg-secondary/70",
              step.disabled && "cursor-not-allowed opacity-60 hover:bg-secondary"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                step.done && !open
                  ? "bg-green-600 text-white"
                  : open
                    ? "border-2 border-primary-foreground"
                    : "border-2 border-primary/40"
              )}
            >
              {step.done && !open ? <Check className="h-5 w-5" /> : index + 1}
            </span>

            <span
              aria-hidden="true"
              className={cn(
                "h-8 w-px shrink-0",
                open ? "bg-primary-foreground/40" : "bg-primary/20"
              )}
            />

            <span className="min-w-0">
              <span className="block font-semibold">{step.title}</span>
              <span
                className={cn(
                  "block text-xs",
                  open ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {step.note}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** What management can decide about a request, and how each one looks. */
const DECISIONS = [
  {
    key: "full",
    title: "Full Approval",
    note: (subject) => "Approve the requested " + subject + " amount",
    mark: (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
        <Check className="h-5 w-5" />
      </span>
    ),
    chosen: "border-green-600 bg-green-50",
  },
  {
    key: "partial",
    title: "Partial Approval",
    note: () => "Approve a different amount",
    mark: (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-blue-700">
        <PieChart className="h-8 w-8" />
      </span>
    ),
    chosen: "border-blue-600 bg-blue-50",
  },
  {
    key: "rejected",
    title: "Rejected",
    note: (subject) => "Decline the " + subject + " request",
    mark: (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
        <X className="h-5 w-5" />
      </span>
    ),
    chosen: "border-red-600 bg-red-50",
  },
];

/**
 * Management's answer to a request, as three cards to choose between.
 *
 * `subject` is what is being asked for ("assistance", "loan") so each card
 * says what it approves or declines. Only the office decides: where `disabled`
 * is set the cards show the decision and cannot change it.
 */
export function DecisionChoice({ subject, value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-primary">Management Decision</h2>
      <div
        role="radiogroup"
        aria-label="Management Decision"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        {DECISIONS.map((decision) => {
          const chosen = value === decision.key;
          return (
            <button
              key={decision.key}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={disabled}
              onClick={() => onChange(decision.key)}
              className={cn(
                "flex items-center gap-4 rounded-md border-2 bg-card px-5 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                chosen ? decision.chosen : "border-border hover:border-primary/30",
                disabled && !chosen && "opacity-70"
              )}
            >
              {decision.mark}
              <span className="min-w-0">
                <span className="block font-semibold text-primary">
                  {decision.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {decision.note(subject)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
