import { useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import FormHeading from "@/components/shared/FormHeading";
import { Plus, Percent } from "lucide-react";
import { withRial } from "@/lib/money";
import {
  commissionRecords,
  feesFor,
  commissionOn,
  monthAndYear,
  recurrenceOf,
  nextCommissionNo,
} from "../commissionData";
import CommissionForm from "./CommissionForm";

const moneyValue = (amount) =>
  Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const money = (amount) => withRial(moneyValue(amount));

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
  const [records, setRecords] = useState(commissionRecords);
  const [adding, setAdding] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const closeForm = () => setAdding(false);

  /** The form settles what was agreed; the list gives it its number. */
  const save = (record) => {
    setRecords((prev) => [
      ...prev,
      {
        ...record,
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        commissionNo: nextCommissionNo(prev),
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
      header: "Beneficiary",
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
      // The month it started, read off the date it takes effect.
      key: "monthYear",
      header: "Month & Year",
      width: "10%",
      exportValue: monthAndYear,
      render: (value, row) => monthAndYear(row),
    },
    {
      key: "type",
      header: "Type & Recurrence",
      width: "15%",
      exportValue: (row) =>
        [
          row.type,
          row.caseFileNo ? "Case file " + row.caseFileNo : "",
          recurrenceOf(row),
        ]
          .filter(Boolean)
          .join(" - "),
      render: (value, row) => (
        <div>
          <p>
            {value}
            {row.caseFileNo && " · Case file " + row.caseFileNo}
          </p>
          <p className="text-xs text-muted-foreground">
            {recurrenceOf(row)}
          </p>
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
      key: "periodFrom",
      header: "Period",
      width: "17%",
      exportValue: (row) =>
        row.periodFrom + (row.periodTo ? " to " + row.periodTo : ""),
      render: (value, row) => (
        <div>
          <p>{value}</p>
          <p className="text-xs text-muted-foreground">
            {row.periodTo ? "to " + row.periodTo : "Open ended"}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* The section's own heading, so the way to add to it sits on the
          same line rather than costing a row of its own. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        {/* The form opened above the list, so back means close it. */}
        <FormHeading
          title={adding ? "Add Commission" : "Commission Records"}
          icon={Percent}
          onBack={adding ? closeForm : undefined}
        />
        <Button type="button" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Commission
        </Button>
      </div>

      {adding && (
        <CommissionForm onCancel={closeForm} onSave={save} />
      )}

      {/* The list stays under the form rather than making way for it: a
          new record is judged against the ones already there. */}
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
