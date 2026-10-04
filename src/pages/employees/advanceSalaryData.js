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
  category: "Salary",
  subcategory: "Salary Advance",
};

/**
 * What the financial department can book an advance as. The booking above is
 * what it is set to; the lists say what else it may be put under.
 */
export const DISBURSEMENT_TYPES = ["Employee Expenses", "Employee Advances & Loans"];
export const DISBURSEMENT_CATEGORIES = ["Salary", "Advances & Loans"];
export const DISBURSEMENT_SUBCATEGORIES = ["Salary Advance", "Other Employee Advance"];

/** How a saved decision reads on the review's status chip. */
export const DECISION_STATUS = {
  full: "Fully Approved",
  partial: "Partially Approved",
};

/** What an advance can be asked for. The last asks the employee to say. */
export const ADVANCE_PURPOSES = [
  "Emergency Case",
  "Education Expenses",
  "Medical Expenses",
  "Family Expenses",
  "Other (Please specify)",
];
export const OTHER_PURPOSE = "Other (Please specify)";

/**
 * "SA-2026-00012": the year it was asked in, then a count across the firm so
 * a number is never reused. The count is the number's last part.
 */
export const nextAdvanceNo = (advances, year = new Date().getFullYear()) =>
  "SA-" +
  year +
  "-" +
  String(
    advances.reduce(
      (max, a) => Math.max(max, Number(String(a.requestNo || "").split("-").pop()) || 0),
      0
    ) + 1
  ).padStart(5, "0");

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
export const owedAdvances = (advances, name, today = new Date()) => {
  const reached = today.getFullYear() * 12 + today.getMonth();
  return advances.filter(
    (advance) =>
      advance.employee === name &&
      advance.status === "Approved" &&
      Number(advance.deductYear) * 12 + MONTHS.indexOf(advance.deductMonth) >
        reached
  );
};

/**
 * What those advances come to.
 *
 * Counted off the same list the payroll takes them from, so the figure on the
 * request form and the figure coming off the pay cannot disagree.
 */
