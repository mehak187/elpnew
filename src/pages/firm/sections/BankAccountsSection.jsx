import { useState } from "react";
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
import { Info, Paperclip, FileCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/panels";
import { cn } from "@/lib/utils";
import { RECEIVING_BANKS } from "@/lib/constants";
import { useFirm } from "@/lib/firm/context";
import {
  accountBalance,
  branchLabel,
  maskAccountNumber,
  formatDate,
  invoices,
  money,
} from "../firmData";

const ALL_BRANCHES = "all";

const emptyAccount = {
  bankName: "",
  bankBranch: "",
  accountNumber: "",
  iban: "",
  openingBalance: "",
  active: true,
  branch: ALL_BRANCHES,
};

const emptyTransfer = {
  fromAccountId: "",
  toAccountId: "",
  date: "",
  amount: "",
  reference: "",
};

/** How an account is named wherever it has to be picked from a list. */
const accountLabel = (account, branches) =>
  account.accountNumber + " - " + branchLabel(branches, account.branchId);

/** The two things this section does, one at a time. */
const TABS = [
  { key: "add", label: "Add Bank Account" },
  { key: "transfer", label: "Transfer Between Accounts" },
];

/**
 * The company's bank accounts, and money moved between them.
 *
 * A balance is never a stored, editable number - it is the running total of
 * everything recorded against the account, so nobody can type a balance the
 * transaction history does not support.
 */
export default function BankAccountsSection({ onNavigateSection, canEdit }) {
  const firm = useFirm();
  const {
    bankAccounts,
    branches,
    transfers,
    addBankAccount,
    addTransfer,
    setAccountActive,
  } = firm;

  const ledgers = {
    payments: firm.payments,
    expenses: firm.expenses,
    transfers: firm.transfers,
    invoices,
  };

  const [tab, setTab] = useState("add");
  const [draft, setDraft] = useState(emptyAccount);
  const [transfer, setTransfer] = useState(emptyTransfer);
  const [receipt, setReceipt] = useState(null);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setMove = (name, value) =>
    setTransfer((prev) => ({ ...prev, [name]: value }));

  const balanceOf = (account) => accountBalance(account, ledgers);
  const accountById = (id) => bankAccounts.find((a) => a.id === Number(id));

  /** How an account reads inside a transfer row. */
  const accountLine = (account) =>
    account
      ? account.bankName + " (" + branchLabel(branches, account.branchId) + ")"
      : "-";

  const totalBalance = bankAccounts.reduce(
    (sum, account) => sum + balanceOf(account),
    0
  );

  const canSaveAccount = canEdit && draft.bankName && draft.accountNumber.trim();

  const saveAccount = () => {
    if (!canSaveAccount) return;
    addBankAccount({
      bankName: draft.bankName,
      bankBranch: draft.bankBranch,
      accountNumber: draft.accountNumber,
      iban: draft.iban,
      branchId: draft.branch === ALL_BRANCHES ? null : Number(draft.branch),
      openingBalance: Number(draft.openingBalance) || 0,
      active: draft.active,
    });
    setDraft(emptyAccount);
  };

  // Money cannot be moved to the account it came from, and there has to be
  // some of it.
  const canTransfer =
    canEdit &&
    transfer.fromAccountId &&
    transfer.toAccountId &&
    transfer.fromAccountId !== transfer.toAccountId &&
    transfer.date &&
    Number(transfer.amount) > 0;

  const saveTransfer = () => {
    if (!canTransfer) return;
    addTransfer({
      fromAccountId: Number(transfer.fromAccountId),
      toAccountId: Number(transfer.toAccountId),
      amount: Number(transfer.amount),
      date: transfer.date,
      reference: transfer.reference,
      description: "Internal transfer",
      receipt: receipt?.name || "",
    });
    setTransfer(emptyTransfer);
    setReceipt(null);
  };

  return (
    <div className="space-y-6">
      {/* Total first, then what each account holds */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-semibold text-foreground">Total Balances</p>
          <p className="mt-1 text-lg font-bold text-primary">
            {money(totalBalance)}
          </p>
        </div>
        {bankAccounts.map((account) => (
          <div key={account.id} className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold text-foreground">
              {account.bankName}
            </p>
            <p className="mt-1 text-lg font-bold text-primary">
              {money(balanceOf(account))}
            </p>
          </div>
        ))}
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Balances update automatically from invoices, receipts, expenses and
        internal transfers.
      </p>

      {canEdit && (
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <p className="font-semibold text-primary">Account Management</p>

            {/* One job at a time: opening an account, or moving money */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
              {TABS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTab(option.key)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    tab === option.key
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {tab === "add" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Select
                      value={draft.bankName}
                      onValueChange={(value) => set("bankName", value)}
                    >
                      <SelectTrigger id="bankName">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECEIVING_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankBranch">Bank Branch</Label>
                    <Input
                      id="bankBranch"
                      value={draft.bankBranch}
                      onChange={(e) => set("bankBranch", e.target.value)}
                      placeholder="Enter bank branch"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={draft.accountNumber}
                      onChange={(e) => set("accountNumber", e.target.value)}
                      placeholder="Enter account number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={draft.iban}
                      onChange={(e) => set("iban", e.target.value)}
                      placeholder="Enter IBAN"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openingBalance">Opening Balance</Label>
                    <Input
                      id="openingBalance"
                      type="number"
                      min="0"
                      value={draft.openingBalance}
                      onChange={(e) => set("openingBalance", e.target.value)}
                      placeholder="Enter opening balance"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountStatus">Account Status</Label>
                    <Select
                      value={draft.active ? "Active" : "Inactive"}
                      onValueChange={(value) => set("active", value === "Active")}
                    >
                      <SelectTrigger id="accountStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* An account either serves the whole company or one office */}
                  <div className="space-y-2">
                    <Label htmlFor="accountBranch">
                      Account Belongs to Branch
                    </Label>
                    <Select
                      value={draft.branch}
                      onValueChange={(value) => set("branch", value)}
                    >
                      <SelectTrigger id="accountBranch">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_BRANCHES}>
                          All Branches
                        </SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveAccount} disabled={!canSaveAccount}>
                    Save Bank Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="transferFrom">Transfer From</Label>
                    <Select
                      value={transfer.fromAccountId}
                      onValueChange={(value) => setMove("fromAccountId", value)}
                    >
                      <SelectTrigger id="transferFrom">
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {accountLabel(account, branches)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Account Number &ndash; Office Branch
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transferTo">Transfer To</Label>
                    <Select
                      value={transfer.toAccountId}
                      onValueChange={(value) => setMove("toAccountId", value)}
                    >
                      <SelectTrigger id="transferTo">
                        <SelectValue placeholder="Select destination account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts
                          // Money cannot be moved to where it already is.
                          .filter(
                            (account) =>
                              String(account.id) !== transfer.fromAccountId
                          )
                          .map((account) => (
                            <SelectItem
                              key={account.id}
                              value={String(account.id)}
                            >
                              {accountLabel(account, branches)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Account Number &ndash; Office Branch
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transferDate">Transfer Date</Label>
                    <Input
                      id="transferDate"
                      type="date"
                      value={transfer.date}
                      onChange={(e) => setMove("date", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">Transfer Amount</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      min="1"
                      value={transfer.amount}
                      onChange={(e) => setMove("amount", e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transferReference">Reference Number</Label>
                    <Input
                      id="transferReference"
                      value={transfer.reference}
                      onChange={(e) => setMove("reference", e.target.value)}
                      placeholder="Enter reference number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Transfer Receipt</Label>
                    {receipt ? (
                      <div className="flex h-9 items-center justify-between gap-2 rounded-md border bg-muted/40 px-3">
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-green-600">
                          <FileCheck className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{receipt.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setReceipt(null)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          &times;
                          <span className="sr-only">Remove receipt</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/50">
                        <Paperclip className="h-3.5 w-3.5" />
                        Choose file
                        <Input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files[0] && setReceipt(e.target.files[0])
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>

                <p className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  An internal transfer reduces the source account and increases
                  the destination account. It is not income and not an expense,
                  so it never reaches the profit and loss.
                </p>

                <div className="flex justify-end">
                  <Button onClick={saveTransfer} disabled={!canTransfer}>
                    Save Transfer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Each tab shows the list its own work belongs to */}
      {tab === "add" && (
        <div>
          <p className="mb-2 font-semibold text-primary">Bank Accounts</p>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="p-3 font-semibold">Account</th>
                    <th className="p-3 font-semibold">Office Branch</th>
                    <th className="p-3 font-semibold">Balances</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                    >
                      <td className="p-3">
                        <span className="block font-semibold">
                          {account.bankName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {account.bankBranch || "-"}
                        </span>
                        {/* Enough of the number to tell accounts apart, no more */}
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {maskAccountNumber(account.accountNumber)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {account.iban || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {account.branchId
                          ? branchLabel(branches, account.branchId) + " Branch"
                          : "All Branches"}
                      </td>
                      <td className="p-3">
                        <span className="block text-xs text-muted-foreground">
                          Opening Balance
                        </span>
                        <span className="block">
                          {money(account.openingBalance)}
                        </span>
                        <span className="mt-1 block text-xs text-primary">
                          Current Balance
                        </span>
                        <span className="block font-bold text-primary">
                          {money(balanceOf(account))}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={account.active ? "success" : "secondary"}>
                          {account.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateSection("transactions", {
                                accountId: account.id,
                              })
                            }
                            className="rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            View
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setAccountActive(account.id, !account.active)
                                }
                                className="rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                {account.active ? "Disable" : "Enable"}
                              </button>
                              {/* Opens the transfer form with this account ready */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTab("transfer");
                                  setMove("fromAccountId", String(account.id));
                                }}
                                className="rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                Transfer
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      )}

      {tab === "transfer" && (
        <div>
          <p className="mb-2 font-semibold text-primary">Account Transfers</p>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              {transfers.length === 0 ? (
                <div className="p-6">
                  <EmptyState>
                    Nothing has been moved between accounts yet.
                  </EmptyState>
                </div>
              ) : (
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                      <th className="p-3 font-semibold">Transfer</th>
                      <th className="p-3 font-semibold">From &rarr; To</th>
                      <th className="p-3 font-semibold">Amount</th>
                      <th className="p-3 font-semibold">Reference &amp; Receipt</th>
                      <th className="p-3 font-semibold">Transferred By</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...transfers]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((move) => (
                        <tr
                          key={move.id}
                          className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                        >
                          <td className="p-3">
                            <span className="block font-semibold">
                              {move.transferNo}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {formatDate(move.date)}
                            </span>
                            {move.time && (
                              <span className="block text-xs text-muted-foreground">
                                {move.time}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            <span className="block">
                              {accountLine(accountById(move.fromAccountId))}
                            </span>
                            <span className="block">&darr;</span>
                            <span className="block">
                              {accountLine(accountById(move.toAccountId))}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">
                            {money(move.amount)}
                          </td>
                          <td className="p-3">
                            <span className="block">{move.reference || "-"}</span>
                            {move.receipt && (
                              <button
                                type="button"
                                title={move.receipt}
                                className="mt-0.5 inline-flex items-center gap-1 rounded text-xs text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                {move.receipt}
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="block">{move.byName || "-"}</span>
                            <span className="block text-xs text-muted-foreground">
                              {move.byRole}
                            </span>
                          </td>
                          <td className="p-3">
                            {/* A transfer is only recorded once it has happened,
                                so there is no pending state to show */}
                            <Badge variant="success">Completed</Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
