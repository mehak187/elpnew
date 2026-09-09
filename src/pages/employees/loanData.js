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

/** What a row of the schedule is waiting for, or no longer is. */
export const INSTALLMENT_STATUS_TONE = {
  Paid: "bg-green-100 text-green-800",
  "Partially Paid": "bg-blue-100 text-blue-800",
  Deferred: "bg-amber-100 text-amber-800",
  Pending: "bg-muted text-muted-foreground",
};

/** What the loan is repaying: its own amount plus anything merged into it. */
export const loanTotal = (record) =>
  Number(record.loanAmount || 0) + Number(record.merged || 0);

/** The year a loan belongs to, which is the year it was drawn. */
export const loanYear = (record) =>
  String(record.disbursementDate || record.firstDue || "").slice(0, 4);

/**
 * Every instalment of a loan, and what has been paid against it.
 *
 * The schedule is not stored: it follows from the amount, the monthly
 * instalment and the day the first one falls due, so it cannot drift out of
 * step with them. Only the payments are recorded - a row's status and the
 * balance left after it are read off those, which is why no figure here can
 * disagree with the one above it.
 */
export function scheduleRows(total, monthly, first, payments = []) {
  const plan = schedule(Number(total), Number(monthly));
  if (!plan.months || !first) return [];

  let paidSoFar = 0;

  return Array.from({ length: plan.months }, (_, index) => {
    const due = dueDate(first, index);
    const installment =
      index === plan.months - 1 ? plan.last : plan.installment;
    const payment = payments.find((entry) => entry.due === due);
    const paid = payment ? Number(payment.amount || 0) : 0;
    paidSoFar += paid;

    return {
      no: index + 1,
      of: plan.months,
      due,
      installment,
      paid,
      remaining: Number((Number(total) - paidSoFar).toFixed(3)),
      status:
        payment && payment.deferred
          ? "Deferred"
          : paid >= installment
            ? "Paid"
            : paid > 0
              ? "Partially Paid"
              : "Pending",
      paymentDate: payment ? payment.date || "" : "",
    };
  });
}

const lastDayOf = (year, month) => new Date(year, month + 1, 0).getDate();

/**
 * The day instalment `index` falls due, counted from the first one.
 *
 * A schedule that starts on the last day of a month stays on the last day of
 * every month after it - 30 September is followed by 31 October, not by the
 * 30th. Any other start keeps its own day, and shortens only where the month
 * is too short to hold it.
 */
export function dueDate(first, index) {
  if (!first) return "";
  const [year, month, day] = String(first).split("-").map(Number);
  const onMonthEnd = day === lastDayOf(year, month - 1);

  const target = new Date(year, month - 1 + index, 1);
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();
  const last = lastDayOf(targetYear, targetMonth);

  const pad = (n) => String(n).padStart(2, "0");
  return (
    targetYear +
    "-" +
    pad(targetMonth + 1) +
    "-" +
    pad(onMonthEnd ? last : Math.min(day, last))
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
 * `merged` is what was still owed on an earlier loan when this one absorbed
 * it, so the balance the schedule works down is the whole debt rather than
 * just the new draw. `payments` is the only record of repayment - everything
 * the list shows about an instalment is worked out from it.
 */
export const loanRecords = [
  {
    id: 1,
    kind: NEW_LOAN,
    loanAmount: 7000,
    merged: 0,
    disbursementDate: "2026-08-26",
    bankName: "Bank Muscat",
    accountNumber: "012345678901",
    monthly: 700,
    firstDue: "2026-09-30",
    payments: [
      { due: "2026-09-30", amount: 700, date: "2026-09-30" },
      { due: "2026-10-31", amount: 700, date: "2026-10-31" },
      { due: "2026-11-30", amount: 0, date: "", deferred: true },
      { due: "2026-12-31", amount: 350, date: "2026-12-31" },
    ],
  },
  {
    id: 2,
    kind: NEW_LOAN,
    loanAmount: 5000,
    merged: 2000,
    disbursementDate: "2026-07-10",
    bankName: "NBO",
    accountNumber: "098765432109",
    monthly: 1000,
    firstDue: "2026-08-31",
    payments: [
      { due: "2026-08-31", amount: 1000, date: "2026-08-31" },
      { due: "2026-09-30", amount: 500, date: "2026-09-30" },
    ],
  },
  {
    id: 3,
    kind: NEW_LOAN,
    loanAmount: 8500,
    merged: 0,
    disbursementDate: "2026-05-18",
    bankName: "Bank Dhofar",
    accountNumber: "045678901234",
    monthly: 850,
    firstDue: "2026-06-30",
    payments: [
      { due: "2026-06-30", amount: 850, date: "2026-06-30" },
      { due: "2026-07-31", amount: 850, date: "2026-07-31" },
      { due: "2026-08-31", amount: 850, date: "2026-08-31" },
    ],
  },
];
