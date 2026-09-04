import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import DataTable from "@/components/shared/DataTable";
import {
  Plus,
  Info,
  Users,
  UserCog,
  Scale,
  UserRound,
  Calculator,
} from "lucide-react";
import { withRial } from "@/lib/money";
import { useClients } from "@/lib/clients/context";
import { clientInvoices, clientLinkedCases } from "@/pages/clients/clientMockData";
import { employeeRecords } from "@/pages/employees/employeeData";

const moneyValue = (amount) =>
  Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const money = (amount) => withRial(moneyValue(amount));

/**
 * Who a commission can be paid to, and which staff each group holds.
 *
 * The group is asked for first so the person list is a handful of names rather
 * than the whole firm - `role` is the field on the employee record that decides
 * who belongs to it.
 */
const CLASSIFICATIONS = [
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

/**
 * A general commission runs on everything the client pays; a specific one is
 * agreed for a single case file, so that file has to be named.
 */
const COMMISSION_TYPES = ["General", "Specific"];

/**
 * Whether the arrangement stands until it is ended, or applies once.
 */
const RECURRENCES = ["Recurring", "One-time"];

/**
 * The legal fees a client settled since a date.
 *
 * Commission is owed on fees, not on tax, so the VAT on each invoice is left
 * out - an invoice of 1,050 made of 1,000 fees and 50 VAT earns commission on
 * the 1,000. Only invoices actually paid count, and they count on the day the
 * money arrived rather than the day the invoice was raised, because that is
 * when the commission fell due.
 */
function legalFeesCollected(clientNo, from, to) {
  if (!clientNo || !from) return 0;
  return clientInvoices
    .filter(
      (invoice) =>
        invoice.clientNo === clientNo &&
        invoice.status === "Paid" &&
        invoice.paidDate >= from &&
        (!to || invoice.paidDate <= to)
    )
    .reduce((sum, invoice) => sum + Number(invoice.legalFees || 0), 0);
}

/**
 * The commission arrangements the firm has agreed.
 *
 * A record holds who is paid, on whose fees, at what rate and from when. It
 * never holds the commission itself: that is the fees times the rate, and a
 * stored answer can disagree with the two numbers it came from.
 */
const initialRecords = [
  { id: 1, commissionNo: "COM-2024-001", classification: "Partners", paidTo: "Mohammed Al Yahyaei", clientNo: "1", clientName: "ABC Holdings LLC", type: "General", caseFileNo: "", rate: 10, recurrence: "Recurring", effectiveFrom: "2024-01-01", effectiveTo: "" },
  { id: 2, commissionNo: "COM-2024-002", classification: "Lawyers", paidTo: "Fatima Al Rashdi", clientNo: "1", clientName: "ABC Holdings LLC", type: "Specific", caseFileNo: "21", rate: 5, recurrence: "One-time", effectiveFrom: "2024-05-01", effectiveTo: "2024-12-31" },
  { id: 3, commissionNo: "COM-2024-003", classification: "Consultants", paidTo: "Amina Al Farsi", clientNo: "3", clientName: "Al Madina Trading", type: "General", caseFileNo: "", rate: 7.5, recurrence: "Recurring", effectiveFrom: "2024-07-01", effectiveTo: "" },
];

/** The fees this arrangement has run on so far. */
const feesFor = (record) =>
  legalFeesCollected(record.clientNo, record.effectiveFrom, record.effectiveTo);

/** What it has earned: the fees times the rate, worked out on the spot. */
const commissionOn = (record) =>
  (feesFor(record) * Number(record.rate || 0)) / 100;

/** The next number in the year's run: COM-2026-004. */
function nextCommissionNo(records) {
  const year = new Date().getFullYear();
  const prefix = "COM-" + year + "-";
  const highest = records
    .filter((r) => r.commissionNo.startsWith(prefix))
    .reduce(
      (max, r) => Math.max(max, Number(r.commissionNo.slice(prefix.length))),
      0
    );
  return prefix + String(highest + 1).padStart(3, "0");
}

const emptyDraft = {
  classification: "",
  paidTo: "",
  clientNo: "",
  type: "General",
  rate: "",
  recurrence: "Recurring",
  caseFileNo: "",
  effectiveFrom: "",
  effectiveTo: "",
};

/** A note the form makes about itself. */
function Notice({ children }) {
  return (
    <p className="flex items-start gap-2 text-xs text-primary">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Commission on referred work.
 *
 * Someone the firm works with brings in work for a cut of the fees it earns.
 * What is agreed here is the arrangement - who, on whose fees, at what rate,
 * from when. The money follows on its own: nothing is worked out until the
 * client actually pays, so a commission can never be owed on money that never
 * arrived.
 */
export default function CommissionSection() {
  const { clients } = useClients();

  const [records, setRecords] = useState(initialRecords);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const setField = (name, value) =>
    setDraft((prev) => ({ ...prev, [name]: value }));

  /** Changing the group empties the person, who may not be in the new one. */
  const chooseClassification = (value) =>
    setDraft((prev) => ({ ...prev, classification: value, paidTo: "" }));

  /** A case file only belongs to a specific arrangement. */
  const chooseType = (value) =>
    setDraft((prev) => ({
      ...prev,
      type: value,
      caseFileNo: value === "Specific" ? prev.caseFileNo : "",
    }));

  const isSpecific = draft.type === "Specific";

  const canSave =
    draft.classification &&
    draft.paidTo &&
    draft.clientNo &&
    draft.type &&
    Number(draft.rate) > 0 &&
    draft.recurrence &&
    draft.effectiveFrom &&
    (!isSpecific || draft.caseFileNo);

  const closeForm = () => {
    setAdding(false);
    setDraft(emptyDraft);
  };

  const save = () => {
    const client = clients.find((c) => c.clientNo === draft.clientNo);
    setRecords((prev) => [
      ...prev,
      {
        ...draft,
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        commissionNo: nextCommissionNo(prev),
        clientName: client?.clientName || "",
        rate: Number(draft.rate),
      },
    ]);
    closeForm();
  };

  const columns = [
    {
      key: "commissionNo",
      header: "Commission No.",
      width: "13%",
      cellClassName: "font-medium",
    },
    { key: "clientName", header: "Client", width: "17%" },
    {
      key: "paidTo",
      header: "Paid To",
      width: "16%",
      exportValue: (row) => row.paidTo + " (" + row.classification + ")",
      render: (value, row) => (
        <div>
          <p>{value}</p>
          <p className="text-xs text-muted-foreground">{row.classification}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type & Recurrence",
      width: "15%",
      exportValue: (row) =>
        [
          row.type,
          row.caseFileNo ? "Case file " + row.caseFileNo : "",
          row.recurrence,
        ]
          .filter(Boolean)
          .join(" - "),
      render: (value, row) => (
        <div>
          <p>
            {value}
            {row.caseFileNo && " · Case file " + row.caseFileNo}
          </p>
          <p className="text-xs text-muted-foreground">{row.recurrence}</p>
        </div>
      ),
    },
    {
      // The fees collected, the rate, and what the two come to - kept together
      // because the last one is only meaningful beside the two it came from.
      key: "rate",
      header: "Legal Fees (Before VAT)",
      subHeader: "& Commission Details",
      width: "22%",
      exportValue: (row) =>
        moneyValue(feesFor(row)) +
        " at " +
        row.rate +
        "% = " +
        moneyValue(commissionOn(row)),
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-medium">{money(feesFor(row))}</p>
          <p className="text-xs text-muted-foreground">{value}%</p>
          <p className="text-xs font-medium text-green-700">
            Commission: {money(commissionOn(row))}
          </p>
        </div>
      ),
    },
    {
      key: "effectiveFrom",
      header: "Effective",
      width: "17%",
      exportValue: (row) =>
        row.effectiveFrom + (row.effectiveTo ? " to " + row.effectiveTo : ""),
      render: (value, row) => (
        <div>
          <p>{value}</p>
          <p className="text-xs text-muted-foreground">
            {row.effectiveTo ? "to " + row.effectiveTo : "Open ended"}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-primary">
            {adding ? "Add Commission" : "Commission Records"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Worked out on collected legal fees, before VAT
          </p>
        </div>
        <Button type="button" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Commission
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:gap-6">
              {/* The group is asked for first, so the person list below it is
                  a handful of names rather than the whole firm. */}
              <div className="space-y-2">
                <Label htmlFor="classification">
                  Classification of Paid To
                  <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={draft.classification}
                  onValueChange={chooseClassification}
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

              <div className="space-y-2">
                <Label htmlFor="paidTo">
                  Paid To<span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={draft.paidTo}
                  onValueChange={(value) => setField("paidTo", value)}
                  disabled={!draft.classification}
                >
                  <SelectTrigger id="paidTo">
                    <SelectValue
                      placeholder={
                        draft.classification
                          ? "Select Person"
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

              <div className="space-y-2">
                <Label htmlFor="commissionClient">
                  Client<span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={draft.clientNo}
                  onValueChange={(value) => setField("clientNo", value)}
                >
                  <SelectTrigger id="commissionClient">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.clientNo} value={client.clientNo}>
                        {client.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionType">
                  Commission Type<span className="text-destructive"> *</span>
                </Label>
                <Select value={draft.type} onValueChange={chooseType}>
                  <SelectTrigger id="commissionType">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMISSION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">
                  Commission Percentage
                  <span className="text-destructive"> *</span>
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="recurrence">
                  Recurrence<span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={draft.recurrence}
                  onValueChange={(value) => setField("recurrence", value)}
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Select Recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* What the arrangement runs on, and for how long */}
            <div className="grid grid-cols-1 gap-4 rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-l-lg bg-secondary/50 p-4">
                <Notice>
                  If you select &ldquo;Specific&rdquo; commission type, please
                  choose the case file.
                </Notice>
              </div>

              <div className="space-y-2 p-4">
                <Label htmlFor="caseFileNo">Case File Number</Label>
                <Select
                  value={draft.caseFileNo}
                  onValueChange={(value) => setField("caseFileNo", value)}
                  disabled={!isSpecific}
                >
                  <SelectTrigger id="caseFileNo">
                    <SelectValue placeholder="Select Case File" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientLinkedCases.map((legalCase) => (
                      <SelectItem key={legalCase.id} value={legalCase.fileNo}>
                        {legalCase.fileNo} &middot; {legalCase.opponent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 p-4">
                <Label htmlFor="effectiveFrom">
                  Effective From<span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={draft.effectiveFrom}
                  max={draft.effectiveTo || undefined}
                  onChange={(e) => setField("effectiveFrom", e.target.value)}
                />
              </div>

              <div className="space-y-2 p-4">
                <Label htmlFor="effectiveTo">Effective To</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={draft.effectiveTo}
                  min={draft.effectiveFrom || undefined}
                  onChange={(e) => setField("effectiveTo", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for an open-ended arrangement
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4">
              <Notice>
                Commission will be calculated automatically when legal fees are
                collected:
                {/* The formula on its own line: it is the thing being said,
                    not an aside to the sentence above it. */}
                <span className="mt-1 block font-semibold">
                  Legal Fees (Before VAT) &times; Commission Percentage =
                  Commission Amount
                </span>
              </Notice>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={!canSave}>
                Save Commission
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={records}
        searchPlaceholder="Search commissions..."
        exportFileName="commission-records.csv"
        enableColumnSearch={false}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
