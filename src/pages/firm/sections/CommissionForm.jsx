import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Building2,
  Briefcase,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import UploadIcon from "@/components/shared/UploadIcon";
import { RequestSteps } from "@/components/shared/RequestSteps";
import { REQUEST_REJECTED } from "@/pages/employees/requestFlow";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYMENT_SOURCES, DEFAULT_BANK } from "@/pages/employees/payrollData";
import { useClients } from "@/lib/clients/context";
import { clientLinkedCases } from "@/pages/clients/clientMockData";
import { employeeRecords } from "@/pages/employees/employeeData";
import {
  DEFAULT_COMMISSION_BOOKING,
  SPECIFIC_COMMISSION,
  subcategoriesOf,
  legalFeesCollected,
  legalFeesInvoicesOnFile,
  legalFeesOnInvoice,
  isFullyPaid,
} from "../commissionData";

/**
 * Who a commission can be paid to, and which staff each group holds.
 *
 * The group is asked for first so the person list is a handful of names rather
 * than the whole firm - `role` is the field on the employee record that decides
 * who belongs to it.
 */
const ALL_MEMBERS = "All Office Members";
const OTHER_STAFF = "Other Staff";

/**
 * Commission is not a partners' matter: anyone in the office who brings in a
 * client or a case can be owed a share of the fees. So the first choice is the
 * whole office, and the last catches anyone whose role none of the named groups
 * covers - nobody who can earn commission is left out of the list.
 */
export const CLASSIFICATIONS = [
  { key: ALL_MEMBERS, role: null, icon: Building2 },
  { key: "Partners", role: "Partner", icon: Users },
  { key: "Consultants", role: "Advisor", icon: UserCog },
  { key: "Lawyers", role: "Lawyer", icon: Scale },
  { key: "Administrators", role: "Administrative", icon: UserRound },
  { key: "Accountants", role: "Accountant", icon: Calculator },
  { key: OTHER_STAFF, role: null, icon: Briefcase },
];

const NAMED_ROLES = CLASSIFICATIONS.map((group) => group.role).filter(Boolean);

const peopleIn = (classification) => {
  if (classification === ALL_MEMBERS) return employeeRecords;
  if (classification === OTHER_STAFF)
    return employeeRecords.filter((e) => !NAMED_ROLES.includes(e.role));
  const group = CLASSIFICATIONS.find((c) => c.key === classification);
  if (!group) return [];
  return employeeRecords.filter((e) => e.role === group.role);
};

/**
 * The groups worth offering: the whole office always, and any other group
 * only when somebody is in it - an empty group is a choice that leads nowhere.
 */
const offeredClassifications = () =>
  CLASSIFICATIONS.filter(
    (group) => group.key === ALL_MEMBERS || peopleIn(group.key).length > 0
  );

/** The group a person's job puts them in. */
const classificationOf = (role) =>
  CLASSIFICATIONS.find((group) => group.role === role)?.key || OTHER_STAFF;

const emptyDraft = {
  ...DEFAULT_COMMISSION_BOOKING,
  clientType: "",
  clientNo: "",
  caseFileNo: "",
  invoiceNo: "",
  periodFrom: "",
  periodTo: "",
  classification: "",
  paidTo: "",
  rate: "",
  notes: "",
};

