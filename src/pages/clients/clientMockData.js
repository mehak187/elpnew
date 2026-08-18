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
  {
    id: 4,
    documentType: "Special Contract",
    fileName: "special-contract-21.pdf",
    fileUrl: "/documents/sample-reference.pdf",
    uploadDate: "2024-03-11",
    expiryDate: "",
    status: "Valid",
    notes: "Linked to the investment dispute file.",
    linkedFileNo: "21",
  },
];

// Office file sequence numbers a Special Contract can be tied to.
export const officeFiles = [
  { fileNo: "21", label: "21 - Investment and Trade Dispute" },
  { fileNo: "34", label: "34 - Commercial Registration Renewal" },
  { fileNo: "47", label: "47 - Labour Claim" },
  { fileNo: "58", label: "58 - Debt Recovery" },
];

export const clientLinkedCases = [
  {
    id: 1,
    fileNo: "21",
    opponent: "Al Noor Trading LLC",
    caseDetails: "Investment and Trade - Primary (Dispute)",
    stage: "Case Registration",
    status: "Review documents",
    updateDate: "2025-01-12",
    update: "-",
  },
  {
    id: 2,
    fileNo: "34",
    opponent: "Muscat Logistics SAOC",
    caseDetails: "Commercial - Appeal (Contract)",
    stage: "Court Hearing",
    status: "Awaiting hearing date",
    updateDate: "2025-02-03",
    update: "Memo submitted",
  },
  {
    id: 3,
    fileNo: "47",
    opponent: "Salim Al Hinai",
    caseDetails: "Labour - Primary (Claim)",
    stage: "Post Judgement",
    status: "Judgement issued",
    updateDate: "2024-12-19",
    update: "Awaiting execution",
  },
];

export const clientInvoices = [
  { id: 1, date: "2024-02-15", invoiceNo: "INV-2024-011", details: "Retainer - Q1 2024", amount: 4500, paidAmount: 4500, status: "Paid", notes: "" },
  { id: 2, date: "2024-05-02", invoiceNo: "INV-2024-042", details: "Court fees - file 21", amount: 1200, paidAmount: 600, status: "Partially Paid", notes: "Balance agreed for June." },
  { id: 3, date: "2024-08-19", invoiceNo: "INV-2024-088", details: "Retainer - Q3 2024", amount: 4500, paidAmount: 0, status: "Unpaid", notes: "" },
  { id: 4, date: "2024-10-01", invoiceNo: "INV-2024-102", details: "Appeal filing - file 34", amount: 2750, paidAmount: 0, status: "Overdue", notes: "Reminder sent twice." },
  { id: 5, date: "2024-11-11", invoiceNo: "INV-2024-119", details: "Duplicate issue", amount: 800, paidAmount: 0, status: "Cancelled", notes: "Raised in error." },
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
