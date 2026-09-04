import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const group = groupOf(employee);
  const mine = circularsFor(circulars, group);

  return (
    <div className="space-y-4">
      <p className="font-semibold text-primary">Circulars</p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {mine.length === 0 ? (
            <div className="p-6">
              <EmptyState>
                No circulars have been addressed to this employee.
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
                {mine.map((circular) => {
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
                            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
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
    </div>
  );
}
