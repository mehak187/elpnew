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

/** Everything one employee has claimed, newest first. */
export const entitlementsFor = (records, name, kind) =>
  records
    .filter((row) => row.employee === name && row.kind === kind)
    .sort(
      (a, b) =>
        String(b.requestDate).localeCompare(String(a.requestDate)) || b.id - a.id
    );

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
