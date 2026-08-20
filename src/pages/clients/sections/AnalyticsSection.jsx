import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BarTrendChart from "@/components/shared/BarTrendChart";
import { clientCaseActivity, clientActivitySummary } from "../clientMockData";

const MONTH_LABEL = (month) => {
  const [year, m] = month.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[Number(m) - 1] + " " + year.slice(2);
};

const FIRST_MONTH = clientCaseActivity[0].month + "-01";
const LAST_MONTH = clientCaseActivity[clientCaseActivity.length - 1].month + "-28";

function Metric({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsSection() {
  const [fromDate, setFromDate] = useState(FIRST_MONTH);
  const [toDate, setToDate] = useState(LAST_MONTH);

  const rows = useMemo(
    () =>
      clientCaseActivity.filter(
        (row) => row.month >= fromDate.slice(0, 7) && row.month <= toDate.slice(0, 7)
      ),
    [fromDate, toDate]
  );

  // Lifetime figures, independent of the date filter.
  const totalReceived = clientCaseActivity.reduce((sum, r) => sum + r.received, 0);
  const totalClosed = clientCaseActivity.reduce((sum, r) => sum + r.closed, 0);
  const openCases = totalReceived - totalClosed;

  const receivedInPeriod = rows.reduce((sum, r) => sum + r.received, 0);
  const closedInPeriod = rows.reduce((sum, r) => sum + r.closed, 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Based on cases and transactions only. Invoices and payment status are
        deliberately excluded.
      </p>

      {/* Lifetime activity */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric
          label="Last Case Received"
          value={new Date(clientActivitySummary.lastCaseReceived).toLocaleDateString("en-GB")}
        />
        <Metric label="Total Cases Received" value={totalReceived} />
        <Metric label="Open Cases" value={openCases} />
        <Metric label="Closed Cases" value={totalClosed} />
        <Metric label="Cases in Progress" value={clientActivitySummary.casesInProgress} />
      </div>

      {/* Period filter */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Cases Received in Period" value={receivedInPeriod} />
            <Metric label="Cases Closed in Period" value={closedInPeriod} />
            <Metric label="Open Cases" value={openCases} />
            <Metric label="Total Cases in Period" value={receivedInPeriod + closedInPeriod} />
          </div>
        </CardContent>
      </Card>

      {/* Trend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-primary">
            Cases Received Over Time
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Cases received per month across the selected period.
          </p>
          <BarTrendChart
            rows={rows.map((r) => ({ label: MONTH_LABEL(r.month), value: r.received }))}
            unit="case"
          />
        </CardContent>
      </Card>
    </div>
  );
}
