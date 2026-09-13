import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/shared/DataTable";
import FormHeading from "@/components/shared/FormHeading";
import { IdStatusDot } from "@/components/shared/panels";
import { Box, FileText, Plus, ShoppingCart, Wallet } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import { useSuppliers } from "@/lib/suppliers/context";
import { useAssets } from "@/lib/assets/context";
import { Field, FieldLabel, Choice, Attach } from "@/pages/leases/fields";
import {
  CASH,
  LEASE_PAYMENT_METHODS as PAYMENT_METHODS,
  accountLabel,
  omr,
  shortDate,
  todayIso,
} from "@/pages/leases/leaseData";
import {
  ASSET_TYPES,
  ASSET_STATUS,
  accumulatedDepreciation,
  netBookValue,
} from "./assetData";

const emptyDraft = {
  branchId: "",
  name: "",
  type: "",
  brandModel: "",
  serialNo: "",
  purchaseDate: "",
  supplier: "",
  invoiceNo: "",
  purchaseInvoiceFile: "",
  warrantyFile: "",
  cost: "",
  rate: "",
  method: "",
  bankAccountId: "",
  transactionNo: "",
  receiptFile: "",
};

/** A typed field, with anything that belongs beside the input (an upload) after it. */
function TextField({ id, label, required, value, onChange, placeholder, type, inputMode, max, children }) {
  return (
    <Field>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1"
        />
        {children}
      </div>
    </Field>
  );
}

/** A document kept with the asset, named in its tooltip. */
function DocLink({ file, label }) {
  if (!file) return null;
  return (
    <p title={file} className="flex items-center gap-1.5 text-xs font-medium text-primary">
      <FileText className="h-3.5 w-3.5 shrink-0" />
      {label}
    </p>
  );
}

/** Only digits and one decimal point, for amounts and rates. */
const decimal = (value) => value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");

/**
 * The fixed asset register.
 *
 * Each asset shows what it is, where and when it was bought, what it cost, the
 * rate it depreciates at, and how it was paid - with the invoice, warranty and
 * transfer receipt kept beside the figures they back. What it has lost so far
 * and what it is still worth are worked out from the cost, the rate and the
 * years since it was bought, never typed in.
 */
