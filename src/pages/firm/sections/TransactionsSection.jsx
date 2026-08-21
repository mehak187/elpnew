import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirm } from "@/lib/firm/context";
import {
  accountTransactions,
  invoices,
  clients,
  cases,
  money,
  formatDate,
  dayOffset,
} from "../firmData";

const TYPE_VARIANT = {
  Opening: "secondary",
  Income: "success",
  Expense: "destructive",
  Payment: "destructive",
  "Transfer In": "success",
  "Transfer Out": "warning",
};

// An outgoing payment and an office expense both leave the account, so they
// are recorded the same way and only differ by the kind stamped on the row.
const RECORD_MODES = [
  { key: "income", label: "Income", icon: ArrowDownLeft },
  { key: "expense", label: "Expense", icon: ArrowUpRight },
  { key: "payment", label: "Payment", icon: Banknote },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight },
];

const OUTGOING = { expense: "Expense", payment: "Payment" };

/**
 * Sections 5, 6 and 7 of the specification.
 *
 * Recording money moves the balance; the balance is never edited directly.
 * Income is captured against an invoice, which is what ties the payment to its
 * client and case, and a transfer writes one row out of one account and one row
 * into the other so both histories stay complete.
 */
export default function TransactionsSection({ initialAccountId, canRecord }) {
  const firm = useFirm();
  const { bankAccounts, payments, expenses, transfers, addPayment, addExpense, addTransfer } = firm;

  const [accountId, setAccountId] = useState(
    String(initialAccountId || bankAccounts[0]?.id || "")
  );
  const [mode, setMode] = useState("income");

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(dayOffset(0));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [toAccountId, setToAccountId] = useState("");

  const account = bankAccounts.find((a) => String(a.id) === accountId);
  const ledgers = { payments, expenses, transfers, invoices };

  const rows = useMemo(
    () => (account ? accountTransactions(account, ledgers).reverse() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account, payments, expenses, transfers]
  );

  // Section 6: the chosen invoice is what links a payment to its client and case.
  const selectedInvoice = invoices.find((i) => String(i.id) === invoiceId);
  const invoiceClient = selectedInvoice
    ? clients.find((c) => c.id === selectedInvoice.clientId)
    : null;
  const invoiceCase = selectedInvoice
    ? cases.find((c) => c.id === selectedInvoice.caseId)
    : null;

  const reset = () => {
    setInvoiceId("");
    setAmount("");
    setDescription("");
    setReference("");
    setToAccountId("");
    setDate(dayOffset(0));
  };

  const canSubmit =
    Number(amount) > 0 &&
    (mode === "income"
      ? Boolean(invoiceId)
      : OUTGOING[mode]
      ? Boolean(description)
      : Boolean(toAccountId) && toAccountId !== accountId);

  const handleRecord = () => {
    const value = Number(amount);
    if (mode === "income") {
      addPayment({
        invoiceId: Number(invoiceId),
        amount: value,
        date,
        bankAccountId: Number(accountId),
      });
    } else if (OUTGOING[mode]) {
      addExpense({
        description,
        reference,
        amount: value,
        date,
        bankAccountId: Number(accountId),
        kind: OUTGOING[mode],
      });
    } else {
      addTransfer({
        fromAccountId: Number(accountId),
        toAccountId: Number(toAccountId),
        amount: value,
        date,
        reference,
        description: description || "Account transfer",
      });
    }
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Account selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="txAccount">Bank Account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id="txAccount" className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.bankName} &ndash; {a.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {account && (
          <p className="text-sm">
            <span className="text-muted-foreground">Current balance: </span>
            <span className="text-lg font-bold text-primary">
              {money(rows[0] ? rows[0].balance : account.openingBalance)}
            </span>
          </p>
        )}
      </div>

      {/* Record a transaction */}
      {canRecord ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              {RECORD_MODES.map((option) => (
                <Button
                  key={option.key}
                  variant={mode === option.key ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMode(option.key);
                    reset();
                  }}
                >
                  <option.icon className="mr-1.5 h-4 w-4" />
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mode === "income" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="txInvoice">Invoice *</Label>
                  <Select value={invoiceId} onValueChange={setInvoiceId}>
                    <SelectTrigger id="txInvoice">
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={String(invoice.id)}>
                          {invoice.invoiceNo} &ndash; {money(invoice.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedInvoice && (
                    <p className="text-xs text-muted-foreground">
                      Links to {invoiceClient ? invoiceClient.name : "client"}
                      {invoiceCase ? " · case " + invoiceCase.caseNo : ""}
                    </p>
                  )}
                </div>
              )}

              {OUTGOING[mode] && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="txDescription">Description *</Label>
                    <Input
                      id="txDescription"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={
                        mode === "payment"
                          ? "e.g. Court fee paid on behalf of client"
                          : "e.g. Office Expense"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="txReference">Reference</Label>
                    <Input
                      id="txReference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={mode === "payment" ? "e.g. PAY-001" : "e.g. EXP-005"}
                    />
                  </div>
                </>
              )}

              {mode === "transfer" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="txTo">Transfer To *</Label>
                    <Select value={toAccountId} onValueChange={setToAccountId}>
                      <SelectTrigger id="txTo">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts
                          .filter((a) => String(a.id) !== accountId)
                          .map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.bankName} &ndash; {a.accountName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="txTrfRef">Reference</Label>
                    <Input
                      id="txTrfRef"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. TRF-002"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="txAmount">Amount (OMR) *</Label>
                <Input
                  id="txAmount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txDate">Date *</Label>
                <Input
                  id="txDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleRecord} disabled={!canSubmit}>
                Record {RECORD_MODES.find((m) => m.key === mode).label}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Your role can view the transaction history but not record entries or
            change balances.
          </span>
        </div>
      )}

      {/* Transaction history */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Description</th>
                <th className="p-3 font-semibold">Reference</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 text-right font-semibold">Amount</th>
                <th className="p-3 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No transactions recorded for this account.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3 text-muted-foreground">{formatDate(row.date)}</td>
                  <td className="p-3 font-medium">{row.description}</td>
                  <td className="p-3 text-muted-foreground">{row.reference || "—"}</td>
                  <td className="p-3">
                    <Badge variant={TYPE_VARIANT[row.type]}>{row.type}</Badge>
                  </td>
                  <td
                    className={cn(
                      "p-3 text-right font-medium",
                      row.type === "Opening"
                        ? "text-muted-foreground"
                        : row.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {row.type === "Opening"
                      ? money(row.amount)
                      : (row.amount >= 0 ? "+" : "-") + money(Math.abs(row.amount))}
                  </td>
                  <td className="p-3 text-right font-semibold">{money(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
