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
import DataTable from "@/components/shared/DataTable";
import FormHeading from "@/components/shared/FormHeading";
import { IdStatusDot } from "@/components/shared/panels";
import { Home, Plus } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import {
  PROPERTY_TYPES,
  PAYMENT_FREQUENCIES,
  LEASE_STATE,
  initialLeases,
  leaseMonths,
  leaseState,
  nextPaymentDate,
  nextContractNo,
  vatOf,
  totalOf,
  omr,
  shortDate,
} from "./leaseData";

const emptyDraft = {
  branchId: "",
  propertyType: "",
  building: "",
  unit: "",
  landlord: "",
  start: "",
  end: "",
  rent: "",
  frequency: "",
  method: "",
};

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

/** A figure worked out from the fields beside it - shown, never typed. */
function Worked({ id, label, value, placeholder = "Auto calculated" }) {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        className="cursor-default bg-muted text-muted-foreground"
        value={value}
        placeholder={placeholder}
      />
    </div>
  );
}

/** A choice from a fixed list. */
function Choice({ id, label, value, onChange, options, placeholder = "Please Select" }) {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <FieldLabel htmlFor={id} required>
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
    </div>
  );
}

/**
 * Every lease the firm holds, in one list.
 *
 * The table reads the contracts as agreed; what follows from them - the
 * number of months, the VAT and total, the next payment and whether the lease
 * is running out - is worked out on the spot. A new lease is added above the
 * list rather than on a page of its own, so it is entered alongside the ones
 * it sits among.
 */
