import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator } from "lucide-react";
import { withRial } from "@/lib/money";
import { clientRecords } from "../clientRecords";
import { clientInvoices } from "../clientMockData";

const moneyValue = (amount) =>
  Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const money = (amount) => withRial(moneyValue(amount));

/**
 * The legal fees this client settled between two dates.
 *
 * Commission is owed on fees, not on tax, so the VAT on each invoice is left
 * out - an invoice of 1,050 made of 1,000 fees and 50 VAT earns commission on
 * the 1,000. Only invoices actually paid count, and they count on the day the
 * money arrived rather than the day the invoice was raised, because that is the
 * period the person is asking about.
 */
function legalFeesPaid(clientNo, from, to) {
  if (!clientNo || !from || !to) return 0;
  return clientInvoices
    .filter(
      (invoice) =>
        invoice.clientNo === clientNo &&
        invoice.status === "Paid" &&
        invoice.paidDate >= from &&
        invoice.paidDate <= to
    )
    .reduce((sum, invoice) => sum + Number(invoice.legalFees || 0), 0);
}

/**
 * A calculator, and only a calculator.
 *
 * Someone inside a client's legal department refers work to the firm for a cut
 * of the fees it brings in. When they ask what last month came to, this answers
 * it. Nothing is written down here - the answer is worked out and read off.
 */
export default function CommissionSection({ clientNo }) {
  const [company, setCompany] = useState(clientNo || "");
  const [percent, setPercent] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const rate = Number(percent) || 0;
  const fees = legalFeesPaid(company, fromDate, toDate);
  const commission = (fees * rate) / 100;

  const ready = company && rate > 0 && fromDate && toDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-secondary p-2">
          <Calculator className="h-4 w-4 text-secondary-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-primary">Commission Calculator</h2>
          <p className="text-xs text-muted-foreground">
            Worked out on paid legal fees, before VAT
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="commissionCompany">Company (Client) *</Label>
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger id="commissionCompany">
              <SelectValue placeholder="Please Select" />
            </SelectTrigger>
            <SelectContent>
              {clientRecords.map((client) => (
                <SelectItem key={client.clientNo} value={client.clientNo}>
                  {client.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="commissionPercent">Commission Percentage *</Label>
          <div className="relative">
            <Input
              id="commissionPercent"
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value.replace(/[^\d.]/g, ""))}
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
      </div>

      {/* One figure, which is the whole point of the page */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Commission Due
          </p>
          <p className="mt-2 text-4xl font-bold text-primary">
            {ready ? money(commission) : "-"}
          </p>
          {ready && (
            <p className="mt-3 text-sm text-muted-foreground">
              {rate}% of {money(fees)} in legal fees paid between{" "}
              {fromDate} and {toDate}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
