/**
 * Loans taken by the firm.
 *
 * A loan is not a payment - it is drawn once and repaid over months - so the
 * record carries both sides: what was borrowed, and the schedule it comes back
 * on. Everything about that schedule is worked out from three figures, which is
 * why so few of the fields on the form are asked for.
 */

/** A loan taken for the first time, and money added to one already running. */
export const NEW_LOAN = "New Loan";
export const ADDITIONAL_LOAN = "Additional Loan";

/**
 * Where a loan lands in the accounts.
 *
 * Only two things can happen: a loan is taken, or more is added to one that
 * is already running. The form asks different questions for each, which is
 * why the subcategory is chosen before anything else.
 */
export const LOAN_BOOKING = [
  {
    name: "Employee Expenses",
    categories: [
      { name: "Loan", subcategories: [NEW_LOAN, ADDITIONAL_LOAN] },
    ],
  },
];

export const categoriesOf = (type) =>
  LOAN_BOOKING.find((t) => t.name === type)?.categories || [];

export const subcategoriesOf = (type, category) =>
  categoriesOf(type).find((c) => c.name === category)?.subcategories || [];

export const DEFAULT_LOAN_BOOKING = {
  expenseType: "Employee Expenses",
  category: "Loan",
  subcategory: NEW_LOAN,
};

/* ------------------------------------------------------- the repayment plan */

/**
 * The schedule a loan comes back on.
 *
 * The last instalment is whatever is left after the whole ones, so it is
 * smaller than the rest unless the total divides evenly. Nothing here is typed
 * in - a schedule that disagreed with the amount it repays would be wrong on
 * the face of it.
 */
export function schedule(total, monthly) {
  if (!total || !monthly || monthly <= 0) {
    return { months: 0, installment: monthly || 0, last: 0 };
  }
  const months = Math.ceil(total / monthly);
  const last = Number((total - (months - 1) * monthly).toFixed(3));
  return { months, installment: monthly, last };
}

/** Three decimals, thousands separated - the way Rials are written here. */
export const amount = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

/** "26/08/2026" */
export const formatDate = (value) => {
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Aug 2026", read off the payment date rather than asked for twice. */
export const period = (value) => {
  const [year, month] = String(value).split("-");
  return MONTHS[Number(month) - 1] + " " + year;
};

/**
 * The month a run of instalments ends on.
 *
 * Counted forward from the date the money goes out, so the end date cannot be
 * typed to say something the instalment count does not.
 */
export function endDate(start, months) {
  const count = Number(months);
  if (!start || !count) return "";
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(year, month - 1 + count, day);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
  );
}

/** How the banks are written in the list, where the column is narrow. */
export const SOURCE_SHORT = {
  "Bank Muscat": "Bank Muscat",
  "National Bank of Oman": "NBO",
  "Bank Dhofar": "Bank Dhofar",
  "Oman Arab Bank": "OAB",
  "Sohar International": "Sohar",
  "Ahli Bank": "Ahli",
};

/* ---------------------------------------------------------------- the list */

/**
 * Loans already drawn.
 *
 * `outstanding` is what was still owed on earlier borrowing when this one was
 * taken, so the total on each row is the firm's whole debt at that moment and
 * not just the new draw.
 */
export const loanRecords = [
  { id: 1, paymentDate: "2026-08-26", expenseType: "Employee Expenses", category: "Loan", subcategory: NEW_LOAN, method: "Bank Transfer", bank: "Bank Muscat", outstanding: 2000, newAmount: 5000, monthly: 700, proof: "loan_proof_260826.pdf", notes: "Business expansion loan" },
  { id: 2, paymentDate: "2026-07-10", expenseType: "Employee Expenses", category: "Loan", subcategory: NEW_LOAN, method: "Bank Transfer", bank: "National Bank of Oman", outstanding: 0, newAmount: 10000, monthly: 1000, proof: "loan_proof_100726.pdf", notes: "Working capital loan" },
  { id: 3, paymentDate: "2026-05-18", expenseType: "Employee Expenses", category: "Loan", subcategory: ADDITIONAL_LOAN, method: "Bank Transfer", bank: "Bank Dhofar", outstanding: 0, newAmount: 8500, monthly: 750, proof: "loan_proof_180526.pdf", notes: "Two office vehicles" },
  { id: 4, paymentDate: "2026-02-04", expenseType: "Employee Expenses", category: "Loan", subcategory: NEW_LOAN, method: "Cheque", bank: "Bank Muscat", outstanding: 0, newAmount: 3200, monthly: 400, proof: "loan_proof_040226.pdf", notes: "Server and network equipment" },
];
