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

import { withRial } from "@/lib/money";

const DAY = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Formatted from the local parts, not through toISOString(): east of UTC the
// UTC form of local midnight still falls on the previous day, which made
// "today" render as yesterday in the date fields.
const isoDate = (date) =>
  date.getFullYear() +
  "-" +
  String(date.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(date.getDate()).padStart(2, "0");

export const dayOffset = (days) =>
  isoDate(new Date(startOfToday().getTime() + days * DAY));

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

/** The bare figure, for inputs and anywhere a plain string is needed. */
export const moneyValue = (amount) =>
  Number(amount).toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const money = (amount) => withRial(moneyValue(amount));

/* ------------------------------------------------- 1. Law firm information */

export const initialFirmInfo = {
  nameAr: "مكتب ياندس للمحاماة",
  nameEn: "YANDS",
  // The name the company trades under, which need not be its registered one.
  tradeName: "Y&S Associates",
  address: "Building 214, Way 3009, Shatti Al Qurum, Muscat, Oman",
  mojLicenseNo: "MOJ-2010-0447",
  crNumber: "1234567",
  crExpiryDate: dayOffset(120),
  // The branch the company answers from, chosen from the branches it has.
  primaryBranchId: 1,
};

/* --------------------------------------------------------- 2. Document types */

export const DOCUMENT_TYPES = [
  "Commercial Registration",
  "Ministry of Justice License",
  "Membership Certificate",
  "Office Lease Contract",
  "Apartment Lease Contract",
  "Other",
];

/**
 * A document either applies to the whole company or to one branch, so the
 * branch field carries null for the general case rather than a separate flag.
 */
export const GENERAL_BRANCH = "general";

export const branchLabel = (branches, branchId) =>
  branchId ? branches.find((b) => b.id === branchId)?.name || "-" : "General";

/** The reference a document is quoted by: DOC-001, DOC-002 and so on. */
export const formatDocumentId = (serial) =>
  "DOC-" + String(serial).padStart(3, "0");

export function nextDocumentId(documents) {
  const highest = documents.reduce((max, d) => {
    const serial = Number(String(d.docId || "").replace("DOC-", ""));
    return Number.isFinite(serial) ? Math.max(max, serial) : max;
  }, 0);
  return formatDocumentId(highest + 1);
}

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
  { id: 1, branchNumber: 1, name: "Muscat", nameAr: "فرع مسقط", address: "Shatti Al Qurum, Muscat", phone: "+968 2411 1111", email: "muscat@company.com", managerId: 1, active: true },
  { id: 2, branchNumber: 2, name: "Salalah", nameAr: "فرع صلالة", address: "Al Saada Street, Salalah", phone: "+968 2329 2222", email: "salalah@company.com", managerId: 7, active: true },
  { id: 3, branchNumber: 3, name: "Sohar", nameAr: "فرع صحار", address: "Falaj Al Qabail, Sohar", phone: "+968 2684 3333", email: "sohar@company.com", managerId: 11, active: true },
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
  { id: 1, bankName: "Bank Muscat", bankBranch: "Shatti Al Qurum", accountNumber: "0123456789", iban: "OM81 BMUS 0123 4567 8901", branchId: 1, openingBalance: 5000, openedAt: dayOffset(-232), active: true },
  { id: 2, bankName: "National Bank of Oman", bankBranch: "Ruwi", accountNumber: "9876543210", iban: "OM45 NBOM 9876 5432 1098", branchId: null, openingBalance: 12000, openedAt: dayOffset(-232), active: true },
  { id: 3, bankName: "Bank Dhofar", bankBranch: "Salalah Main", accountNumber: "4455667788", iban: "OM12 BDOF 4455 6677 8899", branchId: 2, openingBalance: 3000, openedAt: dayOffset(-120), active: false },
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
  { id: 1, transferNo: "TRF-2026-0001", fromAccountId: 3, toAccountId: 1, amount: 3000, date: dayOffset(-95), time: "02:15 PM", reference: "REF-2026-039", receipt: "receipt_2026_039.pdf", byName: "Fatima Al Riyami", byRole: "Accountant", description: "Internal transfer" },
  { id: 2, transferNo: "TRF-2026-0002", fromAccountId: 1, toAccountId: 2, amount: 5000, date: dayOffset(-50), time: "10:30 AM", reference: "REF-2026-045", receipt: "receipt_2026_045.pdf", byName: "Ahmed Al Balushi", byRole: "Finance Manager", description: "Internal transfer" },
];

