import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCog,
  Scale,
  UserRound,
  Calculator,
} from "lucide-react";
import { useClients } from "@/lib/clients/context";
import { clientLinkedCases } from "@/pages/clients/clientMockData";
import { employeeRecords } from "@/pages/employees/employeeData";
import {
  COMMISSION_BOOKING,
  DEFAULT_COMMISSION_BOOKING,
  SPECIFIC_COMMISSION,
  categoriesOf,
  subcategoriesOf,
  legalFeesCollected,
  legalFeesOnCase,
} from "../commissionData";

/**
 * Who a commission can be paid to, and which staff each group holds.
 *
 * The group is asked for first so the person list is a handful of names rather
 * than the whole firm - `role` is the field on the employee record that decides
 * who belongs to it.
 */
export const CLASSIFICATIONS = [
  { key: "Partners", role: "Partner", icon: Users },
  { key: "Consultants", role: "Advisor", icon: UserCog },
  { key: "Lawyers", role: "Lawyer", icon: Scale },
  { key: "Administrators", role: "Administrative", icon: UserRound },
  { key: "Accountants", role: "Accountant", icon: Calculator },
];

const peopleIn = (classification) => {
  const group = CLASSIFICATIONS.find((c) => c.key === classification);
  if (!group) return [];
  return employeeRecords.filter((e) => e.role === group.role);
};

/** The group a person's job puts them in. */
const classificationOf = (role) =>
  CLASSIFICATIONS.find((group) => group.role === role)?.key || "";

const emptyDraft = {
  ...DEFAULT_COMMISSION_BOOKING,
  clientType: "",
  clientNo: "",
  caseFileNo: "",
  periodFrom: "",
  periodTo: "",
  classification: "",
  paidTo: "",
  rate: "",
  notes: "",
};

/** Three decimals, the way Rials are written here. */
const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

/**
 * A field's label, with its required mark coloured.
 *
 * The mark is glued to the last word rather than following a plain space:
 * a long label wraps, and an asterisk alone under it reads as a mistake.
 */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
    </Label>
  );
}

/**
 * The arrangement being agreed: who, on whose fees, at what rate, over what
 * period.
 *
 * One form for both places it is asked for - the firm's own commission page,
 * where anyone can be named, and an employee's record, where the person is
 * already known and so is not asked for again.
 *
 * The commission amount is on the form but is never typed: it is the legal fees
 * the client has actually paid in the period, times the percentage. A figure
 * that could be typed could be typed wrong.
 */
