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
import { EmptyState } from "@/components/shared/panels";
import {
  Home,
  FileText,
  Wallet,
  CalendarClock,
  Ban,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirm } from "@/lib/firm/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { useLeases } from "@/lib/leases/context";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import {
  PROPERTY_TYPES,
  PAYMENT_FREQUENCIES,
  SCHEDULE_STATE,
  addressOf,
  leaseMonths,
  nextPaymentDate,
  paymentSchedule,
  vatOf,
  totalOf,
  omr,
  shortDate,
} from "./leaseData";

/**
 * The parts of a lease, in the order it is put together: the property, the
 * contract, what is paid and how, the payments that follows from that, and
 * what happens at the end.
 *
 * `editable` marks the parts with fields of their own - the others are read
 * off those, or are not set up yet - so Save only shows where there is
 * something to save.
 */
const SECTIONS = [
  { key: "property", label: "Property Details", icon: Home, editable: true, note: "Information about the leased property" },
  { key: "contract", label: "Contract Details", icon: FileText, editable: true, note: "The contract's number and the period it runs for" },
  { key: "rental", label: "Rental & Payment Details", icon: Wallet, editable: true, note: "What is paid, and how often" },
  { key: "schedule", label: "Payment Schedule", icon: CalendarClock, note: "Every payment the contract falls due for" },
  { key: "nonRenewal", label: "Non-Renewal", icon: Ban, note: "Ending the lease at the close of its term" },
];

const draftFrom = (lease) =>
  lease
    ? {
        landlord: lease.landlord || "",
        branchId: lease.branchId ? String(lease.branchId) : "",
        propertyType: lease.propertyType || "",
        address: addressOf(lease),
        start: lease.start || "",
        end: lease.end || "",
        rent: lease.rent ? String(lease.rent) : "",
        frequency: lease.frequency || "",
        method: lease.method || "",
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
function Choice({ id, label, required, value, onChange, options, placeholder = "Please Select" }) {
  return (
    <Field>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
 * One lease, section by section.
 *
 * The property, the contract and the rent are edited here and saved together;
 * everything that follows from them - the months, the VAT and total, the next
 * payment, the whole schedule - is worked out as they are typed.
 */
export default function LeaseDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { findLease, updateLease } = useLeases();
  const { branches } = useFirm();
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

  // The lease as it would stand if saved now, for everything worked out from it.
  const preview = {
    ...lease,
    start: draft.start,
    end: draft.end,
    rent: Number(draft.rent || 0),
    frequency: draft.frequency,
  };
  const months = leaseMonths(draft.start, draft.end);
  const next = nextPaymentDate(preview);
  const schedule = paymentSchedule(preview);

  // The landlord already on the lease stays choosable even when it is not in
  // the supplier directory, or the field would appear to have been emptied.
  const landlordOptions = [
    ...new Set([
      ...suppliers.filter((s) => s.status === "Active").map((s) => s.name),
      ...(draft.landlord ? [draft.landlord] : []),
    ]),
  ].map((name) => ({ value: name, label: name }));

  const save = () => {
    if (!draft.landlord || !draft.branchId || !draft.propertyType || !draft.address.trim()) {
      setSection("property");
      setError("Property Details need a landlord, a branch, a property type and an address.");
      return;
    }
    if (draft.start && draft.end && draft.end < draft.start) {
      setSection("contract");
      setError("The contract cannot end before it starts.");
      return;
    }
    setError("");
    updateLease(lease.id, {
      landlord: draft.landlord,
      branchId: Number(draft.branchId),
      propertyType: draft.propertyType,
      address: draft.address.trim(),
      start: draft.start,
      end: draft.end,
      rent: Number(draft.rent || 0),
      frequency: draft.frequency,
      method: draft.method,
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
              {lease.contractNo} - review and modify
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                  <Worked id="detailContractNo" label="Contract No." value={lease.contractNo} />
                  <Field>
                    <FieldLabel htmlFor="detailStart">Contract Start</FieldLabel>
                    <Input
                      id="detailStart"
                      type="date"
                      value={draft.start}
                      max={draft.end || undefined}
                      onChange={(e) => set("start", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="detailEnd">Contract End</FieldLabel>
                    <Input
                      id="detailEnd"
                      type="date"
                      value={draft.end}
                      min={draft.start || undefined}
                      onChange={(e) => set("end", e.target.value)}
                    />
                  </Field>
                  <Worked
                    id="detailDuration"
                    label="Duration"
                    value={months ? months + " Months" : ""}
                  />
                </div>
              )}

              {section === "rental" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                    <Field>
                      <FieldLabel htmlFor="detailRent">Rental Value (OMR)</FieldLabel>
                      <Input
                        id="detailRent"
                        inputMode="decimal"
                        value={draft.rent}
                        onChange={(e) => set("rent", e.target.value.replace(/[^\d.]/g, ""))}
                        placeholder="0.000"
                      />
                    </Field>
                    <Worked
                      id="detailVat"
                      label="VAT (5%)"
                      value={Number(draft.rent) > 0 ? omr(vatOf(draft.rent)) : ""}
                    />
                    <Worked
                      id="detailTotal"
                      label="Total (OMR)"
                      value={Number(draft.rent) > 0 ? omr(totalOf(draft.rent)) : ""}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                    <Choice
                      id="detailFrequency"
                      label="Payment Frequency"
                      value={draft.frequency}
                      onChange={(value) => set("frequency", value)}
                      options={PAYMENT_FREQUENCIES.map((option) => ({
                        value: option.key,
                        label: option.key,
                      }))}
                    />
                    <Choice
                      id="detailMethod"
                      label="Payment Method"
                      value={draft.method}
                      onChange={(value) => set("method", value)}
                      options={PAYMENT_METHODS.map((method) => ({
                        value: method,
                        label: method,
                      }))}
                    />
                    <Worked
                      id="detailNextPayment"
                      label="Next Payment Date"
                      value={next ? shortDate(next) : ""}
                    />
                  </div>
                </div>
              )}

              {section === "schedule" &&
                (schedule.length === 0 ? (
                  <EmptyState>
                    The schedule appears once the contract dates, the rental value
                    and the payment frequency have been entered.
                  </EmptyState>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b bg-secondary/60 text-left text-primary">
                          <th className="p-3 font-semibold">No.</th>
                          <th className="p-3 font-semibold">Due Date</th>
                          <th className="p-3 text-right font-semibold">Rental Value (OMR)</th>
                          <th className="p-3 text-right font-semibold">VAT (5%)</th>
                          <th className="p-3 text-right font-semibold">Total (OMR)</th>
                          <th className="p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((row) => (
                          <tr
                            key={row.no}
                            className={cn(
                              "border-b transition-colors last:border-0 hover:bg-primary/5",
                              row.when === "next" && "bg-blue-50/60"
                            )}
                          >
                            <td className="p-3">{row.no}</td>
                            <td className="whitespace-nowrap p-3">{shortDate(row.due)}</td>
                            <td className="p-3 text-right">{omr(row.rent)}</td>
                            <td className="p-3 text-right">{omr(row.vat)}</td>
                            <td className="p-3 text-right font-semibold">{omr(row.total)}</td>
                            <td className="p-3">
                              <span
                                className={cn(
                                  "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  SCHEDULE_STATE[row.when].tone
                                )}
                              >
                                {SCHEDULE_STATE[row.when].label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {/* Not yet specified, so nothing is invented for it */}
              {section === "nonRenewal" && (
                <EmptyState>Non-Renewal is not set up yet.</EmptyState>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
