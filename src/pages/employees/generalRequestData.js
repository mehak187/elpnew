/**
 * General requests: anything an employee asks the administration for that has
 * no form of its own - a parking card, a laptop, a chair.
 *
 * The request is the employee's half - a subject and the details. The decision
 * is the administration's half (status, remarks, who reviewed it), and stays
 * empty until one is made, so a request can never look decided before it is.
 */

/** How long each half of the request may be, so the form can say so. */
export const SUBJECT_LIMIT = 50;
export const DETAILS_LIMIT = 1000;

export const REQUEST_STATUSES = ["Pending", "Approved", "Rejected"];

/** How a status is dressed wherever it is shown - the same as leave. */
export const REQUEST_STATUS_TONE = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

/** Today as a plain YYYY-MM-DD in the user's own timezone. */
export const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

/** "10/09/2026" - the short form, because dates are compared down a column. */
export const shortDate = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  return day + "/" + month + "/" + year;
};

export const initialGeneralRequests = [
  {
    id: 1,
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-2026-0011",
    subject: "Internet Allowance",
    details: "Request for additional internet allowance.",
    date: "2026-08-15",
    status: "Rejected",
    remarks: "Not applicable.",
    reviewedBy: "Admin Department",
  },
  {
    id: 2,
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-2026-0012",
    subject: "Office Chair",
    details: "Request to replace office chair.",
    date: "2026-08-20",
    status: "Approved",
    remarks: "Item ordered.",
    reviewedBy: "Department Manager",
  },
  {
    id: 3,
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-2026-0013",
    subject: "Gym Membership",
    details: "Request for gym membership reimbursement.",
    date: "2026-09-01",
    status: "Approved",
    remarks: "Approved as per policy.",
    reviewedBy: "HR Department",
  },
  {
    id: 4,
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-2026-0014",
    subject: "Laptop for Work",
    details: "Request to provide laptop for work.",
    date: "2026-09-05",
    status: "Rejected",
    remarks: "Not approved at this time.",
    reviewedBy: "Finance Manager",
  },
  {
    id: 5,
    employee: "Mohammed Al Yahyaei",
    requestNo: "REQ-2026-0015",
    subject: "Parking Card",
    details: "Request for parking card for office use.",
    date: "2026-09-10",
    status: "Approved",
    remarks: "Card issued on 12/09/2026.",
    reviewedBy: "HR Department",
  },
];

/** Everything one person has asked for, newest first. */
export const requestsFor = (requests, name) =>
  requests
    .filter((request) => request.employee === name)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.requestNo.localeCompare(a.requestNo)
    );

/**
 * The next number in the year's run: REQ-2026-0016.
 *
 * Counted across every request, not just one person's, so two people asking
 * on the same day can never be given the same number.
 */
export function nextRequestNo(requests, date) {
  const prefix = "REQ-" + String(date).slice(0, 4) + "-";
  const highest = requests
    .filter((request) => request.requestNo.startsWith(prefix))
    .reduce(
      (max, request) =>
        Math.max(max, Number(request.requestNo.slice(prefix.length)) || 0),
      0
    );
  return prefix + String(highest + 1).padStart(4, "0");
}
