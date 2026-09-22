/**
 * General requests: anything an employee asks the administration for that has
 * no form of its own - a parking card, a laptop, a chair.
 *
 * The request is the employee's half - what kind of request it is, what they
 * are asking for, and any paper that supports it. The decision is the
 * administration's half, and stays empty until one is made, so a request can
 * never look decided before it is.
 */

/**
 * What kind of thing is being raised.
 *
 * Asked for instead of a subject line: a subject is a sentence somebody has
 * to compose, and two people describing the same thing write it two ways,
 * which is no use to anyone sorting a year of them.
 */
export const REQUEST_TYPES = [
  "Suggestions",
  "Report",
  "Administrative Request",
  "Other Requests",
];

/** How long each side of the conversation may be, so the form can say so. */
export const COMMENT_LIMIT = 500;
export const DECISION_COMMENT_LIMIT = 300;

export const REQUEST_STATUSES = ["Pending", "Approved", "Rejected"];

/** The two answers the administration can give. */
export const APPROVED = "Approved";
export const REJECTED = "Rejected";

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
    requestNo: "GR-2026-001",
    requestType: "Administrative Request",
    comment: "Request for additional internet allowance.",
    document: "",
    date: "2026-08-15",
    status: "Rejected",
    decisionDate: "2026-08-18",
    remarks: "Not applicable.",
    reviewedBy: "Admin Department",
  },
  {
    id: 2,
    employee: "Mohammed Al Yahyaei",
    requestNo: "GR-2026-002",
    requestType: "Administrative Request",
    comment: "Request to replace office chair.",
    document: "",
    date: "2026-08-20",
    status: "Approved",
    decisionDate: "2026-08-22",
    remarks: "Item ordered.",
    reviewedBy: "Department Manager",
  },
  {
    id: 3,
    employee: "Mohammed Al Yahyaei",
    requestNo: "GR-2026-003",
    requestType: "Other Requests",
    comment: "Request for gym membership reimbursement.",
    document: "",
    date: "2026-09-01",
    status: "Approved",
    decisionDate: "2026-09-03",
    remarks: "Approved as per policy.",
    reviewedBy: "HR Department",
  },
  {
    id: 4,
    employee: "Mohammed Al Yahyaei",
    requestNo: "GR-2026-004",
    requestType: "Administrative Request",
    comment: "Please issue a parking access card for the employee vehicle.",
    document: "parking-request.pdf",
    date: "2026-09-10",
    // Waiting on the administration, so nothing on the decision is filled in.
    status: "Pending",
    decisionDate: "",
    remarks: "",
    reviewedBy: "",
  },
  {
    id: 5,
    employee: "Mohammed Al Yahyaei",
    requestNo: "GR-2026-005",
    requestType: "Suggestions",
    comment: "Suggest moving the weekly case review to Sunday mornings.",
    document: "",
    date: "2026-09-14",
    status: "Pending",
    decisionDate: "",
    remarks: "",
    reviewedBy: "",
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
 * The next number in the year's run: GR-2026-006.
 *
 * Counted across every request, not just one person's, so two people asking
 * on the same day can never be given the same number.
 */
export function nextRequestNo(requests, date) {
  const prefix = "GR-" + String(date).slice(0, 4) + "-";
  const highest = requests
    .filter((request) => request.requestNo.startsWith(prefix))
    .reduce(
      (max, request) =>
        Math.max(max, Number(request.requestNo.slice(prefix.length)) || 0),
      0
    );
  return prefix + String(highest + 1).padStart(3, "0");
}
