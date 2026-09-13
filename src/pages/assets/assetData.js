/**
 * The firm's fixed assets: laptops, printers, furniture - anything bought to
 * be used for years rather than used up.
 *
 * An asset records what was bought, from whom, for how much, how it was paid
 * and the rate it loses value at. What it has lost so far and what it is still
 * worth follow from those and today's date, so they are worked out each time
 * rather than stored.
 */
import { todayIso } from "@/pages/leases/leaseData";

export const ASSET_TYPES = [
  "IT Equipment",
  "Office Equipment",
  "Furniture",
  "Electronics",
  "Vehicles",
  "Other",
];

/** Where an asset stands. The dot beside its number shows it. */
export const ASSET_STATUS = {
  active: { label: "Active", dot: "bg-green-500" },
  maintenance: { label: "Under Maintenance", dot: "bg-orange-400" },
  disposed: { label: "Disposed", dot: "bg-slate-500" },
};

const round3 = (value) => Math.round(value * 1000) / 1000;

/** Whole years from one YYYY-MM-DD date to another: 15/01/2025 to 13/09/2026 is 1. */
export function fullYearsBetween(from, to) {
  if (!from || !to || to < from) return 0;
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  let years = toYear - fromYear;
  if (toMonth < fromMonth || (toMonth === fromMonth && toDay < fromDay)) years -= 1;
  return Math.max(years, 0);
}

/**
 * What the asset has lost so far: straight-line, a full year's rate for every
 * full year since it was bought, and never more than it cost.
 */
export function accumulatedDepreciation(asset, today = todayIso()) {
  const cost = Number(asset.cost || 0);
  const perYear = (cost * Number(asset.rate || 0)) / 100;
  return round3(Math.min(cost, perYear * fullYearsBetween(asset.purchaseDate, today)));
}

/** What the asset is still worth on the books. */
export const netBookValue = (asset, today = todayIso()) =>
  round3(Number(asset.cost || 0) - accumulatedDepreciation(asset, today));

/** The next asset number in the register: A006 after A005. */
export function nextAssetNo(assets) {
  const highest = assets.reduce(
    (max, asset) => Math.max(max, Number(String(asset.assetNo).replace(/\D/g, "")) || 0),
    0
  );
  return "A" + String(highest + 1).padStart(3, "0");
}

// branchId points at the firm's branches (1 Muscat, 2 Salalah, 3 Sohar) and
// bankAccountId at the firm account the asset was paid from.
const a = (id, assetNo, branchId, name, type, brandModel, serialNo, purchaseDate, supplier, invoiceNo, cost, rate, method, bankAccountId, transactionNo, status) => ({
  id, assetNo, branchId, name, type, brandModel, serialNo, purchaseDate, supplier, invoiceNo, cost, rate, method, bankAccountId, transactionNo, status,
  purchaseInvoiceFile: invoiceNo + ".pdf",
  warrantyFile: "Warranty-" + serialNo + ".pdf",
  receiptFile: transactionNo + ".pdf",
});

export const initialAssets = [
  a(1, "A001", 1, "Laptop", "IT Equipment", "Dell Latitude 5440", "DL5440-9823", "2025-01-15", "Bahwan Computers", "INV-4587", 420, 20, "Bank Transfer", 1, "TRX-20250115-001", "active"),
  a(2, "A002", 2, "Printer", "Office Equipment", "HP LaserJet Pro", "HP-774321", "2024-03-10", "Tech World LLC", "INV-2210", 126, 15, "Bank Transfer", 2, "TRX-20240310-002", "active"),
  a(3, "A003", 1, "Office Desk", "Furniture", "IKEA", "IK-3301", "2023-06-05", "Oman Office Supplies", "INV-7781", 84, 10, "Standing Order", 1, "TRX-20230605-003", "maintenance"),
  a(4, "A004", 1, "Projector", "Electronics", "Epson EB-X06", "EP-660921", "2022-11-22", "Al Hinai Trading", "INV-6623", 315, 25, "Bank Transfer", 4, "TRX-20221122-004", "disposed"),
  a(5, "A005", 2, "Office Chair", "Furniture", "Herman Miller", "HM-8831", "2024-02-17", "Muscat Furnishings", "INV-3090", 63, 10, "Bank Transfer", 3, "TRX-20240217-005", "active"),
];
