import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import AiSearch from "@/components/shared/AiSearch";
import FormHeading from "@/components/shared/FormHeading";
import { Check, FileSpreadsheet, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";
import {
  useCirculars,
  circularsFor,
  acknowledgementBy,
  groupOf,
  ACTIVE,
  STATUS_LABEL,
  STATUS_TONE,
  formatDate,
} from "@/lib/circulars/context";

/**
 * The circulars this one employee is addressed by.
 *
 * Only their own acknowledgement is shown. How many other people have read a
 * circular, and which of them have not, is the firm's business and not a
 * colleague's - so the count and the details that appear on the Company
 * Profile page are deliberately absent here.
 */
export default function EmployeeCircularsSection({ employee }) {
  const { circulars, acknowledge } = useCirculars();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const group = groupOf(employee);
  const mine = circularsFor(circulars, group);

  const search = query.trim().toLowerCase();
  const listed = mine.filter((c) =>
    !search
      ? true
      : [c.circularNo, c.content, c.targetGroup, c.issuedBy]
          .join(" ")
          .toLowerCase()
          .includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(listed.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const shown = listed.slice(start, start + pageSize);

  // Only this employee's own acknowledgement goes into the file, for the same
  // reason only theirs is on screen.
  const ownAcknowledgement = (circular) => {
    const ack = acknowledgementBy(circular, employee.name);
    return ack ? "Acknowledged " + ack.at : "Not acknowledged";
  };

  const exportCirculars = () =>
    downloadCsv(
      toCsv(
        [
          { key: "circularNo", header: "Circular No." },
          { key: "content", header: "Subject / Content" },
          { key: "date", header: "Date", exportValue: (r) => formatDate(r.date) },
          { key: "targetGroup", header: "Target Group" },
          { key: "issuedBy", header: "Issued By" },
          {
            key: "acknowledgement",
            header: "Acknowledgement",
            exportValue: ownAcknowledgement,
          },
          {
            key: "status",
            header: "Status",
            exportValue: (r) => STATUS_LABEL[r.status],
          },
        ],
        listed
      ),
      "my-circulars.csv"
    );

  return (
    <div className="space-y-4">
      <FormHeading title="Circulars" icon={Megaphone} />

      {/* The same toolbar every table in the system has: search on the left,
          page size and export on the right - kept inside the page's own width
          so neither is pushed past its edge. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AiSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Ask about circulars..."
        />

        <div className="hidden flex-1 sm:block" />

        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-20" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Export to CSV"
            onClick={exportCirculars}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="sr-only">Export to CSV</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {listed.length === 0 ? (
            <div className="p-6">
              <EmptyState>
                {mine.length === 0
                  ? "No circulars have been addressed to this employee."
                  : "No circulars match that search."}
              </EmptyState>
            </div>
          ) : (
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-semibold" style={{ width: "12%" }}>
                    Circular No.
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "20%" }}>
                    Subject / Content
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "11%" }}>
                    Date
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "13%" }}>
                    Target Group
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "14%" }}>
                    Issued By
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "18%" }}>
                    Acknowledgement
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "12%" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((circular) => {
                  const mineAck = acknowledgementBy(circular, employee.name);
                  return (
                    <tr
                      key={circular.id}
                      className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                    >
                      <td className="whitespace-nowrap p-3 font-semibold text-primary">
                        {circular.circularNo}
                      </td>
                      <td className="p-3">{circular.content}</td>
                      <td className="whitespace-nowrap p-3">
                        {formatDate(circular.date)}
                      </td>
                      <td className="p-3">{circular.targetGroup}</td>
                      <td className="p-3">{circular.issuedBy}</td>
                      {/* Their own acknowledgement, and nobody else's */}
                      <td className="p-3">
                        {mineAck ? (
                          <span className="flex items-start gap-1.5 text-green-700">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                              <span className="block font-medium">
                                Acknowledged
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {mineAck.at}
                              </span>
                            </span>
                          </span>
                        ) : circular.status === ACTIVE ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              acknowledge(circular.id, employee.name)
                            }
                          >
                            I Acknowledge
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">
                            Not acknowledged
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_TONE[circular.status]
                          )}
                        >
                          {STATUS_LABEL[circular.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {listed.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Showing {start + 1} to {Math.min(start + pageSize, listed.length)}{" "}
            of {listed.length} entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                type="button"
                variant={n === currentPage ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
