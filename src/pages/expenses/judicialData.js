/**
 * Judicial authority expenses - what the firm pays a court on a case's behalf.
 *
 * These are not supplier invoices. Every one of them belongs to a case file, so
 * the record carries the case it was paid for, the court that took the money,
 * and the transfer it went out on.
 */

import { dayOffset } from "@/pages/firm/firmData";

/** The nine things a court is paid for. The tiles are drawn from this order. */
export const JUDICIAL_EXPENSE_TYPES = [
  "Lawsuit Filing Fees",
  "Supreme Court Deposit",
  "Petition Order Security Deposit",
  "Judicial Announcements",
  "Expert Fees",
  "Translation Expenses",
  "Document Expenses",
  "Prisoner Release Bail",
  "Execution Amount Payment",
];

/** Every one of these sits under the same category. */
export const JUDICIAL_CATEGORY = "Judicial Authority Expenses";

export const CASE_KINDS = [
  "Commercial Case",
  "Civil Case",
  "Labour Case",
  "Criminal Case",
  "Real Estate Case",
  "Administrative Case",
  "Family / Personal Status Case",
];

export const COURT_LEVELS = [
  "First Instance",
  "Appeal",
  "Supreme",
  "Execution",
];

export const JUDICIAL_STATUSES = ["Approved", "Pending"];

/** The three letters a branch is known by on an expense number. */
const BRANCH_CODES = { Muscat: "MUS", Salalah: "SAL", Sohar: "SOH" };

/** "EXP-MUS-000456" - the branch is part of the number, not just beside it. */
const expenseNo = (branch, id) =>
  "EXP-" +
  (BRANCH_CODES[branch] || branch.slice(0, 3).toUpperCase()) +
  "-" +
  String(450 + id * 6).padStart(6, "0");

/** "10:15 AM" as 615. */
const clock = (time) => {
  const [hours, rest] = String(time).split(":");
  const minutes = Number(String(rest).slice(0, 2));
  const pm = /PM/i.test(time);
  const hour = Number(hours) % 12 + (pm ? 12 : 0);
  return hour * 60 + minutes;
};

/** 700 as "11:40 AM". */
const clockText = (minutes) => {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(total / 60);
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return (
    String(shown).padStart(2, "0") +
    ":" +
    String(total % 60).padStart(2, "0") +
    (hour < 12 ? " AM" : " PM")
  );
};

/**
 * When the accountant saw it.
 *
 * The accountant sits between the person who raised the request and the
 * finance manager who releases the money, so the time falls between theirs -
 * halfway when both happened on the same day, and shortly after submission
 * when the approval ran over to the next.
 */
const accountantTime = (submittedAt, submittedTime, approvedAt, approvedTime) =>
  submittedAt === approvedAt
    ? clockText(Math.round((clock(submittedTime) + clock(approvedTime)) / 2))
    : clockText(clock(submittedTime) + 85);

const e = (
  id,
  branch,
  client,
  opponent,
  court,
  level,
  caseNo,
  location,
  expenseType,
  subcategory,
  amount,
  method,
  bank,
  accountNo,
  submittedBy,
  submittedAt,
  submittedTime,
  approvedAt,
  approvedTime
) => ({
  id,
  expenseNo: expenseNo(branch, id),
  branch,
  client,
  opponent,
  court,
  level,
  caseNo,
  location,
  expenseType,
  category: JUDICIAL_CATEGORY,
  subcategory,
  amount,
  paymentMethod: method,
  bank,
  accountNo,
  receipt: "receipt-" + String(id).padStart(3, "0") + ".pdf",
  registrationReceipt: "registration-" + String(id).padStart(3, "0") + ".pdf",
  caseRecord: "case-record-" + String(id).padStart(3, "0") + ".pdf",
  submittedBy,
  submittedAt,
  submittedTime,
  // Two approvals, not one: the accountant checks the expense, the finance
  // manager releases the money, and the table has to show both.
  accountantApprovedBy: "Khalid Al Balushi",
  accountantApprovedAt: submittedAt,
  accountantApprovedTime: accountantTime(
    submittedAt,
    submittedTime,
    approvedAt,
    approvedTime
  ),
  financeApprovedBy: "Ahmad Al Hinai",
  approvedBy: "Ahmad Al Hinai",
  approvedAt,
  approvedTime,
  status: "Approved",
});

