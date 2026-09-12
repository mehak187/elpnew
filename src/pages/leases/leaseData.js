/**
 * The properties the firm rents: offices, flats for staff, storage.
 *
 * A lease records what was agreed - where, from whom, for how long, how much
 * and how often. Everything that follows from those (how many months it runs,
 * the VAT, the total, when the next payment falls, whether it is running out)
 * is worked out each time rather than stored, so it can never disagree with
 * the contract it came from.
 */

export const PROPERTY_TYPES = [
  "Office",
  "Apartment",
  "Storage",
  "Warehouse",
  "Parking",
];

/** How often rent is paid, and how many months apart the payments fall. */
export const PAYMENT_FREQUENCIES = [
  { key: "Monthly", months: 1 },
  { key: "Quarterly", months: 3 },
  { key: "Semi-Annually", months: 6 },
  { key: "Annually", months: 12 },
];

export const VAT_RATE = 0.05;

/**
 * How early a lease is flagged as running out.
 *
 * Longer than the month given to documents: a lease has to be renewed, or
 * notice given, before it ends - and that takes negotiating, not just filing.
 */
export const LEASE_WARNING_DAYS = 60;

const DAY = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");

/** A YYYY-MM-DD string as a local date, so a timezone cannot move the day. */
const toDate = (iso) => {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toIso = (date) =>
  date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());

/** Today, as a plain date in the user's own timezone. */
export const todayIso = () => toIso(new Date());

/** "01/10/2026" - short, because dates are compared down a column. */
export const shortDate = (iso) => {
  if (!iso) return "-";
  const [year, month, day] = String(iso).split("-");
  return day + "/" + month + "/" + year;
};

/** "500.000" - Rials to three decimals. */
export const omr = (value) =>
  Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

/**
 * A date some whole months later, kept on the same day of the month - or the
 * last day of a month too short to have it (31 January + 1 month is 28 or 29
 * February, not 3 March).
 */
function addMonths(iso, months) {
  const start = toDate(iso);
  const target = new Date(start.getFullYear(), start.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(start.getDate(), lastDay));
  return toIso(target);
}

export const monthsBetweenPayments = (frequency) =>
  PAYMENT_FREQUENCIES.find((option) => option.key === frequency)?.months || 1;

/**
 * How many months a lease runs, counting both its first and last day: from
 * 01/10/2026 to 30/09/2027 is twelve months, not eleven.
 */
export function leaseMonths(start, end) {
  if (!start || !end || end < start) return 0;
  const from = toDate(start);
  const until = toDate(end);
  until.setDate(until.getDate() + 1);
  let months =
    (until.getFullYear() - from.getFullYear()) * 12 +
    (until.getMonth() - from.getMonth());
  if (until.getDate() < from.getDate()) months -= 1;
  return Math.max(months, 0);
}

/** VAT on one payment of rent. */
export const vatOf = (rent) =>
  Math.round(Number(rent || 0) * VAT_RATE * 1000) / 1000;

/** What one payment comes to, VAT included. */
export const totalOf = (rent) => Number(rent || 0) + vatOf(rent);

/**
 * Where a lease stands, read off its end date.
 *
 * A lease that has not started yet is still one the firm is bound by, so it
 * counts as active rather than as something in between.
 */
export function leaseState(lease, today = todayIso()) {
  if (!lease.end) return "active";
  if (lease.end < today) return "expired";
  const daysLeft = Math.ceil((toDate(lease.end) - toDate(today)) / DAY);
  return daysLeft <= LEASE_WARNING_DAYS ? "soon" : "active";
}

export const LEASE_STATE = {
  active: { label: "Active", dot: "bg-green-500" },
  soon: { label: "Expiring Soon", dot: "bg-amber-400" },
  expired: { label: "Expired", dot: "bg-black" },
};

/**
 * The next day rent falls due: the first payment date, stepping by the
 * frequency, that is today or later - and still inside the contract. An ended
 * lease has none.
 */
