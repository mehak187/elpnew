import { clientInvoices } from "@/pages/clients/clientMockData";

/* ------------------------------------------ what commission is counted on */

/**
 * The only kind of invoice commission is earned on.
 *
 * Court charges, execution fees, expenses and disbursements are money the firm
 * collects and passes on, not fees it earns, so an invoice for any of them
 * earns nobody a share.
 */
export const LEGAL_FEES = "Legal Fees";

export const isLegalFeesInvoice = (invoice) => invoice.feeType === LEGAL_FEES;

/**
 * Settled in full, going by the money rather than the label.
 *
 * What was paid has to reach the whole invoice, VAT included, and there has to
 * be a day it arrived. A part payment earns nothing until it is complete, and a
 * cancelled invoice never does. The status is not trusted on its own: it is
 * written separately, and a stored label can disagree with the amounts beside
 * it.
 */
export const isFullyPaid = (invoice) =>
  invoice.status !== "Cancelled" &&
  Boolean(invoice.paidDate) &&
  Number(invoice.paidAmount || 0) >= Number(invoice.amount || 0);

/**
 * What an invoice earns commission on: its legal fees before VAT.
 *
 * An invoice of OMR 105 made of 100 legal fees and 5 VAT earns commission on
 * the 100. VAT is the government's money, collected on its behalf.
 */
const feesBeforeVat = (invoice) => Number(invoice.legalFees || 0);

/**
 * The legal fees a client paid in full within a period.
 *
 * Counted on the day the money arrived rather than the day the invoice was
 * raised, because that is when the commission fell due - so an invoice raised
 * in March and settled in May belongs to May. Both ends of the period count.
 */
export function legalFeesCollected(clientNo, from, to) {
  if (!clientNo || !from) return 0;
  return clientInvoices
    .filter(
      (invoice) =>
        invoice.clientNo === clientNo &&
        isLegalFeesInvoice(invoice) &&
        isFullyPaid(invoice) &&
        invoice.paidDate >= from &&
        (!to || invoice.paidDate <= to)
    )
    .reduce((sum, invoice) => sum + feesBeforeVat(invoice), 0);
}

/**
 * The legal fees a client paid in full on one case file.
 *
 * A commission agreed for a single case is owed on that case's fees and no
 * others, so the invoice has to say which file it was for. The same rules as a
 * period otherwise: legal fees only, before VAT, paid in full.
 */
export function legalFeesOnCase(clientNo, caseFileNo) {
  if (!clientNo || !caseFileNo) return 0;
  return clientInvoices
    .filter(
      (invoice) =>
        invoice.clientNo === clientNo &&
        invoice.caseFileNo === caseFileNo &&
        isLegalFeesInvoice(invoice) &&
        isFullyPaid(invoice)
    )
    .reduce((sum, invoice) => sum + feesBeforeVat(invoice), 0);
}

/* ------------------------------------------------- where it lands in the books */

/** A standing arrangement, and one agreed for a particular piece of work. */
export const FIXED_COMMISSION = "Fixed Commission";
export const SPECIFIC_COMMISSION = "Specific Commission";

/**
 * Where a commission lands in the accounts.
 *
 * One type and one category, because every commission the firm agrees is
 * booked the same way. What changes is whether it stands for the period or was
 * agreed once, which is what the subcategory records.
 */
export const COMMISSION_BOOKING = [
  {
    name: "Employee Expenses",
    categories: [
      {
        name: "Commission",
        subcategories: [FIXED_COMMISSION, SPECIFIC_COMMISSION],
      },
    ],
  },
];

export const categoriesOf = (type) =>
  COMMISSION_BOOKING.find((t) => t.name === type)?.categories || [];

export const subcategoriesOf = (type, category) =>
  categoriesOf(type).find((c) => c.name === category)?.subcategories || [];

// The subcategory is left for the user to choose: it decides which questions
// the form asks next, so it is never answered for them.
export const DEFAULT_COMMISSION_BOOKING = {
  expenseType: "Employee Expenses",
  category: "Commission",
  subcategory: "",
};

/**
 * Whether the arrangement stands or was agreed once.
 *
 * Not stored: a fixed commission runs for the whole period and a specific one
 * is agreed for a single piece of work, so the subcategory already says it. A
 * field of its own could only ever repeat it or contradict it.
 */
export const recurrenceOf = (record) =>
  record.type === SPECIFIC_COMMISSION ? "One-time" : "Recurring";

/* ------------------------------------------------------------ the arrangements */

/**
 * The commission arrangements the firm has agreed.
 *
 * A record holds who is paid, on whose fees, at what rate and over what period.
 * It never holds the commission itself: that is the fees times the rate, and a
 * stored answer can disagree with the two numbers it came from.
 *
 * Kept here rather than inside the page that manages them, because an employee
 * is shown their own arrangements on their own record - one list, so the two
 * screens cannot disagree about what was agreed.
 */
export const commissionRecords = [
  { id: 1, commissionNo: "COM-2024-001", classification: "Partners", paidTo: "Mohammed Al Yahyaei", clientNo: "1", clientName: "ABC Holdings LLC", type: FIXED_COMMISSION, caseFileNo: "", rate: 10, periodFrom: "2024-01-01", periodTo: "", notes: "" },
  { id: 2, commissionNo: "COM-2024-002", classification: "Lawyers", paidTo: "Fatima Al Rashdi", clientNo: "1", clientName: "ABC Holdings LLC", type: SPECIFIC_COMMISSION, caseFileNo: "21", rate: 5, periodFrom: "2024-05-01", periodTo: "2024-12-31", notes: "" },
  { id: 3, commissionNo: "COM-2024-003", classification: "Consultants", paidTo: "Amina Al Farsi", clientNo: "3", clientName: "Al Madina Trading", type: FIXED_COMMISSION, caseFileNo: "", rate: 7.5, periodFrom: "2024-07-01", periodTo: "", notes: "" },
];

/**
 * The next number in the year's run: COM-2026-004.
 *
 * Kept here because two pages add commissions - the firm's own page and an
 * employee's record - and a number handed out twice would name two things.
 */
export function nextCommissionNo(records) {
  const year = new Date().getFullYear();
  const prefix = "COM-" + year + "-";
  const highest = records
    .filter((r) => r.commissionNo.startsWith(prefix))
    .reduce(
      (max, r) => Math.max(max, Number(r.commissionNo.slice(prefix.length))),
      0
    );
  return prefix + String(highest + 1).padStart(3, "0");
}

/**
 * The month an arrangement started, as the list writes it: 01/2024.
 *
 * Read off the date the period opens rather than asked for a second time - a
 * month that disagreed with the date beside it would be wrong on sight.
 */
export const monthAndYear = (record) => {
  const [year, month] = String(record.periodFrom || "").split("-");
  return year && month ? month + "/" + year : "-";
};

/**
 * The fees an arrangement has run on so far.
 *
 * Which fees those are depends on what kind it is: a specific commission is
 * agreed for one case file and earns on that file alone, while a fixed one
 * stands over a period and earns on everything paid inside it.
 */
export const feesFor = (record) =>
  record.type === SPECIFIC_COMMISSION
    ? legalFeesOnCase(record.clientNo, record.caseFileNo)
    : legalFeesCollected(record.clientNo, record.periodFrom, record.periodTo);

/** What it has earned: the fees times the rate, worked out on the spot. */
export const commissionOn = (record) =>
  (feesFor(record) * Number(record.rate || 0)) / 100;

/** Everything agreed with one person. */
export const commissionsFor = (name) =>
  commissionRecords.filter((record) => record.paidTo === name);
