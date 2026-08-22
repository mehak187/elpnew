/**
 * Law Firm Profile data.
 *
 * Section 11 of the specification asks that these areas are not separate
 * islands at the UI level, so the records below are related by id in the chain
 * the document sets out:
 *
 *   Law Firm -> Branches -> Clients -> Cases -> Invoices -> Payments
 *                                                        -> Bank Accounts
 *
 * Nothing that can be derived is stored. Bank balances come from transactions,
 * client totals come from invoices and payments, and document status comes from
 * the expiry date - so a figure on screen can never drift from its records.
 */

const DAY = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const dayOffset = (days) =>
  new Date(startOfToday().getTime() + days * DAY).toISOString().slice(0, 10);

export const daysUntil = (dateStr) =>
  Math.round(
    (new Date(dateStr).setHours(0, 0, 0, 0) - startOfToday().getTime()) / DAY
  );

export const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

export const money = (amount) =>
  "OMR " +
  Number(amount).toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/* ------------------------------------------------- 1. Law firm information */

export const initialFirmInfo = {
  nameAr: "مكتب ياندس للمحاماة",
  nameEn: "YANDS",
  address: "Building 214, Way 3009, Shatti Al Qurum, Muscat, Oman",
  mojLicenseNo: "MOJ-2010-0447",
  crNumber: "1234567",
  crExpiryDate: dayOffset(120),
};

/* --------------------------------------------------------- 2. Document types */

export const DOCUMENT_TYPES = [
  "Professional Indemnity Insurance",
  "Ministry of Justice License",
  "Commercial Registration",
  "Official Certificate",
  "License or Permit",
  "Annual Accounting Report",
  "Administrative or Management Report",
  "Meeting Minutes",
  "Other",
];

export const RELATED_TO_KINDS = [
  { key: "firm", label: "The Law Firm" },
  { key: "client", label: "A Client" },
  { key: "case", label: "A Case" },
];

// A document is Expiring Soon inside this window.
export const EXPIRY_WARNING_DAYS = 60;

/**
 * Status is never stored - it is read off the expiry date every time, so it can
 * never be stale. A document with no expiry date is simply Active.
 */
export function documentStatus(document) {
  if (!document.expiryDate) return "Active";
  const days = daysUntil(document.expiryDate);
  if (days < 0) return "Expired";
  if (days <= EXPIRY_WARNING_DAYS) return "Expiring Soon";
  return "Active";
}

export const DOCUMENT_STATUS_VARIANT = {
  Active: "success",
  "Expiring Soon": "warning",
  Expired: "destructive",
};

/* ----------------------------------------------------------- 3. Branches */

export const initialBranches = [
  { id: 1, branchNumber: 1, name: "Muscat", address: "Shatti Al Qurum, Muscat", phone: "+968 2411 1111" },
  { id: 2, branchNumber: 2, name: "Salalah", address: "Al Saada Street, Salalah", phone: "+968 2329 2222" },
  { id: 3, branchNumber: 3, name: "Sohar", address: "Falaj Al Qabail, Sohar", phone: "+968 2684 3333" },
];

/**
 * The next branch number, taken from the highest one already stored.
 *
 * The number is derived here and saved onto the branch record. Case numbering
 * later reads it from the record rather than recomputing it, so adding a branch
 * never requires a change to the case-numbering logic.
 */
export function nextBranchNumber(branches) {
  return branches.reduce((max, b) => Math.max(max, b.branchNumber), 0) + 1;
}

/* ------------------------------------------------------- 4. Bank accounts */

export const initialBankAccounts = [
  { id: 1, bankName: "Bank Muscat", accountName: "YANDS Legal Firm - Main", accountNumber: "OM81 BMUS 0123 4567 8901", openingBalance: 5000, openedAt: dayOffset(-232), active: true },
  { id: 2, bankName: "National Bank of Oman", accountName: "YANDS Legal Firm - Client Trust", accountNumber: "OM45 NBOM 9876 5432 1098", openingBalance: 12000, openedAt: dayOffset(-232), active: true },
  { id: 3, bankName: "Bank Dhofar", accountName: "YANDS Legal Firm - Salalah Branch", accountNumber: "OM12 BDOF 4455 6677 8899", openingBalance: 3000, openedAt: dayOffset(-120), active: false },
];

/* ------------------------- 8. Clients, cases and invoices (the relation chain) */

export const clients = [
  { id: 1, name: "ABC Holdings LLC", branchId: 1, active: true },
  { id: 2, name: "XYZ Investments", branchId: 1, active: true },
  { id: 3, name: "Gulf Construction Co", branchId: 2, active: true },
  { id: 4, name: "Al Madina Trading", branchId: 1, active: true },
  { id: 5, name: "Salalah Port Services", branchId: 2, active: true },
  { id: 6, name: "Nizwa Cement Factory", branchId: 3, active: true },
  { id: 7, name: "Fatima Rashid", branchId: 1, active: false },
];

