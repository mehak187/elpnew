import { initialAdvances } from "./advanceSalaryData";
import { loanRecords } from "./loanData";
import { assistanceRecords, statusOf } from "./assistanceData";
import { initialBonuses } from "./bonusData";
import { initialEntitlements } from "./entitlementData";
import { initialGeneralRequests } from "./generalRequestData";

/**
 * How many of each kind of request one employee has made, and how many are
 * still waiting on a decision - the two figures on the Requests page's cards.
 *
 * Read from the same records the request pages list, so a card cannot claim a
 * number its own page does not show. A kind with no page of its own yet has
 * nothing to count.
 */

const tally = (rows, isPending) => ({
  total: rows.length,
  pending: rows.filter(isPending).length,
});

const waiting = (row) => row.status === "Pending";

const mine = (rows, name) => rows.filter((row) => row.employee === name);

/** An entitlement of one kind, as the Entitlements page keeps it. */
const entitlement = (kind) => (name) =>
  tally(
    mine(initialEntitlements, name).filter((row) => row.kind === kind),
    waiting
  );

const COUNTERS = {
  salaryAdvance: (name) => tally(mine(initialAdvances, name), waiting),
  loan: (name) => tally(mine(loanRecords, name), waiting),
  assistance: (name) =>
    tally(mine(assistanceRecords, name), (row) => statusOf(row) === "Pending"),
  bonus: (name) => tally(mine(initialBonuses, name), waiting),
  overtime: entitlement("overtime"),
  leavePay: entitlement("leaveEncashment"),
  medical: entitlement("medical"),
  transport: entitlement("transport"),
  travel: entitlement("travel"),
  airTicket: entitlement("airTicket"),
  notice: entitlement("notice"),
  gratuity: entitlement("endOfService"),
  general: (name) => tally(mine(initialGeneralRequests, name), waiting),
};

/** { total, pending } for one kind of request made by one employee. */
export const requestCountFor = (key, name) =>
  COUNTERS[key]?.(name) ?? { total: 0, pending: 0 };
