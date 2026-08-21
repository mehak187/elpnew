// Records the expense pages link against, the general invoices, and the
// approval workflow those invoices travel through.

import { dayOffset } from "@/pages/firm/firmData";

export { dayOffset, daysUntil, formatDate, money } from "@/pages/firm/firmData";

/** Registered fixed assets. A fixed-asset expense attaches to one of these. */
export const fixedAssets = [
  { id: 1, assetNo: "AST-001", name: "Toyota Land Cruiser", category: "Vehicles", purchasedAt: dayOffset(-540), value: 14500 },
  { id: 2, assetNo: "AST-002", name: "Nissan Patrol", category: "Vehicles", purchasedAt: dayOffset(-300), value: 12800 },
  { id: 3, assetNo: "AST-003", name: "Partner Office Furniture Set", category: "Office Furniture", purchasedAt: dayOffset(-410), value: 3200 },
  { id: 4, assetNo: "AST-004", name: "Dell Latitude Laptops (x6)", category: "Computers & Laptops", purchasedAt: dayOffset(-220), value: 4800 },
  { id: 5, assetNo: "AST-005", name: "Canon Photocopier", category: "Printers & Photocopiers", purchasedAt: dayOffset(-160), value: 1900 },
  { id: 6, assetNo: "AST-006", name: "Reception Air Conditioning Unit", category: "Air Conditioning Units", purchasedAt: dayOffset(-95), value: 850 },
];

export const employees = [
  { id: 1, name: "Mohammed Al Yahyaei", role: "Partner" },
  { id: 2, name: "Salim Al Rawahi", role: "Senior Lawyer" },
  { id: 3, name: "Layla Al Balushi", role: "Lawyer" },
  { id: 4, name: "Khalid Al Hinai", role: "Execution Officer" },
  { id: 5, name: "Aisha Al Saadi", role: "Accountant" },
];

export const partners = [
  { id: 1, name: "Mohammed Al Yahyaei", share: "45%" },
  { id: 2, name: "Yusuf Al Kindi", share: "35%" },
  { id: 3, name: "Noura Al Habsi", share: "20%" },
];

export const linkedCases = [
  { id: 1, caseNo: "1234/2026", client: "ABC Holdings LLC" },
  { id: 2, caseNo: "0988/2026", client: "Al Madina Trading" },
  { id: 3, caseNo: "1187/2026", client: "Gulf Construction Co" },
  { id: 4, caseNo: "1301/2026", client: "Nizwa Cement Factory" },
  { id: 5, caseNo: "1156/2026", client: "Salalah Port Services" },
];

/** Suppliers a general invoice can come from. */
export const suppliers = [
  "Al Maha Properties",
  "Oman Electricity Distribution",
  "Omantel",
  "Ooredoo",
  "Muscat Stationery Est.",
  "Gulf Cleaning Services",
  "Bank Muscat",
  "Tax Authority",
  "Al Wathba Insurance",
  "Ministry of Commerce",
  "KPMG Oman",
  "Blue Ocean Media",
  "Nizwa Print House",
  "Other Supplier",
];

export const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cheque",
  "Cash",
  "Card",
  "Direct Debit",
];

/* ------------------------------------------------------------- workflow */

/**
 * Invoice statuses, in the order an invoice moves through them.
 *
 * The route depends on who raised the invoice, not on its value:
 *   Employee -> Accountant -> Finance Manager -> Payment
 *   Admin    -> Finance Manager -> Payment          (never the accountant)
 */
export const STATUS = {
  draft: "Draft",
  submitted: "Submitted",
  accountant: "Under Accountant Review",
  finance: "Under Finance Manager Review",
  returned: "Returned for Correction",
  rejected: "Rejected",
  approved: "Approved for Payment",
  partiallyPaid: "Partially Paid",
  paid: "Paid",
};

export const STATUS_VARIANT = {
  draft: "outline",
  submitted: "secondary",
  accountant: "warning",
  finance: "brand",
  returned: "warning",
  rejected: "destructive",
  approved: "brand",
  partiallyPaid: "warning",
  paid: "success",
};

