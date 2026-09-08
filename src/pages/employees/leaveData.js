/**
 * Leave taken and asked for.
 *
 * A request is the employee's half - category, type, dates and reason. The
 * decision is management's half, and stays empty until one is made, so a
 * request can never look decided before it is.
 */

const DAY = 24 * 60 * 60 * 1000;
const dayOffset = (days) =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

/**
 * The kinds of absence, and what each one covers.
 *
 * Category first, then type: the category is what the leave is charged
 * against, the type is what it is for.
 */
export const ABSENCE_CATEGORIES = {
  "Regular Leave": ["Annual Leave", "Sick Leave", "Emergency Leave"],
  "Family Leave": ["Maternity Leave", "Paternity Leave", "Bereavement Leave"],
  "Unpaid Leave": ["Unpaid Leave", "Study Leave"],
};

export const LEAVE_STATUSES = ["Pending", "Approved", "Rejected"];

/** How a status is dressed wherever it is shown. */
export const LEAVE_STATUS_TONE = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

/**
 * How long a leave runs, counted inclusively.
 *
 * Never stored: a saved day count can disagree with the two dates it came
 * from, and the dates are what the employee actually asked for. Leaving on the
 * 1st and returning on the 5th is five days away, not four.
 */
export function leaveDays(from, to) {
  if (!from || !to) return 0;
  const days = Math.round((new Date(to) - new Date(from)) / DAY) + 1;
  return days > 0 ? days : 0;
}

/** The year a leave is charged against: the year it starts in. */
export const leaveYear = (from) => (from ? Number(from.slice(0, 4)) : "");

export const initialLeaves = [
  {
    id: 1,
    employee: "Mohammed Al Yahyaei",
    category: "Regular Leave",
    type: "Annual Leave",
    from: dayOffset(-8),
    to: dayOffset(-4),
    reason: "Family vacation",
    status: "Approved",
    decidedAt: dayOffset(-15),
    comments: "Approved as requested.",
  },
  {
    id: 2,
    employee: "Mohammed Al Yahyaei",
    category: "Regular Leave",
    type: "Sick Leave",
    from: dayOffset(33),
    to: dayOffset(35),
    reason: "Medical treatment",
    status: "Pending",
    decidedAt: "",
    comments: "",
  },
  {
    id: 3,
    employee: "Mohammed Al Yahyaei",
    category: "Family Leave",
    type: "Maternity Leave",
    from: dayOffset(72),
    to: dayOffset(92),
    reason: "Maternity leave",
    status: "Rejected",
    decidedAt: dayOffset(70),
    comments: "The requested period exceeds the available entitlement.",
  },
  {
    id: 4,
    employee: "Fatima Al Rashdi",
    category: "Regular Leave",
    type: "Annual Leave",
    from: dayOffset(-40),
    to: dayOffset(-34),
    reason: "Travelling abroad",
    status: "Approved",
    decidedAt: dayOffset(-48),
    comments: "Cover arranged with the Muscat office.",
  },
];

/** Everything one person has asked for, soonest first. */
export const leavesFor = (leaves, name) =>
  leaves
    .filter((leave) => leave.employee === name)
    .sort((a, b) => a.from.localeCompare(b.from));
