/**
 * What an employee is paid each month.
 *
 * A payslip is built from three groups: what is earned, what is held back, and
 * what is left. Only the first two are ever entered - every total is worked out
 * from them, so a payslip cannot state a net that its own lines do not support.
 */

/** The allowances that sit on top of basic pay, in the order they are asked for. */
export const ALLOWANCES = [
  { key: "special", label: "Special Allowance" },
  { key: "housing", label: "Housing Allowance" },
  { key: "transport", label: "Transportation Allowance" },
  { key: "electricity", label: "Electricity Allowance" },
  { key: "water", label: "Water Allowance" },
];

/** What can be held back from a month's pay. */
export const DEDUCTIONS = [
  { key: "loan", label: "Loan Installment" },
  { key: "administrative", label: "Administrative Deduction" },
];

const num = (value) => Number(value || 0);

/** Basic pay plus every allowance. */
export const totalEarnings = (draft) =>
  num(draft.basic) + ALLOWANCES.reduce((sum, a) => sum + num(draft[a.key]), 0);

/** Everything held back this month. */
export const totalDeductions = (draft) =>
  DEDUCTIONS.reduce((sum, d) => sum + num(draft[d.key]), 0);

/** What is left once the deductions come off. */
export const netSalary = (draft) => totalEarnings(draft) - totalDeductions(draft);

/**
 * A payment covers a month, or a quarter when it is a quarterly bonus, so the
 * quarters sit in the same list rather than in a field of their own.
 */
export const PAYMENT_MONTHS = [
  { value: "Jan", label: "January" },
  { value: "Feb", label: "February" },
  { value: "Mar", label: "March" },
  { value: "Apr", label: "April" },
  { value: "May", label: "May" },
  { value: "Jun", label: "June" },
  { value: "Jul", label: "July" },
  { value: "Aug", label: "August" },
  { value: "Sep", label: "September" },
  { value: "Oct", label: "October" },
  { value: "Nov", label: "November" },
  { value: "Dec", label: "December" },
  { value: "Q1", label: "Q1 (Jan - Mar)" },
  { value: "Q2", label: "Q2 (Apr - Jun)" },
  { value: "Q3", label: "Q3 (Jul - Sep)" },
  { value: "Q4", label: "Q4 (Oct - Dec)" },
];

/** The short month names, in the order a date gives them. */
export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const PAYMENT_YEARS = ["2024", "2025", "2026", "2027"];

/** Where the money leaves from. Cash is listed with the banks, not apart. */
export const PAYMENT_SOURCES = [
  "Bank Muscat",
  "National Bank of Oman",
  "Bank Dhofar",
  "Oman Arab Bank",
  "Sohar International",
  "Ahli Bank",
  "Cash",
];

/** The account nearly every payment leaves from. */
export const DEFAULT_BANK = "Bank Muscat";

/** How the banks are written in the history, where the column is narrow. */
export const SOURCE_SHORT = {
  "Bank Muscat": "Bank Muscat",
  "National Bank of Oman": "NBO",
  "Bank Dhofar": "Bank Dhofar",
  "Oman Arab Bank": "OAB",
  "Sohar International": "Sohar",
  "Ahli Bank": "Ahli",
  Cash: "Cash",
};

/* --------------------------------------------------------------- amounts */

/** Three decimals, thousands separated - the way Rials are written here. */
export const amount = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

/** "Aug 2026", or "Q2 2026" for a quarterly payment. */
export const period = (record) => record.month + " " + record.year;

/** "26/08/2026" */
export const formatDate = (value) => {
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
};

/* ------------------------------------------------------------- the record */

/**
 * Payments already made.
 *
 * `allowances` and `deductions` are held as the totals that were paid, because
 * a payslip is a record of what happened - if the housing allowance changes
 * next year, last year's payslip must not change with it.
 */
export const salaryRecords = [
  { id: 1, paymentDate: "2026-08-26", month: "Aug", year: "2026", basic: 800, allowances: 150, deductions: 50, method: "Bank Transfer", source: "Bank Muscat", notes: "Monthly salary for August 2026" },
  { id: 2, paymentDate: "2026-07-26", month: "Jul", year: "2026", basic: 800, allowances: 150, deductions: 50, method: "Bank Transfer", source: "Bank Muscat", notes: "Monthly salary for July 2026" },
  { id: 3, paymentDate: "2026-06-26", month: "Jun", year: "2026", basic: 800, allowances: 150, deductions: 50, method: "Bank Transfer", source: "Bank Muscat", notes: "Monthly salary for June 2026" },
  { id: 4, paymentDate: "2026-06-10", month: "Q2", year: "2026", basic: 0, allowances: 500, deductions: 0, method: "Bank Transfer", source: "National Bank of Oman", notes: "Q2 performance bonus" },
  { id: 5, paymentDate: "2026-05-26", month: "May", year: "2026", basic: 800, allowances: 150, deductions: 50, method: "Bank Transfer", source: "Bank Muscat", notes: "Monthly salary for May 2026" },
  { id: 6, paymentDate: "2026-04-26", month: "Apr", year: "2026", basic: 780, allowances: 150, deductions: 50, method: "Bank Transfer", source: "Bank Muscat", notes: "Monthly salary for April 2026" },
  { id: 7, paymentDate: "2026-03-26", month: "Mar", year: "2026", basic: 780, allowances: 150, deductions: 50, method: "Bank Transfer", source: "Bank Muscat", notes: "Monthly salary for March 2026" },
  { id: 8, paymentDate: "2026-02-26", month: "Feb", year: "2026", basic: 780, allowances: 150, deductions: 50, method: "Cash", source: "Cash", notes: "Monthly salary for February 2026" },
];

