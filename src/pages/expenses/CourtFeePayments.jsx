import { Card, CardContent } from "@/components/ui/card";
import { Landmark } from "lucide-react";
import { EmptyState } from "@/components/shared/panels";
import { courtFeeRequests, money } from "./expenseData";

/**
 * Court fee payment requests.
 *
 * A court fee is raised against a case file rather than a supplier invoice, so
 * the table that lists these is designed together with the case file it hangs
 * off. Until then this page carries the total the firm is committed to, and
 * says plainly what is still to come.
 */
export default function CourtFeePayments() {
  const total = courtFeeRequests.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary p-2 sm:p-3">
          <Landmark className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">
            Court Fee Payment
          </h1>
          <p className="text-xs text-primary/75 sm:text-sm">
            Fees raised against a case file
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Court Fee Payment Requests
            </p>
            <p className="text-lg font-bold text-primary">
              {courtFeeRequests.length}
            </p>
          </div>
          <p className="mt-1 text-lg font-semibold">{money(total)}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <EmptyState>
            These requests are attached to their case files, so the table is
            designed with the case file it belongs to.
          </EmptyState>
        </CardContent>
      </Card>
    </div>
  );
}
