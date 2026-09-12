import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import BackButton from "@/components/shared/BackButton";
import FormHeading from "@/components/shared/FormHeading";
import UploadIcon from "@/components/shared/UploadIcon";
import { EmptyState } from "@/components/shared/panels";
import {
  Home,
  FileText,
  Wallet,
  CalendarClock,
  Ban,
  Save,
  FileCheck,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirm } from "@/lib/firm/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { useLeases } from "@/lib/leases/context";
import {
  PROPERTY_TYPES,
  CONTRACT_STATUSES,
  LEASE_PAYMENT_METHODS,
  INSTALLMENT_COUNTS,
  PAYMENT_DAYS,
  CASH,
  CHEQUE,
  OTHER_ACCOUNT,
  INSTALLMENT_STATUS,
  RENT_EXPENSE_TYPE,
  RENT_CATEGORY,
  rentSubcategoryOf,
  groupedAccountNumber,
  accountLabel,
  addressOf,
  leaseMonths,
  installmentsOf,
  vatOf,
  totalOf,
  omr,
  shortDate,
} from "./leaseData";

/**
 * The parts of a lease, in the order it is put together: the property, the
 * contract, what is paid and how, the installments that follow from that, and
 * ending it.
 *
 * `editable` marks the parts with fields of their own; the schedule is read off
 * the others, so Save only shows where there is something to save.
 */
const SECTIONS = [
  { key: "property", label: "Property Details", icon: Home, editable: true, note: "Information about the leased property" },
  { key: "contract", label: "Contract Details", icon: FileText, editable: true, note: "Contract information and duration" },
  { key: "rental", label: "Rental & Payment Details", icon: Wallet, editable: true, note: "What is paid, how, and in how many installments" },
  { key: "schedule", label: "Payment Schedule", icon: CalendarClock, note: "Every installment the contract falls due for" },
  { key: "nonRenewal", label: "Non-Renewal", icon: Ban, editable: true, note: "Notice not to renew the lease at the end of its term" },
];

const draftFrom = (lease) =>
  lease
    ? {
        landlord: lease.landlord || "",
        branchId: lease.branchId ? String(lease.branchId) : "",
        propertyType: lease.propertyType || "",
        address: addressOf(lease),
        contractStatus: lease.contractStatus || "",
        contractNo: lease.contractNo || "",
        contractFile: lease.contractFile || "",
        start: lease.start || "",
        end: lease.end || "",
        rent: lease.rent ? String(lease.rent) : "",
        vatApplied: lease.vatApplied !== false,
        method: lease.method || "",
        paymentFile: lease.paymentFile || "",
        bankAccountId: lease.bankAccountId ? String(lease.bankAccountId) : "",
        installments: lease.installments ? String(lease.installments) : "",
        paymentDay: lease.paymentDay ? String(lease.paymentDay) : "",
        cheques: { ...(lease.cheques || {}) },
        nonRenewalDate: lease.nonRenewalDate || "",
        nonRenewalFile: lease.nonRenewalFile || "",
      }
    : null;

/** A field's label, with its required mark glued to the last word. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && (
        <span className="whitespace-nowrap text-destructive">&nbsp;*</span>
      )}
    </Label>
  );
}

function Field({ children }) {
  return <div className="flex h-full flex-col justify-end gap-2">{children}</div>;
}

/** A choice from a list. Empty values are ignored - nobody picks "nothing". */
function Choice({ id, label, required, value, onChange, options, placeholder = "Please Select", disabled, children }) {
  return (
    <Field>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="flex gap-2">
        <Select
          value={value}
          onValueChange={(next) => next && onChange(next)}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="min-w-0 flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {children}
      </div>
    </Field>
  );
}

/** A figure worked out from the fields beside it - shown, never typed. */
function Worked({ id, label, value }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        className="cursor-default bg-muted text-muted-foreground"
        value={value}
        placeholder="Auto calculated"
      />
    </Field>
  );
}

