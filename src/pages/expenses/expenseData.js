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

/* ------------------------------------------------------ accountant review */

/**
 * What the accountant can decide, and where each decision sends the request.
 *
 * A return or a rejection stops the request, so the accountant has to say why -
 * the note is written into the history and shown to whoever raised it.
 */
export const ACCOUNTANT_REVIEW_RESULTS = [
  {
    key: "approve",
    label: "Approve for Payment",
    status: "finance",
    action: "Approved by Accountant",
    needsNote: false,
  },
  {
    key: "return",
    label: "Return for Correction",
    status: "returned",
    action: "Returned for Correction",
    needsNote: true,
  },
  {
    key: "reject",
    label: "Reject the Request",
    status: "rejected",
    action: "Rejected",
    needsNote: true,
  },
];

/* ------------------------------------------------- finance manager approval */

/**
 * What the finance manager can decide.
 *
 * Approving and paying is one action rather than two: the manager releasing the
 * money is the manager recording where it went, so the transfer details are
 * asked for at the same moment. A return or a rejection asks for a note.
 */
export const FINANCE_ACTIONS = [
  {
    key: "pay",
    label: "Approve & Process Payment",
    action: "Approved for Payment",
    needsNote: false,
    needsTransfer: true,
  },
  {
    key: "return",
    label: "Return for Correction",
    status: "returned",
    action: "Returned for Correction",
    needsNote: true,
  },
  {
    key: "reject",
    label: "Reject Request",
    status: "rejected",
    action: "Rejected",
    needsNote: true,
  },
];

/* ------------------------------------------------------- request numbers */

/**
 * The number a request is chased by while it is in flight - REQ 4/2026 and so
 * on, restarting each year.
 *
 * It is not the expense number. The expense keeps `reference` for good; this
 * only exists while somebody still has to act, and is dropped the moment the
 * payment goes through, so a settled expense cannot be quoted by a number that
 * no longer means anything.
 */
export const formatRequestNo = (serial, year) =>
  "REQ " + serial + "/" + year;

export function nextRequestNo(invoices, date = dayOffset(0)) {
  const year = Number(String(date).slice(0, 4));
  const used = invoices
    .map((i) => i.requestNo)
    .filter(Boolean)
    .map((no) => {
      const [serial, of] = no.replace("REQ ", "").split("/");
      return Number(of) === year ? Number(serial) : 0;
    });
  return formatRequestNo(Math.max(0, ...used) + 1, year);
}

/** Nothing is left to chase once the money has gone out in full. */
export const requestClosed = (status) => status === "paid";

/* --------------------------------------------------------- expense records */

/**
 * A request stops being a request once it has cleared approval. From that point
 * it is an expense the firm has committed to, so it leaves the request list and
 * is read from the expenses table instead - one record, in one place, whichever
 * way it was raised.
 */
export const APPROVED_STATUSES = ["approved", "partiallyPaid", "paid"];

export const isApprovedRequest = (invoice) =>
  APPROVED_STATUSES.includes(invoice.status);

/** Expense number: 1/26, 2/26 and so on, restarting each year. */
export const formatExpenseNo = (serial, date) =>
  serial + "/" + String(date).slice(2, 4);

/** Where an expense sits against its own settlement. */
export function settlement(paid, total) {
  if (paid <= 0) return { key: "unpaid", label: "Unpaid", variant: "secondary" };
  if (paid >= total)
    return { key: "fullyPaid", label: "Fully Paid", variant: "success" };
  return { key: "partiallyPaid", label: "Partially Paid", variant: "warning" };
}

/** The moment the request cleared approval, and who cleared it. */
function approvalOf(invoice) {
  const entry = [...invoice.history]
    .reverse()
    .find((h) => h.action.startsWith("Approved for Payment"));
  return { by: entry?.by || "", at: entry?.at || "" };
}

/**
 * Everything the expenses table shows: expenses recorded directly, and the
 * requests that have cleared approval, in one shape.
 *
 * Numbered oldest first so the number and the order agree, and so a number once
 * given never shifts when something newer arrives.
 */