export default function LeasesPage() {
  const { branches } = useFirm();

  const [leases, setLeases] = useState(initialLeases);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const branchName = (branchId) =>
    branches.find((branch) => branch.id === Number(branchId))?.name || "-";

  // What the lease being written will come to, as it is written.
  const draftLease = { ...draft, rent: Number(draft.rent || 0) };
  const draftMonths = leaseMonths(draft.start, draft.end);
  const draftNext = nextPaymentDate(draftLease);
  const contractNo = nextContractNo(leases);

  const canSave =
    draft.branchId &&
    draft.propertyType &&
    draft.building.trim() &&
    draft.unit.trim() &&
    draft.landlord.trim() &&
    draft.start &&
    draft.end &&
    draft.end >= draft.start &&
    Number(draft.rent) > 0 &&
    draft.frequency &&
    draft.method;

  const close = () => {
    setAdding(false);
    setDraft(emptyDraft);
  };

  const save = () => {
    if (!canSave) return;
    setLeases((prev) => [
      {
        id: prev.reduce((max, lease) => Math.max(max, lease.id), 0) + 1,
        branchId: Number(draft.branchId),
        propertyType: draft.propertyType,
        building: draft.building.trim(),
        unit: draft.unit.trim(),
        landlord: draft.landlord.trim(),
        contractNo: nextContractNo(prev),
        start: draft.start,
        end: draft.end,
        rent: Number(draft.rent),
        frequency: draft.frequency,
        method: draft.method,
      },
      ...prev,
    ]);
    setCurrentPage(1);
    close();
  };

  // The rows the table reads: the contract, with its branch named and its
  // place in the list numbered.
  const rows = leases.map((lease, index) => ({
    ...lease,
    rowNo: index + 1,
    branchName: branchName(lease.branchId),
    state: leaseState(lease),
  }));

  const columns = [
    {
      // The dot says where the lease stands, so there is no status column.
      key: "rowNo",
      header: "#",
      width: "5%",
      exportValue: (row) => row.rowNo + " (" + LEASE_STATE[row.state].label + ")",
      render: (value, row) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-medium">{value}</span>
          <IdStatusDot
            status={LEASE_STATE[row.state].label}
            tone={LEASE_STATE[row.state].dot}
          />
        </span>
      ),
    },
    {
      key: "branchName",
      header: "Branch",
      subHeader: "Property Type",
      width: "10%",
      exportValue: (row) => row.branchName + " - " + row.propertyType,
      render: (value, row) => (
        <div>
          <p className="font-semibold text-primary">{value}</p>
          <p className="text-primary/80">{row.propertyType}</p>
        </div>
      ),
    },
    {
      key: "building",
      header: "Property Information",
      width: "15%",
      exportValue: (row) => row.building + " - " + row.unit,
      render: (value, row) => (
        <div className="text-primary/80">
          <p>{value}</p>
          <p>{row.unit}</p>
        </div>
      ),
    },
    {
      key: "landlord",
      header: "Landlord",
      width: "14%",
      render: (value) => <span className="text-primary/80">{value}</span>,
    },
    {
      key: "contractNo",
      header: "Contract No.",
      width: "10%",
      render: (value) => (
        <span className="whitespace-nowrap text-primary/80">{value}</span>
      ),
    },
    {
      // The two dates and the months between them, counted rather than typed.
      key: "start",
      header: "Contract Period",
      subHeader: "Duration",
      width: "11%",
      exportValue: (row) =>
        shortDate(row.start) +
        " to " +
        shortDate(row.end) +
        " (" +
        leaseMonths(row.start, row.end) +
        " Months)",
      render: (value, row) => (
        <div className="whitespace-nowrap text-primary/80">
          <p>{shortDate(value)}</p>
          <p>{shortDate(row.end)}</p>
          <p>{leaseMonths(value, row.end)} Months</p>
        </div>
      ),
    },
    {
      // The rent for one payment, its VAT and what the two come to.
      key: "rent",
      header: "Rental Value (OMR)",
      subHeader: "VAT (5%) · Total (OMR)",
      width: "12%",
      exportValue: (row) =>
        omr(row.rent) + " + " + omr(vatOf(row.rent)) + " = " + omr(totalOf(row.rent)),
      render: (value) => (
        <div className="whitespace-nowrap">
          <p className="text-primary">{omr(value)}</p>
          <p className="text-primary/80">{omr(vatOf(value))}</p>
          <p className="font-semibold text-primary">{omr(totalOf(value))}</p>
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Payment Frequency",
      subHeader: "Payment Method",
      width: "12%",
      exportValue: (row) => row.frequency + " - " + row.method,
      render: (value, row) => (
        <div>
          <p className="font-semibold text-primary">{value}</p>
          <p className="text-primary/80">{row.method}</p>
        </div>
      ),
    },
    {
      key: "nextPayment",
      header: "Next Payment",
      subHeader: "Date",
      width: "11%",
      exportValue: (row) => shortDate(nextPaymentDate(row)),
      render: (_, row) => (
        <span className="whitespace-nowrap text-primary/80">
          {shortDate(nextPaymentDate(row))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Home className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">Leases</h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              Manage all lease contracts in one place
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Lease
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <FormHeading title="Add New Lease" icon={Home} />

            {/* Where, and what */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <Choice
                id="leaseBranch"
                label="Branch"
                value={draft.branchId}
                onChange={(value) => set("branchId", value)}
                options={branches.map((branch) => ({
                  value: String(branch.id),
                  label: branch.name,
                }))}
              />
              <Choice
                id="leasePropertyType"
                label="Property Type"
                value={draft.propertyType}
                onChange={(value) => set("propertyType", value)}
                options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
              />
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="leaseBuilding" required>
                  Building / Property
                </FieldLabel>
                <Input
                  id="leaseBuilding"
                  value={draft.building}
                  onChange={(e) => set("building", e.target.value)}
                  placeholder="e.g. Al Khuwair Office Building"
                />
              </div>
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="leaseUnit" required>
                  Unit
                </FieldLabel>
                <Input
                  id="leaseUnit"
                  value={draft.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="e.g. Office 101"
                />
              </div>
            </div>

            {/* From whom, and for how long */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="leaseLandlord" required>
                  Landlord
                </FieldLabel>
                <Input
                  id="leaseLandlord"
                  value={draft.landlord}
                  onChange={(e) => set("landlord", e.target.value)}
                  placeholder="Landlord name"
                />
              </div>
              <Worked id="leaseContractNo" label="Contract No." value={contractNo} />
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="leaseStart" required>
                  Contract Start
                </FieldLabel>
                <Input
                  id="leaseStart"
                  type="date"
                  value={draft.start}
                  max={draft.end || undefined}
                  onChange={(e) => set("start", e.target.value)}
                />
              </div>
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="leaseEnd" required>
                  Contract End
                </FieldLabel>
                <Input
                  id="leaseEnd"
                  type="date"
                  value={draft.end}
                  min={draft.start || undefined}
                  onChange={(e) => set("end", e.target.value)}
                />
              </div>
            </div>

            {/* How much, and how often */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <Worked
                id="leaseDuration"
                label="Duration"
                value={draftMonths ? draftMonths + " Months" : ""}
              />
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="leaseRent" required>
                  Rental Value (OMR)
                </FieldLabel>
                <Input
                  id="leaseRent"
                  inputMode="decimal"
                  value={draft.rent}
                  onChange={(e) => set("rent", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.000"
                />
              </div>
              <Worked
                id="leaseVat"
                label="VAT (5%)"
                value={Number(draft.rent) > 0 ? omr(vatOf(draft.rent)) : ""}
              />
              <Worked
                id="leaseTotal"
                label="Total (OMR)"
                value={Number(draft.rent) > 0 ? omr(totalOf(draft.rent)) : ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <Choice
                id="leaseFrequency"
                label="Payment Frequency"
                value={draft.frequency}
                onChange={(value) => set("frequency", value)}
                options={PAYMENT_FREQUENCIES.map((option) => ({
                  value: option.key,
                  label: option.key,
                }))}
              />
              <Choice
                id="leaseMethod"
                label="Payment Method"
                value={draft.method}
                onChange={(value) => set("method", value)}
                options={PAYMENT_METHODS.map((method) => ({
                  value: method,
                  label: method,
                }))}
              />
              <Worked
                id="leaseNextPayment"
                label="Next Payment Date"
                value={draftNext ? shortDate(draftNext) : ""}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={!canSave}>
                Save Lease
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Ask about leases..."
            exportFileName="leases.csv"
            enableColumnSearch={false}
            currentPage={currentPage}
            totalPages={Math.ceil(rows.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
