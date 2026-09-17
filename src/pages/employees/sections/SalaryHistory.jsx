import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import AiSearch from "@/components/shared/AiSearch";
import { EmptyState } from "@/components/shared/panels";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { cn } from "@/lib/utils";
import { money, amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import {
  SALARY_STATUS_TONE,
  salaryHistory,
  salaryHistoryRows,
  salaryPeriod,
} from "../payrollData";

/** One figure of the summary: what it is, then how much it was. */
function Part({ label, value }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground">{label}</span>{" "}
      <span className="font-medium text-primary">{value}</span>
    </span>
  );
}

/**
 * What has been paid, month by month.
 *
 * One row to a salary: what the month came to, what was transferred, and how.
 * The net is not stored - it is the three figures beside it, and a stored total
 * could disagree with them.
 */
export default function SalaryHistory({
  history = salaryHistory,
  // The salary breakdown above this list is opened from here, beside the
  // search - the row that used to hold the month and the year.
  detailsOpen = false,
  onToggleDetails = null,
}) {
  const [query, setQuery] = useState("");

  // Newest first, and each row carrying the period it is for so the search
  // finds "September 2026" the way the table writes it.
  const rows = salaryHistoryRows(history).map((row) => ({
    ...row,
    period: salaryPeriod(row),
  }));

  const shown = smartSearch(rows, query);

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* The search on the left, where every list in the system has it, and
            the name of what is being searched on the right. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AiSearch
            value={query}
            onChange={setQuery}
            placeholder="Ask about salaries..."
          />

          {/* The section above already names this list, so the row's other
              end carries what acts on it instead of saying so twice. The
              words say what a click will do, and to what. */}
          {onToggleDetails && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              aria-expanded={detailsOpen}
              aria-controls="salary-details"
              onClick={onToggleDetails}
            >
              {detailsOpen ? (
                <EyeOff className="mr-1.5 h-4 w-4" />
              ) : (
                <Eye className="mr-1.5 h-4 w-4" />
              )}
              {detailsOpen ? "Hide Salary Details" : "View Salary Details"}
            </Button>
          )}
        </div>

        {shown.length === 0 ? (
          <EmptyState>No salary matches that search.</EmptyState>
        ) : (
          <RecordTable minWidth={1040}>
            <HeadRow>
              <Th width="10%">Salary No.</Th>
              <Th width="14%">Salary Period</Th>
              <Th width="32%">Salary Summary</Th>
              <Th width="14%">Net Salary</Th>
              <Th width="18%">Transfer Details</Th>
              <Th width="12%">Status</Th>
            </HeadRow>
            <tbody>
              {shown.map((row) => (
                <Row key={row.id}>
                  <Td className="whitespace-nowrap font-bold text-primary">
                    {row.salaryNo}
                  </Td>

                  <Td className="whitespace-nowrap">{row.period}</Td>

                  {/* What the month was made of, read left to right: the pay,
                      what was added to it, and what came off. */}
                  <Td>
                    <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                      {/* Three figures in one cell: the currency is said once,
                          on the net beside them. */}
                      <Part label="Basic" value={amountValue(row.basic)} />
                      <span className="text-muted-foreground">/</span>
                      <Part label="Allowances" value={amountValue(row.allowances)} />
                      <span className="text-muted-foreground">/</span>
                      <Part label="Deductions" value={amountValue(row.deductions)} />
                    </span>
                  </Td>

                  {/* What actually reached the account, which is what the row
                      is for. */}
                  <Td className="whitespace-nowrap font-bold text-green-700">
                    {money(row.net)}
                  </Td>

                  <Td>
                    {row.method}
                    {row.reference && (
                      <>
                        <span className="px-1.5 text-muted-foreground">/</span>
                        {row.reference}
                      </>
                    )}
                  </Td>

                  <Td className="text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        SALARY_STATUS_TONE[row.status] ||
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                      />
                      {row.status}
                    </span>
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
