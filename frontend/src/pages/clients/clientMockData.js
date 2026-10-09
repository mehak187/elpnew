// Sample records for the client profile sections. In the live system each of
// these comes from the API, scoped to the client being viewed.

import { dayOffset } from "./clientRecords";

/**
 * The papers filed against this client.
 *
 * `documentDate` is the date on the document itself, not the day it was
 * uploaded - a certificate issued in March that reaches the office in June
 * is a March document, and the expiry it is read against belongs to that
 * date.
 *
 * Status is not held here. It is read off the expiry date every render, so a
 * paper cannot sit in the list calling itself valid after its date has
 * passed. Expiries are generated around today so the demo always shows all
 * three states.
 */
export const clientDocuments = [
  { id: 1, serial: 1, documentType: "Power of Attorney", fileName: "poa-2024.pdf", fileUrl: "/documents/sample-poa.pdf", documentDate: dayOffset(-960), expiryDate: dayOffset(400), notes: "Signed before the notary in Muscat.", linkedFileNo: null },
  { id: 2, serial: 2, documentType: "Commercial Registration", fileName: "cr-certificate.pdf", fileUrl: "/documents/sample-reference.pdf", documentDate: dayOffset(-960), expiryDate: dayOffset(300), notes: "", linkedFileNo: null },
  { id: 3, serial: 3, documentType: "ID Card", fileName: "id-card.pdf", fileUrl: "/documents/sample-reference.pdf", documentDate: dayOffset(-945), expiryDate: "", notes: "", linkedFileNo: null },
  { id: 4, serial: 4, documentType: "Tax Card", fileName: "tax-card.pdf", fileUrl: "/documents/sample-reference.pdf", documentDate: dayOffset(-942), expiryDate: "", notes: "", linkedFileNo: null },
  { id: 5, serial: 5, documentType: "Trade License", fileName: "trade-license.pdf", fileUrl: "/documents/sample-reference.pdf", documentDate: dayOffset(-937), expiryDate: dayOffset(150), notes: "", linkedFileNo: null },
  { id: 6, serial: 6, documentType: "Memorandum of Association", fileName: "moa.pdf", fileUrl: "/documents/sample-reference.pdf", documentDate: dayOffset(-920), expiryDate: dayOffset(18), notes: "", linkedFileNo: null },
  { id: 7, serial: 7, documentType: "Share Certificate", fileName: "share-certificate.pdf", fileUrl: "/documents/sample-reference.pdf", documentDate: dayOffset(-915), expiryDate: dayOffset(-45), notes: "", linkedFileNo: null },
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
/**
 * The client's files, one row each.
 *
 * `caseNumbers` holds every number the file has been given as it moved up:
 * the same dispute is registered afresh at each level, so a file at the
 * Supreme Court still carries its Primary and Appeal numbers. Keeping them
 * together is what lets one row show a file's whole history.
 *
 * `litigationLevel` is where the file stands now - the level its next
 * hearing belongs to - which is what the stage tabs count.
 */
export const clientLinkedCases = [
  { id: 1, fileNo: "21", opponent: "Al Noor Trading LLC", caseNumbers: { Primary: "125/2026" }, litigationLevel: "Primary", caseStage: "Case Registration", caseStatus: "Active", court: "Muscat Primary Court", governorate: "Muscat", location: "Muscat", updateDate: "2025-01-12", update: "Reviewing documents" },
  { id: 2, fileNo: "34", opponent: "Muscat Logistics SAOC", caseNumbers: { Primary: "98/2025", Appeal: "88/2026" }, litigationLevel: "Appeal", caseStage: "Commencing", caseStatus: "Active", court: "Court of Appeal", governorate: "Muscat", location: "Muscat", updateDate: "2025-02-04", update: "Memo submitted, awaiting hearing date" },
  { id: 3, fileNo: "47", opponent: "Salim Al Harthi", caseNumbers: { Primary: "212/2025" }, litigationLevel: "Primary", caseStage: "Adjournments", caseStatus: "Active", court: "Labour Court", governorate: "Muscat", location: "Seeb", updateDate: "2024-11-19", update: "Judgement issued, awaiting execution" },
  { id: 4, fileNo: "52", opponent: "Oman Development LLC", caseNumbers: { Primary: "145/2024", Execution: "3021/2026" }, litigationLevel: "Execution", caseStage: "Enforcement", caseStatus: "Active", court: "Execution Court", governorate: "Muscat", location: "Muscat", updateDate: "2025-03-01", update: "Execution procedures in progress" },
  { id: 5, fileNo: "58", opponent: "Bright Future Trading", caseNumbers: { Primary: "77/2024", Execution: "2884/2025" }, litigationLevel: "Execution", caseStage: "Settlement", caseStatus: "Closed", court: "Execution Court", governorate: "Dhofar", location: "Salalah", updateDate: "2025-04-21", update: "Case closed after full execution" },
  { id: 6, fileNo: "63", opponent: "Gulf Metals SAOC", caseNumbers: { Primary: "301/2026" }, litigationLevel: "Primary", caseStage: "Pleadings", caseStatus: "Active", court: "Investment & Commerce Court", governorate: "Muscat", location: "Muscat", updateDate: "2025-01-28", update: "Statement of defence filed" },
  { id: 7, fileNo: "70", opponent: "Rustaq Developments", caseNumbers: { Primary: "66/2025", Appeal: "120/2026" }, litigationLevel: "Appeal", caseStage: "Adjournments", caseStatus: "Active", court: "Court of Appeal", governorate: "Al Batinah North", location: "Rustaq", updateDate: "2025-02-17", update: "Hearing adjourned to next month" },
  { id: 8, fileNo: "74", opponent: "Seeb Wholesale", caseNumbers: { Primary: "188/2024", Appeal: "52/2025", Supreme: "41/2026" }, litigationLevel: "Supreme", caseStage: "Commencing", caseStatus: "Active", court: "Supreme Court", governorate: "Muscat", location: "Muscat", updateDate: "2025-03-14", update: "Appeal registered at Supreme Court" },
  { id: 9, fileNo: "81", opponent: "Batinah Transport", caseNumbers: { Primary: "233/2025", Execution: "3110/2026" }, litigationLevel: "Execution", caseStage: "Enforcement", caseStatus: "Active", court: "Execution Court", governorate: "Al Batinah South", location: "Barka", updateDate: "2025-04-02", update: "Assets identified for seizure" },
  { id: 10, fileNo: "88", opponent: "Amerat Contracting", caseNumbers: { Primary: "154/2024", Appeal: "31/2025", Execution: "2990/2025" }, litigationLevel: "Execution", caseStage: "Settlement", caseStatus: "Closed", court: "Execution Court", governorate: "Muscat", location: "Al Amerat", updateDate: "2025-04-30", update: "Settled and file closed" },
];

/**
 * A case file, by its number.
 *
 * An invoice records which file it was raised for and nothing else about it:
 * the opponent, the level and the case number belong to the case, and copying
 * them onto the invoice would let the two disagree the moment a case moves.
 */
export const caseByFileNo = (fileNo) =>
  clientLinkedCases.find((file) => file.fileNo === fileNo) || null;

/** The case number at the level the file currently stands at. */
export const currentCaseNo = (file) =>
  file ? file.caseNumbers[file.litigationLevel] || "-" : "-";

/**
 * What this client has been billed.
 *
 * `details` is the fee being charged and `reason` is why it was charged;
 * `caseFileNo` ties both to the file they were earned on. `feeType` says what
 * kind of money the invoice is for - only "Legal Fees" earns commission, so
 * court charges, execution fees, expenses and disbursements are told apart
 * here rather than guessed at from the wording of the details.
 */
export const clientInvoices = [
  { id: 1, clientNo: "1", date: "2024-02-15", invoiceNo: "INV-2024-011", dueDate: "2024-03-16", caseFileNo: "21", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Case filing and representation", legalFees: 4500, vat: 225, amount: 4725, paidAmount: 4725, paidDate: "2024-03-10", status: "Paid", notes: "" },
  { id: 2, clientNo: "1", date: "2024-05-02", invoiceNo: "INV-2024-042", dueDate: "2024-06-01", caseFileNo: "34", feeType: "Legal Fees", details: "Legal fees - Appeal", reason: "Appeal fees as per agreement", legalFees: 1200, vat: 60, amount: 1260, paidAmount: 600, paidDate: "", status: "Partially Paid", notes: "Balance agreed for June." },
  { id: 3, clientNo: "1", date: "2024-07-08", invoiceNo: "INV-2024-071", dueDate: "2024-08-07", caseFileNo: "52", feeType: "Execution Fees", details: "Execution fees", reason: "Execution request and follow up", legalFees: 2000, vat: 100, amount: 2100, paidAmount: 2100, paidDate: "2024-07-29", status: "Paid", notes: "" },
  { id: 4, clientNo: "1", date: "2024-08-19", invoiceNo: "INV-2024-088", dueDate: "2024-09-18", caseFileNo: "74", feeType: "Legal Fees", details: "Legal fees - Supreme", reason: "Supreme Court submission", legalFees: 4500, vat: 225, amount: 4725, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 5, clientNo: "1", date: "2024-10-01", invoiceNo: "INV-2024-102", dueDate: "2024-10-31", caseFileNo: "63", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Statement of defence and hearings", legalFees: 2750, vat: 137.5, amount: 2887.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent twice." },
  { id: 6, clientNo: "1", date: "2024-11-11", invoiceNo: "INV-2024-119", dueDate: "2024-12-11", caseFileNo: "47", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "As per agreement HON046659", legalFees: 800, vat: 40, amount: 840, paidAmount: 0, paidDate: "", status: "Cancelled", notes: "Raised in error." },

  { id: 7, clientNo: "2", date: "2025-01-05", invoiceNo: "INV-2025-200", dueDate: "2025-02-04", caseFileNo: "21", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 1500, vat: 75.0, amount: 1575.0, paidAmount: 1575.0, paidDate: "2025-01-27", status: "Paid", notes: "" },
  { id: 8, clientNo: "2", date: "2025-03-06", invoiceNo: "INV-2025-201", dueDate: "2025-04-05", caseFileNo: "52", feeType: "Legal Fees", details: "Legal fees - Appeal", reason: "Appeal submission", legalFees: 800, vat: 40.0, amount: 840.0, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 9, clientNo: "3", date: "2026-02-06", invoiceNo: "INV-2026-202", dueDate: "2026-03-08", caseFileNo: "34", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 2000, vat: 100.0, amount: 2100.0, paidAmount: 2100.0, paidDate: "2026-03-01", status: "Paid", notes: "" },
  { id: 10, clientNo: "3", date: "2026-04-07", invoiceNo: "INV-2026-203", dueDate: "2026-05-07", caseFileNo: "58", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Statement of defence", legalFees: 1150, vat: 57.5, amount: 1207.5, paidAmount: 603.75, paidDate: "", status: "Partially Paid", notes: "Balance agreed in instalments." },
  { id: 11, clientNo: "4", date: "2025-03-07", invoiceNo: "INV-2025-204", dueDate: "2025-04-06", caseFileNo: "47", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 2500, vat: 125.0, amount: 2625.0, paidAmount: 2625.0, paidDate: "2025-03-31", status: "Paid", notes: "" },
  { id: 12, clientNo: "4", date: "2025-05-06", invoiceNo: "INV-2025-205", dueDate: "2025-06-05", caseFileNo: "63", feeType: "Execution Fees", details: "Execution fees", reason: "Execution request and follow up", legalFees: 1500, vat: 75.0, amount: 1575.0, paidAmount: 1575.0, paidDate: "2025-05-24", status: "Paid", notes: "" },
  { id: 13, clientNo: "5", date: "2026-04-08", invoiceNo: "INV-2026-206", dueDate: "2026-05-08", caseFileNo: "52", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 3000, vat: 150.0, amount: 3150.0, paidAmount: 3150.0, paidDate: "2026-05-03", status: "Paid", notes: "" },
  { id: 14, clientNo: "5", date: "2026-06-07", invoiceNo: "INV-2026-207", dueDate: "2026-07-07", caseFileNo: "70", feeType: "Legal Fees", details: "Legal fees - Supreme", reason: "Supreme Court submission", legalFees: 1850, vat: 92.5, amount: 1942.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent." },
  { id: 15, clientNo: "6", date: "2025-05-09", invoiceNo: "INV-2025-208", dueDate: "2025-06-08", caseFileNo: "58", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 3500, vat: 175.0, amount: 3675.0, paidAmount: 3675.0, paidDate: "2025-06-04", status: "Paid", notes: "" },
  { id: 16, clientNo: "6", date: "2025-07-08", invoiceNo: "INV-2025-209", dueDate: "2025-08-07", caseFileNo: "74", feeType: "Legal Fees", details: "Legal fees - Appeal", reason: "Appeal submission", legalFees: 2200, vat: 110.0, amount: 2310.0, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 17, clientNo: "7", date: "2026-06-10", invoiceNo: "INV-2026-210", dueDate: "2026-07-10", caseFileNo: "63", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 4000, vat: 200.0, amount: 4200.0, paidAmount: 4200.0, paidDate: "2026-07-07", status: "Paid", notes: "" },
  { id: 18, clientNo: "7", date: "2026-08-09", invoiceNo: "INV-2026-211", dueDate: "2026-09-08", caseFileNo: "81", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Statement of defence", legalFees: 2550, vat: 127.5, amount: 2677.5, paidAmount: 1338.75, paidDate: "", status: "Partially Paid", notes: "Balance agreed in instalments." },
  { id: 19, clientNo: "8", date: "2025-07-11", invoiceNo: "INV-2025-212", dueDate: "2025-08-10", caseFileNo: "70", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 4500, vat: 225.0, amount: 4725.0, paidAmount: 4725.0, paidDate: "2025-08-08", status: "Paid", notes: "" },
  { id: 20, clientNo: "8", date: "2025-09-09", invoiceNo: "INV-2025-213", dueDate: "2025-10-09", caseFileNo: "88", feeType: "Execution Fees", details: "Execution fees", reason: "Execution request and follow up", legalFees: 800, vat: 40.0, amount: 840.0, paidAmount: 840.0, paidDate: "2025-09-27", status: "Paid", notes: "" },
  { id: 21, clientNo: "9", date: "2026-08-12", invoiceNo: "INV-2026-214", dueDate: "2026-09-11", caseFileNo: "74", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 5000, vat: 250.0, amount: 5250.0, paidAmount: 5250.0, paidDate: "2026-09-10", status: "Paid", notes: "" },
  { id: 22, clientNo: "9", date: "2026-10-11", invoiceNo: "INV-2026-215", dueDate: "2026-11-10", caseFileNo: "21", feeType: "Legal Fees", details: "Legal fees - Supreme", reason: "Supreme Court submission", legalFees: 1150, vat: 57.5, amount: 1207.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent." },
  { id: 23, clientNo: "10", date: "2025-09-13", invoiceNo: "INV-2025-216", dueDate: "2025-10-13", caseFileNo: "81", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 1500, vat: 75.0, amount: 1575.0, paidAmount: 1575.0, paidDate: "2025-10-13", status: "Paid", notes: "" },
  { id: 24, clientNo: "10", date: "2025-11-12", invoiceNo: "INV-2025-217", dueDate: "2025-12-12", caseFileNo: "34", feeType: "Legal Fees", details: "Legal fees - Appeal", reason: "Appeal submission", legalFees: 1500, vat: 75.0, amount: 1575.0, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 25, clientNo: "11", date: "2026-10-14", invoiceNo: "INV-2026-218", dueDate: "2026-11-13", caseFileNo: "88", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 2000, vat: 100.0, amount: 2100.0, paidAmount: 2100.0, paidDate: "2026-11-05", status: "Paid", notes: "" },
  { id: 26, clientNo: "11", date: "2026-12-13", invoiceNo: "INV-2026-219", dueDate: "2027-01-12", caseFileNo: "47", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Statement of defence", legalFees: 1850, vat: 92.5, amount: 1942.5, paidAmount: 971.25, paidDate: "", status: "Partially Paid", notes: "Balance agreed in instalments." },
  { id: 27, clientNo: "12", date: "2025-11-15", invoiceNo: "INV-2025-220", dueDate: "2025-12-15", caseFileNo: "21", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 2500, vat: 125.0, amount: 2625.0, paidAmount: 2625.0, paidDate: "2025-12-08", status: "Paid", notes: "" },
  { id: 28, clientNo: "12", date: "2026-01-14", invoiceNo: "INV-2025-221", dueDate: "2026-02-13", caseFileNo: "52", feeType: "Execution Fees", details: "Execution fees", reason: "Execution request and follow up", legalFees: 2200, vat: 110.0, amount: 2310.0, paidAmount: 2310.0, paidDate: "2026-02-01", status: "Paid", notes: "" },
  { id: 29, clientNo: "13", date: "2026-12-16", invoiceNo: "INV-2026-222", dueDate: "2027-01-15", caseFileNo: "34", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 3000, vat: 150.0, amount: 3150.0, paidAmount: 3150.0, paidDate: "2027-01-09", status: "Paid", notes: "" },
  { id: 30, clientNo: "13", date: "2027-02-14", invoiceNo: "INV-2026-223", dueDate: "2027-03-16", caseFileNo: "58", feeType: "Legal Fees", details: "Legal fees - Supreme", reason: "Supreme Court submission", legalFees: 2550, vat: 127.5, amount: 2677.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent." },
  { id: 31, clientNo: "14", date: "2025-01-17", invoiceNo: "INV-2025-224", dueDate: "2025-02-16", caseFileNo: "47", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 3500, vat: 175.0, amount: 3675.0, paidAmount: 3675.0, paidDate: "2025-02-11", status: "Paid", notes: "" },
  { id: 32, clientNo: "14", date: "2025-03-18", invoiceNo: "INV-2025-225", dueDate: "2025-04-17", caseFileNo: "63", feeType: "Legal Fees", details: "Legal fees - Appeal", reason: "Appeal submission", legalFees: 800, vat: 40.0, amount: 840.0, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 33, clientNo: "15", date: "2026-02-18", invoiceNo: "INV-2026-226", dueDate: "2026-03-20", caseFileNo: "52", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 4000, vat: 200.0, amount: 4200.0, paidAmount: 4200.0, paidDate: "2026-03-16", status: "Paid", notes: "" },
  { id: 34, clientNo: "15", date: "2026-04-19", invoiceNo: "INV-2026-227", dueDate: "2026-05-19", caseFileNo: "70", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Statement of defence", legalFees: 1150, vat: 57.5, amount: 1207.5, paidAmount: 603.75, paidDate: "", status: "Partially Paid", notes: "Balance agreed in instalments." },
  { id: 35, clientNo: "16", date: "2025-03-19", invoiceNo: "INV-2025-228", dueDate: "2025-04-18", caseFileNo: "58", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 4500, vat: 225.0, amount: 4725.0, paidAmount: 4725.0, paidDate: "2025-04-15", status: "Paid", notes: "" },
  { id: 36, clientNo: "16", date: "2025-05-18", invoiceNo: "INV-2025-229", dueDate: "2025-06-17", caseFileNo: "74", feeType: "Execution Fees", details: "Execution fees", reason: "Execution request and follow up", legalFees: 1500, vat: 75.0, amount: 1575.0, paidAmount: 1575.0, paidDate: "2025-06-05", status: "Paid", notes: "" },
  { id: 37, clientNo: "17", date: "2026-04-20", invoiceNo: "INV-2026-230", dueDate: "2026-05-20", caseFileNo: "63", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 5000, vat: 250.0, amount: 5250.0, paidAmount: 5250.0, paidDate: "2026-05-18", status: "Paid", notes: "" },
  { id: 38, clientNo: "17", date: "2026-06-19", invoiceNo: "INV-2026-231", dueDate: "2026-07-19", caseFileNo: "81", feeType: "Legal Fees", details: "Legal fees - Supreme", reason: "Supreme Court submission", legalFees: 1850, vat: 92.5, amount: 1942.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent." },
  { id: 39, clientNo: "18", date: "2025-05-21", invoiceNo: "INV-2025-232", dueDate: "2025-06-20", caseFileNo: "70", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 1500, vat: 75.0, amount: 1575.0, paidAmount: 1575.0, paidDate: "2025-06-19", status: "Paid", notes: "" },
  { id: 40, clientNo: "18", date: "2025-07-20", invoiceNo: "INV-2025-233", dueDate: "2025-08-19", caseFileNo: "88", feeType: "Legal Fees", details: "Legal fees - Appeal", reason: "Appeal submission", legalFees: 2200, vat: 110.0, amount: 2310.0, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 41, clientNo: "19", date: "2026-06-22", invoiceNo: "INV-2026-234", dueDate: "2026-07-22", caseFileNo: "74", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 2000, vat: 100.0, amount: 2100.0, paidAmount: 2100.0, paidDate: "2026-07-22", status: "Paid", notes: "" },
  { id: 42, clientNo: "19", date: "2026-08-21", invoiceNo: "INV-2026-235", dueDate: "2026-09-20", caseFileNo: "21", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Statement of defence", legalFees: 2550, vat: 127.5, amount: 2677.5, paidAmount: 1338.75, paidDate: "", status: "Partially Paid", notes: "Balance agreed in instalments." },
  { id: 43, clientNo: "20", date: "2025-07-23", invoiceNo: "INV-2025-236", dueDate: "2025-08-22", caseFileNo: "81", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 2500, vat: 125.0, amount: 2625.0, paidAmount: 2625.0, paidDate: "2025-08-14", status: "Paid", notes: "" },
  { id: 44, clientNo: "20", date: "2025-09-21", invoiceNo: "INV-2025-237", dueDate: "2025-10-21", caseFileNo: "34", feeType: "Execution Fees", details: "Execution fees", reason: "Execution request and follow up", legalFees: 800, vat: 40.0, amount: 840.0, paidAmount: 840.0, paidDate: "2025-10-09", status: "Paid", notes: "" },
  { id: 45, clientNo: "21", date: "2026-08-24", invoiceNo: "INV-2026-238", dueDate: "2026-09-23", caseFileNo: "88", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 3000, vat: 150.0, amount: 3150.0, paidAmount: 3150.0, paidDate: "2026-09-16", status: "Paid", notes: "" },
  { id: 46, clientNo: "21", date: "2026-10-23", invoiceNo: "INV-2026-239", dueDate: "2026-11-22", caseFileNo: "47", feeType: "Legal Fees", details: "Legal fees - Supreme", reason: "Supreme Court submission", legalFees: 1150, vat: 57.5, amount: 1207.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent." },
  { id: 47, clientNo: "22", date: "2025-09-05", invoiceNo: "INV-2025-240", dueDate: "2025-10-05", caseFileNo: "21", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 3500, vat: 175.0, amount: 3675.0, paidAmount: 3675.0, paidDate: "2025-09-29", status: "Paid", notes: "" },
  { id: 48, clientNo: "22", date: "2025-11-04", invoiceNo: "INV-2025-241", dueDate: "2025-12-04", caseFileNo: "52", feeType: "Legal Fees", details: "Legal fees - Appeal", reason: "Appeal submission", legalFees: 1500, vat: 75.0, amount: 1575.0, paidAmount: 0, paidDate: "", status: "Unpaid", notes: "" },
  { id: 49, clientNo: "23", date: "2026-10-06", invoiceNo: "INV-2026-242", dueDate: "2026-11-05", caseFileNo: "34", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 4000, vat: 200.0, amount: 4200.0, paidAmount: 4200.0, paidDate: "2026-10-31", status: "Paid", notes: "" },
  { id: 50, clientNo: "23", date: "2026-12-05", invoiceNo: "INV-2026-243", dueDate: "2027-01-04", caseFileNo: "58", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Statement of defence", legalFees: 1850, vat: 92.5, amount: 1942.5, paidAmount: 971.25, paidDate: "", status: "Partially Paid", notes: "Balance agreed in instalments." },
  { id: 51, clientNo: "24", date: "2025-11-07", invoiceNo: "INV-2025-244", dueDate: "2025-12-07", caseFileNo: "47", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 4500, vat: 225.0, amount: 4725.0, paidAmount: 4725.0, paidDate: "2025-12-03", status: "Paid", notes: "" },
  { id: 52, clientNo: "24", date: "2026-01-06", invoiceNo: "INV-2025-245", dueDate: "2026-02-05", caseFileNo: "63", feeType: "Execution Fees", details: "Execution fees", reason: "Execution request and follow up", legalFees: 2200, vat: 110.0, amount: 2310.0, paidAmount: 2310.0, paidDate: "2026-01-24", status: "Paid", notes: "" },
  { id: 53, clientNo: "25", date: "2026-12-08", invoiceNo: "INV-2026-246", dueDate: "2027-01-07", caseFileNo: "52", feeType: "Legal Fees", details: "Legal fees - Primary", reason: "Representation and hearings", legalFees: 5000, vat: 250.0, amount: 5250.0, paidAmount: 5250.0, paidDate: "2027-01-04", status: "Paid", notes: "" },
  { id: 54, clientNo: "25", date: "2027-02-06", invoiceNo: "INV-2026-247", dueDate: "2027-03-08", caseFileNo: "70", feeType: "Legal Fees", details: "Legal fees - Supreme", reason: "Supreme Court submission", legalFees: 2550, vat: 127.5, amount: 2677.5, paidAmount: 0, paidDate: "", status: "Overdue", notes: "Reminder sent." },
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