export function nextPaymentDate(lease, today = todayIso()) {
  if (!lease.start || !lease.end || lease.end < today) return "";
  const step = monthsBetweenPayments(lease.frequency);
  let due = lease.start;
  for (let n = 1; due < today; n++) {
    due = addMonths(lease.start, n * step);
  }
  return due <= lease.end ? due : "";
}

/** The next number in the year's run: RNT-2026-002. */
export function nextContractNo(leases, date = todayIso()) {
  const prefix = "RNT-" + String(date).slice(0, 4) + "-";
  const highest = leases
    .filter((lease) => lease.contractNo.startsWith(prefix))
    .reduce(
      (max, lease) =>
        Math.max(max, Number(lease.contractNo.slice(prefix.length)) || 0),
      0
    );
  return prefix + String(highest + 1).padStart(3, "0");
}

/* ------------------------------------------------------------ the contracts */

// branchId points at the firm's own branches: 1 Muscat, 2 Salalah, 3 Sohar.
const l = (id, branchId, propertyType, building, unit, landlord, contractNo, start, end, rent, frequency, method) => ({
  id, branchId, propertyType, building, unit, landlord, contractNo, start, end, rent, frequency, method,
});

export const initialLeases = [
  l(1, 1, "Office", "Al Khuwair Office Building", "Office 101", "Al Badr Trading LLC", "RNT-2025-001", "2026-10-01", "2027-09-30", 500, "Monthly", "Bank Transfer"),
  l(2, 1, "Office", "Qurum Business Center", "Office 201", "Oman Real Estate Co.", "RNT-2025-002", "2026-08-15", "2027-08-14", 750, "Quarterly", "Cheque"),
  l(3, 2, "Storage", "Salalah Industrial Area", "Warehouse 3", "Salalah Logistics LLC", "RNT-2025-003", "2026-07-01", "2028-06-30", 400, "Monthly", "Bank Transfer"),
  l(4, 1, "Apartment", "Al Ghubrah", "Apartment 5B", "Mohammed Al Riyami", "RNT-2024-010", "2024-11-01", "2026-10-31", 350, "Monthly", "Bank Transfer"),
  l(5, 1, "Office", "Ruwi Commercial Building", "Office 3", "National Properties LLC", "RNT-2023-005", "2023-01-01", "2024-12-31", 600, "Monthly", "Bank Transfer"),
  l(6, 3, "Office", "Sohar Business Tower", "Office 12", "Batinah Properties LLC", "RNT-2025-004", "2025-03-01", "2027-02-28", 450, "Monthly", "Bank Transfer"),
  l(7, 3, "Apartment", "Falaj Al Qabail", "Apartment 2A", "Said Al Maamari", "RNT-2025-005", "2025-10-16", "2026-10-15", 280, "Monthly", "Cheque"),
  l(8, 2, "Office", "Al Saada Commercial Centre", "Office 7", "Dhofar Estates LLC", "RNT-2024-006", "2024-09-01", "2027-08-31", 520, "Semi-Annually", "Bank Transfer"),
  l(9, 1, "Parking", "Shatti Al Qurum", "Parking Bays 14-16", "Al Mouj Parking Services", "RNT-2025-006", "2026-01-01", "2026-12-31", 90, "Quarterly", "Bank Transfer"),
  l(10, 1, "Storage", "Ghala Industrial Area", "Store 22", "Ghala Storage Co.", "RNT-2024-008", "2024-04-01", "2026-03-31", 300, "Monthly", "Bank Transfer"),
  l(11, 2, "Apartment", "Al Haffa", "Apartment 9", "Ahmed Al Kathiri", "RNT-2025-007", "2025-12-01", "2026-11-30", 260, "Monthly", "Cash"),
  l(12, 3, "Warehouse", "Sohar Industrial Estate", "Warehouse 5", "Sohar Logistics Hub", "RNT-2026-001", "2026-05-01", "2028-04-30", 380, "Quarterly", "Bank Transfer"),
];
