/**
 * Advances an employee asks for against their own salary.
 *
 * This is the one thing on the salary page the employee does rather than the
 * firm: they ask, the office decides, and the amount comes back out of a month
 * they name. So it is asked for on My Profile and nowhere else - the firm does
 * not ask for an advance on somebody's behalf.
 */

export const ADVANCE_STATUSES = ["Pending", "Approved", "Rejected"];

export const ADVANCE_STATUS_TONE = {
  Pending: "text-amber-600",
  Approved: "text-green-700",
  Rejected: "text-destructive",
};

/** Where a request has got to, as the chip under its number reads it. */
export const ADVANCE_STATUS_CHIP = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

/** How an advance is filed once it is paid: the same booking every time. */
export const ADVANCE_BOOKING = {
  expenseType: "Employee Expenses",
  category: "Salaries",
  subcategory: "Salary Advance",
};

/** "SAR-001", counted across the firm so a number is never reused. */
export const nextAdvanceNo = (advances) =>
  "SAR-" +
  String(
    advances.reduce(
      (max, a) => Math.max(max, Number(String(a.requestNo || "").replace(/\D/g, "")) || 0),
      0
    ) + 1
  ).padStart(3, "0");

/** The months, as an advance names the one it comes out of. */
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * What is still owed on advances already granted.
 *
 * An advance comes back out of one named month, so it is owed until that month
 * has been reached; once it has, the salary for it carried the deduction.
 */
export const outstandingAdvance = (advances, name, today = new Date()) => {
  const reached = today.getFullYear() * 12 + today.getMonth();
  return advances
    .filter(
      (advance) =>
        advance.employee === name &&
        advance.status === "Approved" &&
        Number(advance.deductYear) * 12 + MONTHS.indexOf(advance.deductMonth) >
          reached
    )
    .reduce((total, advance) => total + Number(advance.amount || 0), 0);
};

/** One person's requests, newest first. */
export const advancesFor = (advances, name) =>
  advances
    .filter((advance) => advance.employee === name)
    .sort((a, b) => b.requestedOn.localeCompare(a.requestedOn) || b.id - a.id);

/** The month the advance is to be deducted from, as it reads on a row. */
export const deductedFrom = (advance) =>
  advance.deductMonth && advance.deductYear
    ? advance.deductMonth + " " + advance.deductYear
    : "-";

export const initialAdvances = [
  {
    id: 1,
    requestNo: "SAR-001",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-03-04",
    amount: 500,
    deductMonth: "April",
    deductYear: "2026",
    reason: "School fees for the new term.",
    status: "Approved",
  },
  {
    id: 2,
    requestNo: "SAR-002",
    employee: "Priya Sharma",
    requestedOn: "2026-04-12",
    amount: 200,
    deductMonth: "May",
    deductYear: "2026",
    reason: "Flights home for a family wedding.",
    status: "Approved",
  },
  {
    id: 3,
    requestNo: "SAR-003",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-05-19",
    amount: 400,
    deductMonth: "June",
    deductYear: "2026",
    reason: "Car repairs after an accident.",
    status: "Rejected",
  },
  {
    id: 4,
    requestNo: "SAR-004",
    employee: "Fatima Al Rashdi",
    requestedOn: "2026-06-08",
    amount: 350,
    deductMonth: "July",
    deductYear: "2026",
    reason: "Deposit on a new flat.",
    status: "Approved",
  },
  {
    id: 5,
    requestNo: "SAR-005",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-07-21",
    amount: 600,
    deductMonth: "August",
    deductYear: "2026",
    reason: "Medical treatment not covered by insurance.",
    status: "Approved",
  },
  {
    // Still waiting: the one request on the list with nothing decided yet.
    id: 6,
    requestNo: "SAR-006",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-09-08",
    amount: 300,
    deductMonth: "October",
    deductYear: "2026",
    reason: "University fees for the autumn term.",
    status: "Pending",
  },
];
