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
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-03-04",
    amount: 500,
    deductMonth: "April",
    deductYear: "2026",
    reason: "School fees for the new term.",
    status: "Approved",
  },
];