export function expenseRecords(expenses, invoices) {
  const fromRequests = invoices.filter(isApprovedRequest).map((invoice) => {
    const total = invoiceTotal(invoice);
    const paid = amountPaid(invoice);
    const approval = approvalOf(invoice);

    return {
      id: "request-" + invoice.id,
      source: "request",
      reference: invoice.reference,
      date: invoice.invoiceDate,
      supplier: invoice.supplier,
      invoiceNumber: invoice.invoiceNumber,
      invoiceFile: invoice.invoiceFile,
      lines: invoice.lines,
      net: invoiceNet(invoice),
      tax: invoiceTax(invoice),
      total,
      paid,
      payments: invoice.payments,
      createdBy: invoice.createdBy,
      createdAt: invoice.history[0]?.at || invoice.invoiceDate,
      approvedBy: approval.by,
      approvedAt: approval.at,
    };
  });

  // An expense recorded directly is money already spent, so it arrives settled
  // and carries no invoice or approval behind it.
  const direct = expenses.map((expense) => ({
    id: "expense-" + expense.id,
    source: "expense",
    expenseId: expense.id,
    reference: "",
    date: expense.date,
    supplier: "",
    invoiceNumber: "",
    invoiceFile: "",
    lines: [
      {
        id: expense.id,
        typeKey: expense.typeKey,
        path: expense.path,
        description: expense.description,
      },
    ],
    linkKind: expense.linkKind,
    linkId: expense.linkId,
    net: expense.amount,
    tax: 0,
    total: expense.amount,
    paid: expense.amount,
    payments: [{ id: 1, date: expense.date, amount: expense.amount, method: "" }],
    createdBy: "",
    createdAt: expense.date,
    approvedBy: "",
    approvedAt: "",
  }));

  const serials = {};
  return [...fromRequests, ...direct]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((row) => {
      const year = String(row.date).slice(0, 4);
      serials[year] = (serials[year] || 0) + 1;
      return { ...row, expenseNo: formatExpenseNo(serials[year], row.date) };
    });
}

/* ---------------------------------------------------- looking backwards */

const kindOf = (line) => line.typeKey + "|" + line.path.join("/");

/**
 * Earlier requests worth reading before deciding this one.
 *
 * The same supplier is the strongest signal - it is what makes a duplicate
 * invoice or a creeping price obvious. After that comes the same person
 * claiming the same kind of expense, which is what makes a habit obvious. A
 * request has to match on at least one of those to be worth showing, and the
 * strongest matches come first.
 */
export function similarRequests(invoices, invoice) {
  const kinds = new Set(invoice.lines.map(kindOf));

  return invoices
    .filter((other) => other.id !== invoice.id)
    .map((other) => {
      const sameSupplier = other.supplier === invoice.supplier;
      const sameApplicant = other.createdBy === invoice.createdBy;
      const sameKind = other.lines.some((line) => kinds.has(kindOf(line)));
      return {
        invoice: other,
        sameSupplier,
        sameApplicant,
        sameKind,
        score: (sameSupplier ? 4 : 0) + (sameKind ? 2 : 0) + (sameApplicant ? 1 : 0),
      };
    })
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.invoice.invoiceDate.localeCompare(a.invoice.invoiceDate)
    )
    .slice(0, 10);
}

/* ------------------------------------------- what the partners keep to
                                                themselves */

/**
 * Expense types that never pass the accountant.
 *
 * What a partner draws, what the staff are paid and what has been advanced
 * against a salary are the partners' own business. These requests go straight
 * to the finance manager and are read on the partners' page, not the one the
 * whole firm can open.
 */
const PARTNER_ONLY_TYPES = ["partner", "employee", "advances-loans"];

export const skipsAccountant = (invoice) =>
  invoice.creatorRole === "admin" ||
  invoice.lines.some((line) => PARTNER_ONLY_TYPES.includes(line.typeKey));

/* --------------------------------------------------------- who sees what */

/**
 * The roles a request page is read as. Auth is not wired up yet, so the page
 * offers these as a switcher the way the dashboard does.
 */
export const VIEWER_ROLES = [
  { key: "employee", label: "Employee" },
  { key: "accountant", label: "Accountant" },
  { key: "finance", label: "Finance Manager" },
  { key: "admin", label: "Admin / Management" },
];

/** Nothing is waiting on anyone once an invoice reaches one of these. */
const CLOSED = ["paid", "rejected"];

/**
 * Each role is shown only the requests that need it to act at that moment.
 *
 *   Employee        own requests that are still in flight
 *   Accountant      only what is sitting at the accountant step
 *   Finance Manager nothing until the accountant has acted, so the accountant's
 *                   review is not visible early either
 *   Admin           everything
 */
