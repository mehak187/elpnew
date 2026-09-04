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
import { Plus } from "lucide-react";
import { withRial } from "@/lib/money";
import { useClients } from "@/lib/clients/context";
import { clientInvoices } from "@/pages/clients/clientMockData";

const moneyValue = (amount) =>
  Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const money = (amount) => withRial(moneyValue(amount));

/**
 * The legal fees a client settled between two dates.
 *
 * Commission is owed on fees, not on tax, so the VAT on each invoice is left
 * out - an invoice of 1,050 made of 1,000 fees and 50 VAT earns commission on
 * the 1,000. Only invoices actually paid count, and they count on the day the
 * money arrived rather than the day the invoice was raised, because that is the
 * period the person is asking about.
 */
function legalFeesPaid(clientNo, from, to) {
  if (!clientNo || !from || !to) return 0;
  return clientInvoices
    .filter(
      (invoice) =>
        invoice.clientNo === clientNo &&
        invoice.status === "Paid" &&
        invoice.paidDate >= from &&
        invoice.paidDate <= to
    )
    .reduce((sum, invoice) => sum + Number(invoice.legalFees || 0), 0);
}

/**
 * What has been paid out on referred work.
 *
 * A record holds the fees it was worked out on and the rate agreed, never the
 * commission itself - that is multiplication, and a stored answer can disagree
 * with the two numbers it came from.
 */
const initialRecords = [
  { id: 1, commissionNo: "COM-2024-001", clientNo: "1", clientName: "ABC Holdings LLC", date: "2024-02-15", paidTo: "Ahmed Al Jabri", legalFees: 4725, rate: 10, notes: "Retainer - Q1 2024" },
  { id: 2, commissionNo: "COM-2024-002", clientNo: "1", clientName: "ABC Holdings LLC", date: "2024-05-02", paidTo: "Ahmed Al Jabri", legalFees: 6000, rate: 10, notes: "Court fees - file 21" },
  { id: 3, commissionNo: "COM-2024-003", clientNo: "17", clientName: "XYZ Investments", date: "2024-07-08", paidTo: "Fatma Al Busaidi", legalFees: 2100, rate: 10, notes: "Advisory retainer - Q2" },
];

/** What a record earns: the fees times the rate, worked out on the spot. */
const commissionOn = (record) =>
  (Number(record.legalFees || 0) * Number(record.rate || 0)) / 100;

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
  clientNo: "",
  paidTo: "",
  fromDate: "",
  toDate: "",
  percent: "",
  notes: "",
};

/**
 * Commission on referred work.
 *
 * Someone inside a client's legal department refers work to the firm for a cut
 * of the fees it brings in. The fees are not typed in - they are read off the
 * invoices that client actually paid inside the period, so a record cannot
 * claim commission on money that never arrived.
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

  const rate = Number(draft.percent) || 0;
  const fees = legalFeesPaid(draft.clientNo, draft.fromDate, draft.toDate);
  const due = (fees * rate) / 100;

  const canSave =
    draft.clientNo && draft.paidTo && rate > 0 && draft.fromDate && draft.toDate;

  const closeForm = () => {
    setAdding(false);
    setDraft(emptyDraft);
  };

  const save = () => {
    const client = clients.find((c) => c.clientNo === draft.clientNo);
    setRecords((prev) => [
      ...prev,
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        commissionNo: nextCommissionNo(prev),
        clientNo: draft.clientNo,
        clientName: client?.clientName || "",
        // The day the record was made, which is the day the commission was
        // settled - the period it covers is already in the fees.
        date: new Date().toISOString().slice(0, 10),
        paidTo: draft.paidTo,
        legalFees: fees,
        rate,
        notes: draft.notes,
      },
    ]);
    closeForm();
  };

  const columns = [
    {
      key: "commissionNo",
      header: "Commission No.",
      width: "14%",
      cellClassName: "font-medium",
    },
    { key: "clientName", header: "Client", width: "18%" },
    { key: "date", header: "Date", width: "12%" },
    { key: "paidTo", header: "Paid To", width: "16%" },
    {
      // The fees, the rate, and what the two come to - kept together because
      // the last one is only meaningful beside the two it came from.
      key: "legalFees",
      header: "Legal Fees (Before VAT)",
      subHeader: "& Commission Details",
      width: "22%",
      exportValue: (row) =>
        moneyValue(row.legalFees) +
        " at " +
        row.rate +
        "% = " +
        moneyValue(commissionOn(row)),
      render: (value, row) => (
        <div className="space-y-0.5">
          <p className="font-medium">{money(value)}</p>
          <p className="text-xs text-muted-foreground">{row.rate}%</p>
          <p className="text-xs font-medium text-green-700">
            Commission: {money(commissionOn(row))}
          </p>
        </div>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      width: "18%",
      render: (value) =>
        value || <span className="text-muted-foreground">-</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-primary">Commission Records</h2>
          <p className="text-xs text-muted-foreground">
            Worked out on paid legal fees, before VAT
          </p>
        </div>
        {!adding && (
          <Button type="button" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Commission
          </Button>
        )}
      </div>

      {/* The form is the calculator: pick the client, the period and the rate,
          and the fees are read off the invoices they actually paid. */}
      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="commissionCompany">Company (Client) *</Label>
                <Select
                  value={draft.clientNo}
                  onValueChange={(value) => setField("clientNo", value)}
                >
                  <SelectTrigger id="commissionCompany">
                    <SelectValue placeholder="Please Select" />
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
                <Label htmlFor="commissionPaidTo">Paid To *</Label>
                <Input
                  id="commissionPaidTo"
                  value={draft.paidTo}
                  onChange={(e) => setField("paidTo", e.target.value)}
                  placeholder="Who the commission is paid to"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionPercent">
                  Commission Percentage *
                </Label>
                <div className="relative">
                  <Input
                    id="commissionPercent"
                    inputMode="decimal"
                    value={draft.percent}
                    onChange={(e) =>
                      setField("percent", e.target.value.replace(/[^\d.]/g, ""))
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
                <Label htmlFor="commissionFrom">From Date *</Label>
                <Input
                  id="commissionFrom"
                  type="date"
                  value={draft.fromDate}
                  max={draft.toDate || undefined}
                  onChange={(e) => setField("fromDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionTo">To Date *</Label>
                <Input
                  id="commissionTo"
                  type="date"
                  value={draft.toDate}
                  min={draft.fromDate || undefined}
                  onChange={(e) => setField("toDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionNotes">Notes</Label>
                <Input
                  id="commissionNotes"
                  value={draft.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="What this commission is for"
                />
              </div>
            </div>

            {/* The answer, before it is written down */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Legal Fees Paid in Period
                </p>
                <p className="text-lg font-bold">{money(fees)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Commission Due</p>
                <p className="text-lg font-bold text-green-700">
                  {canSave ? money(due) : "-"}
                </p>
              </div>
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
