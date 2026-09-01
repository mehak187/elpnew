// Sample records for the client profile sections. In the live system each of
// these comes from the API, scoped to the client being viewed.

export const clientDocuments = [
  {
    id: 1,
    documentType: "Power of Attorney",
    fileName: "poa-2024.pdf",
    fileUrl: "/documents/sample-poa.pdf",
    uploadDate: "2024-01-20",
    expiryDate: "2025-12-31",
    status: "Valid",
    notes: "Signed before the notary in Muscat.",
    linkedFileNo: null,
  },
  {
    id: 2,
    documentType: "Commercial Registration",
    fileName: "cr-certificate.pdf",
    fileUrl: "/documents/sample-reference.pdf",
    uploadDate: "2024-01-20",
    expiryDate: "2025-06-15",
    status: "Expiring Soon",
    notes: "",
    linkedFileNo: null,
  },
  {
    id: 3,
    documentType: "ID Card",
    fileName: "id-card.pdf",
    fileUrl: "/documents/sample-reference.pdf",
    uploadDate: "2024-02-02",
    expiryDate: "",
    status: "Valid",
    notes: "",
    linkedFileNo: null,
  },
];


/**
 * Every agreement signed with this client - the original, its renewals, and any
 * amendment made since. A contract with an end date that has passed is spent,
 * and the table drops it to the bottom.
 */
export const clientContracts = [
  {
    id: 1,
    serial: 1,
    contractType: "General",
    caseFileNo: null,
    title: "Original retainer agreement",
    startDate: "2024-01-20",
    endDate: "2025-01-19",
    fileName: "retainer-2024.pdf",
    fileUrl: "/documents/sample-reference.pdf",
    notes: "Superseded by the 2025 renewal.",
  },
  {
    id: 2,
    serial: 2,
    contractType: "General",
    caseFileNo: null,
    title: "Retainer renewal",
    startDate: "2025-01-20",
    endDate: "",
    fileName: "retainer-2025.pdf",
    fileUrl: "/documents/sample-reference.pdf",
    notes: "Rolling, no end date agreed.",
  },
  {
    id: 3,
    serial: 3,
    contractType: "Specific",
    caseFileNo: "21",
    title: "Investment dispute engagement",
    startDate: "2024-03-11",
    endDate: "",
    fileName: "special-contract-21.pdf",
    fileUrl: "/documents/sample-reference.pdf",
    notes: "Fee agreed on the outcome of the file.",
  },
];

// Office file sequence numbers a contract can be tied to.
export const officeFiles = [
  { fileNo: "21", label: "21 - Investment and Trade Dispute" },
  { fileNo: "34", label: "34 - Commercial Registration Renewal" },
  { fileNo: "47", label: "47 - Labour Claim" },
  { fileNo: "58", label: "58 - Debt Recovery" },
];

/**
 * The cases this client has running.
 *
 *  is the court a case has reached and  says
 * whether it is still live. The two are counted separately above the table:
 * a closed case still belongs to the level it ended at.
 */
export const clientLinkedCases = [
  { id: 1, fileNo: "21", opponent: "Al Noor Trading LLC", court: "Muscat Primary Court", litigationLevel: "Primary", caseStage: "Case Registration", caseStatus: "Active", updateDate: "2025-01-12", update: "Reviewing documents" },
  { id: 2, fileNo: "34", opponent: "Muscat Logistics SAOC", court: "Court of Appeal", litigationLevel: "Appeal", caseStage: "Commencing", caseStatus: "Active", updateDate: "2025-02-04", update: "Memo submitted, awaiting hearing date" },
  { id: 3, fileNo: "47", opponent: "Salim Al Harthi", court: "Labour Court", litigationLevel: "Primary", caseStage: "Adjournments", caseStatus: "Active", updateDate: "2024-11-19", update: "Judgement issued, awaiting execution" },
  { id: 4, fileNo: "52", opponent: "Oman Development LLC", court: "Execution Court", litigationLevel: "Execution", caseStage: "Enforcement", caseStatus: "Active", updateDate: "2025-03-01", update: "Execution procedures in progress" },
  { id: 5, fileNo: "58", opponent: "Bright Future Trading", court: "Execution Court", litigationLevel: "Execution", caseStage: "Settlement", caseStatus: "Closed", updateDate: "2025-04-21", update: "Case closed after full execution" },
  { id: 6, fileNo: "63", opponent: "Gulf Metals SAOC", court: "Muscat Primary Court", litigationLevel: "Primary", caseStage: "Pleadings", caseStatus: "Active", updateDate: "2025-01-28", update: "Statement of defence filed" },
  { id: 7, fileNo: "70", opponent: "Rustaq Developments", court: "Court of Appeal", litigationLevel: "Appeal", caseStage: "Adjournments", caseStatus: "Active", updateDate: "2025-02-17", update: "Hearing adjourned to next month" },
  { id: 8, fileNo: "74", opponent: "Seeb Wholesale", court: "Supreme Court", litigationLevel: "Supreme", caseStage: "Commencing", caseStatus: "Active", updateDate: "2025-03-14", update: "Appeal registered at Supreme Court" },
  { id: 9, fileNo: "81", opponent: "Batinah Transport", court: "Execution Court", litigationLevel: "Execution", caseStage: "Enforcement", caseStatus: "Active", updateDate: "2025-04-02", update: "Assets identified for seizure" },
  { id: 10, fileNo: "88", opponent: "Amerat Contracting", court: "Execution Court", litigationLevel: "Execution", caseStage: "Settlement", caseStatus: "Closed", updateDate: "2025-04-30", update: "Settled and file closed" },
];

