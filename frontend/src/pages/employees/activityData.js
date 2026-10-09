/**
 * The working day, and what the firm can tell about it afterwards.
 *
 * Two ideas run through this file. The first is that a count is never asked
 * for twice: the number of court sessions attended is how many sessions were
 * entered, so it is counted rather than typed. The second is that time at the
 * desk and time working are not the same measurement, which is why office
 * hours and system active time are kept apart everywhere they appear.
 */

/* ------------------------------------------------------------ what is done */

/**
 * The kinds of activity a day is made of.
 *
 * `location` and `person` say which of the detail fields the type actually
 * needs - an expert meeting has an expert but no court, and other work has
 * neither - so the form asks only for what belongs to the activity in hand.
 */
export const ACTIVITY_TYPES = [
  {
    name: "Court Session",
    key: "court",
    location: "Court",
    person: null,
    countLabel: "Court Sessions Attended",
  },
  {
    name: "Client Meeting",
    key: "client",
    location: "Location",
    person: "Client Name",
    countLabel: "Client Meetings",
  },
  {
    name: "Expert Meeting",
    key: "expert",
    location: "Location",
    person: "Expert Name",
    countLabel: "Expert Meetings",
  },
  {
    name: "Other Activity",
    key: "other",
    location: "Location",
    person: null,
    countLabel: "Other Activities",
  },
];

export const activityType = (name) =>
  ACTIVITY_TYPES.find((t) => t.name === name) || ACTIVITY_TYPES[3];

/** What gets written, as it would be named on the file it goes into. */
export const LEGAL_DOCUMENT_TYPES = [
  "Memo",
  "Pleading",
  "Statement of Claim",
  "Appeal",
  "Reply",
  "Legal Opinion",
  "Other Legal Document",
];

/* ------------------------------------------------------------------- time */

/** "09:15" as 555. Anything unreadable is no time at all. */
export const toMinutes = (time) => {
  const [hours, mins] = String(time || "").split(":");
  const total = Number(hours) * 60 + Number(mins);
  return Number.isFinite(total) ? total : 0;
};

/** Minutes between two clock times, never negative. */
export const spanMinutes = (from, to) =>
  Math.max(0, toMinutes(to) - toMinutes(from));

/** 465 as "7h 45m", and 60 as "1h 0m" - the unit is always spelled out. */
export const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(minutes || 0));
  return Math.floor(total / 60) + "h " + (total % 60) + "m";
};

/** 465 as "7.8" - hours to one decimal, for figures that are averaged. */
export const hours = (minutes) => (Math.max(0, minutes || 0) / 60).toFixed(1);

const pad = (n) => String(n).padStart(2, "0");

/** A Date as "2026-08-29", read in local time rather than UTC. */
export const isoDate = (date) =>
  date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());

export const today = () => isoDate(new Date());