/** How the commission was actually paid, once it has been settled. */
const emptyPayment = {
  method: "",
  bank: DEFAULT_BANK,
  accountNo: "",
  paymentDate: "",
  reference: "",
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
 * A booking the form does not ask about: every commission is an employee
 * expense, and every one is booked under Commission.
 */
function Fixed({ id, label, value }) {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={() => {}}>
        <SelectTrigger id={id} className="bg-locked">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={value}>{value}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * How the commission actually reached the person it was agreed with.
 *
 * The figure is not asked for again: it is what the first stage worked out,
 * and a typed one could disagree with the fees it came from.
 */
function CommissionPayment({
  commissionNo,
  payee,
  amount,
  payment,
  onChange,
  receipt,
  onReceipt,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <Locked id="payCommissionNo" label="Commission No." value={commissionNo} />
      <Locked id="payPayee" label="Payee" value={payee} />
      <Locked
        id="payAmount"
        label="Commission Amount (OMR)"
        value={amount}
        highlight
      />

      <div className="flex h-full flex-col justify-end gap-2">
        <FieldLabel htmlFor="payMethod" required>
          Payment Method
        </FieldLabel>
        <Select
          value={payment.method}
          onValueChange={(value) => value && onChange("method", value)}
        >
          <SelectTrigger id="payMethod">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex h-full flex-col justify-end gap-2">
        <FieldLabel htmlFor="payBank">Bank</FieldLabel>
        <Select
          value={payment.bank}
          onValueChange={(value) => value && onChange("bank", value)}
        >
          <SelectTrigger id="payBank">
            <SelectValue placeholder="Select bank or cash" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex h-full flex-col justify-end gap-2">
        <FieldLabel htmlFor="payAccount">Account No.</FieldLabel>
        <Input
          id="payAccount"
          value={payment.accountNo}
          onChange={(e) => onChange("accountNo", e.target.value)}
          placeholder="Enter the account the commission goes to"
        />
      </div>

      <div className="flex h-full flex-col justify-end gap-2">
        <FieldLabel htmlFor="payDate" required>
          Payment Date
        </FieldLabel>
        <Input
          id="payDate"
          type="date"
          value={payment.paymentDate}
          onChange={(e) => onChange("paymentDate", e.target.value)}
        />
      </div>

      {/* What the bank called the payment, and the proof of it. */}
      <div className="flex h-full flex-col justify-end gap-2 sm:col-span-1 lg:col-span-2">
        <FieldLabel htmlFor="payReference">Payment Reference</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="payReference"
            value={payment.reference}
            onChange={(e) => onChange("reference", e.target.value)}
            placeholder="TRX-0000-00000"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            asChild
            title={receipt ? receipt.name + " attached" : "Attach payment receipt"}
            className={cn("shrink-0", receipt && "border-green-600 text-green-600")}
          >
            <label htmlFor="payReceipt" className="cursor-pointer">
              {receipt ? (
                <FileCheck className="h-4 w-4" />
              ) : (
                <UploadIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Attach payment receipt</span>
            </label>
          </Button>
          <Input
            id="payReceipt"
            type="file"
            className="hidden"
            onChange={(e) => e.target.files[0] && onReceipt(e.target.files[0])}
          />
        </div>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <FieldLabel htmlFor="payNotes">Notes</FieldLabel>
        <Textarea
          id="payNotes"
          rows={3}
          value={payment.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Enter payment notes"
        />
      </div>
    </div>
  );
}

/** A figure or a fact the payment stage reads back rather than asks for. */
function Locked({ id, label, value, highlight }) {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value}
        className={cn(
          "cursor-default bg-locked text-muted-foreground",
          highlight && "border-green-600/40 font-semibold text-green-700"
        )}
      />
    </div>
  );
}

/**
 * The arrangement being agreed: who, on whose fees, at what rate, over what
 * period.
 *
 * One form for every place it is asked for. Anyone in the office can be named
 * as the beneficiary - not only partners - because commission is earned by
 * whoever brought in the client or the case. On an employee's record that
 * employee is simply the starting choice.
 *
 * The commission amount is on the form but is never typed: it is the legal fees
 * before VAT the client has paid in full - on the chosen invoice, or within the
 * period - times the percentage. A figure that could be typed could be typed
 * wrong.
 */
export default function CommissionForm({
  employee,
  onCancel,
  onSave,
  // A commission already on the list, opened back into the form to be
  // followed, corrected or decided.
  initial = null,
  // What the first stage does: the commission goes on the list straight away,
  // waiting on the payment that settles it.
  onSubmit,
  onReject,
  // The number this commission will carry, handed down by whoever keeps the
  // list, so the form can show it before it is saved.
  commissionNo = "",
  // Told which client is chosen, so the list under the form can narrow to
  // that client's commissions while one for them is being written.
  onClientChange,
}) {
  const { clients } = useClients();

  // Which half of the commission is open: what it comes to, and then how it
  // was paid.
  const [stage, setStage] = useState(initial ? "payment" : "commission");
  const [payment, setPayment] = useState(() =>
    initial
      ? {
          ...emptyPayment,
          method: initial.method || "",
          bank: initial.bank || DEFAULT_BANK,
          accountNo: initial.accountNo || "",
          paymentDate: initial.paymentDate || "",
          reference: initial.reference || "",
          notes: initial.paymentNotes || "",
        }
      : emptyPayment
  );
  const [receipt, setReceipt] = useState(null);
  // Refusing asks for a reason before it takes one.
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const refused = initial?.status === REQUEST_REJECTED;
  const setPay = (name, value) =>
    setPayment((prev) => ({ ...prev, [name]: value }));

  // Opened from an employee's record, that employee is filled in to start
  // with - but only to start with. Commission can go to any member of the
  // office who brought in the client or the case, so both questions about who
  // it is for stay open to change.
  const [draft, setDraft] = useState(() =>
    initial
      ? {
          ...emptyDraft,
          ...initial,
          subcategory: initial.type || initial.subcategory || "",
          rate: String(initial.rate ?? ""),
        }
      : {
          ...emptyDraft,
          classification: employee ? classificationOf(employee.role) : "",
          paidTo: employee ? employee.name : "",
        }
  );

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  /** Changing the group empties the person, who may not be in the new one. */
  const chooseClassification = (value) =>
    setDraft((prev) => ({ ...prev, classification: value, paidTo: "" }));

  /** Changing the kind of client empties the client, for the same reason. */
  const chooseClientType = (value) => {
    if (!value) return;
    setDraft((prev) => ({
      ...prev,
      clientType: value,
      clientNo: "",
      invoiceNo: "",
    }));
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
    // Invoices belong to a client, so one chosen for the last client goes.
    setDraft((prev) => ({ ...prev, clientNo: value, invoiceNo: "" }));
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

  /** Another file has its own invoices, so the one chosen for the last goes. */
  const chooseCaseFile = (value) => {
    if (!value) return;
    setDraft((prev) => ({ ...prev, caseFileNo: value, invoiceNo: "" }));
  };

  const chooseInvoice = (value) => {
    if (!value) return;
    setField("invoiceNo", value);
  };

  // What a specific commission can be calculated from: the legal-fees
  // invoices this client was sent on this file, and no others.
  const fileInvoices = legalFeesInvoicesOnFile(draft.clientNo, draft.caseFileNo);

  // What the arrangement is worth so far: the legal fees before VAT it runs
  // on, times the rate - one invoice for a specific commission, everything
  // paid in the period for a fixed one. Both sides come from elsewhere, so it
  // moves on its own as the invoice or the period and the percentage are set.
  const fees = isSpecific
    ? legalFeesOnInvoice(draft.clientNo, draft.invoiceNo)
    : legalFeesCollected(draft.clientNo, draft.periodFrom, draft.periodTo);
  const commission = (fees * Number(draft.rate || 0)) / 100;

  const canSave =
    draft.expenseType &&
    draft.category &&
    draft.subcategory &&
    draft.clientType &&
    draft.clientNo &&
    (isSpecific
      ? draft.caseFileNo && draft.invoiceNo
      : draft.periodFrom && draft.periodTo) &&
    draft.classification &&
    draft.paidTo &&
    Number(draft.rate) > 0;

  /** What was agreed, as the record keeps it. */
  const agreed = () => {
    const client = clients.find((c) => c.clientNo === draft.clientNo);
    return {
      ...draft,
      // The subcategory is what kind of commission this is, so the record
      // keeps it under the name the rest of the system reads it by.
      type: draft.subcategory,
      // Only one of the two was asked for, so only one is kept.
      caseFileNo: isSpecific ? draft.caseFileNo : "",
      invoiceNo: isSpecific ? draft.invoiceNo : "",
      periodFrom: isSpecific ? "" : draft.periodFrom,
      periodTo: isSpecific ? "" : draft.periodTo,
      clientName: client?.clientName || "",
      rate: Number(draft.rate),
    };
  };

  /**
   * The commission agreed. It goes on the list straight away, waiting on the
   * payment that settles it, and the form moves on to that payment.
   */
  const saveAndContinue = () => {
    if (!canSave) return;
    onSubmit?.(agreed());
    setStage("payment");
  };

  const canPay = canSave && payment.method && payment.paymentDate;

  /** Refused: the commission keeps its temporary number and says why. */
  const reject = () => {
    if (!reason.trim()) return;
    onReject?.(reason.trim());
  };

  const save = () => {
    if (!canPay) return;
    onSave({
      ...agreed(),
      // The day it was agreed, which is what the list reads it by.
      date: new Date().toISOString().slice(0, 10),
      method: payment.method,
      bank: payment.bank,
      accountNo: payment.accountNo,
      paymentDate: payment.paymentDate,
      reference: payment.reference.trim(),
      receipt: receipt?.name || "",
      paymentNotes: payment.notes.trim(),
    });
  };

  return (
    <div className="space-y-6">
        {/* The two halves of a commission: what it comes to, and then how it
            was paid. Either header opens its own half. */}
        <RequestSteps
          active={stage}
          onChange={setStage}
          steps={[
            {
              key: "commission",
              title: "Add Commission",
              note: "Commission calculation and eligibility details",
              done: Boolean(canSave),
            },
            {
              key: "payment",
              title: "Commission Payment",
              note: "Payment and bank transfer details",
              done: Boolean(canPay),
              // Nothing can be paid until there is a figure to pay.
              disabled: !canSave,
            },
          ]}
        />

        <h3 className="text-base font-semibold text-primary">
          {stage === "payment" ? "Commission Payment" : "Add Commission"}
        </h3>

        {stage === "payment" ? (
          <CommissionPayment
            commissionNo={commissionNo}
            payee={draft.paidTo}
            amount={money(commission)}
            payment={payment}
            onChange={setPay}
            receipt={receipt}
            onReceipt={setReceipt}
          />
        ) : (
        <>
        {/* Where the commission lands in the accounts. Neither of the first
            two is a choice - every commission is booked the same way - but
            they are shown so the record says what it will be charged to. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="flex h-full flex-col justify-end gap-2">
            <FieldLabel htmlFor="commissionNo">Commission No.</FieldLabel>
            <Input
              id="commissionNo"
              readOnly
              tabIndex={-1}
              className="cursor-default bg-locked text-muted-foreground"
              value={commissionNo}
            />
          </div>

          <Fixed
            id="commissionExpenseType"
            label="Expense Type"
            value={draft.expenseType}
          />
          <Fixed
            id="commissionCategory"
            label="Category"
            value={draft.category}
          />

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
        {/* Four to a row either way: client type, client, and then a case
            file and its invoice, or the two ends of a period. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
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
            <>
            <div className="flex h-full flex-col justify-end gap-2">
              <FieldLabel htmlFor="caseFileNo" required>
                Case File Number
              </FieldLabel>
              <Select value={draft.caseFileNo} onValueChange={chooseCaseFile}>
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

            {/* The invoice the commission is calculated from: only this
                client's legal-fees invoices on this file are offered. One not
                yet paid in full is shown - so it is clear it exists - but
                cannot be chosen, because commission is earned only on fees the
                client has actually paid. */}
            <div className="flex h-full flex-col justify-end gap-2">
              <FieldLabel htmlFor="commissionInvoice" required>
                Invoice Number
              </FieldLabel>
              <Select
                value={draft.invoiceNo}
                onValueChange={chooseInvoice}
                disabled={
                  !draft.clientNo ||
                  !draft.caseFileNo ||
                  fileInvoices.length === 0
                }
              >
                <SelectTrigger id="commissionInvoice">
                  <SelectValue
                    placeholder={
                      !draft.clientNo || !draft.caseFileNo
                        ? "Select a case file first"
                        : fileInvoices.length === 0
                          ? "No legal-fees invoice on this file"
                          : "Select Invoice"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fileInvoices.map((invoice) => {
                    const paidInFull = isFullyPaid(invoice);
                    return (
                      <SelectItem
                        key={invoice.invoiceNo}
                        value={invoice.invoiceNo}
                        disabled={!paidInFull}
                      >
                        {invoice.invoiceNo} &mdash; {money(invoice.legalFees)}{" "}
                        before VAT
                        {!paidInFull && " · " + invoice.status}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            </>
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
            >
              <SelectTrigger id="classification">
                <SelectValue placeholder="Select Classification" />
              </SelectTrigger>
              <SelectContent>
                {offeredClassifications().map((group) => {
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
              disabled={!draft.classification}
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
              className="cursor-default bg-locked text-muted-foreground"
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
        </>
        )}

        {/* The rule is not written on the form - it is what the Commission
            Amount field above is worked out by:
            Legal Fees (Before VAT) x Commission Percentage = Commission Amount,
            counted only on fees the client has actually paid. */}
        {/* A refused commission says why, and stays as it is. */}
        {stage === "payment" && refused && (
          <div className="space-y-2">
            <FieldLabel htmlFor="commissionRefused">
              Reason for Rejection
            </FieldLabel>
            <Textarea
              id="commissionRefused"
              readOnly
              tabIndex={-1}
              rows={2}
              className="cursor-default border-destructive/40 bg-destructive/5 text-destructive"
              value={initial?.rejectionReason || ""}
            />
          </div>
        )}

        {stage === "payment" && rejecting && (
          <div className="space-y-2">
            <FieldLabel htmlFor="commissionReason" required>
              Reason for Rejection
            </FieldLabel>
            <Textarea
              id="commissionReason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Say why this commission is refused"
            />
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          {stage === "payment" && !refused && onReject && (
            rejecting ? (
              <Button
                type="button"
                variant="destructive"
                onClick={reject}
                disabled={!reason.trim()}
              >
                Confirm Rejection
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setRejecting(true)}
              >
                Reject Request
              </Button>
            )
          )}

          {stage === "payment" ? (
            !refused && (
              <Button
                type="button"
                onClick={save}
                disabled={!canPay || rejecting}
              >
                Confirm Commission Payment
              </Button>
            )
          ) : (
            <Button type="button" onClick={saveAndContinue} disabled={!canSave}>
              Save and Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
    </div>
  );
}
