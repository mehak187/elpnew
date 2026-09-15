/**
 * The firm's fixed assets: laptops, printers, furniture - anything bought to
 * be used for years rather than used up.
 *
 * An asset starts from its purchase invoice and the expense it is booked
 * under; what it is, its documents, its expenses and how it depreciates are
 * completed on its own page. What it cost is what its purchase invoices add up
 * to, and what it has lost so far and what it is still worth follow from that,
 * the depreciation settings and today's date - all worked out each time rather
 * than stored.
 */
import { EXPENSE_TYPES } from "@/lib/expenses/taxonomy";
import { todayIso, vatOf, totalOf } from "@/pages/leases/leaseData";

/** A new asset is booked as a purchase of assets. */
export const ASSET_EXPENSE_TYPE = "Purchase of Assets";

/** The expense type everything spent on an asset afterwards is booked under. */
export const FIXED_ASSET_EXPENSES =
  EXPENSE_TYPES.find((type) => type.key === "fixed-assets")?.name || "Fixed Asset Expenses";

/** Every fixed-asset expense category, each with its subcategories. */
export const ASSET_EXPENSE_CATEGORIES = (
  EXPENSE_TYPES.find((type) => type.key === "fixed-assets")?.children || []
).map((category) => ({
  name: category.name,
  subcategories: (category.children || []).map((sub) => sub.name),
}));

// The categories that buy something the firm keeps - maintenance,
// registration and the like are running costs, and add nothing to the cost.
const PURCHASE_CATEGORIES = ["Fixed Asset Purchase", "Capital Improvements & Fit-Out"];

export const isPurchaseCategory = (name) => PURCHASE_CATEGORIES.includes(name);

/** The categories an asset itself is classified under. */
export const ASSET_CATEGORIES = ASSET_EXPENSE_CATEGORIES.filter((category) =>
  isPurchaseCategory(category.name)
);

/** The subcategories of one category in a list. */
export const subcategoriesIn = (categories, name) =>
  categories.find((category) => category.name === name)?.subcategories || [];

/**
 * Where an asset stands. The dot beside its number shows it.
 *
 * Pending is never stored: an asset with no purchase invoice recorded has no
 * cost, and cannot be anything else whatever its status says.
 */
export const ASSET_STATUS = {
  pending: { label: "Details pending", dot: "bg-gray-300" },
  active: { label: "Active", dot: "bg-green-500" },
  maintenance: { label: "Under Maintenance", dot: "bg-orange-400" },
  disposed: { label: "Disposed", dot: "bg-slate-500" },
};

export const DEPRECIATION_METHODS = ["Straight-Line", "Declining Balance"];
const DECLINING_BALANCE = "Declining Balance";

const round3 = (value) => Math.round(value * 1000) / 1000;

/** An expense's VAT and total, from its amount before VAT. */
export const expenseVat = (expense) => vatOf(expense.amount, expense.vatApplied);
export const expenseTotal = (expense) => totalOf(expense.amount, expense.vatApplied);

/** What the asset cost: its purchase invoices, before VAT. */
export const assetCost = (asset) =>
  round3(
    (asset.expenses || [])
      .filter((expense) => isPurchaseCategory(expense.category))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  );

export const assetState = (asset) =>
  assetCost(asset) > 0 ? asset.status || "active" : "pending";

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
 * What the asset has lost so far, a year at a time for every full year since
 * it was bought.
 *
 * Straight-line takes the same share of the cost each year, and stops once the
 * cost is used up. Declining balance takes the rate from whatever value is
 * left, so each year takes less than the one before.
 */
export function accumulatedDepreciation(asset, today = todayIso()) {
  const cost = assetCost(asset);
  const rate = Math.min(Number(asset.rate || 0), 100) / 100;
  const years = fullYearsBetween(asset.purchaseDate, today);
  if (!cost || !rate || !years) return 0;
  if (asset.depreciationMethod === DECLINING_BALANCE) {
    return round3(cost * (1 - Math.pow(1 - rate, years)));
  }
  return round3(Math.min(cost, cost * rate * years));
}

