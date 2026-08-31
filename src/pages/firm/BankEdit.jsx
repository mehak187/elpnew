import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGoBack } from "@/lib/useGoBack";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import { ArrowLeft, Save, Landmark } from "lucide-react";
import { RECEIVING_BANKS, BANK_BRANCHES, ACCOUNT_TYPES } from "@/lib/constants";
import { useFirm } from "@/lib/firm/context";
import { accountBalance, invoices, money } from "./firmData";

/** A required field, with the mark that says so. */
function FieldLabel({ htmlFor, optional, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {!optional && <span className="text-destructive"> *</span>}
    </Label>
  );
}

/**
 * One bank account, opened from its name on the list.
 *
 * The opening balance can be corrected here because it is a stated fact about
 * the account. The current balance cannot: it is the running total of what has
 * been recorded against the account, so it is shown and never offered as a
 * field.
 */
export default function BankEdit() {
  const navigate = useNavigate();
  const goBack = useGoBack("/settings/firm");
  const { id } = useParams();
  const firm = useFirm();
  const { bankAccounts, branches, updateBankAccount } = firm;

  const account = bankAccounts.find((a) => a.id === Number(id));

  const [draft, setDraft] = useState(() => ({
    bankName: account?.bankName || "",
    bankBranch: account?.bankBranch || "",
    branchArea: account?.branchArea || "",
    location: account?.location || "",
    accountName: account?.accountName || "",
    accountNumber: account?.accountNumber || "",
    iban: account?.iban || "",
    swift: account?.swift || "",
    accountType: account?.accountType || "",
    openingBalance: String(account?.openingBalance ?? ""),
    branchId: account?.branchId ? String(account.branchId) : "all",
    active: account?.active ?? true,
  }));

  if (!account) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState>That bank account is no longer on file.</EmptyState>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={goBack}>
              Back to Company Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const balance = accountBalance(account, {
    payments: firm.payments,
    expenses: firm.expenses,
    transfers: firm.transfers,
    invoices,
  });

  const canSave =
    draft.bankName &&
    draft.bankBranch &&
    draft.accountName.trim() &&
    draft.accountNumber.trim() &&
    draft.iban.trim() &&
    draft.openingBalance !== "" &&
    draft.accountType;

  const save = () => {
    if (!canSave) return;
    updateBankAccount(account.id, {
      bankName: draft.bankName,
      bankBranch: draft.bankBranch,
      branchArea: draft.branchArea,
      location: draft.location,
      accountName: draft.accountName,
      accountNumber: draft.accountNumber,
      iban: draft.iban,
      swift: draft.swift,
      accountType: draft.accountType,
      openingBalance: Number(draft.openingBalance) || 0,
      branchId: draft.branchId === "all" ? null : Number(draft.branchId),
      active: draft.active,
    });
    navigate("/settings/firm");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/settings/firm" />
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Landmark className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Edit Bank Information
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              {account.bankName} &middot; Current balance {money(balance)}
            </p>
          </div>
        </div>
        <Button onClick={save} disabled={!canSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="space-y-4">
            <p className="border-b pb-2 text-sm font-semibold text-primary">
              1. Bank &amp; Branch
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="bankName">Bank Name</FieldLabel>
                <Select
                  value={draft.bankName}
                  onValueChange={(value) => set("bankName", value)}
                >
                  <SelectTrigger id="bankName">
                    <SelectValue placeholder="Select Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* The bank already on the account is offered even if it is
                        not one of the standing choices. */}
                    {[...new Set([draft.bankName, ...RECEIVING_BANKS])]
                      .filter(Boolean)
                      .map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="bankBranch">Bank Branch</FieldLabel>
                <Select
                  value={draft.bankBranch}
                  onValueChange={(value) => set("bankBranch", value)}
                >
                  <SelectTrigger id="bankBranch">
                    <SelectValue placeholder="Select Bank Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set([draft.bankBranch, ...BANK_BRANCHES])]
                      .filter(Boolean)
                      .map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="branchArea" optional>
                  Area
                </FieldLabel>
                <Input
                  id="branchArea"
                  value={draft.branchArea}
                  onChange={(e) => set("branchArea", e.target.value)}
                  placeholder="Shatti Al Qurum"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="location" optional>
                  City / Country
                </FieldLabel>
                <Input
                  id="location"
                  value={draft.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Muscat, Oman"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="border-b pb-2 text-sm font-semibold text-primary">
              2. Account
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="accountName">Account Name</FieldLabel>
                <Input
                  id="accountName"
                  value={draft.accountName}
                  onChange={(e) => set("accountName", e.target.value)}
                  placeholder="Enter Account Name"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="accountNumber">Account Number</FieldLabel>
                <Input
                  id="accountNumber"
                  value={draft.accountNumber}
                  onChange={(e) => set("accountNumber", e.target.value)}
                  placeholder="Enter Account Number"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="iban">IBAN</FieldLabel>
                <Input
                  id="iban"
                  value={draft.iban}
                  onChange={(e) => set("iban", e.target.value)}
                  placeholder="Enter IBAN"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="swift" optional>
                  SWIFT Code
                </FieldLabel>
                <Input
                  id="swift"
                  value={draft.swift}
                  onChange={(e) => set("swift", e.target.value)}
                  placeholder="BMUSOMRX"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="accountType">Account Type</FieldLabel>
                <Select
                  value={draft.accountType}
                  onValueChange={(value) => set("accountType", value)}
                >
                  <SelectTrigger id="accountType">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="openingBalance">Opening Balance</FieldLabel>
                <Input
                  id="openingBalance"
                  type="number"
                  min="0"
                  step="0.001"
                  value={draft.openingBalance}
                  onChange={(e) => set("openingBalance", e.target.value)}
                />
              </div>

              {/* An account either serves the whole company or one office */}
              <div className="space-y-2">
                <FieldLabel htmlFor="officeBranch" optional>
                  Account Belongs to Branch
                </FieldLabel>
                <Select
                  value={draft.branchId}
                  onValueChange={(value) => set("branchId", value)}
                >
                  <SelectTrigger id="officeBranch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="accountStatus">Account Status</FieldLabel>
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
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={goBack}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
