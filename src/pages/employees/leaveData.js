/**
 * Leave taken and asked for.
 *
 * A request is the employee's half - type, dates and reason. The decision is
 * management's half, and stays empty until one is made, so a request can never
 * look decided before it is.
 */

const DAY = 24 * 60 * 60 * 1000;
const dayOffset = (days) =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

/**
 * The kinds of absence, and what each one is worth.
 *
 * The entitlement travels with the type rather than being written on a form
 * somewhere: it is the rule for that leave, and it is the same rule wherever
 * the leave is asked for. Several are a range because the law gives different
 * lengths for different circumstances - a bereavement depends on who died, and
 * widowhood on the woman's faith - so the exact figure is settled when the
 * request is decided, not when it is typed.
 */
export const ABSENCE_CATEGORIES = [
  {
    name: "Regular Leave",
    types: [
      { name: "Annual Leave", entitlement: "30 Days" },
      { name: "Sick Leave", entitlement: "Up to 182 Days" },
      { name: "Unpaid Leave", entitlement: "As Approved" },
    ],
  },
  {
    name: "Family Leave",
    types: [
      { name: "Paternity Leave", entitlement: "7 Days" },
      { name: "Maternity Leave", entitlement: "98 Days" },
      { name: "Marriage Leave", entitlement: "3 Days" },
      { name: "Bereavement Leave", entitlement: "2 / 3 / 10 Days" },
      { name: "Widowhood Leave", entitlement: "130 / 14 Days" },
    ],
  },
  {
    name: "Special Leave",
    types: [
      { name: "Hajj Leave", entitlement: "15 Days" },
      { name: "Study / Examination Leave", entitlement: "Up to 15 Days" },
      { name: "Patient Escort Leave", entitlement: "15 Days" },
    ],
  },
];

/** The types one category offers. */
export const typesIn = (category) =>
  ABSENCE_CATEGORIES.find((c) => c.name === category)?.types || [];

/** What a leave type is worth, wherever it is named. */
export function entitlementOf(type) {
  for (const category of ABSENCE_CATEGORIES) {
    const found = category.types.find((t) => t.name === type);
    if (found) return found.entitlement;
  }
  return "";
}

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
export const leaveYear = (from) => (from ? from.slice(0, 4) : "");

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
    employee: "Mohammed Al Yahyaei",
    category: "Special Leave",
    type: "Hajj Leave",
    from: dayOffset(-400),
    to: dayOffset(-386),
    reason: "Pilgrimage",
    status: "Approved",
    decidedAt: dayOffset(-420),
    comments: "Taken in full.",
  },
  {
    id: 5,
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

/** The years a person has leave in, newest first, for the year picker. */
export const leaveYearsFor = (leaves, name) => [
  ...new Set(leavesFor(leaves, name).map((leave) => leaveYear(leave.from))),
].sort((a, b) => b.localeCompare(a));