/** Who can raise a general invoice, and where it goes first. */
export const CREATOR_ROLES = [
  { key: "employee", label: "Employee", firstReview: "accountant" },
  {
    key: "admin",
    label: "Admin / Administrative User",
    firstReview: "finance",
  },
];

export const firstReviewFor = (creatorRole) =>
  CREATOR_ROLES.find((r) => r.key === creatorRole)?.firstReview || "accountant";

/** The route an invoice takes, used to draw its progress. */
export function routeFor(creatorRole) {
  const steps = [
    { key: "submitted", label: "Submitted" },
    { key: "accountant", label: "Accountant" },
    { key: "finance", label: "Finance Manager" },
    { key: "approved", label: "Approved for Payment" },
    { key: "paid", label: "Payment" },
  ];
  // An admin-raised invoice never passes through the accountant.
  return creatorRole === "admin"
    ? steps.filter((s) => s.key !== "accountant")
    : steps;
}

/** Amounts on a line, with tax kept separate from the net amount. */
export const lineTotal = (line) =>
  Number(line.amountBeforeTax || 0) + Number(line.taxAmount || 0);

export const invoiceNet = (invoice) =>
  invoice.lines.reduce((sum, l) => sum + Number(l.amountBeforeTax || 0), 0);

export const invoiceTax = (invoice) =>
  invoice.lines.reduce((sum, l) => sum + Number(l.taxAmount || 0), 0);

export const invoiceTotal = (invoice) =>
  invoiceNet(invoice) + invoiceTax(invoice);

export const amountPaid = (invoice) =>
  (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

/** Paid in full, or only partly - the doc asks for both to be distinguished. */
export function settlementStatus(invoice) {
  const paid = amountPaid(invoice);
  if (paid <= 0) return null;
  return paid >= invoiceTotal(invoice) ? "paid" : "partiallyPaid";
}

/* ------------------------------------------------------- general invoices */

export const initialInvoices = [
  {
    id: 1,
    reference: "GIN-2026-001",
    invoiceNumber: "AMP-8842",
    invoiceDate: dayOffset(-5),
    supplier: "Al Maha Properties",
    invoiceFile: "rent-august.pdf",
    supportingDocuments: ["lease-agreement.pdf"],
    createdBy: "Aisha Al Saadi",
    creatorRole: "employee",
    status: "finance",
    history: [
      { at: dayOffset(-5), by: "Aisha Al Saadi", action: "Submitted", reason: "" },
      { at: dayOffset(-4), by: "Accountant", action: "Approved", reason: "" },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "office", path: ["Rent", "Office Rent"], description: "Muscat office - August", amountBeforeTax: 2400, taxAmount: 120 },
    ],
  },
  {
    id: 2,
    reference: "GIN-2026-002",
    invoiceNumber: "BOM-1190",
    invoiceDate: dayOffset(-3),
    supplier: "Blue Ocean Media",
    invoiceFile: "agency-invoice.pdf",
    supportingDocuments: [],
    createdBy: "Layla Al Balushi",
    creatorRole: "employee",
    status: "accountant",
    history: [
      { at: dayOffset(-3), by: "Layla Al Balushi", action: "Submitted", reason: "" },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "marketing", path: ["Digital Marketing", "Social Media Management"], description: "Q3 social media retainer", amountBeforeTax: 1200, taxAmount: 60 },
      { id: 2, typeKey: "marketing", path: ["Design & Printing", "Marketing Material Printing"], description: "Brochure print run", amountBeforeTax: 350, taxAmount: 17 },
    ],
  },
  {
    id: 3,
    reference: "GIN-2026-003",
    invoiceNumber: "BM-77213",
    invoiceDate: dayOffset(-1),
    supplier: "Bank Muscat",
    invoiceFile: "bank-statement.pdf",
    supportingDocuments: [],
    createdBy: "Mohammed Al Yahyaei",
    creatorRole: "admin",
    status: "finance",
    history: [
      {
        at: dayOffset(-1),
        by: "Mohammed Al Yahyaei",
        action: "Submitted by Admin - accountant step skipped",
        reason: "",
      },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "admin-financial", path: ["Bank Charges", "Bank Transfer Fees"], description: "International transfer fees", amountBeforeTax: 45, taxAmount: 0 },
    ],
  },
  {
    id: 4,
    reference: "GIN-2026-004",
    invoiceNumber: "GCS-4410",
    invoiceDate: dayOffset(-18),
    supplier: "Gulf Cleaning Services",
    invoiceFile: "cleaning-invoice.pdf",
    supportingDocuments: ["service-contract.pdf"],
    createdBy: "Aisha Al Saadi",
    creatorRole: "employee",
    status: "partiallyPaid",
    history: [
      { at: dayOffset(-18), by: "Aisha Al Saadi", action: "Submitted", reason: "" },
      { at: dayOffset(-16), by: "Accountant", action: "Approved", reason: "" },
      { at: dayOffset(-15), by: "Finance Manager", action: "Approved for Payment", reason: "" },
      { at: dayOffset(-12), by: "Finance", action: "Part payment recorded", reason: "" },
    ],
    payments: [
      { id: 1, date: dayOffset(-12), amount: 100, method: "Bank Transfer", reference: "TRF-99120" },
    ],
    lines: [
      { id: 1, typeKey: "office", path: ["Cleaning", "Cleaning Services"], description: "Monthly cleaning contract", amountBeforeTax: 180, taxAmount: 9 },
    ],
  },
  {
    id: 5,
    reference: "GIN-2026-005",
    invoiceNumber: "MSE-2231",
    invoiceDate: dayOffset(-9),
    supplier: "Muscat Stationery Est.",
    invoiceFile: "stationery.pdf",
    supportingDocuments: [],
    createdBy: "Salim Al Rawahi",
    creatorRole: "employee",
    status: "returned",
    history: [
      { at: dayOffset(-9), by: "Salim Al Rawahi", action: "Submitted", reason: "" },
      {
        at: dayOffset(-8),
        by: "Accountant",
        action: "Returned for Correction",
        reason: "The attached invoice does not show the supplier VAT number.",
      },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "office", path: ["Stationery & Printing", "Printer Ink & Toner"], description: "Toner cartridges", amountBeforeTax: 210, taxAmount: 10 },
    ],
  },
];