/**
 * A file attached beside the field it backs. The name lives in the tooltip,
 * so the control stays the size of a button whether a file is there or not.
 */
function Attach({ id, file, onFile, what }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      asChild
      title={file ? file + " attached" : "Upload " + what}
      className={cn("shrink-0", file && "border-green-600 text-green-600")}
    >
      <label className="cursor-pointer">
        {file ? <FileCheck className="h-4 w-4" /> : <UploadIcon className="h-4 w-4" />}
        <span className="sr-only">Upload {what}</span>
        <Input
          id={id}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0].name)}
        />
      </label>
    </Button>
  );
}

/** The installments, as a table - with a cheque number to fill in where rent is paid by cheque. */
function InstallmentTable({ rows, byCheque, onCheque, editable }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b bg-secondary/60 text-left text-primary">
            <th className="p-3 font-semibold">No.</th>
            <th className="p-3 font-semibold">Due Date</th>
            <th className="p-3 text-right font-semibold">Amount (OMR)</th>
            {byCheque && <th className="p-3 font-semibold">Cheque No.</th>}
            <th className="p-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.no}
              className={cn(
                "border-b transition-colors last:border-0 hover:bg-primary/5",
                row.isNext && "bg-blue-50/60"
              )}
            >
              <td className="p-3">{row.no}</td>
              <td className="whitespace-nowrap p-3">{shortDate(row.due)}</td>
              <td className="p-3 text-right font-semibold">{omr(row.amount)}</td>
              {byCheque && (
                <td className="p-3">
                  {editable ? (
                    <Input
                      id={"chequeNo-" + row.no}
                      value={row.chequeNo}
                      onChange={(e) => onCheque(row.no, e.target.value)}
                      placeholder="Cheque number"
                      autoComplete="off"
                      className="h-8 w-40"
                    />
                  ) : (
                    row.chequeNo || <span className="text-muted-foreground">-</span>
                  )}
                </td>
              )}
              <td className="p-3">
                <span
                  className={cn(
                    "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                    INSTALLMENT_STATUS[row.status].pill
                  )}
                >
                  {INSTALLMENT_STATUS[row.status].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A label and its value on one line, the value pushed to the right edge. */
function AmountLine({ label, value, strong }) {
  return (
    <p className={cn("flex justify-between gap-4", strong && "font-semibold text-primary")}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </p>
  );
}

/**
 * Every installment, as the finance team reads it.
 *
 * The dot beside each installment is its status. The date is the due date
 * until the rent is paid, and then the day it was paid with the transaction
 * that paid it - once paid, when it was due no longer matters. The amount is
 * split into rent and VAT so the total can be checked line by line, and the
 * method says exactly where the money goes: which account, or which cheque
 * and how many are still to be cashed.
 */
function PaymentScheduleTable({ rows, lease, bankAccounts }) {
  const account =
    lease.bankAccountId && lease.bankAccountId !== OTHER_ACCOUNT
      ? bankAccounts.find((option) => option.id === Number(lease.bankAccountId))
      : null;
  const chequeCount = rows.length;

  const methodLines = (row) => {
    if (lease.method === CHEQUE) {
      return [
        "Cheque No.: " + (row.chequeNo || "-"),
        row.payment || row.status === "cancelled"
          ? null
          : "Remaining Cheques: " + row.remainingCheques + " of " + chequeCount,
      ].filter(Boolean);
    }
    if (lease.method === CASH) return [];
    if (lease.bankAccountId === OTHER_ACCOUNT) return ["Other account"];
    return account
      ? [account.bankName, groupedAccountNumber(account.accountNumber)]
      : ["-"];
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-250 text-sm">
          <thead>
            <tr className="border-b bg-secondary/60 text-left text-primary">
              <th className="p-3 font-semibold" style={{ width: "13%" }}>Installment No.</th>
              <th className="p-3 font-semibold" style={{ width: "16%" }}>Due Date / Payment Date</th>
              <th className="p-3 font-semibold" style={{ width: "15%" }}>Payment Details</th>
              <th className="p-3 font-semibold" style={{ width: "20%" }}>Rental Amount (OMR)</th>
              <th className="p-3 font-semibold" style={{ width: "20%" }}>Payment Method &amp; Details</th>
              <th className="p-3 font-semibold" style={{ width: "16%" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = INSTALLMENT_STATUS[row.status];
              return (
                <tr
                  key={row.no}
                  className="border-b align-top transition-colors last:border-0 hover:bg-primary/5"
                >
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-primary">
                      <span
                        title={status.label}
                        className={cn("h-3 w-3 shrink-0 rounded-full", status.dot)}
                      />
                      <span className="sr-only">{status.label}: </span>
                      Installment {row.no}
                    </span>
                  </td>

                  <td className="p-3">
                    {row.payment ? (
                      <>
                        <p className="text-muted-foreground">Payment Date:</p>
                        <p>{shortDate(row.payment.paidOn)}</p>
                        <p className="text-muted-foreground">
                          Transaction No.:{" "}
                          <span className="text-foreground">{row.payment.transactionNo || "-"}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">Due Date:</p>
                        <p>{shortDate(row.due)}</p>
                      </>
                    )}
                  </td>

                  <td className="p-3">
                    <p>{RENT_EXPENSE_TYPE}</p>
                    <p>{RENT_CATEGORY}</p>
                    <p>{rentSubcategoryOf(lease.propertyType)}</p>
                  </td>

                  <td className="p-3">
                    <AmountLine label="Rental Amount" value={omr(row.rentPart)} />
                    <AmountLine
                      label={lease.vatApplied === false ? "VAT (exempt)" : "VAT (5%)"}
                      value={omr(row.vat)}
                    />
                    <AmountLine label="Total Amount" value={omr(row.amount)} strong />
                  </td>

                  <td className="p-3">
                    <p className="font-semibold text-primary">{lease.method || "-"}</p>
                    {methodLines(row).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </td>

                  <td className="p-3 text-muted-foreground">{row.note || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* What the dots mean, once, under the table rather than on every row. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="font-semibold text-primary">Status:</span>
        {["paid", "soon", "unpaid", "cancelled", "upcoming"].map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", INSTALLMENT_STATUS[key].dot)} />
            {INSTALLMENT_STATUS[key].label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * One lease, section by section.
 *
 * The property, the contract, the rent and a notice not to renew are edited
 * here and saved together; everything that follows from them - the months,
 * the VAT, the installments and their dates - is worked out as they are typed.
 */
export default function LeaseDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { findLease, updateLease } = useLeases();
  const { branches, bankAccounts } = useFirm();
  const { suppliers } = useSuppliers();

  const lease = findLease(id);

  const [draft, setDraft] = useState(() => draftFrom(lease));
  const [loadedId, setLoadedId] = useState(id);
  const [section, setSection] = useState("property");
  const [error, setError] = useState("");

  // Moving straight from one lease to another reloads the page.
  if (id !== loadedId) {
    setLoadedId(id);
    setDraft(draftFrom(lease));
    setSection("property");
    setError("");
  }

  if (!lease || !draft) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            That lease no longer exists.
          </p>
          <Button type="button" className="mt-4" onClick={() => navigate("/leases")}>
            Back to Leases
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current = SECTIONS.find((option) => option.key === section);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  /** Cash never touches a bank, so choosing it clears the account. */
  const chooseMethod = (value) =>
    setDraft((prev) => ({
      ...prev,
      method: value,
      bankAccountId: value === CASH ? "" : prev.bankAccountId,
    }));

  const setCheque = (no, value) =>
    setDraft((prev) => ({ ...prev, cheques: { ...prev.cheques, [no]: value } }));

  // The lease as it would stand if saved now, for everything worked out from it.
  const preview = {
    ...lease,
    start: draft.start,
    end: draft.end,
    rent: Number(draft.rent || 0),
    vatApplied: draft.vatApplied,
    installments: Number(draft.installments || 0),
    paymentDay: Number(draft.paymentDay || 0),
    cheques: draft.cheques,
    method: draft.method,
    bankAccountId: draft.bankAccountId,
    propertyType: draft.propertyType,
  };
  const months = leaseMonths(draft.start, draft.end);
  const installments = installmentsOf(preview);
  const byCheque = draft.method === CHEQUE;
  const isCash = draft.method === CASH;

  // The landlord already on the lease stays choosable even when it is not in
  // the supplier directory, or the field would appear to have been emptied.
  const landlordOptions = [
    ...new Set([
      ...suppliers.filter((s) => s.status === "Active").map((s) => s.name),
      ...(draft.landlord ? [draft.landlord] : []),
    ]),
  ].map((name) => ({ value: name, label: name }));

  // The firm's own accounts still in use, or one of someone else's.
  const accountOptions = [
    ...bankAccounts
      .filter((account) => account.active)
      .map((account) => ({ value: String(account.id), label: accountLabel(account) })),
    { value: OTHER_ACCOUNT, label: "Other" },
  ];

  const save = () => {
    if (!draft.landlord || !draft.branchId || !draft.propertyType || !draft.address.trim()) {
      setSection("property");
      setError("Property Details need a landlord, a branch, a property type and an address.");
      return;
    }
    if (!draft.contractStatus || !draft.contractNo.trim() || !draft.start || !draft.end) {
      setSection("contract");
      setError("Contract Details need a contract status, the contract number and both contract dates.");
      return;
    }
    if (draft.end < draft.start) {
      setSection("contract");
      setError("The contract cannot end before it starts.");
      return;
    }
    if (!(Number(draft.rent) > 0) || !draft.method || (!isCash && !draft.bankAccountId)) {
      setSection("rental");
      setError(
        "Rental & Payment Details need the rental value, the payment method and - unless it is paid in cash - the bank account."
      );
      return;
    }
    setError("");

    // Only the cheque numbers the installments still have are kept.
    const cheques = byCheque
      ? Object.fromEntries(
          installments
            .filter((row) => (draft.cheques[row.no] || "").trim())
            .map((row) => [row.no, draft.cheques[row.no].trim()])
        )
      : {};

    updateLease(lease.id, {
      landlord: draft.landlord,
      branchId: Number(draft.branchId),
      propertyType: draft.propertyType,
      // Once the property is described here, its address is the one record of
      // where it is - an older building and unit would otherwise keep showing
      // in the table over an address that has since been corrected.
      address: draft.address.trim(),
      building: "",
      unit: "",
      contractStatus: draft.contractStatus,
      contractNo: draft.contractNo.trim(),
      contractFile: draft.contractFile,
      start: draft.start,
      end: draft.end,
      rent: Number(draft.rent),
      vatApplied: draft.vatApplied,
      method: draft.method,
      paymentFile: draft.paymentFile,
      bankAccountId: isCash ? "" : draft.bankAccountId === OTHER_ACCOUNT ? OTHER_ACCOUNT : Number(draft.bankAccountId),
      installments: Number(draft.installments || 0),
      paymentDay: Number(draft.paymentDay || 0),
      cheques,
      nonRenewalDate: draft.nonRenewalDate,
      nonRenewalFile: draft.nonRenewalFile,
    });
    navigate("/leases");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/leases" />
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Home className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">Lease Details</h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              {(lease.contractNo || "New lease") + " - review and modify"}
            </p>
          </div>
        </div>
        {/* Only where there are fields to save. */}
        {current.editable && (
          <Button type="button" onClick={save}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="flex flex-col items-start gap-4 sm:gap-6 lg:flex-row">
        {/* Section navigation */}
        <Card className="w-full lg:sticky lg:top-20 lg:w-64 lg:shrink-0">
          <CardContent className="p-3">
            <p className="mb-2 border-b px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lease Management
            </p>
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
              {SECTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSection(option.key)}
                    className={cn(
                      "flex items-center gap-2.5 text-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                      section === option.key
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {option.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* min-w-0 or a wide table in here would stretch the whole page */}
        <div className="w-full min-w-0 flex-1">
          <Card>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <FormHeading title={current.label} note={current.note} icon={current.icon} />

              {error && current.editable && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {section === "property" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                  <Choice
                    id="detailLandlord"
                    label="Landlord"
                    required
                    value={draft.landlord}
                    onChange={(value) => set("landlord", value)}
                    options={landlordOptions}
                    placeholder="Select landlord from suppliers"
                  />
                  <Choice
                    id="detailBranch"
                    label="Branch"
                    required
                    value={draft.branchId}
                    onChange={(value) => set("branchId", value)}
                    options={branches.map((branch) => ({
                      value: String(branch.id),
                      label: branch.name,
                    }))}
                  />
                  <Choice
                    id="detailPropertyType"
                    label="Property Type"
                    required
                    value={draft.propertyType}
                    onChange={(value) => set("propertyType", value)}
                    options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
                  />
                  <Field>
                    <FieldLabel htmlFor="detailAddress" required>
                      Address
                    </FieldLabel>
                    <Input
                      id="detailAddress"
                      value={draft.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="e.g. Al Khuwair, Muscat"
                    />
                  </Field>
                </div>
              )}

              {section === "contract" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <Choice
                      id="detailContractStatus"
                      label="Contract Status"
                      required
                      value={draft.contractStatus}
                      onChange={(value) => set("contractStatus", value)}
                      options={CONTRACT_STATUSES.map((status) => ({
                        value: status,
                        label: status,
                      }))}
                    />

                    {/* The number on the signed contract, with the copy it came from. */}
                    <Field>
                      <FieldLabel htmlFor="detailContractNo" required>
                        Contract Number
                      </FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="detailContractNo"
                          value={draft.contractNo}
                          onChange={(e) => set("contractNo", e.target.value)}
                          placeholder="e.g. RNT-2025-001"
                          autoComplete="off"
                          className="min-w-0 flex-1"
                        />
                        <Attach
                          id="detailContractFile"
                          file={draft.contractFile}
                          onFile={(name) => set("contractFile", name)}
                          what="contract copy"
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="detailStart" required>
                        Contract Start Date
                      </FieldLabel>
                      <Input
                        id="detailStart"
                        type="date"
                        value={draft.start}
                        max={draft.end || undefined}
                        onChange={(e) => set("start", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="detailEnd" required>
                        Contract End Date
                      </FieldLabel>
                      <Input
                        id="detailEnd"
                        type="date"
                        value={draft.end}
                        min={draft.start || undefined}
                        onChange={(e) => set("end", e.target.value)}
                      />
                    </Field>
                  </div>

                  {/* The duration the heading promises, counted from the two dates. */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <Worked
                      id="detailDuration"
                      label="Duration"
                      value={months ? months + " Months" : ""}
                    />
                  </div>
                </div>
              )}

              {section === "rental" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    {/* The monthly rent. The button beside it says whether VAT is
                        charged on it: residential lettings are exempt, so a flat
                        for staff is entered with it off. */}
                    <Field>
                      <FieldLabel htmlFor="detailRent" required>
                        Rental Value (OMR)
                      </FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="detailRent"
                          inputMode="decimal"
                          value={draft.rent}
                          onChange={(e) => set("rent", e.target.value.replace(/[^\d.]/g, ""))}
                          placeholder="0.000"
                          className="min-w-0 flex-1"
                        />
                        <Button
                          id="detailVatToggle"
                          type="button"
                          variant="outline"
                          aria-pressed={draft.vatApplied}
                          title={draft.vatApplied ? "VAT charged - click if this lease is VAT exempt" : "VAT exempt - click to charge 5% VAT"}
                          onClick={() => set("vatApplied", !draft.vatApplied)}
                          className={cn(
                            "shrink-0 gap-1 px-2.5",
                            draft.vatApplied ? "text-primary" : "text-muted-foreground line-through"
                          )}
                        >
                          <Percent className="h-3.5 w-3.5" />
                          5 %
                        </Button>
                      </div>
                    </Field>

                    <Worked
                      id="detailRentWithVat"
                      label={draft.vatApplied ? "Rental Value with 5% VAT (OMR)" : "Rental Value, VAT exempt (OMR)"}
                      value={Number(draft.rent) > 0 ? omr(totalOf(draft.rent, draft.vatApplied)) : ""}
                    />

                    <Choice
                      id="detailMethod"
                      label="Payment Method"
                      required
                      value={draft.method}
                      onChange={chooseMethod}
                      options={LEASE_PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
                      placeholder="Select payment method"
                    >
                      <Attach
                        id="detailPaymentFile"
                        file={draft.paymentFile}
                        onFile={(name) => set("paymentFile", name)}
                        what="payment document"
                      />
                    </Choice>

                    <Choice
                      id="detailBankAccount"
                      label="Bank Account for Rent Payment"
                      required={!isCash}
                      value={draft.bankAccountId}
                      onChange={(value) => set("bankAccountId", value)}
                      options={accountOptions}
                      placeholder={isCash ? "Not needed for cash" : "Select bank account"}
                      disabled={isCash}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <Choice
                      id="detailInstallments"
                      label="Number of Installments"
                      value={draft.installments}
                      onChange={(value) => set("installments", value)}
                      options={INSTALLMENT_COUNTS.map((n) => ({ value: String(n), label: String(n) }))}
                    />
                    <Choice
                      id="detailPaymentDay"
                      label="Payment Day of Month"
                      value={draft.paymentDay}
                      onChange={(value) => set("paymentDay", value)}
                      options={PAYMENT_DAYS.map((n) => ({ value: String(n), label: String(n) }))}
                    />
                    <Worked
                      id="detailVat"
                      label="VAT per Month (OMR)"
                      value={Number(draft.rent) > 0 ? omr(vatOf(draft.rent, draft.vatApplied)) : ""}
                    />
                  </div>

                  {/* Paying by cheque writes out one cheque per installment, so
                      the installments are laid out here and only the cheque
                      numbers are left to be typed in. */}
                  {byCheque &&
                    (installments.length === 0 ? (
                      <EmptyState>
                        The installments appear once the contract dates, the rental
                        value and the number of installments have been entered.
                      </EmptyState>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-primary">
                          Cheque Installments
                        </p>
                        <InstallmentTable
                          rows={installments}
                          byCheque
                          editable
                          onCheque={setCheque}
                        />
                      </div>
                    ))}
                </div>
              )}

              {section === "schedule" &&
                (installments.length === 0 ? (
                  <EmptyState>
                    The schedule appears once the contract dates, the rental value
                    and the number of installments have been entered.
                  </EmptyState>
                ) : (
                  <PaymentScheduleTable
                    rows={installments}
                    lease={preview}
                    bankAccounts={bankAccounts}
                  />
                ))}

              {section === "nonRenewal" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                  {/* The day notice was asked for, with the letter it was given in. */}
                  <Field>
                    <FieldLabel htmlFor="detailNonRenewalDate">Request Date</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="detailNonRenewalDate"
                        type="date"
                        value={draft.nonRenewalDate}
                        onChange={(e) => set("nonRenewalDate", e.target.value)}
                        className="min-w-0 flex-1"
                      />
                      <Attach
                        id="detailNonRenewalFile"
                        file={draft.nonRenewalFile}
                        onFile={(name) => set("nonRenewalFile", name)}
                        what="non-renewal notice"
                      />
                    </div>
                  </Field>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