export const clientInvoices = [
  { id: 1, clientNo: "1", date: "2024-02-15", invoiceNo: "INV-2024-011", dueDate: "2024-03-16", details: "Retainer - Q1 2024", legalFees: 4500, vat: 225, amount: 4725, paidAmount: 4725, paidDate: "2024-03-10", status: "Paid", notes: "" },
  { id: 2, clientNo: "1", date: "2024-05-02", invoiceNo: "INV-2024-042", dueDate: "2024-06-01", details: "Court fees - file 21", legalFees: 1200, vat: 60, amount: 1260, paidAmount: 600, paidDate: "", status: "Partially Paid", notes: "Balance agreed for June." },
  { id: 3, clientNo: "1", date: "2024-07-08", invoiceNo: "INV-2024-071", dueDate: "2024-08-07", details: "Advisory retainer - Q2", legalFees: 2000, vat: 100, amount: 2100, paidAmount: 2100, paidDate: "2024-07-29", status: "Paid", notes: "" },
  { id: 4, clientNo: "1", date: "2024-08-19", invoiceNo: "INV-2024-088", dueDate: "2024-09-18", details: "Retainer - Q3 2024", legalFees: 4500, vat: 225, amount: 4725, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 5, clientNo: "1", date: "2024-10-01", invoiceNo: "INV-2024-102", dueDate: "2024-10-31", details: "Appeal filing - file 34", legalFees: 2750, vat: 137.5, amount: 2887.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent twice." },
  { id: 6, clientNo: "1", date: "2024-11-11", invoiceNo: "INV-2024-119", dueDate: "2024-12-11", details: "Duplicate issue", legalFees: 800, vat: 40, amount: 840, paidAmount: 0, paidDate: "", status: "Cancelled", notes: "Raised in error." },
];

// Case activity, month by month. Deliberately holds no financial data - the
// analytics section is defined to ignore invoices and payment status.
export const clientCaseActivity = [
  { month: "2024-01", received: 2, closed: 0 },
  { month: "2024-02", received: 1, closed: 1 },
  { month: "2024-03", received: 3, closed: 0 },
  { month: "2024-04", received: 0, closed: 2 },
  { month: "2024-05", received: 2, closed: 1 },
  { month: "2024-06", received: 1, closed: 0 },
  { month: "2024-07", received: 0, closed: 1 },
  { month: "2024-08", received: 4, closed: 0 },
  { month: "2024-09", received: 1, closed: 2 },
  { month: "2024-10", received: 2, closed: 1 },
  { month: "2024-11", received: 0, closed: 3 },
  { month: "2024-12", received: 2, closed: 1 },
  { month: "2025-01", received: 3, closed: 0 },
  { month: "2025-02", received: 1, closed: 2 },
];

export const clientActivitySummary = {
  lastCaseReceived: "2025-02-08",
  casesInProgress: 4,
};

// Compact directory used by the merge screen. Replaced by the clients API
// call in the live system.
export const clientDirectory = [
  { clientNo: "1", clientName: "ABC Holdings LLC" },
  { clientNo: "2", clientName: "Fatima Rashid" },
  { clientNo: "3", clientName: "Al Madina Trading" },
  { clientNo: "4", clientName: "Gulf Construction Co" },
  { clientNo: "5", clientName: "Ahmed Al Lawati" },
  { clientNo: "6", clientName: "Muscat Finance LLC" },
  { clientNo: "7", clientName: "Salim Al Rawahi" },
  { clientNo: "8", clientName: "Salalah Port Services" },
  { clientNo: "21", clientName: "XYZ Investments" },
];

// Everything a merge carries across to the surviving client.
export const MERGE_TRANSFER_ITEMS = [
  "Files and transactions",
  "Invoices",
  "Payments and balances",
  "Documents",
  "Contracts",
  "Notes",
];

/** Who a commission can be paid to. */