export default function CommissionForm({
  employee,
  onCancel,
  onSave,
  // Told which client is chosen, so the list under the form can narrow to
  // that client's commissions while one for them is being written.
  onClientChange,
}) {
  const { clients } = useClients();

  // On an employee's own record the commission is theirs by definition, so
  // the two questions about who it is for are answered before it opens.
  const [draft, setDraft] = useState(() => ({
    ...emptyDraft,
    classification: employee ? classificationOf(employee.role) : "",
    paidTo: employee ? employee.name : "",
  }));

  const ownsPerson = Boolean(employee);

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  /** Changing the group empties the person, who may not be in the new one. */
  const chooseClassification = (value) =>
    setDraft((prev) => ({ ...prev, classification: value, paidTo: "" }));

  /** Changing the kind of client empties the client, for the same reason. */
  const chooseClientType = (value) => {
    if (!value) return;
    setDraft((prev) => ({ ...prev, clientType: value, clientNo: "" }));
    onClientChange?.("");
  };

  /**
   * The client, passed on to whoever shows the list.
   *
   * An empty value is ignored: inside the employee's form Radix keeps a hidden
   * native select that reports "" when its list is rebuilt, which would clear
   * the choice - and the filter with it - on its own.
   */
  const chooseClient = (value) => {
    if (!value) return;
    setField("clientNo", value);
    onClientChange?.(value);
  };

  // The kinds of client the firm actually has, read off the directory rather
  // than listed here - a kind nobody is would only ever be an empty choice.
  const clientTypes = [...new Set(clients.map((client) => client.type))]
    .filter(Boolean)
    .sort();

  const clientsOfType = clients.filter(
    (client) => client.type === draft.clientType
  );

  // A specific commission is agreed for one case file; a fixed one stands
  // over a period. They are alternatives, so the form asks for one or the
  // other and never for both.
  const isSpecific = draft.subcategory === SPECIFIC_COMMISSION;

  // What the arrangement is worth so far: the fees it runs on, times the
  // rate. Both sides come from elsewhere, so it moves on its own as the case
  // file or the period and the percentage are set.
  const fees = isSpecific
    ? legalFeesOnCase(draft.clientNo, draft.caseFileNo)
    : legalFeesCollected(draft.clientNo, draft.periodFrom, draft.periodTo);
  const commission = (fees * Number(draft.rate || 0)) / 100;

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.subcategory &&
    draft.clientType &&
    draft.clientNo &&
    (isSpecific
      ? draft.caseFileNo
      : draft.periodFrom && draft.periodTo) &&
    draft.classification &&
    draft.paidTo &&
    Number(draft.rate) > 0;

  const save = () => {
    if (!canSave) return;
    const client = clients.find((c) => c.clientNo === draft.clientNo);
    onSave({
      ...draft,
      // The subcategory is what kind of commission this is, so the record
      // keeps it under the name the rest of the system reads it by.
      type: draft.subcategory,
      // Only one of the two was asked for, so only one is kept: a period
      // on a case-file commission would be a figure nobody set.
      caseFileNo: isSpecific ? draft.caseFileNo : "",
      periodFrom: isSpecific ? "" : draft.periodFrom,
      periodTo: isSpecific ? "" : draft.periodTo,
      clientName: client?.clientName || "",
      rate: Number(draft.rate),
    });
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {/* Where the commission lands in the accounts. Neither of the first
            two is a choice - every commission is booked the same way - but
            they are shown so the request says what it will be charged to. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionExpenseType" required>
              Expense Type
            </FieldLabel>
            <Select
              value={draft.expenseType}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  expenseType: value,
                  category: "",
                  subcategory: "",
                }))
              }
            >
              <SelectTrigger id="commissionExpenseType">
                <SelectValue placeholder="Select Expense Type" />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_BOOKING.map((option) => (
                  <SelectItem key={option.name} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionCategory" required>
              Category
            </FieldLabel>
            <Select
              value={draft.category}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  category: value,
                  subcategory: "",
                }))
              }
              disabled={!draft.expenseType}
            >
              <SelectTrigger id="commissionCategory">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesOf(draft.expenseType).map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionSubcategory" required>
              Subcategory
            </FieldLabel>
            <Select
              value={draft.subcategory}
              onValueChange={(value) => setField("subcategory", value)}
              disabled={!draft.category}
            >
              <SelectTrigger id="commissionSubcategory">
                <SelectValue placeholder="Please Select" />
              </SelectTrigger>
              <SelectContent>
                {subcategoriesOf(draft.expenseType, draft.category).map(
                  (sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nothing below the first row until a subcategory is chosen: a fixed
            and a specific commission ask different questions, so there is
            nothing sensible to show before the choice is made. */}
        {draft.subcategory && (
        <>
        {/* Whose fees it runs on, and what bounds them. */}
        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6",
            isSpecific ? "lg:grid-cols-3" : "lg:grid-cols-4"
          )}
        >
          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionClientType" required>
              Client Type
            </FieldLabel>
            <Select value={draft.clientType} onValueChange={chooseClientType}>
              <SelectTrigger id="commissionClientType">
                <SelectValue placeholder="Select Client Type" />
              </SelectTrigger>
              <SelectContent>
                {clientTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionClient" required>
              Client Name
            </FieldLabel>
            <Select
              value={draft.clientNo}
              onValueChange={chooseClient}
              disabled={!draft.clientType}
            >
              <SelectTrigger id="commissionClient">
                <SelectValue
                  placeholder={
                    draft.clientType
                      ? "Select Client"
                      : "Select a client type first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clientsOfType.map((client) => (
                  <SelectItem key={client.clientNo} value={client.clientNo}>
                    {client.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* A case file, or a period - never both. Which one is asked
              for is the whole difference between the two subcategories. */}
          {isSpecific ? (
            <div className="flex h-full flex-col justify-end gap-2">
              <FieldLabel htmlFor="caseFileNo" required>
                Case File Number
              </FieldLabel>
              <Select
                value={draft.caseFileNo}
                onValueChange={(value) => setField("caseFileNo", value)}
              >
                <SelectTrigger id="caseFileNo">
                  <SelectValue placeholder="Select Case File" />
                </SelectTrigger>
                <SelectContent>
                  {clientLinkedCases.map((file) => (
                    <SelectItem key={file.fileNo} value={file.fileNo}>
                      {file.fileNo} - {file.opponent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="periodFrom" required>
                  Period From
                </FieldLabel>
                <Input
                  id="periodFrom"
                  type="date"
                  value={draft.periodFrom}
                  max={draft.periodTo || undefined}
                  onChange={(e) => setField("periodFrom", e.target.value)}
                />
              </div>

              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="periodTo" required>
                  Period To
                </FieldLabel>
                <Input
                  id="periodTo"
                  type="date"
                  value={draft.periodTo}
                  min={draft.periodFrom || undefined}
                  onChange={(e) => setField("periodTo", e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Who is paid, and how much of the fees they are paid. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="classification" required>
              Classification of Paid To
            </FieldLabel>
            <Select
              value={draft.classification}
              onValueChange={chooseClassification}
              disabled={ownsPerson}
            >
              <SelectTrigger id="classification">
                <SelectValue placeholder="Select Classification" />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFICATIONS.map((group) => {
                  const Icon = group.icon;
                  return (
                    <SelectItem key={group.key} value={group.key}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 opacity-70" />
                        {group.key}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="paidTo" required>
              Paid To (Beneficiary)
            </FieldLabel>
            <Select
              value={draft.paidTo}
              onValueChange={(value) => setField("paidTo", value)}
              disabled={ownsPerson || !draft.classification}
            >
              <SelectTrigger id="paidTo">
                <SelectValue
                  placeholder={
                    draft.classification
                      ? "Select Beneficiary"
                      : "Select a classification first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {peopleIn(draft.classification).map((person) => (
                  <SelectItem key={person.id} value={person.name}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionRate" required>
              Commission Percentage (Before VAT)
            </FieldLabel>
            <div className="relative">
              <Input
                id="commissionRate"
                inputMode="decimal"
                value={draft.rate}
                onChange={(e) =>
                  setField("rate", e.target.value.replace(/[^\d.]/g, ""))
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

          {/* Worked out, never typed: the fees the client has actually paid
              in the period, times the percentage beside it. */}
          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionAmount">
              Commission Amount (OMR)
            </FieldLabel>
            <Input
              id="commissionAmount"
              readOnly
              tabIndex={-1}
              className="cursor-default bg-muted text-muted-foreground"
              value={money(commission)}
            />
          </div>
        </div>

        <div className="flex h-full flex-col justify-end gap-2">
          <FieldLabel htmlFor="commissionNotes">Notes</FieldLabel>
          <Textarea
            id="commissionNotes"
            rows={3}
            value={draft.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Enter any notes (optional)"
          />
        </div>
        </>
        )}

        {/* The rule is not written on the form - it is what the Commission
            Amount field above is worked out by:
            Legal Fees (Before VAT) x Commission Percentage = Commission Amount,
            counted only on fees the client has actually paid. */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!canSave}>
            Submit Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