export const cases = [
  { id: 1, caseNo: "126001", clientId: 1, branchId: 1, status: "Active", openedAt: dayOffset(-210) },
  { id: 2, caseNo: "126005", clientId: 1, branchId: 1, status: "Active", openedAt: dayOffset(-150) },
  { id: 3, caseNo: "126009", clientId: 1, branchId: 1, status: "Closed", openedAt: dayOffset(-320) },
  { id: 4, caseNo: "126012", clientId: 2, branchId: 1, status: "Active", openedAt: dayOffset(-95) },
  { id: 5, caseNo: "226004", clientId: 3, branchId: 2, status: "Active", openedAt: dayOffset(-60) },
  { id: 6, caseNo: "126018", clientId: 4, branchId: 1, status: "Closed", openedAt: dayOffset(-280) },
  { id: 7, caseNo: "226011", clientId: 5, branchId: 2, status: "Active", openedAt: dayOffset(-40) },
  { id: 8, caseNo: "326002", clientId: 6, branchId: 3, status: "Active", openedAt: dayOffset(-18) },
  { id: 9, caseNo: "126022", clientId: 7, branchId: 1, status: "Closed", openedAt: dayOffset(-400) },
  { id: 10, caseNo: "126027", clientId: 2, branchId: 1, status: "Active", openedAt: dayOffset(-12) },
];

export const invoices = [
  { id: 1, invoiceNo: "INV-001", caseId: 1, clientId: 1, amount: 1000, date: dayOffset(-200) },
  { id: 2, invoiceNo: "INV-002", caseId: 2, clientId: 1, amount: 750, date: dayOffset(-140) },
  { id: 3, invoiceNo: "INV-003", caseId: 3, clientId: 1, amount: 500, date: dayOffset(-300) },
  { id: 4, invoiceNo: "INV-004", caseId: 4, clientId: 2, amount: 2200, date: dayOffset(-90) },
  { id: 5, invoiceNo: "INV-005", caseId: 5, clientId: 3, amount: 1800, date: dayOffset(-55) },
  { id: 6, invoiceNo: "INV-006", caseId: 7, clientId: 5, amount: 1350, date: dayOffset(-35) },
  { id: 7, invoiceNo: "INV-007", caseId: 8, clientId: 6, amount: 900, date: dayOffset(-15) },
  { id: 8, invoiceNo: "INV-008", caseId: 10, clientId: 2, amount: 1600, date: dayOffset(-8) },
];

// A payment settles an invoice and lands in one bank account.
export const initialPayments = [
  { id: 1, invoiceId: 1, amount: 1000, date: dayOffset(-195), bankAccountId: 1 },
  { id: 2, invoiceId: 2, amount: 500, date: dayOffset(-120), bankAccountId: 1 },
  { id: 4, invoiceId: 4, amount: 2200, date: dayOffset(-70), bankAccountId: 2 },
  { id: 5, invoiceId: 5, amount: 900, date: dayOffset(-30), bankAccountId: 1 },
  { id: 6, invoiceId: 7, amount: 900, date: dayOffset(-6), bankAccountId: 1 },
];

export const initialExpenses = [
  { id: 1, description: "Office Expense", reference: "EXP-001", amount: 500, date: dayOffset(-190), bankAccountId: 1, kind: "Expense" },
  { id: 2, description: "Court Fees", reference: "EXP-002", amount: 320, date: dayOffset(-100), bankAccountId: 1, kind: "Expense" },
  { id: 3, description: "Staff Salaries", reference: "EXP-003", amount: 2400, date: dayOffset(-40), bankAccountId: 2, kind: "Expense" },
  { id: 4, description: "Software Subscription", reference: "EXP-004", amount: 180, date: dayOffset(-20), bankAccountId: 1, kind: "Expense" },
];

export const initialTransfers = [
  { id: 1, fromAccountId: 2, toAccountId: 1, amount: 1500, date: dayOffset(-50), reference: "TRF-001", description: "Transfer to main account" },
];

/* -------------------------------------------------------- 2. Documents */

