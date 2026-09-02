import { createContext, useContext } from "react";

/**
 * Who a circular is addressed to.
 *
 * Groups rather than names: a circular is issued to a part of the firm and
 * stays addressed to it as people join and leave, which a list of names would
 * not do.
 */
export const TARGET_GROUPS = [
  "All Employees",
  "Administration",
  "Finance",
  "Lawyers",
];

export const ALL_EMPLOYEES = "All Employees";

export const CircularsContext = createContext({
  circulars: [],
  addCircular: () => {},
  acknowledge: () => {},
});

export const useCirculars = () => useContext(CircularsContext);

/** Whether a circular is addressed to somebody in this group. */
export const addressedTo = (circular, group) =>
  circular.targetGroup === ALL_EMPLOYEES || circular.targetGroup === group;

/** Whether this person has already acknowledged it. */
export const acknowledgedBy = (circular, name) =>
  circular.acknowledgements.some((a) => a.name === name);

/**
 * The circulars this person still has to read, oldest first.
 *
 * Oldest first because a circular that has been waiting longest is the one
 * most overdue, and they are shown one at a time.
 */
export function pendingFor(circulars, group, name) {
  return circulars
    .filter((c) => addressedTo(c, group) && !acknowledgedBy(c, name))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** "CIR-2026-004" - the number the next circular will be given. */
export function nextCircularNo(circulars, year = new Date().getFullYear()) {
  const serial = circulars.reduce((max, c) => {
    const parts = String(c.circularNo).split("-");
    if (Number(parts[1]) !== year) return max;
    return Math.max(max, Number(parts[2]) || 0);
  }, 0);
  return "CIR-" + year + "-" + String(serial + 1).padStart(3, "0");
}