/** What the asset is still worth on the books. */
export const netBookValue = (asset, today = todayIso()) =>
  round3(assetCost(asset) - accumulatedDepreciation(asset, today));

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
// is the invoice date, and the purchase invoice is the asset's first expense.
const a = (id, assetNo, branchId, name, brandModel, serialNo, purchaseDate, supplier, invoiceNo, subcategory, cost, rate, usefulLife, method, bankAccountId, transactionNo, status, laterExpenses = []) => ({
  id, assetNo, branchId, name, brandModel, serialNo, purchaseDate, supplier, invoiceNo, subcategory, rate, usefulLife, method, bankAccountId, transactionNo, status,
  expenseType: ASSET_EXPENSE_TYPE,
  category: "Fixed Asset Purchase",
  depreciationMethod: "Straight-Line",
  invoiceFile: invoiceNo + ".pdf",
  invoiceLater: false,
  guaranteeNo: "GN-" + serialNo,
  guaranteeFile: "Guarantee-" + serialNo + ".pdf",
  receiptFile: transactionNo + ".pdf",
  documents: [{ id: 1, name: "Delivery Note", file: "DN-" + invoiceNo + ".pdf", uploadedOn: purchaseDate }],
  expenses: [
    { id: 1, category: "Fixed Asset Purchase", subcategory, invoiceNo, invoiceDate: purchaseDate, amount: cost, vatApplied: true, payee: supplier, invoiceFile: invoiceNo + ".pdf" },
    ...laterExpenses.map((expense, index) => ({ id: index + 2, vatApplied: true, invoiceFile: "", ...expense })),
  ],
});

export const initialAssets = [
  a(1, "A001", 1, "Laptop", "Dell Latitude 5440", "DL5440-9823", "2025-01-15", "Bahwan Computers", "INV-4587", "Computers & Laptops", 420, 20, 5, "Bank Transfer", 1, "TRX-20250115-001", "active", [
    { category: "Asset Maintenance & Repairs", subcategory: "Computer & Printer Maintenance", invoiceNo: "INV-5120", invoiceDate: "2026-02-10", amount: 12, payee: "Bahwan Computers" },
  ]),
  a(2, "A002", 2, "Printer", "HP LaserJet Pro", "HP-774321", "2024-03-10", "Tech World LLC", "INV-2210", "Printers & Photocopiers", 126, 15, 7, "Bank Transfer", 2, "TRX-20240310-002", "active"),
  a(3, "A003", 1, "Office Desk", "IKEA", "IK-3301", "2023-06-05", "Oman Office Supplies", "INV-7781", "Office Furniture", 84, 10, 10, "Standing Order", 1, "TRX-20230605-003", "maintenance", [
    { category: "Asset Maintenance & Repairs", subcategory: "Furniture Maintenance", invoiceNo: "INV-8120", invoiceDate: "2026-08-20", amount: 18, payee: "Oman Office Supplies" },
  ]),
  a(4, "A004", 1, "Projector", "Epson EB-X06", "EP-660921", "2022-11-22", "Al Hinai Trading", "INV-6623", "IT & Network Equipment", 315, 25, 4, "Bank Transfer", 4, "TRX-20221122-004", "disposed", [
    { category: "Asset Maintenance & Repairs", subcategory: "Equipment Maintenance", invoiceNo: "INV-7002", invoiceDate: "2025-03-02", amount: 25, payee: "Al Hinai Trading" },
  ]),
  a(5, "A005", 2, "Office Chair", "Herman Miller", "HM-8831", "2024-02-17", "Muscat Furnishings", "INV-3090", "Office Furniture", 63, 10, 10, "Bank Transfer", 3, "TRX-20240217-005", "active"),
];