export const outstandingAdvance = (advances, name, today = new Date()) =>
  owedAdvances(advances, name, today).reduce(
    (total, advance) => total + Number(advance.approvedAmount ?? advance.amount ?? 0),
    0
  );

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
    requestNo: "SA-2026-00001",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-03-04",
    amount: 500,
    deductMonth: "April",
    deductYear: "2026",
    purpose: "Education Expenses",
    reason: "School fees for the new term.",
    status: "Approved",
  },
  {
    id: 2,
    requestNo: "SA-2026-00002",
    employee: "Priya Sharma",
    requestedOn: "2026-04-12",
    amount: 200,
    deductMonth: "May",
    deductYear: "2026",
    purpose: "Family Expenses",
    reason: "Flights home for a family wedding.",
    status: "Approved",
  },
  {
    id: 3,
    requestNo: "SA-2026-00003",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-05-19",
    amount: 400,
    deductMonth: "June",
    deductYear: "2026",
    purpose: "Emergency Case",
    reason: "Car repairs after an accident.",
    status: "Rejected",
  },
  {
    id: 4,
    requestNo: "SA-2026-00004",
    employee: "Fatima Al Rashdi",
    requestedOn: "2026-06-08",
    amount: 350,
    deductMonth: "July",
    deductYear: "2026",
    purpose: "Other (Please specify)",
    reason: "Deposit on a new flat.",
    status: "Approved",
  },
  {
    id: 5,
    requestNo: "SA-2026-00005",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-07-21",
    amount: 600,
    deductMonth: "August",
    deductYear: "2026",
    purpose: "Medical Expenses",
    reason: "Medical treatment not covered by insurance.",
    status: "Approved",
  },
  {
    // Still waiting: the one request on the list with nothing decided yet.
    id: 6,
    requestNo: "SA-2026-00006",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-09-08",
    amount: 300,
    deductMonth: "October",
    deductYear: "2026",
    purpose: "Education Expenses",
    reason: "University fees for the autumn term.",
    status: "Pending",
  },
  {
    // Handed back by management to be corrected: it opens on the employee's
    // own page as a correction, to be resubmitted.
    id: 7,
    requestNo: "SA-2026-00007",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-10-01",
    amount: 400,
    deductMonth: "October",
    deductYear: "2026",
    purpose: "Emergency Case",
    reason:
      "Requesting a salary advance due to urgent family medical expenses. My father is scheduled for a medical procedure and I need to cover the treatment costs and related expenses.",
    status: "Pending",
    decision: "completion",
    managementComment:
      "The requested amount is higher than the permitted limit. Please adjust the amount and resubmit the request.",
    decidedOn: "2026-10-03",
    decidedBy: "Khalid Al Hinai",
    decidedByTitle: "Partner",
  },
  {
    // Waiting on management, on the record of the employee the designs show.
    id: 8,
    requestNo: "SA-2026-00008",
    employee: "Ahmed Al Balushi",
    requestedOn: "2026-10-03",
    amount: 400,
    deductMonth: "October",
    deductYear: "2026",
    purpose: "Emergency Case",
    reason:
      "Requesting a salary advance due to urgent family medical expenses. My father is scheduled for a medical procedure and I need to cover the treatment costs and related expenses.",
    status: "Pending",
  },
  {
    // Waiting on management, on the record of the person signed in.
    id: 9,
    requestNo: "SA-2026-00009",
    employee: "Mohammed Al Yahyaei",
    requestedOn: "2026-10-04",
    amount: 150,
    deductMonth: "November",
    deductYear: "2026",
    purpose: "Medical Expenses",
    reason: "Dental treatment not covered by insurance.",
    status: "Pending",
  },
  {
    // Partly granted and not yet paid: it opens on the financial
    // department's stage.
    id: 10,
    requestNo: "SA-2026-00010",
    employee: "Ahmed Al Balushi",
    requestedOn: "2026-10-02",
    amount: 400,
    deductMonth: "October",
    deductYear: "2026",
    purpose: "Family Expenses",
    reason: "Travel costs for a family emergency.",
    status: "Approved",
    decision: "partial",
    approvedAmount: 300,
    managementComment: "Approved partially due to the nature of the case.",
    decidedOn: "2026-10-04",
    decidedBy: "Khalid Al Hinai",
    decidedByTitle: "Partner",
  },
  {
    // Handed back to be corrected, on the same record as the two above, so
    // all three stages can be seen on one employee.
    id: 11,
    requestNo: "SA-2026-00011",
    employee: "Ahmed Al Balushi",
    requestedOn: "2026-10-03",
    amount: 400,
    deductMonth: "October",
    deductYear: "2026",
    purpose: "Emergency Case",
    reason:
      "Requesting a salary advance due to urgent family medical expenses. My father is scheduled for a medical procedure and I need to cover the treatment costs and related expenses.",
    status: "Pending",
    decision: "completion",
    managementComment:
      "The requested amount is higher than the permitted limit. Please adjust the amount and resubmit the request.",
    decidedOn: "2026-10-03",
    decidedBy: "Khalid Al Hinai",
    decidedByTitle: "Partner",
  },
  // Aisha Al Kindi: a request at every stage, on the record the client tests.
  {
    id: 12,
    requestNo: "SA-2026-00012",
    employee: "Aisha Al Kindi",
    requestedOn: "2026-10-03",
    amount: 400,
    deductMonth: "October",
    deductYear: "2026",
    purpose: "Emergency Case",
    reason:
      "Requesting a salary advance due to urgent family medical expenses. My father is scheduled for a medical procedure and I need to cover the treatment costs and related expenses.",
    status: "Pending",
  },
  {
    id: 13,
    requestNo: "SA-2026-00013",
    employee: "Aisha Al Kindi",
    requestedOn: "2026-10-02",
    amount: 400,
    deductMonth: "October",
    deductYear: "2026",
    purpose: "Family Expenses",
    reason: "Travel costs for a family emergency.",
    status: "Approved",
    decision: "partial",
    approvedAmount: 300,
    managementComment: "Approved partially due to the nature of the case.",
    decidedOn: "2026-10-04",
    decidedBy: "Khalid Al Hinai",
    decidedByTitle: "Partner",
  },
  {
    id: 14,
    requestNo: "SA-2026-00014",
    employee: "Aisha Al Kindi",
    requestedOn: "2026-10-01",
    amount: 900,
    deductMonth: "November",
    deductYear: "2026",
    purpose: "Education Expenses",
    reason: "University fees for my son's first semester.",
    status: "Pending",
    decision: "completion",
    managementComment:
      "The requested amount is higher than the permitted limit. Please adjust the amount and resubmit the request.",
    decidedOn: "2026-10-03",
    decidedBy: "Khalid Al Hinai",
    decidedByTitle: "Partner",
  },
  {
    id: 15,
    requestNo: "SA-2026-00015",
    employee: "Aisha Al Kindi",
    requestedOn: "2026-08-12",
    amount: 250,
    deductMonth: "September",
    deductYear: "2026",
    purpose: "Medical Expenses",
    reason: "Dental treatment not covered by insurance.",
    status: "Approved",
    decision: "full",
    approvedAmount: 250,
    managementComment: "Approved.",
    decidedOn: "2026-08-14",
    decidedBy: "Khalid Al Hinai",
    decidedByTitle: "Partner",
    method: "Bank Transfer",
    paymentDate: "2026-08-16",
    reference: "TRX-2026-00412",
    paidOn: "2026-08-16",
    paidBy: "Mohammed Al Yahyaei",
  },
];
