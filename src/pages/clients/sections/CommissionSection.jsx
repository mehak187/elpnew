import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/panels";
import { clientInvoices, commissionPayments, commissionPayees } from "../clientMockData";
import { withRial } from "@/lib/money";

const moneyValue = (amount) =>
  Number(amount || 0).toLocaleString("en-GB", { maximumFractionDigits: 2 });

const money = (amount) => withRial(moneyValue(amount));

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

/**
 * What the client actually paid us between two dates.
 *
 * Commission is owed on money received, not money invoiced, so this counts the
 * paid portion of each invoice rather than its face value.
 */
function legalFeesBetween(from, to) {
  if (!from || !to) return 0;
  return clientInvoices
    .filter((invoice) => invoice.date >= from && invoice.date <= to)
    .reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0);
}

export default function CommissionSection() {
  const [hasCommission, setHasCommission] = useState("");
  const [percent, setPercent] = useState("");
  const [payableTo, setPayableTo] = useState(commissionPayees[0]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payments, setPayments] = useState(commissionPayments);

  const fees = legalFeesBetween(fromDate, toDate);
  const amount = (fees * (Number(percent) || 0)) / 100;

  const canRecord =
    hasCommission === "Yes" && fromDate && toDate && payableTo && amount > 0;

  const recordPayment = () => {
    setPayments((prev) => [
      {
        id: prev.reduce((max, p) => Math.max(max, p.id), 0) + 1,
        paidOn: new Date().toISOString().slice(0, 10),
        fromDate,
        toDate,
        payableTo,
        legalFees: fees,
        percent: Number(percent),
        amount,
      },
      ...prev,
    ]);
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="hasCommission">Is there a commission? *</Label>
          <Select value={hasCommission} onValueChange={setHasCommission}>
            <SelectTrigger id="hasCommission">
              <SelectValue placeholder="Please Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nothing below matters unless a commission is owed. */}
        {hasCommission === "Yes" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="commissionPercent">Commission Percentage *</Label>
              <div className="relative">
                <Input
                  id="commissionPercent"
                  type="text"
                  inputMode="decimal"
                  value={percent}
                  onChange={(e) =>
                    setPercent(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="0"
                  className="pr-8"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground"
                >
                  %
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payableTo">Payable To *</Label>
              <Select value={payableTo} onValueChange={setPayableTo}>
                <SelectTrigger id="payableTo">
                  <SelectValue placeholder="Please Select" />
                </SelectTrigger>
                <SelectContent>
                  {commissionPayees.map((payee) => (
                    <SelectItem key={payee} value={payee}>
                      {payee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionFrom">From Date *</Label>
              <Input
                id="commissionFrom"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionTo">To Date *</Label>
              <Input
                id="commissionTo"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            {/* Read from the client's paid invoices, never typed. */}
            <div className="space-y-2">
              <Label htmlFor="legalFees">
                Total Legal Fees Received in Period
              </Label>
              <Input
                id="legalFees"
                value={fromDate && toDate ? moneyValue(fees) : ""}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionAmount">Commission Applied</Label>
              <Input
                id="commissionAmount"
                value={fromDate && toDate ? moneyValue(amount) : ""}
                readOnly
                disabled
                className="bg-muted font-bold text-primary"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={recordPayment}
                disabled={!canRecord}
                className="w-full"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Commissions already paid */}
      {hasCommission === "Yes" && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-semibold">Paid On</th>
                  <th className="p-3 font-semibold">Period</th>
                  <th className="p-3 font-semibold">Payable To</th>
                  <th className="p-3 text-right font-semibold">Legal Fees</th>
                  <th className="p-3 text-right font-semibold">Rate</th>
                  <th className="p-3 text-right font-semibold">Commission Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6">
                      <EmptyState>No commission has been paid yet.</EmptyState>
                    </td>
                  </tr>
                )}
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground">
                      {formatDate(payment.paidOn)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(payment.fromDate)} &ndash;{" "}
                      {formatDate(payment.toDate)}
                    </td>
                    <td className="p-3 font-medium">{payment.payableTo}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {money(payment.legalFees)}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {payment.percent}%
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {money(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