/** What was actually paid on a past payment. */
export const netAmount = (record) =>
  record.amount != null
    ? num(record.amount)
    : num(record.basic) + num(record.allowances) - num(record.deductions);

/* ------------------------------------------------- how a payment is booked */

/**
 * Where a payment to an employee lands in the accounts.
 *
 * Type -> Category -> Subcategory, the same three levels the rest of the
 * system books expenses by. Only the branches an employee can be paid under
 * are listed here; the full tree belongs to General Invoices.
 */
export const PAYROLL_BOOKING = [
  {
    name: "Employee Expenses",
    categories: [
      {
        name: "Salaries & Bonuses",
        subcategories: [
          "Salary",
          "Salary Advance",
          "Bonus",
          "Overtime",
          "Commission",
          "Leave Salary",
          "End of Service Benefit",
        ],
      },
      {
        name: "Allowances & Benefits",
        subcategories: [
          "Housing Allowance",
          "Transportation Allowance",
          "Phone Allowance",
          "Other Allowance",
        ],
      },
    ],
  },
  {
    name: "Employee Advances & Loans",
    categories: [
      {
        name: "Advances & Loans",
        subcategories: ["Employee Loan", "Other Advance"],
      },
    ],
  },
];

/** The categories under a type, and the subcategories under those. */
export const categoriesOf = (type) =>
  PAYROLL_BOOKING.find((t) => t.name === type)?.categories || [];

export const subcategoriesOf = (type, category) =>
  categoriesOf(type).find((c) => c.name === category)?.subcategories || [];

/** What a salary is booked as unless somebody says otherwise. */
/**
 * Payments whose amount is not the monthly salary.
 *
 * A bonus, overtime, a commission, leave pay and an end-of-service settlement
 * are all worked out elsewhere, so the figure is entered rather than read off
 * the payslip - and the payslip summary is not shown, because it would be
 * describing a different payment. Nothing is asked for but the amount.
 */
export const ENTERED_AMOUNT = [
  "Bonus",
  "Overtime",
  "Commission",
  "Leave Salary",
  "End of Service Benefit",
];

/** Payments that cover a span of service rather than one month. */
export const WITH_PERIOD = ["End of Service Benefit"];

export const entersAmount = (subcategory) =>
  ENTERED_AMOUNT.includes(subcategory);

export const hasPeriod = (subcategory) => WITH_PERIOD.includes(subcategory);

export const DEFAULT_BOOKING = {
  expenseType: "Employee Expenses",
  category: "Salaries & Bonuses",
  subcategory: "Salary",
};

/* ------------------------------------------------- the salary history */

/**
 * The loan the monthly deductions are running against.
 *
 * One loan, described once: how much was borrowed, what comes off each month,
 * and over how many months. Everything the history shows about it - which
 * installment a month is, what is left, how many are still to come - is worked
 * out from this and from what was actually deducted, so no row can claim a
 * balance the deductions do not support.
 */
export const SALARY_LOAN = { principal: 7560, installment: 120, count: 63 };

/**
 * What was paid each month, oldest first.
 *
 * Only what actually happened is recorded: the pay, the allowances, what came
 * off for the loan and what came off administratively. The net is not here -
 * it is those four numbers, and a stored fifth could disagree with them.
 */
export const salaryHistory = [
  { id: 1, month: 4, year: 2026, basic: 2500, allowances: 580, loanDeducted: 0, administrative: 175, paymentDate: "2026-04-30" },
  { id: 2, month: 5, year: 2026, basic: 2500, allowances: 580, loanDeducted: 80, administrative: 175, paymentDate: "2026-05-31" },
  { id: 3, month: 6, year: 2026, basic: 2500, allowances: 580, loanDeducted: 120, administrative: 175, paymentDate: "2026-06-30" },
  { id: 4, month: 7, year: 2026, basic: 2500, allowances: 580, loanDeducted: 120, administrative: 175, paymentDate: "2026-07-30" },
  { id: 5, month: 8, year: 2026, basic: 2500, allowances: 580, loanDeducted: 120, administrative: 175, paymentDate: "2026-08-31" },
  { id: 6, month: 9, year: 2026, basic: 2500, allowances: 580, loanDeducted: 120, administrative: 175, paymentDate: "2026-09-28" },
];

/**
 * The history with everything that can be worked out, worked out.
 *
 * Read in order, oldest first, because each month's remaining loan depends on
 * every month before it. A month with nothing deducted is not an installment
 * at all, so it does not consume one.
 */
export function salaryHistoryRows(history = salaryHistory, loan = SALARY_LOAN) {
  let paid = 0;
  let taken = 0;

  const rows = [...history]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((record) => {
      const due = record.loanDeducted > 0 ? loan.installment : 0;
      if (record.loanDeducted > 0) {
        paid += record.loanDeducted;
        taken += 1;
      }

      return {
        ...record,
        gross: record.basic + record.allowances,
        net: record.basic + record.allowances - record.loanDeducted - record.administrative,
        loan: {
          due,
          deducted: record.loanDeducted,
          // Full, part, or no installment at all - read off the two figures
          // rather than stamped on the record.
          state:
            record.loanDeducted === 0
              ? "none"
              : record.loanDeducted >= due
                ? "full"
                : "partial",
          shortfall: Math.max(due - record.loanDeducted, 0),
          number: taken,
          count: loan.count,
          remaining: Math.max(loan.principal - paid, 0),
          remainingInstallments: Math.max(loan.count - taken, 0),
        },
      };
    });

  // Newest first to read, though the sums were run oldest first.
  return rows.reverse();
}
