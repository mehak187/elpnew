/**
 * What the firm owes an employee beyond the monthly salary.
 *
 * Every entitlement is claimed the same way: the employee asks, the office
 * decides, and the money is paid. So they share one booking (an employee
 * expense, under Allowance Request) and differ only in what the request is
 * for, which is what the subcategory says.
 */

export const ENTITLEMENT_EXPENSE_TYPE = "Employee Expenses";
export const ENTITLEMENT_CATEGORY = "Allowance Request";

/** What each tab's request is filed as. */
export const ENTITLEMENT_SUBCATEGORY = {
  leaveEncashment: "Leave Encashment Request",
  overtime: "Overtime Pay Request",
  medical: "Medical Allowance Request",
  transport: "Transport Allowance Request",
  assignment: "Assignment Allowance Request",
  travel: "Travel Allowance Request",
  airTicket: "Air Ticket Allowance Request",
  notice: "Notice Pay Request",
  endOfService: "End of Service Request",
};

/** Where a request stands. */
export const ENTITLEMENT_PENDING = "Pending";
export const ENTITLEMENT_APPROVED = "Approved";
export const ENTITLEMENT_REJECTED = "Rejected";

export const ENTITLEMENT_STATUS_CHIP = {
  [ENTITLEMENT_PENDING]: "bg-amber-100 text-amber-800",
  [ENTITLEMENT_APPROVED]: "bg-green-100 text-green-800",
  [ENTITLEMENT_REJECTED]: "bg-red-100 text-red-800",
};

/** A month of pay, divided into days - what one day of leave is worth. */
export const DAYS_IN_MONTH = 30;

/** A working day, for turning a monthly salary into an hourly rate. */
export const HOURS_IN_DAY = 8;

/**
 * What each tab asks for beyond the classification it shares with the rest.
 *
 * "leaveDays" counts days off a leave balance, "hours" counts overtime, and
 * everything else is a sum the employee names. The amount follows from the
 * choice, so no tab asks for a figure it can work out.
 */
export const ENTITLEMENT_MODE = {
  leaveEncashment: "leaveDays",
  overtime: "hours",
};

export const modeOf = (kind) => ENTITLEMENT_MODE[kind] || "amount";

/** What one hour of overtime is worth. */
export const hourlyRate = (salary) =>
  Number((Number(salary || 0) / DAYS_IN_MONTH / HOURS_IN_DAY).toFixed(3));

/**
 * What a run of leave days is worth in money.
 *
 * Worked out from the salary every time, never stored: a figure saved beside
 * the days it came from is a figure that can disagree with them.
 */
export const encashmentAmount = (salary, days) =>
  Number(
    ((Number(salary || 0) / DAYS_IN_MONTH) * Number(days || 0)).toFixed(3)
  );

/** What overtime hours come to at the employee's own rate. */
export const overtimeAmount = (salary, hours) =>
  Number((hourlyRate(salary) * Number(hours || 0)).toFixed(3));

/** Everything one employee has claimed, newest first. */
export const entitlementsFor = (records, name, kind) =>
  records
    .filter((row) => row.employee === name && row.kind === kind)
    .sort(
      (a, b) =>
        String(b.requestDate).localeCompare(String(a.requestDate)) || b.id - a.id
    );

/**
 * The last request of the same kind this person had paid.
 *
 * What was given before is the first thing anyone deciding a request wants to
 * know, so it is read off the list rather than looked up by hand.
 */
export const lastSimilar = (records, name, kind, exceptId) =>
  records
    .filter(
      (row) =>
        row.employee === name &&
        row.kind === kind &&
        row.id !== exceptId &&
        row.status === ENTITLEMENT_APPROVED &&
        row.paymentDate
    )
    .sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)))[0] ||
  null;

/**
 * What has happened to one request, newest first.
 *
 * There is no separate log: each step leaves its own mark on the record - the
 * day it was asked for, the day it was decided, the day it was paid - so the
 * history is read back off those rather than kept twice and left to disagree.
 */