/** "29/08/2026" */
export const formatDate = (value) => {
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Aug 2026" */
export const monthLabel = (value) => {
  const [year, month] = String(value).split("-");
  return MONTH_NAMES[Number(month) - 1] + " " + year;
};

/** The long weekday and date the page opens on. */
export const longDate = (value) => {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/* ------------------------------------------------------- the recorded days */

/**
 * A settled figure that varies from day to day without ever varying between
 * two readings of the same day. Real days come from the database; these have to
 * be repeatable, or every render would report different performance.
 */
const wobble = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * One made-up working day.
 *
 * System active time is deliberately less than office time - an hour at the
 * desk is not an hour in the system, and the whole point of measuring both is
 * to see the difference.
 */
function buildDay(date, seed) {
  const startMinutes = 8 * 60 + Math.round(wobble(seed) * 45);
  const officeMinutes = 7 * 60 + Math.round(wobble(seed + 1) * 150);
  const endMinutes = startMinutes + officeMinutes;

  const court = Math.round(wobble(seed + 2) * 2.4);
  const client = Math.round(wobble(seed + 3) * 2.2);
  const expert = Math.round(wobble(seed + 4) * 1.4);
  const other = Math.round(wobble(seed + 5) * 1.6);
  const memos = Math.round(wobble(seed + 6) * 3.4);

  const minutes = {
    court: court * (45 + Math.round(wobble(seed + 7) * 60)),
    client: client * (30 + Math.round(wobble(seed + 8) * 45)),
    expert: expert * (30 + Math.round(wobble(seed + 9) * 50)),
    other: other * (20 + Math.round(wobble(seed + 10) * 40)),
  };

  const booked = minutes.court + minutes.client + minutes.expert + minutes.other;
  // Time in the system is what is left of the day once the diary is taken out,
  // less the part of it nobody was really working.
  const atDesk = Math.max(0, officeMinutes - booked);
  const activeMinutes = Math.round(atDesk * (0.62 + wobble(seed + 11) * 0.24));

  return {
    date,
    startTime: pad(Math.floor(startMinutes / 60)) + ":" + pad(startMinutes % 60),
    endTime: pad(Math.floor(endMinutes / 60)) + ":" + pad(endMinutes % 60),
    officeMinutes,
    activeMinutes,
    counts: { court, client, expert, other, memos },
    minutes,
  };
}

/**
 * The last two years of working days, weekends left out.
 *
 * Two years rather than one, because the twelve-month view is compared against
 * the twelve months before it and both windows have to be there.
 */
export function recordedDays(from = new Date()) {
  const days = [];
  for (let back = 0; back < 730; back += 1) {
    const date = new Date(from);
    date.setDate(date.getDate() - back);
    const weekday = date.getDay();
    // The working week here runs Sunday to Thursday.
    if (weekday === 5 || weekday === 6) continue;
    days.push(buildDay(isoDate(date), back + 1));
  }
  return days;
}

/* --------------------------------------------------------- the periods shown */

/**
 * How far back a view looks, and what it is compared against.
 *
 * Every period is compared with the one immediately before it and of the same
 * length, so the comparison is always like for like - and always against this
 * employee's own past, never against anybody else.
 */
export const PERIODS = [
  { key: "month", label: "This Month vs Last Month", months: 1 },
  { key: "3", label: "Last 3 Months", months: 3 },
  { key: "6", label: "Last 6 Months", months: 6 },
  { key: "12", label: "Last 12 Months", months: 12 },
];

/** The two windows a period covers: [currentFrom, previousFrom]. */
export function windowsFor(months, from = new Date()) {
  const current = new Date(from);
  current.setMonth(current.getMonth() - months);
  const previous = new Date(from);
  previous.setMonth(previous.getMonth() - months * 2);
  return { currentFrom: isoDate(current), previousFrom: isoDate(previous) };
}

export const between = (days, from, to) =>
  days.filter((day) => day.date > from && day.date <= to);

/* ------------------------------------------------------------- the totals */

const sum = (days, read) => days.reduce((total, day) => total + read(day), 0);

/**
 * Everything the statistics page reports, worked out from the days themselves.
 *
 * The score is the one figure here that is a judgement rather than a count, so
 * it is spelled out: how much of the day reached the system, and how much work
 * came out of it, against targets the firm can move.
 */
export function summarise(days) {
  const officeMinutes = sum(days, (d) => d.officeMinutes);
  const activeMinutes = sum(days, (d) => d.activeMinutes);
  const totals = {
    days: days.length,
    officeMinutes,
    activeMinutes,
    avgDailyMinutes: days.length ? officeMinutes / days.length : 0,
    memos: sum(days, (d) => d.counts.memos),
    court: sum(days, (d) => d.counts.court),
    client: sum(days, (d) => d.counts.client),
    expert: sum(days, (d) => d.counts.expert),
    other: sum(days, (d) => d.counts.other),
    courtMinutes: sum(days, (d) => d.minutes.court),
    clientMinutes: sum(days, (d) => d.minutes.client),
    expertMinutes: sum(days, (d) => d.minutes.expert),
    otherMinutes: sum(days, (d) => d.minutes.other),
  };

  totals.score = days.length ? performanceScore(totals) : 0;
  return totals;
}

/** A day's work, as the firm counts it: three parts effort, one part presence. */
function performanceScore(totals) {
  const perDay = (value) => value / totals.days;
  const capped = (value, target) => Math.min(value / target, 1);

  // Time that actually reached the system or a booked activity, over time at
  // the desk - presence alone earns nothing here.
  const booked =
    totals.courtMinutes +
    totals.clientMinutes +
    totals.expertMinutes +
    totals.otherMinutes;
  const engagement = totals.officeMinutes
    ? Math.min((totals.activeMinutes + booked) / totals.officeMinutes, 1)
    : 0;

  const output = capped(perDay(totals.memos), 1.5);
  const hearings = capped(perDay(totals.court), 1);
  const meetings = capped(perDay(totals.client + totals.expert), 1.5);

  return Math.round(
    (engagement * 40 + output * 25 + hearings * 20 + meetings * 15)
  );
}

/** A change between two figures, and which way it went. */
export function change(current, previous) {
  const difference = current - previous;
  const percent = previous ? (difference / previous) * 100 : null;
  return { difference, percent };
}
