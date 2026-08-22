import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { changePercent } from "@/lib/metrics";

/**
 * Priority indicator. The dot is never the only signal - a label always sits
 * beside it, so the meaning survives colour blindness and greyscale printing.
 */
const PRIORITY_TONE = {
  High: "bg-red-500",
  Urgent: "bg-red-500",
  Overdue: "bg-red-500",
  Medium: "bg-amber-500",
  Soon: "bg-amber-500",
  Completed: "bg-green-600",
  Normal: "bg-green-600",
  Information: "bg-blue-500",
};

export function PriorityDot({ level, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          PRIORITY_TONE[level] || "bg-muted-foreground"
        )}
      />
      <span className="text-muted-foreground">{label || level}</span>
    </span>
  );
}

/** Section wrapper: title, optional icon, optional action on the right. */
export function SectionCard({ title, icon: Icon, action, children, className }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">{children}</CardContent>
    </Card>
  );
}

/** Top summary card: value, month-on-month movement, and a destination. */
export function StatCard({ label, value, previous, to, icon: Icon, format }) {
  const navigate = useNavigate();
  const change =
    previous === undefined ? null : changePercent(rawValue(value), previous);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => to && navigate(to)}
      onKeyDown={(e) => {
        if (to && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          navigate(to);
        }
      }}
      className="transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <CardContent className="h-full p-4">
        <div className="flex h-full items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs leading-snug text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold">
              {format ? format(rawValue(value)) : value}
            </p>
            {change && <ChangeNote change={change} />}
          </div>
          {Icon && (
            <div className="rounded-xl bg-secondary p-2.5 text-secondary-foreground">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const rawValue = (value) =>
  typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));

function ChangeNote({ change }) {
  if (change.isNew) {
    return <p className="mt-1 text-xs text-blue-600">New flow</p>;
  }
  if (change.value === null || change.value === 0) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        No change vs last month
      </p>
    );
  }
  const up = change.value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-xs",
        up ? "text-green-600" : "text-red-600"
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(change.value)}% vs last month
    </p>
  );
}

/** A clickable row inside a section. */
export function Row({ to, onClick, children, className }) {
  const navigate = useNavigate();
  const go = onClick || (to ? () => navigate(to) : undefined);

  return (
    <button
      type="button"
      onClick={go}
      disabled={!go}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-left transition-colors",
        "[&>*:first-child]:min-w-0 [&>*:first-child]:flex-1",
        go && "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
    >
      {children}
      {go && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );
}

/** Small labelled count used inside compact grids. */
export function Tile({ label, value, to, onClick, tone }) {
  const navigate = useNavigate();
  const TONE = {
    high: "text-red-600",
    warning: "text-amber-600",
    good: "text-green-600",
    info: "text-blue-600",
  };
  const go = onClick || (to ? () => navigate(to) : undefined);

  return (
    <button
      type="button"
      onClick={go}
      disabled={!go}
      className={cn(
        "flex h-full flex-col justify-between rounded-lg border p-3 text-left transition-colors",
        go && "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
      )}
    >
      <p className="text-xs leading-snug text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-lg font-bold", TONE[tone] || "text-primary")}>
        {value}
      </p>
    </button>
  );
}

export function EmptyState({ children }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}

/**
 * A status as plain text with a coloured dot, rather than a filled badge.
 *
 * Green when the record is in its healthy state, red otherwise - the client
 * asked for exactly two signals, not one per status value.
 */
export function StatusDot({ status, isGood }) {
  if (!status) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {status}
      <span
        aria-hidden="true"
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          isGood ? "bg-green-500" : "bg-red-500"
        )}
      />
    </span>
  );
}