export const entitlementHistory = (record) => {
  if (!record) return [];
  const events = [];

  if (record.requestDate) {
    events.push({
      at: record.requestDate,
      action: "Request submitted",
      from: "-",
      to: ENTITLEMENT_PENDING,
      by: record.employee,
      amount: record.amount,
      comment: record.reason || "",
      reference: record.requestNo || "",
    });
  }

  if (record.decisionDate) {
    events.push({
      at: record.decisionDate,
      action: record.status === ENTITLEMENT_REJECTED ? "Request rejected" : "Request approved",
      from: ENTITLEMENT_PENDING,
      to: record.status,
      by: record.decidedBy || "Management",
      amount: record.status === ENTITLEMENT_REJECTED ? 0 : record.approvedAmount ?? record.amount,
      comment: record.managementComment || record.rejectionReason || "",
      reference: record.entitlementNo || "",
    });
  }

  if (record.paymentDate) {
    events.push({
      at: record.paymentDate,
      action: "Amount disbursed",
      from: ENTITLEMENT_APPROVED,
      to: ENTITLEMENT_APPROVED,
      by: record.decidedBy || "Management",
      amount: record.approvedAmount ?? record.amount,
      comment: record.method || "",
      reference: record.reference || "",
    });
  }

  return events.sort((a, b) => String(b.at).localeCompare(String(a.at)));
};

export const initialEntitlements = [
  {
    id: 1,
    kind: "leaveEncashment",
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-001",
    entitlementNo: "ENT-001",
    requestDate: "2026-06-12",
    year: "2026",
    leaveType: "Annual Leave",
    days: 5,
    amount: 416.667,
    reason: "Encashing part of this year's annual leave.",
    status: ENTITLEMENT_APPROVED,
    rejectionReason: "",
  },
  {
    // Paid, and so the one a new transport request is compared against.
    id: 2,
    kind: "transport",
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-002",
    entitlementNo: "ENT-002",
    requestDate: "2026-08-10",
    amount: 25,
    approvedAmount: 25,
    reason: "Travel between the Muscat and Sohar offices for the month.",
    status: ENTITLEMENT_APPROVED,
    decisionDate: "2026-08-12",
    decidedBy: "Ahmed Al Balushi",
    managementComment: "Approved as claimed.",
    method: "Bank Transfer",
    bankAccount: "Bank Muscat — •••• 6789",
    paymentDate: "2026-08-15",
    reference: "TRX-2026-00418",
    rejectionReason: "",
  },
  {
    // Waiting on a decision: the one that opens on the decision stage.
    id: 3,
    kind: "transport",
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-003",
    entitlementNo: "",
    requestDate: "2026-09-19",
    amount: 25,
    reason: "Client meetings in Sohar over three days.",
    status: ENTITLEMENT_PENDING,
    attachment: "fuel-receipts.pdf",
    rejectionReason: "",
  },
  {
    id: 4,
    kind: "transport",
    employee: "Priya Sharma",
    requestNo: "REQ-004",
    entitlementNo: "ENT-003",
    requestDate: "2026-07-28",
    amount: 18,
    approvedAmount: 15,
    reason: "Daily travel to the court registry.",
    status: ENTITLEMENT_APPROVED,
    decisionDate: "2026-07-30",
    decidedBy: "Ahmed Al Balushi",
    managementComment: "Approved at the standard monthly rate.",
    method: "Bank Transfer",
    bankAccount: "Bank Muscat — •••• 6789",
    paymentDate: "2026-08-01",
    reference: "TRX-2026-00377",
    rejectionReason: "",
  },
  {
    id: 5,
    kind: "transport",
    employee: "Priya Sharma",
    requestNo: "REQ-005",
    entitlementNo: "",
    requestDate: "2026-09-20",
    amount: 25,
    reason: "Document filing runs for the month of September.",
    status: ENTITLEMENT_PENDING,
    attachment: "transport-claim.pdf",
    rejectionReason: "",
  },
];

/** "ENT-001", the number a request takes once it has been approved. */
export const nextEntitlementNo = (records) =>
  "ENT-" +
  String(
    records.reduce(
      (max, row) =>
        Math.max(max, Number(String(row.entitlementNo || "").replace(/\D/g, "")) || 0),
      0
    ) + 1
  ).padStart(3, "0");