export function visibleInvoices(invoices, role, userName) {
  // A request that has cleared approval has become an expense and is read on
  // the expenses page, so it is off this list whoever is looking.
  const inFlight = invoices.filter((i) => !isApprovedRequest(i));

  switch (role) {
    case "employee":
      return inFlight.filter(
        (i) => i.createdBy === userName && !CLOSED.includes(i.status)
      );
    case "accountant":
      // Also what they have already passed on, so they can follow it through
      // the finance manager's review. Read-only from here.
      return inFlight.filter((i) =>
        ["accountant", "finance"].includes(i.status)
      );
    case "finance":
      return inFlight.filter((i) => i.status === "finance");
    default:
      return inFlight;
  }
}

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
    requestNo: "REQ 1/2026",
    branch: "Muscat",
    invoiceNumber: "AMP-8842",
    invoiceDate: dayOffset(-5),
    supplier: "Al Maha Properties",
    invoiceFile: "rent-august.pdf",
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
    requestNo: "REQ 2/2026",
    branch: "Muscat",
    invoiceNumber: "BOM-1190",
    invoiceDate: dayOffset(-3),
    supplier: "Blue Ocean Media",
    invoiceFile: "agency-invoice.pdf",
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
    requestNo: "REQ 3/2026",
    branch: "Muscat",
    invoiceNumber: "BM-77213",
    invoiceDate: dayOffset(-1),
    supplier: "Bank Muscat",
    invoiceFile: "bank-statement.pdf",
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
    requestNo: "REQ 4/2026",
    branch: "Salalah",
    invoiceNumber: "GCS-4410",
    invoiceDate: dayOffset(-18),
    supplier: "Gulf Cleaning Services",
    invoiceFile: "cleaning-invoice.pdf",
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
    requestNo: "REQ 5/2026",
    branch: "Sohar",
    invoiceNumber: "MSE-2231",
    invoiceDate: dayOffset(-9),
    supplier: "Muscat Stationery Est.",
    invoiceFile: "stationery.pdf",
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
  {
    id: 6,
    reference: "GIN-2026-006",
    requestNo: "REQ 6/2026",
    branch: "Muscat",
    invoiceNumber: "232",
    invoiceDate: dayOffset(0),
    supplier: "Al Maha Properties",
    invoiceFile: "",
    createdBy: "Mohammed Al Yahyaei",
    creatorRole: "admin",
    status: "finance",
    history: [
      {
        at: dayOffset(0),
        by: "Mohammed Al Yahyaei",
        action: "Submitted by Admin - accountant step skipped",
        reason: "",
      },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "office", path: ["Utilities & Services", "Electricity"], description: "", amountBeforeTax: 12, taxAmount: 1 },
      { id: 2, typeKey: "marketing", path: ["Advertising", "Online Advertising"], description: "", amountBeforeTax: 20, taxAmount: 0 },
    ],
  },
  {
    id: 7,
    reference: "GIN-2026-007",
    requestNo: "REQ 7/2026",
    branch: "Salalah",
    invoiceNumber: "OMT-5521",
    invoiceDate: dayOffset(-6),
    supplier: "Omantel",
    invoiceFile: "omantel-july.pdf",
    createdBy: "Khalid Al Hinai",
    creatorRole: "employee",
    status: "accountant",
    history: [
      { at: dayOffset(-6), by: "Khalid Al Hinai", action: "Submitted", reason: "" },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "office", path: ["Internet & Telecommunications", "Internet"], description: "Salalah branch line", amountBeforeTax: 320, taxAmount: 16 },
    ],
  },
  {
    id: 9,
    reference: "GIN-2026-009",
    requestNo: "REQ 9/2026",
    branch: "Muscat",
    invoiceNumber: "PTR-0031",
    invoiceDate: dayOffset(-11),
    supplier: "Al Wathba Insurance",
    invoiceFile: "",
    createdBy: "Yusuf Al Kindi",
    creatorRole: "admin",
    status: "finance",
    history: [
      {
        at: dayOffset(-11),
        by: "Yusuf Al Kindi",
        action: "Submitted by Admin - accountant step skipped",
        reason: "",
      },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "partner", path: ["Partner Expenses", "Hospitality & Meetings"], description: "Client dinner, Muscat", amountBeforeTax: 260, taxAmount: 13 },
    ],
  },
  {
    id: 8,
    reference: "GIN-2026-008",
    requestNo: "REQ 8/2026",
    branch: "Muscat",
    invoiceNumber: "FIT-1042",
    invoiceDate: dayOffset(-2),
    supplier: "Falcon IT Solutions",
    invoiceFile: "licences.pdf",
    createdBy: "Layla Al Balushi",
    creatorRole: "employee",
    status: "accountant",
    history: [
      { at: dayOffset(-2), by: "Layla Al Balushi", action: "Submitted", reason: "" },
    ],
    payments: [],
    lines: [
      { id: 1, typeKey: "office", path: ["Software & Subscriptions", "Software Licenses"], description: "Annual practice licences", amountBeforeTax: 940, taxAmount: 47 },
    ],
  },
];

/**
 * Court fee payment requests.
 *
 * These are raised against a case file rather than a supplier invoice, so
 * they are counted on the requests page but not listed there - their table is
 * designed with the case file it belongs to.
 */
export const courtFeeRequests = [
  { id: 1, requestNo: "CFR 1/2026", raisedAt: dayOffset(-4), caseNo: "1234/2026", client: "ABC Holdings LLC", purpose: "Case Filing Fees", amount: 320 },
  { id: 2, requestNo: "CFR 2/2026", raisedAt: dayOffset(-9), caseNo: "0988/2026", client: "Al Madina Trading", purpose: "Expert Deposit Fees", amount: 750 },
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