export default function AssetsPage() {
  const { branches, bankAccounts } = useFirm();
  const { suppliers } = useSuppliers();
  const { assets, addAsset } = useAssets();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const isCash = draft.method === CASH;

  /** Cash never touches a bank, so choosing it clears the account. */
  const chooseMethod = (value) =>
    setDraft((prev) => ({
      ...prev,
      method: value,
      bankAccountId: value === CASH ? "" : prev.bankAccountId,
    }));

  const branchLabel = (branchId) => {
    const branch = branches.find((option) => option.id === Number(branchId));
    return branch ? branch.name + " Branch" : "-";
  };
  const accountOf = (id) => bankAccounts.find((account) => account.id === Number(id));

  const canSave =
    draft.branchId &&
    draft.name.trim() &&
    draft.type &&
    draft.purchaseDate &&
    draft.supplier &&
    Number(draft.cost) > 0 &&
    Number(draft.rate) > 0 &&
    Number(draft.rate) <= 100 &&
    draft.method &&
    (isCash || draft.bankAccountId);

  const close = () => {
    setAdding(false);
    setDraft(emptyDraft);
  };

  const save = () => {
    if (!canSave) return;
    addAsset({
      ...draft,
      branchId: Number(draft.branchId),
      name: draft.name.trim(),
      brandModel: draft.brandModel.trim(),
      serialNo: draft.serialNo.trim(),
      invoiceNo: draft.invoiceNo.trim(),
      transactionNo: draft.transactionNo.trim(),
      cost: Number(draft.cost),
      rate: Number(draft.rate),
      bankAccountId: isCash ? "" : Number(draft.bankAccountId),
      status: "active",
    });
    // New assets join the end of the register, so show the page they land on.
    setCurrentPage(Math.ceil((assets.length + 1) / pageSize));
    close();
  };

  const rows = assets.map((asset) => ({
    ...asset,
    branchLabel: branchLabel(asset.branchId),
    accumulated: accumulatedDepreciation(asset),
    netBookValue: netBookValue(asset),
  }));

  const paymentLines = (row) => {
    if (row.method === CASH) return [];
    const account = accountOf(row.bankAccountId);
    return account ? [account.bankName, account.accountNumber] : ["-"];
  };

  const figure = (value) => <span className="font-semibold text-primary">{omr(value)}</span>;

  const columns = [
    {
      // The dot says where the asset stands, so there is no status column.
      key: "assetNo",
      header: "Asset No.",
      subHeader: "Branch",
      width: "9%",
      exportValue: (row) =>
        row.assetNo + " - " + row.branchLabel + " (" + ASSET_STATUS[row.status].label + ")",
      sortValue: (row) => row.assetNo,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <IdStatusDot status={ASSET_STATUS[row.status].label} tone={ASSET_STATUS[row.status].dot} />
          <div>
            <p className="text-base font-semibold text-primary">{value}</p>
            <p className="whitespace-nowrap text-primary/80">{row.branchLabel}</p>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Asset Details",
      subHeader: "Name / Type / Brand & Model / Serial No.",
      width: "16%",
      exportValue: (row) =>
        [row.name, row.type, row.brandModel, row.serialNo && "SN: " + row.serialNo]
          .filter(Boolean)
          .join(" - "),
      sortValue: (row) => row.name,
      render: (value, row) => (
        <div className="text-primary/80">
          <p className="font-semibold text-primary">{value}</p>
          <p>{row.type}</p>
          {row.brandModel && <p>{row.brandModel}</p>}
          {row.serialNo && <p>SN: {row.serialNo}</p>}
        </div>
      ),
    },
    {
      key: "purchaseDate",
      header: "Purchase Details",
      subHeader: "Date / Supplier / Invoice No.",
      width: "15%",
      exportValue: (row) =>
        [shortDate(row.purchaseDate), row.supplier, row.invoiceNo].filter(Boolean).join(" - "),
      sortValue: (row) => row.purchaseDate,
      render: (value, row) => (
        <div className="space-y-0.5 text-primary/80">
          <p className="font-semibold text-primary">{shortDate(value)}</p>
          <p>{row.supplier}</p>
          {row.invoiceNo && <p>{row.invoiceNo}</p>}
          <DocLink file={row.purchaseInvoiceFile} label="Purchase Invoice" />
          <DocLink file={row.warrantyFile} label="Warranty Invoice" />
        </div>
      ),
    },
    {
      key: "cost",
      header: "Cost (OMR)",
      width: "9%",
      className: "text-center",
      cellClassName: "text-center",
      exportValue: (row) => omr(row.cost),
      sortValue: (row) => row.cost,
      render: (value) => figure(value),
    },
    {
      key: "rate",
      header: "Depreciation Rate",
      subHeader: "(Per Annum)",
      width: "9%",
      className: "text-center",
      cellClassName: "text-center",
      exportValue: (row) => row.rate + "%",
      sortValue: (row) => row.rate,
      render: (value) => <span className="text-primary/80">{value}%</span>,
    },
    {
      // Worked out from the cost, the rate and the full years since purchase.
      key: "accumulated",
      header: "Accumulated Depreciation",
      subHeader: "(OMR)",
      width: "10%",
      className: "text-center",
      cellClassName: "text-center",
      disableSort: true,
      exportValue: (row) => omr(row.accumulated),
      render: (value) => figure(value),
    },
    {
      key: "netBookValue",
      header: "Net Book Value",
      subHeader: "(OMR)",
      width: "9%",
      className: "text-center",
      cellClassName: "text-center",
      exportValue: (row) => omr(row.netBookValue),
      sortValue: (row) => row.netBookValue,
      render: (value) => figure(value),
    },
    {
      key: "method",
      header: "Payment Details",
      subHeader: "Method / Bank / Account No. / Transaction No.",
      width: "16%",
      disableSort: true,
      exportValue: (row) =>
        [row.method, ...paymentLines(row), row.transactionNo].filter(Boolean).join(" - "),
      render: (value, row) => (
        <div className="space-y-0.5 text-primary/80">
          <p className="font-semibold text-primary">{value}</p>
          {paymentLines(row).map((line) => (
            <p key={line}>{line}</p>
          ))}
          {row.transactionNo && <p>{row.transactionNo}</p>}
          <DocLink file={row.receiptFile} label="Transfer Receipt" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Box className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">Assets</h1>
            <p className="text-xs text-primary/75 sm:text-sm">Fixed Asset Register</p>
          </div>
        </div>
        <Button type="button" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <FormHeading title="Asset Details" note="What the asset is and where it is used" icon={Box} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-6">
              <Choice
                id="assetBranch"
                label="Branch"
                required
                value={draft.branchId}
                onChange={(value) => set("branchId", value)}
                options={branches.map((branch) => ({ value: String(branch.id), label: branch.name }))}
                placeholder="Select Branch"
              />
              <TextField
                id="assetName"
                label="Asset Name"
                required
                value={draft.name}
                onChange={(value) => set("name", value)}
                placeholder="e.g. Laptop"
              />
              <Choice
                id="assetType"
                label="Asset Type"
                required
                value={draft.type}
                onChange={(value) => set("type", value)}
                options={ASSET_TYPES.map((type) => ({ value: type, label: type }))}
              />
              <TextField
                id="assetBrandModel"
                label="Brand & Model"
                value={draft.brandModel}
                onChange={(value) => set("brandModel", value)}
                placeholder="e.g. Dell Latitude 5440"
              />
              <TextField
                id="assetSerialNo"
                label="Serial No."
                value={draft.serialNo}
                onChange={(value) => set("serialNo", value)}
                placeholder="e.g. DL5440-9823"
              />
            </div>

            <FormHeading title="Purchase Details" note="When, from whom and for how much" icon={ShoppingCart} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-6">
              <TextField
                id="assetPurchaseDate"
                label="Purchase Date"
                required
                type="date"
                max={todayIso()}
                value={draft.purchaseDate}
                onChange={(value) => set("purchaseDate", value)}
              />
              <Choice
                id="assetSupplier"
                label="Supplier"
                required
                value={draft.supplier}
                onChange={(value) => set("supplier", value)}
                options={suppliers
                  .filter((supplier) => supplier.status === "Active")
                  .map((supplier) => ({ value: supplier.name, label: supplier.name }))}
                placeholder="Select supplier"
              />
              {/* The invoice number, with the purchase invoice and the warranty beside it. */}
              <TextField
                id="assetInvoiceNo"
                label="Invoice No."
                value={draft.invoiceNo}
                onChange={(value) => set("invoiceNo", value)}
                placeholder="e.g. INV-4587"
              >
                <Attach
                  id="assetPurchaseInvoice"
                  file={draft.purchaseInvoiceFile}
                  onFile={(name) => set("purchaseInvoiceFile", name)}
                  what="purchase invoice"
                />
                <Attach
                  id="assetWarranty"
                  file={draft.warrantyFile}
                  onFile={(name) => set("warrantyFile", name)}
                  what="warranty invoice"
                />
              </TextField>
              <TextField
                id="assetCost"
                label="Cost (OMR)"
                required
                inputMode="decimal"
                value={draft.cost}
                onChange={(value) => set("cost", decimal(value))}
                placeholder="0.000"
              />
              <TextField
                id="assetRate"
                label="Depreciation Rate (% Per Annum)"
                required
                inputMode="decimal"
                value={draft.rate}
                onChange={(value) => set("rate", decimal(value))}
                placeholder="e.g. 20"
              />
            </div>

            <FormHeading title="Payment Details" note="How the asset was paid for" icon={Wallet} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-6">
              <Choice
                id="assetMethod"
                label="Payment Method"
                required
                value={draft.method}
                onChange={chooseMethod}
                options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
                placeholder="Select payment method"
              />
              <Choice
                id="assetBankAccount"
                label="Bank Account"
                required={!isCash}
                value={draft.bankAccountId}
                onChange={(value) => set("bankAccountId", value)}
                options={bankAccounts
                  .filter((account) => account.active)
                  .map((account) => ({ value: String(account.id), label: accountLabel(account) }))}
                placeholder={isCash ? "Not needed for cash" : "Select bank account"}
                disabled={isCash}
              />
              <TextField
                id="assetTransactionNo"
                label="Transaction No."
                value={draft.transactionNo}
                onChange={(value) => set("transactionNo", value)}
                placeholder="e.g. TRX-20250115-001"
              >
                <Attach
                  id="assetReceipt"
                  file={draft.receiptFile}
                  onFile={(name) => set("receiptFile", name)}
                  what="transfer receipt"
                />
              </TextField>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={!canSave}>
                Save
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
            searchPlaceholder="Ask AI anything..."
            exportFileName="assets.csv"
            enableColumnSearch={false}
            enableSorting
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