/** Expenses recorded outside General Invoices, on their own record pages. */
export const initialExpenses = [
  { id: 1, date: dayOffset(-4), typeKey: "court-case", path: ["Court Fees", "Case Filing Fees"], amount: 320, description: "Filing fee for the commercial claim", linkKind: "case", linkId: 1 },
  { id: 2, date: dayOffset(-9), typeKey: "court-case", path: ["Court Fees", "Expert Deposit Fees"], amount: 750, description: "Expert deposit", linkKind: "case", linkId: 2 },
  { id: 3, date: dayOffset(-15), typeKey: "employee", path: ["Employee Expenses", "Travel & Accommodation"], amount: 430, description: "Salalah hearing travel", linkKind: "employee", linkId: 2 },
  { id: 4, date: dayOffset(-20), typeKey: "advances-loans", path: ["Advances & Loans", "Salary Advance"], amount: 600, description: "Advance against August salary", linkKind: "employee", linkId: 3 },
  { id: 5, date: dayOffset(-7), typeKey: "fixed-assets", path: ["Asset Maintenance & Repairs", "Vehicle Maintenance"], amount: 275, description: "Service and oil change", linkKind: "asset", linkId: 1 },
  { id: 6, date: dayOffset(-30), typeKey: "fixed-assets", path: ["Vehicle Registration & Insurance", "Vehicle Insurance"], amount: 410, description: "Annual policy", linkKind: "asset", linkId: 1 },
  { id: 7, date: dayOffset(-45), typeKey: "fixed-assets", path: ["Fixed Asset Purchase", "Computers & Laptops"], amount: 4800, description: "Six laptops for the litigation team", linkKind: "asset", linkId: 4 },
  { id: 8, date: dayOffset(-12), typeKey: "partner", path: ["Partner Expenses", "Hospitality & Meetings"], amount: 220, description: "Client dinner", linkKind: "partner", linkId: 2 },
];
