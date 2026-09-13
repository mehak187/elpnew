/**
 * The firm's fixed assets: laptops, printers, furniture - anything bought to
 * be used for years rather than used up.
 *
 * An asset starts from its purchase invoice and the expense it is booked
 * under; what it is, what it cost, its depreciation rate and how it was paid
 * are completed afterwards. What it has lost so far and what it is still worth
 * follow from the cost, the rate and today's date, so they are worked out each
 * time rather than stored.
 */
import { EXPENSE_TYPES } from "@/lib/expenses/taxonomy";
import { todayIso } from "@/pages/leases/leaseData";

/** Every asset is booked as a purchase of assets. */
export const ASSET_EXPENSE_TYPE = "Purchase of Assets";

// Of the fixed-asset expense categories, the ones that buy something the firm
// keeps - maintenance, registration and the like are running costs, not assets.
const PURCHASE_CATEGORIES = ["Fixed Asset Purchase", "Capital Improvements & Fit-Out"];

/** The categories an asset can be booked under, each with its subcategories. */
export const ASSET_CATEGORIES = (
  EXPENSE_TYPES.find((type) => type.key === "fixed-assets")?.children || []
)
  .filter((category) => PURCHASE_CATEGORIES.includes(category.name))
  .map((category) => ({
    name: category.name,
    subcategories: (category.children || []).map((sub) => sub.name),
  }));

/**
 * Where an asset stands. The dot beside its number shows it.
 *
 * Pending is never stored: an asset whose cost has not been entered yet cannot
 * be anything else, whatever its status says.
 */
export const ASSET_STATUS = {
  pending: { label: "Details pending", dot: "bg-gray-300" },
  active: { label: "Active", dot: "bg-green-500" },
  maintenance: { label: "Under Maintenance", dot: "bg-orange-400" },
  disposed: { label: "Disposed", dot: "bg-slate-500" },
};

export const assetState = (asset) =>
  Number(asset.cost) > 0 ? asset.status || "active" : "pending";

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
// bankAccountId at the firm account the asset was paid from. The purchase date
// is the invoice date.
const a = (id, assetNo, branchId, name, type, brandModel, serialNo, purchaseDate, supplier, invoiceNo, subcategory, cost, rate, method, bankAccountId, transactionNo, status) => ({
  id, assetNo, branchId, name, type, brandModel, serialNo, purchaseDate, supplier, invoiceNo, cost, rate, method, bankAccountId, transactionNo, status,
  invoiceFile: invoiceNo + ".pdf",
  invoiceLater: false,
  guaranteeNo: "GN-" + serialNo,
  guaranteeFile: "Guarantee-" + serialNo + ".pdf",
  receiptFile: transactionNo + ".pdf",
  expenseType: ASSET_EXPENSE_TYPE,
  category: "Fixed Asset Purchase",
  subcategory,
});

export const initialAssets = [
  a(1, "A001", 1, "Laptop", "IT Equipment", "Dell Latitude 5440", "DL5440-9823", "2025-01-15", "Bahwan Computers", "INV-4587", "Computers & Laptops", 420, 20, "Bank Transfer", 1, "TRX-20250115-001", "active"),
  a(2, "A002", 2, "Printer", "Office Equipment", "HP LaserJet Pro", "HP-774321", "2024-03-10", "Tech World LLC", "INV-2210", "Printers & Photocopiers", 126, 15, "Bank Transfer", 2, "TRX-20240310-002", "active"),
  a(3, "A003", 1, "Office Desk", "Furniture", "IKEA", "IK-3301", "2023-06-05", "Oman Office Supplies", "INV-7781", "Office Furniture", 84, 10, "Standing Order", 1, "TRX-20230605-003", "maintenance"),
  a(4, "A004", 1, "Projector", "Electronics", "Epson EB-X06", "EP-660921", "2022-11-22", "Al Hinai Trading", "INV-6623", "IT & Network Equipment", 315, 25, "Bank Transfer", 4, "TRX-20221122-004", "disposed"),
  a(5, "A005", 2, "Office Chair", "Furniture", "Herman Miller", "HM-8831", "2024-02-17", "Muscat Furnishings", "INV-3090", "Office Furniture", 63, 10, "Bank Transfer", 3, "TRX-20240217-005", "active"),
];
