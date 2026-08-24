import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BarTrendChart from "@/components/shared/BarTrendChart";
import {
  clientCases,
  liveCases,
  deletedCases,
  CASE_TYPES,
  CASE_STAGES,
  CASE_LEVELS,
  levelOf,
  isOpen,
  isInProgress,
  claimTotal,
  receivedBetween,
  countBy,
  receivedPeriods,
} from "../clientCases";
import { withRial } from "@/lib/money";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : "-";

const MONTH_LABEL = (month) => {
  const [year, m] = month.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[Number(m) - 1] + " " + year.slice(2);
};

const money = (amount) =>
  withRial(Number(amount || 0).toLocaleString("en-GB"));

/**
 * A figure, and underneath it what those files claim between them.
 *
 * A count on its own says how busy the client is; the claim total says how much
 * is riding on it, which is the figure anyone reading this page is after.
 */
function Metric({ label, value, amount }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <p className="text-xs leading-snug text-muted-foreground">{label}</p>
        <div className="mt-2">
          <p className="text-lg font-bold text-primary">{value}</p>
          {amount !== undefined && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {money(amount)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** A row of counts, one per key, laid out as small tiles. */
function Breakdown({ title, counts }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(counts).map(([key, count]) => (
          <div key={key} className="rounded-lg border p-3">
            <p className="text-xs leading-snug text-muted-foreground">{key}</p>
            <p className="mt-1 text-lg font-bold text-primary">{count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const EARLIEST = clientCases.reduce(
  (min, k) => (k.receivedAt < min ? k.receivedAt : min),
  clientCases[0].receivedAt
);
const LATEST = liveCases.reduce(
  (max, k) => (k.receivedAt > max ? k.receivedAt : max),
  liveCases[0].receivedAt
);

export default function AnalyticsSection() {
  const [fromDate, setFromDate] = useState(EARLIEST);
  const [toDate, setToDate] = useState(LATEST);

  /* Lifetime, counted from the live cases only */
  const open = liveCases.filter(isOpen);
  const closed = liveCases.filter((k) => !isOpen(k));
  const totalReceived = liveCases.length;
  const inProgress = liveCases.filter(isInProgress).length;
  const lastReceived = LATEST;

  const typeCounts = countBy(liveCases, CASE_TYPES, (k) => k.type);
  const stageCounts = countBy(open, CASE_STAGES, (k) => k.stage);
  const levelCounts = countBy(open, CASE_LEVELS, levelOf);

  /* Selected period. Left unmemoised on purpose - the compiler does it, and
     doing it by hand here stopped it from optimising the component at all. */
  const inPeriod = receivedBetween(liveCases, fromDate, toDate);
  const closedInPeriod = liveCases.filter(
    (k) => k.closedAt && k.closedAt >= fromDate && k.closedAt <= toDate
  ).length;
  const periodTypeCounts = countBy(inPeriod, CASE_TYPES, (k) => k.type);

  /* Cases received per period, for the cards */
  const periods = receivedPeriods().map((period) => ({
    ...period,
    count: receivedBetween(liveCases, period.from, period.to).length,
  }));

  /* Chart: cases received per month across the selected range */
  const months = {};
  for (const legalCase of inPeriod) {
    const month = legalCase.receivedAt.slice(0, 7);
    months[month] = (months[month] || 0) + 1;
  }
  const trend = Object.keys(months)
    .sort()
    .map((month) => ({ label: MONTH_LABEL(month), value: months[month] }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Based on cases and transactions only. Invoices and payment status are
        deliberately excluded.
      </p>

      {/* Lifetime activity, each figure with what those files claim */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          label="Total Cases Received"
          value={totalReceived}
          amount={claimTotal(liveCases)}
        />
        <Metric
          label="Open Cases"
          value={open.length}
          amount={claimTotal(open)}
        />
        <Metric
          label="Closed Cases"
          value={closed.length}
          amount={claimTotal(closed)}
        />
        <Metric
          label="Cases in Progress"
          value={inProgress}
          amount={claimTotal(liveCases.filter(isInProgress))}
        />
        {/* Struck off, so counted apart from everything above */}
        <Metric
          label="Deleted from the System"
          value={deletedCases.length}
          amount={claimTotal(deletedCases)}
        />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Breakdown title="Cases by Type" counts={typeCounts} />
        </CardContent>
      </Card>

      {/* Period filter */}
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="activityFrom">From</Label>
              <Input
                id="activityFrom"
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activityTo">To</Label>
              <Input
                id="activityTo"
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric
              label="Cases Received in Period"
              value={inPeriod.length}
              amount={claimTotal(inPeriod)}
            />
            <Metric label="Cases Closed in Period" value={closedInPeriod} />
            <Metric
              label="Open Cases"
              value={open.length}
              amount={claimTotal(open)}
            />
            <Metric
              label="Total Cases in Period"
              value={inPeriod.length + closedInPeriod}
            />
          </div>

          <Breakdown title="Cases by Type in Period" counts={periodTypeCounts} />
        </CardContent>
      </Card>

      {/* Which court the open cases stand before, and where within it */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <Breakdown title="Case Level" counts={levelCounts} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Breakdown title="Case Stage" counts={stageCounts} />
        </CardContent>
      </Card>

      {/* Cases received, period by period - with the latest one alongside,
          since the two are read together */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              Cases Received
            </p>
            <p className="text-xs text-muted-foreground">
              Last case received{" "}
              <span className="font-semibold text-primary">
                {formatDate(lastReceived)}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {periods.map((period) => (
              <div key={period.label} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{period.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(period.from)} &ndash; {formatDate(period.to)}
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {period.count}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-primary">
            Cases Received Over Time
          </h3>
          <BarTrendChart rows={trend} unit="case" />
        </CardContent>
      </Card>
    </div>
  );
}