export const initialDocuments = [
  { id: 1, name: "Professional Indemnity Insurance 2026", type: "Professional Indemnity Insurance", documentDate: dayOffset(-200), issueDate: dayOffset(-200), expiryDate: dayOffset(45), fileName: "indemnity-2026.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "firm", relatedId: null, notes: "Renewal quote requested." },
  { id: 2, name: "Ministry of Justice License", type: "Ministry of Justice License", documentDate: dayOffset(-500), issueDate: dayOffset(-500), expiryDate: dayOffset(210), fileName: "moj-license.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "firm", relatedId: null, notes: "" },
  { id: 3, name: "Commercial Registration Certificate", type: "Commercial Registration", documentDate: dayOffset(-610), issueDate: dayOffset(-610), expiryDate: dayOffset(120), fileName: "cr-certificate.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "firm", relatedId: null, notes: "" },
  { id: 4, name: "Annual Accounting Report 2025", type: "Annual Accounting Report", documentDate: dayOffset(-150), issueDate: dayOffset(-150), expiryDate: "", fileName: "accounts-2025.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "firm", relatedId: null, notes: "Audited." },
  { id: 5, name: "Bar Association Permit", type: "License or Permit", documentDate: dayOffset(-400), issueDate: dayOffset(-400), expiryDate: dayOffset(-12), fileName: "bar-permit.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "firm", relatedId: null, notes: "Renewal overdue." },
  { id: 6, name: "Power of Attorney - ABC Holdings", type: "Official Certificate", documentDate: dayOffset(-205), issueDate: dayOffset(-205), expiryDate: dayOffset(300), fileName: "poa-abc.pdf", fileUrl: "/documents/sample-poa.pdf", relatedKind: "client", relatedId: 1, notes: "" },
  { id: 7, name: "Meeting Minutes - XYZ Investments", type: "Meeting Minutes", documentDate: dayOffset(-30), issueDate: "", expiryDate: "", fileName: "minutes-xyz.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "client", relatedId: 2, notes: "Scope of engagement agreed." },
  { id: 8, name: "Statement of Claim - Case 226004", type: "Official Certificate", documentDate: dayOffset(-58), issueDate: dayOffset(-58), expiryDate: "", fileName: "claim-226004.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "case", relatedId: 5, notes: "" },
  { id: 9, name: "Management Report Q2 2026", type: "Administrative or Management Report", documentDate: dayOffset(-45), issueDate: dayOffset(-45), expiryDate: "", fileName: "mgmt-q2.pdf", fileUrl: "/documents/sample-reference.pdf", relatedKind: "firm", relatedId: null, notes: "" },
];

/* --------------------------------------------------- 5 & 7. Derived money */

/**
 * Every movement against one account, oldest first, with a running balance.
 *
 * The opening balance is the first row rather than a separate field, so the
 * final running balance IS the current balance - the two can never disagree.
 */
export function accountTransactions(account, { payments, expenses, transfers, invoices: invoiceList }) {
  const rows = [
    {
      id: "opening-" + account.id,
      date: account.openedAt,
      description: "Opening Balance",
      reference: "",
      type: "Opening",
      amount: account.openingBalance,
    },
  ];

  payments
    .filter((p) => p.bankAccountId === account.id)
    .forEach((p) => {
      const invoice = invoiceList.find((i) => i.id === p.invoiceId);
      rows.push({
        id: "pay-" + p.id,
        date: p.date,
        description: "Invoice Payment",
        reference: invoice ? invoice.invoiceNo : "",
        type: "Income",
        amount: p.amount,
      });
    });

  expenses
    .filter((e) => e.bankAccountId === account.id)
    .forEach((e) => {
      rows.push({
        id: "exp-" + e.id,
        date: e.date,
        description: e.description,
        reference: e.reference,
        type: e.kind || "Expense",
        amount: -e.amount,
      });
    });

  transfers.forEach((t) => {
    if (t.toAccountId === account.id) {
      rows.push({
        id: "trf-in-" + t.id,
        date: t.date,
        description: t.description,
        reference: t.reference,
        type: "Transfer In",
        amount: t.amount,
      });
    }
    if (t.fromAccountId === account.id) {
      rows.push({
        id: "trf-out-" + t.id,
        date: t.date,
        description: t.description,
        reference: t.reference,
        type: "Transfer Out",
        amount: -t.amount,
      });
    }
  });

  rows.sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  return rows.map((row) => {
    balance += row.amount;
    return { ...row, balance };
  });
}

export function accountBalance(account, ledgers) {
  const rows = accountTransactions(account, ledgers);
  return rows.length ? rows[rows.length - 1].balance : account.openingBalance;
}

/* ------------------------------------- 8. Invoiced / paid / outstanding */

export function clientTotals(clientId, { payments }) {
  const clientInvoices = invoices.filter((i) => i.clientId === clientId);
  const invoiced = clientInvoices.reduce((sum, i) => sum + i.amount, 0);
  const paid = clientInvoices.reduce(
    (sum, invoice) =>
      sum +
      payments
        .filter((p) => p.invoiceId === invoice.id)
        .reduce((s, p) => s + p.amount, 0),
    0
  );
  return { invoiced, paid, outstanding: invoiced - paid };
}

export function caseTotals(caseId, { payments }) {
  const caseInvoices = invoices.filter((i) => i.caseId === caseId);
  const invoiced = caseInvoices.reduce((sum, i) => sum + i.amount, 0);
  const paid = caseInvoices.reduce(
    (sum, invoice) =>
      sum +
      payments
        .filter((p) => p.invoiceId === invoice.id)
        .reduce((s, p) => s + p.amount, 0),
    0
  );
  return { invoiced, paid, outstanding: invoiced - paid };
}

/* ----------------------------------------------------- 9. Overview figures */

// New cases are those opened within this window.
export const NEW_CASE_WINDOW_DAYS = 30;

export function overviewFigures({ branches, documents, bankAccounts, payments, expenses, transfers }) {
  const ledgers = { payments, expenses, transfers, invoices };

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const clientsWithOpenCases = clients.filter((c) =>
    cases.some((k) => k.clientId === c.id && k.status === "Active")
  );
  const clientsWithOutstanding = clients.filter(
    (c) => clientTotals(c.id, ledgers).outstanding > 0
  );

  const statuses = documents.map(documentStatus);

  return {
    cases: {
      total: cases.length,
      active: cases.filter((c) => c.status === "Active").length,
      closed: cases.filter((c) => c.status === "Closed").length,
      newCases: cases.filter(
        (c) => Math.abs(daysUntil(c.openedAt)) <= NEW_CASE_WINDOW_DAYS
      ).length,
      byBranch: branches.map((branch) => ({
        branch,
        count: cases.filter((c) => c.branchId === branch.id).length,
      })),
    },
    clients: {
      total: clients.length,
      active: clients.filter((c) => c.active).length,
      withOpenCases: clientsWithOpenCases.length,
      withOutstanding: clientsWithOutstanding.length,
    },
    financial: {
      totalInvoiced,
      totalPaid,
      totalOutstanding: totalInvoiced - totalPaid,
      totalExpenses,
    },
    bank: {
      total: bankAccounts.reduce((sum, a) => sum + accountBalance(a, ledgers), 0),
      byAccount: bankAccounts.map((account) => ({
        account,
        balance: accountBalance(account, ledgers),
      })),
    },
    documents: {
      active: statuses.filter((s) => s === "Active").length,
      expiringSoon: statuses.filter((s) => s === "Expiring Soon").length,
      expired: statuses.filter((s) => s === "Expired").length,
    },
  };
}

/* ------------------------------------------------------- Branch staff roles */

/** The roles a branch staffs, in the order they are assigned to a client. */
export const BRANCH_ROLES = [
  "General Supervisor",
  "Legal Consultant",
  "Enforcement Officer",
];

/**
 * Staff, each belonging to one branch.
 *
 * A client is managed by people from a single branch, so the role pickers only
 * ever offer that branch's staff. Case tasks will later be assigned from the
 * same list.
 */
export const firmStaff = [
  { id: 1, name: "Mohammed Al Yahyaei", branchId: 1, role: "General Supervisor" },
  { id: 2, name: "Hamad Al Riyami", branchId: 1, role: "General Supervisor" },
  { id: 3, name: "Layla Al Balushi", branchId: 1, role: "Legal Consultant" },
  { id: 4, name: "Aisha Al Saadi", branchId: 1, role: "Legal Consultant" },
  { id: 5, name: "Khalid Al Hinai", branchId: 1, role: "Enforcement Officer" },
  { id: 6, name: "Nasser Al Amri", branchId: 1, role: "Enforcement Officer" },

  { id: 7, name: "Salim Al Rawahi", branchId: 2, role: "General Supervisor" },
  { id: 8, name: "Maryam Al Ghafri", branchId: 2, role: "Legal Consultant" },
  { id: 9, name: "Yusuf Al Kindi", branchId: 2, role: "Legal Consultant" },
  { id: 10, name: "Talal Al Mahrouqi", branchId: 2, role: "Enforcement Officer" },

  { id: 11, name: "Noura Al Habsi", branchId: 3, role: "General Supervisor" },
  { id: 12, name: "Badar Al Shukaili", branchId: 3, role: "Legal Consultant" },
  { id: 13, name: "Zahra Al Jabri", branchId: 3, role: "Enforcement Officer" },
];

/** Staff of one branch who hold a given role. */
export const staffFor = (branchId, role) =>
  firmStaff.filter((s) => s.branchId === Number(branchId) && s.role === role);