export const initialJudicialExpenses = [
  e(1, "Muscat", "Al Maha Properties", "Ahmed Al Balushi", "Muscat Primary Court", "First Instance", "125/2026", "Muscat", "Lawsuit Filing Fees", "Commercial Case", 800, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Mohammed Al Yahyaei", dayOffset(-1), "10:15 AM", dayOffset(-1), "12:30 PM"),
  e(2, "Salalah", "Oman Couriers LLC", "Khalid Al Harthi", "Salalah Court of Appeal", "Appeal", "88/2026", "Salalah", "Judicial Announcements", "Civil Case", 120, "Bank Transfer", "Bank Dhofar", "OM45 20000000", "Aisha Al Saadi", dayOffset(-2), "09:20 AM", dayOffset(-2), "11:00 AM"),
  e(3, "Muscat", "ABC Holdings LLC", "Gulf Metals SAOC", "Muscat Primary Court", "First Instance", "131/2026", "Muscat", "Lawsuit Filing Fees", "Commercial Case", 650, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Salim Al Rawahi", dayOffset(-4), "11:05 AM", dayOffset(-4), "02:10 PM"),
  e(4, "Sohar", "Nizwa Cement Factory", "Sohar Steel LLC", "Sohar Primary Court", "First Instance", "56/2026", "Sohar", "Lawsuit Filing Fees", "Commercial Case", 450, "Cheque", "National Bank of Oman", "OM31 30000000", "Layla Al Balushi", dayOffset(-6), "08:45 AM", dayOffset(-6), "10:40 AM"),
  e(5, "Muscat", "Al Madina Trading", "Yusuf Al Amri", "Muscat Primary Court", "First Instance", "142/2026", "Muscat", "Lawsuit Filing Fees", "Civil Case", 300, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Khalid Al Hinai", dayOffset(-7), "01:30 PM", dayOffset(-7), "03:55 PM"),
  e(6, "Salalah", "Salalah Port Services", "Dhofar Shipping", "Salalah Primary Court", "First Instance", "91/2026", "Salalah", "Lawsuit Filing Fees", "Labour Case", 250, "Cash", "Bank Dhofar", "OM45 20000000", "Aisha Al Saadi", dayOffset(-9), "10:00 AM", dayOffset(-9), "11:35 AM"),
  e(7, "Muscat", "Gulf Construction Co", "Muscat Bricks LLC", "Supreme Court", "Supreme", "12/2026", "Muscat", "Supreme Court Deposit", "Commercial Case", 600, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Mohammed Al Yahyaei", dayOffset(-12), "09:10 AM", dayOffset(-12), "01:20 PM"),
  e(8, "Muscat", "ABC Holdings LLC", "Oman Steel Traders", "Supreme Court", "Supreme", "18/2026", "Muscat", "Supreme Court Deposit", "Civil Case", 400, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Salim Al Rawahi", dayOffset(-14), "02:40 PM", dayOffset(-13), "09:30 AM"),
  e(9, "Muscat", "Al Maha Properties", "Rustaq Developments", "Muscat Court of Appeal", "Appeal", "77/2026", "Muscat", "Petition Order Security Deposit", "Real Estate Case", 300, "Bank Transfer", "Oman Arab Bank", "OM52 40000000", "Layla Al Balushi", dayOffset(-16), "11:50 AM", dayOffset(-16), "04:05 PM"),
  e(10, "Sohar", "Falcon Logistics", "Batinah Transport", "Sohar Court of Appeal", "Appeal", "64/2026", "Sohar", "Petition Order Security Deposit", "Commercial Case", 250, "Cheque", "National Bank of Oman", "OM31 30000000", "Khalid Al Hinai", dayOffset(-18), "08:20 AM", dayOffset(-18), "12:15 PM"),
  e(11, "Muscat", "Al Madina Trading", "Seeb Wholesale", "Muscat Primary Court", "First Instance", "149/2026", "Muscat", "Petition Order Security Deposit", "Civil Case", 200, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Aisha Al Saadi", dayOffset(-20), "03:15 PM", dayOffset(-19), "10:05 AM"),
  e(12, "Salalah", "Oman Couriers LLC", "Dhofar Freight", "Salalah Primary Court", "First Instance", "95/2026", "Salalah", "Judicial Announcements", "Commercial Case", 80, "Cash", "Bank Dhofar", "OM45 20000000", "Aisha Al Saadi", dayOffset(-22), "09:00 AM", dayOffset(-22), "10:25 AM"),
  e(13, "Muscat", "Gulf Construction Co", "Amerat Contracting", "Muscat Primary Court", "First Instance", "152/2026", "Muscat", "Judicial Announcements", "Civil Case", 70, "Cash", "Bank Muscat", "OM20 10000000", "Salim Al Rawahi", dayOffset(-24), "12:35 PM", dayOffset(-24), "02:50 PM"),
  e(14, "Sohar", "Nizwa Cement Factory", "Liwa Aggregates", "Sohar Primary Court", "First Instance", "59/2026", "Sohar", "Judicial Announcements", "Commercial Case", 50, "Cash", "National Bank of Oman", "OM31 30000000", "Layla Al Balushi", dayOffset(-26), "10:45 AM", dayOffset(-26), "01:00 PM"),
  e(15, "Muscat", "ABC Holdings LLC", "Gulf Metals SAOC", "Muscat Primary Court", "First Instance", "131/2026", "Muscat", "Expert Fees", "Commercial Case", 900, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Mohammed Al Yahyaei", dayOffset(-28), "09:40 AM", dayOffset(-28), "03:30 PM"),
  e(16, "Salalah", "Salalah Port Services", "Dhofar Shipping", "Salalah Primary Court", "First Instance", "91/2026", "Salalah", "Expert Fees", "Labour Case", 600, "Bank Transfer", "Bank Dhofar", "OM45 20000000", "Khalid Al Hinai", dayOffset(-30), "11:20 AM", dayOffset(-29), "09:15 AM"),
  e(17, "Muscat", "Al Maha Properties", "Rustaq Developments", "Muscat Court of Appeal", "Appeal", "77/2026", "Muscat", "Translation Expenses", "Real Estate Case", 200, "Bank Transfer", "Oman Arab Bank", "OM52 40000000", "Aisha Al Saadi", dayOffset(-32), "02:05 PM", dayOffset(-32), "04:40 PM"),
  e(18, "Muscat", "Al Madina Trading", "Yusuf Al Amri", "Muscat Primary Court", "First Instance", "142/2026", "Muscat", "Translation Expenses", "Civil Case", 154, "Cash", "Bank Muscat", "OM20 10000000", "Layla Al Balushi", dayOffset(-34), "10:10 AM", dayOffset(-34), "11:55 AM"),
  e(19, "Sohar", "Falcon Logistics", "Batinah Transport", "Sohar Court of Appeal", "Appeal", "64/2026", "Sohar", "Translation Expenses", "Commercial Case", 120, "Cash", "National Bank of Oman", "OM31 30000000", "Salim Al Rawahi", dayOffset(-36), "08:55 AM", dayOffset(-36), "12:20 PM"),
  e(20, "Muscat", "Gulf Construction Co", "Muscat Bricks LLC", "Muscat Primary Court", "First Instance", "155/2026", "Muscat", "Document Expenses", "Commercial Case", 180, "Cash", "Bank Muscat", "OM20 10000000", "Khalid Al Hinai", dayOffset(-38), "01:45 PM", dayOffset(-38), "03:10 PM"),
  e(21, "Salalah", "Oman Couriers LLC", "Khalid Al Harthi", "Salalah Court of Appeal", "Appeal", "88/2026", "Salalah", "Document Expenses", "Civil Case", 120, "Cash", "Bank Dhofar", "OM45 20000000", "Aisha Al Saadi", dayOffset(-40), "09:30 AM", dayOffset(-40), "10:50 AM"),
  e(22, "Muscat", "ABC Holdings LLC", "Said Al Rashdi", "Muscat Criminal Court", "First Instance", "33/2026", "Muscat", "Prisoner Release Bail", "Criminal Case", 500, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Mohammed Al Yahyaei", dayOffset(-42), "07:50 AM", dayOffset(-42), "09:05 AM"),
  e(23, "Muscat", "Al Maha Properties", "Seeb Wholesale", "Muscat Execution Court", "Execution", "204/2026", "Muscat", "Execution Amount Payment", "Commercial Case", 450, "Bank Transfer", "Bank Muscat", "OM20 10000000", "Salim Al Rawahi", dayOffset(-44), "11:15 AM", dayOffset(-44), "02:35 PM"),
  e(24, "Sohar", "Nizwa Cement Factory", "Sohar Steel LLC", "Sohar Execution Court", "Execution", "71/2026", "Sohar", "Execution Amount Payment", "Commercial Case", 250, "Cheque", "National Bank of Oman", "OM31 30000000", "Layla Al Balushi", dayOffset(-46), "10:25 AM", dayOffset(-45), "08:40 AM"),
];

/** What each tile above the table counts, in the order they are shown. */
export function judicialTotals(expenses) {
  const of = (type) => expenses.filter((x) => x.expenseType === type);
  const sum = (rows) => rows.reduce((total, x) => total + Number(x.amount), 0);

  return [
    { label: "All Expenses", count: expenses.length, amount: sum(expenses) },
    ...JUDICIAL_EXPENSE_TYPES.map((type) => {
      const rows = of(type);
      return { label: type, count: rows.length, amount: sum(rows) };
    }),
  ];
}
