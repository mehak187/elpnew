/**
 * The client's cases, one record each.
 *
 * Analytics used to read pre-summed monthly totals, which could answer "how
 * many cases this month" but not "how many commercial cases this month" - the
 * breakdown simply was not in the data. Holding the cases themselves means
 * every figure on the page is counted from the same list, so a type total and a
 * period total can never contradict each other.
 */

const DAY = 24 * 60 * 60 * 1000;
const iso = (days) =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

/** The case types the client works in. */
export const CASE_TYPES = [
  "Criminal Cases",
  "Civil Cases",
  "Commercial Cases",
  "Labor Cases",
  "Family/Personal Status Cases",
  "Real Estate Cases",
  "Administrative Cases",
];

/**
 * The court a case stands before.
 *
 * A case sent back to a differently constituted panel, or raised as a dispute
 * over the ruling, is at the same court but is a case of its own - so each is
 * counted separately rather than folded back into the plain level.
 */
export const CASE_LEVELS = [
  "Primary",
  "Appeal",
  "Supreme",
  "Execution",
  "Primary (Different Panel)",
  "Appeal (Different Panel)",
  "Supreme (Different Panel)",
  "Primary (Dispute)",
  "Appeal (Dispute)",
  "Supreme (Dispute)",
];

/**
 * Where a case has reached in the office's own handling of it, as opposed to
 * which court it stands before. A closed file has reached the last of them.
 */
export const CASE_STAGES = [
  "Case Registration",
  "Running Cases",
  "Post Judgement",
  "Close file",
];

const c = (id, type, level, stage, receivedDays, closedDays, claimAmount, deleted) => ({
  id,
  caseNo: "26" + String(1000 + id),
  type,
  level,
  stage,
  receivedAt: iso(receivedDays),
  closedAt: closedDays === null ? null : iso(closedDays),
  claimAmount,
  // Deleted cases are kept so they can still be counted and accounted for.
  deletedAt: deleted ? iso(deleted) : null,
});

export const clientCases = [
  c(1, "Commercial Cases", "Execution", "Close file", -410, -60, 18500, null),
  c(2, "Civil Cases", "Primary", "Post Judgement", -395, null, 42000, null),
  c(3, "Commercial Cases", "Appeal", "Case Registration", -370, null, 7300, null),
  c(4, "Labor Cases", "Primary", "Close file", -350, -300, 3200, -290),
  c(5, "Civil Cases", "Primary (Dispute)", "Close file", -330, -240, 15750, null),
  c(6, "Real Estate Cases", "Primary", "Close file", -300, -150, 96000, null),
  c(7, "Commercial Cases", "Supreme", "Running Cases", -280, null, 54000, null),
  c(8, "Criminal Cases", "Primary", "Close file", -255, -120, 8800, null),
  c(9, "Administrative Cases", "Primary", "Close file", -240, -180, 12400, -170),
  c(10, "Commercial Cases", "Primary (Different Panel)", "Running Cases", -210, null, 31000, null),
  c(11, "Family/Personal Status Cases", "Primary", "Close file", -195, -140, 4600, -130),
  c(12, "Civil Cases", "Appeal (Dispute)", "Close file", -175, -40, 27500, null),
  c(13, "Labor Cases", "Primary", "Running Cases", -150, null, 9100, null),
  c(14, "Commercial Cases", "Execution", "Close file", -130, -35, 63000, null),
  c(15, "Real Estate Cases", "Appeal (Different Panel)", "Case Registration", -110, null, 38000, null),
  c(16, "Civil Cases", "Primary", "Close file", -95, -20, 11200, -15),
  c(17, "Criminal Cases", "Supreme (Dispute)", "Close file", -80, -25, 5400, null),
  c(18, "Commercial Cases", "Primary", "Case Registration", -62, null, 72000, null),
  c(19, "Administrative Cases", "Primary", "Close file", -45, -10, 6800, null),
  c(20, "Labor Cases", "Supreme (Different Panel)", "Post Judgement", -30, null, 19500, null),
  c(21, "Commercial Cases", "Primary", "Case Registration", -14, null, 45000, null),
  c(22, "Civil Cases", "Primary", "Running Cases", -5, null, 13600, null),
];

/**
 * A deleted case is struck off but not thrown away.
 *
 * Every other figure on the page is counted from the live cases, so a deletion
 * takes a case out of the totals the moment it happens - but the case is still
 * there to be counted on its own, which is the point of recording the deletion
 * rather than removing the row.
 */
export const isDeleted = (legalCase) => legalCase.deletedAt !== null;

export const liveCases = clientCases.filter((k) => !isDeleted(k));
export const deletedCases = clientCases.filter(isDeleted);

export const isOpen = (legalCase) => legalCase.closedAt === null;

/** What a set of files claims between them. */
export const claimTotal = (cases) =>
  cases.reduce((sum, k) => sum + Number(k.claimAmount || 0), 0);

/** The count shown beside the page title: live cases still open. */
export const activeCaseCount = liveCases.filter(isOpen).length;


/**
 * A case counts as in progress once it is past registration - the file is open
 * and something is actually happening on it.
 */
export const isInProgress = (legalCase) =>
  isOpen(legalCase) && legalCase.stage !== "Case Registration";

/** Cases received between two dates, inclusive. */
export const receivedBetween = (cases, from, to) =>
  cases.filter((k) => k.receivedAt >= from && k.receivedAt <= to);

/** Counts per key, keeping every key so an empty one still shows as zero. */
export function countBy(cases, keys, pick) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const legalCase of cases) {
    const key = pick(legalCase);
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

/* ------------------------------------------------- the Cases Received cards */

const startOfMonth = (offset) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toIso = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

const monthLabel = (date) =>
  date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

/**
 * The periods the Cases Received cards cover: each of the last three months,
 * the three of them together, then this year and last.
 */
export function receivedPeriods() {
  const periods = [];

  for (let back = 0; back < 3; back++) {
    const from = startOfMonth(-back);
    const to = new Date(startOfMonth(-back + 1).getTime() - DAY);
    periods.push({ label: monthLabel(from), from: toIso(from), to: toIso(to) });
  }

  const threeFrom = startOfMonth(-2);
  const threeTo = new Date(startOfMonth(1).getTime() - DAY);
  periods.push({
    label: "Last 3 Months",
    from: toIso(threeFrom),
    to: toIso(threeTo),
  });

  const year = new Date().getFullYear();
  periods.push({
    label: String(year),
    from: year + "-01-01",
    to: year + "-12-31",
  });
  periods.push({
    label: String(year - 1),
    from: year - 1 + "-01-01",
    to: year - 1 + "-12-31",
  });

  return periods;
}