/**
 * An account number is shown masked wherever the account is only being
 * identified - the last four digits are enough to tell one from another, and
 * the rest has no business being on a screen anyone can look over.
 */
export function maskAccountNumber(accountNumber) {
  const digits = String(accountNumber || "").replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return "**** **** **** " + digits.slice(-4);
}

/** The reference a transfer is quoted by: TRF-2026-0001 and so on. */
export function nextTransferNo(transfers, date = dayOffset(0)) {
  const year = String(date).slice(0, 4);
  const highest = transfers.reduce((max, t) => {
    const [, of, serial] = String(t.transferNo || "").split("-");
    return of === year ? Math.max(max, Number(serial) || 0) : max;
  }, 0);
  return "TRF-" + year + "-" + String(highest + 1).padStart(4, "0");
}

/* -------------------------------------------------------- 2. Documents */

export const initialDocuments = [
  { id: 1, docId: "DOC-001", branchId: null, type: "Commercial Registration", expiryDate: dayOffset(120), fileName: "cr-certificate.pdf", fileUrl: "/documents/sample-reference.pdf", notes: "" },
  { id: 2, docId: "DOC-002", branchId: null, type: "Ministry of Justice License", expiryDate: dayOffset(210), fileName: "moj-license.pdf", fileUrl: "/documents/sample-reference.pdf", notes: "" },
  { id: 3, docId: "DOC-003", branchId: null, type: "Membership Certificate", expiryDate: dayOffset(45), fileName: "bar-membership.pdf", fileUrl: "/documents/sample-reference.pdf", notes: "Renewal quote requested." },
  { id: 4, docId: "DOC-004", branchId: 1, type: "Office Lease Contract", expiryDate: dayOffset(300), fileName: "lease-muscat.pdf", fileUrl: "/documents/sample-reference.pdf", notes: "Shatti Al Qurum office." },
  { id: 5, docId: "DOC-005", branchId: 2, type: "Office Lease Contract", expiryDate: dayOffset(-12), fileName: "lease-salalah.pdf", fileUrl: "/documents/sample-reference.pdf", notes: "Renewal overdue." },
  { id: 6, docId: "DOC-006", branchId: 3, type: "Apartment Lease Contract", expiryDate: dayOffset(160), fileName: "apartment-sohar.pdf", fileUrl: "/documents/sample-reference.pdf", notes: "Staff accommodation." },
  { id: 7, docId: "DOC-007", branchId: null, type: "Other", expiryDate: "", fileName: "accounts-2025.pdf", fileUrl: "/documents/sample-reference.pdf", notes: "Audited annual accounts." },
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
// In the order a client's work passes through them: the supervisor over it, the
// consultant advising on it, the lawyer running it, the officer enforcing it.
export const BRANCH_ROLES = [
  "General Supervisor",
  "Legal Consultant",
  "Lawyer",
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
  { id: 14, name: "Fatma Al Zadjali", branchId: 1, role: "Lawyer" },
  { id: 15, name: "Omar Al Harthy", branchId: 1, role: "Lawyer" },

  { id: 7, name: "Salim Al Rawahi", branchId: 2, role: "General Supervisor" },
  { id: 8, name: "Maryam Al Ghafri", branchId: 2, role: "Legal Consultant" },
  { id: 9, name: "Yusuf Al Kindi", branchId: 2, role: "Legal Consultant" },
  { id: 10, name: "Talal Al Mahrouqi", branchId: 2, role: "Enforcement Officer" },
  { id: 16, name: "Huda Al Balushi", branchId: 2, role: "Lawyer" },

  { id: 11, name: "Noura Al Habsi", branchId: 3, role: "General Supervisor" },
  { id: 12, name: "Badar Al Shukaili", branchId: 3, role: "Legal Consultant" },
  { id: 13, name: "Zahra Al Jabri", branchId: 3, role: "Enforcement Officer" },
  { id: 17, name: "Saif Al Rashdi", branchId: 3, role: "Lawyer" },
];

/** Staff of one branch who hold a given role. */
export const staffFor = (branchId, role) =>
  firmStaff.filter((s) => s.branchId === Number(branchId) && s.role === role);
