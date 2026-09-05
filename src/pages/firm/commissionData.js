import { clientInvoices } from "@/pages/clients/clientMockData";

/**
 * The legal fees a client settled since a date.
 *
 * Commission is owed on fees, not on tax, so the VAT on each invoice is left
 * out - an invoice of 1,050 made of 1,000 fees and 50 VAT earns commission on
 * the 1,000. Only invoices actually paid count, and they count on the day the
 * money arrived rather than the day the invoice was raised, because that is
 * when the commission fell due.
 */
export function legalFeesCollected(clientNo, from, to) {
  if (!clientNo || !from) return 0;
  return clientInvoices
    .filter(
      (invoice) =>
        invoice.clientNo === clientNo &&
        invoice.status === "Paid" &&
        invoice.paidDate >= from &&
        (!to || invoice.paidDate <= to)
    )
    .reduce((sum, invoice) => sum + Number(invoice.legalFees || 0), 0);
}

/**
 * The commission arrangements the firm has agreed.
 *
 * A record holds who is paid, on whose fees, at what rate and from when. It
 * never holds the commission itself: that is the fees times the rate, and a
 * stored answer can disagree with the two numbers it came from.
 *
 * Kept here rather than inside the page that manages them, because an employee
 * is shown their own arrangements on their own record - one list, so the two
 * screens cannot disagree about what was agreed.
 */
export const commissionRecords = [
  { id: 1, commissionNo: "COM-2024-001", classification: "Partners", paidTo: "Mohammed Al Yahyaei", clientNo: "1", clientName: "ABC Holdings LLC", type: "General", caseFileNo: "", rate: 10, recurrence: "Recurring", effectiveFrom: "2024-01-01", effectiveTo: "" },
  { id: 2, commissionNo: "COM-2024-002", classification: "Lawyers", paidTo: "Fatima Al Rashdi", clientNo: "1", clientName: "ABC Holdings LLC", type: "Specific", caseFileNo: "21", rate: 5, recurrence: "One-time", effectiveFrom: "2024-05-01", effectiveTo: "2024-12-31" },
  { id: 3, commissionNo: "COM-2024-003", classification: "Consultants", paidTo: "Amina Al Farsi", clientNo: "3", clientName: "Al Madina Trading", type: "General", caseFileNo: "", rate: 7.5, recurrence: "Recurring", effectiveFrom: "2024-07-01", effectiveTo: "" },
];

/** The fees an arrangement has run on so far. */
export const feesFor = (record) =>
  legalFeesCollected(record.clientNo, record.effectiveFrom, record.effectiveTo);

/** What it has earned: the fees times the rate, worked out on the spot. */
export const commissionOn = (record) =>
  (feesFor(record) * Number(record.rate || 0)) / 100;

/** Everything agreed with one person. */
export const commissionsFor = (name) =>
  commissionRecords.filter((record) => record.paidTo === name);
