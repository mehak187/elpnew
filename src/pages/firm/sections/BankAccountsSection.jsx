import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Info } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import { accountBalance, invoices, money } from "../firmData";

const emptyAccount = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  openingBalance: "",
};

/**
 * Section 4 of the specification.
 *
 * The current balance is not a stored, editable number. It is the running total
 * of the transactions recorded against the account, which is what section 5
 * requires - a user cannot type a balance that the transaction history does not
 * support.
 */
export default function BankAccountsSection({ onNavigateSection }) {
  const firm = useFirm();
  const { bankAccounts, addBankAccount, setAccountActive } = firm;
  const ledgers = {
    payments: firm.payments,
    expenses: firm.expenses,
    transfers: firm.transfers,
    invoices,
  };

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyAccount);

  const handleSave = () => {
    addBankAccount({
      ...draft,
      openingBalance: Number(draft.openingBalance) || 0,
    });
    setDraft(emptyAccount);
    setAdding(false);
  };

  const totalBalance = bankAccounts.reduce(
    (sum, account) => sum + accountBalance(account, ledgers),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="text-muted-foreground">Total across accounts: </span>
          <span className="font-bold text-primary">{money(totalBalance)}</span>
        </p>
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Bank Account
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={draft.bankName}
                  onChange={(e) => setDraft({ ...draft, bankName: e.target.value })}
                  placeholder="e.g. Bank Muscat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={draft.accountName}
                  onChange={(e) => setDraft({ ...draft, accountName: e.target.value })}
                  placeholder="Enter account name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number / IBAN *</Label>
                <Input
                  id="accountNumber"
                  value={draft.accountNumber}
                  onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })}
                  placeholder="Enter account number or IBAN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  min="0"
                  value={draft.openingBalance}
                  onChange={(e) => setDraft({ ...draft, openingBalance: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                The opening balance is recorded as the first transaction. The
                current balance is then calculated from every transaction after
                it and cannot be edited by hand.
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!draft.bankName || !draft.accountName || !draft.accountNumber}
              >
                Save Bank Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="p-3 font-semibold">Bank Name</th>
                <th className="p-3 font-semibold">Account Name</th>
                <th className="p-3 font-semibold">Account Number / IBAN</th>
                <th className="p-3 text-right font-semibold">Opening Balance</th>
                <th className="p-3 text-right font-semibold">Current Balance</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {bankAccounts.map((account) => (
                <tr key={account.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{account.bankName}</td>
                  <td className="p-3 text-muted-foreground">{account.accountName}</td>
                  <td className="p-3 text-muted-foreground">{account.accountNumber}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {money(account.openingBalance)}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    <button
                      type="button"
                      onClick={() => onNavigateSection("transactions", { accountId: account.id })}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {money(accountBalance(account, ledgers))}
                    </button>
                  </td>
                  <td className="p-3">
                    <Badge variant={account.active ? "success" : "secondary"}>
                      {account.active ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAccountActive(account.id, !account.active)}
                    >
                      {account.active ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Select a current balance to open that account&apos;s transaction history.
      </p>
    </div>
  );
}
