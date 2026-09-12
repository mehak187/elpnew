/**
 * The properties the firm rents: offices, flats for staff, storage.
 *
 * A lease records what was agreed - where, from whom, for how long, the
 * monthly rent, how it is paid and in how many installments. Everything that
 * follows from those (how many months it runs, the VAT, each installment's
 * date and amount, the next payment, whether it is running out) is worked out
 * each time rather than stored, so it can never disagree with the contract it
 * came from.
 */

export const PROPERTY_TYPES = [
  "Office",
  "Apartment",
  "Storage",
  "Warehouse",
  "Parking",
];

/** Whether the contract is the first one for the property or a renewal of it. */
export const CONTRACT_STATUSES = ["New Contract", "Renewal"];

/** How rent is paid. */
export const LEASE_PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Cheque",
  "Standing Order",
];

export const CASH = "Cash";
export const CHEQUE = "Cheque";

/** A bank account that is not one of the firm's own. */
export const OTHER_ACCOUNT = "other";

/** The contract's rent can be split into anything from one payment to twelve. */
export const INSTALLMENT_COUNTS = Array.from({ length: 12 }, (_, i) => i + 1);

/** The day of the month an installment falls due. */
export const PAYMENT_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

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
const round3 = (value) => Math.round(value * 1000) / 1000;

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

/** "Bank Muscat – 0123 4567 89" - the bank, and the account in fours. */
export const accountLabel = (account) =>
  account.bankName +
  " – " +
  String(account.accountNumber || "").replace(/(.{4})/g, "$1 ").trim();

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

/**
 * VAT on a month's rent - none where the lease is exempt. Residential lettings
 * are, which is why a flat for staff can be entered without it.
 */
export const vatOf = (rent, applied = true) =>
  applied === false ? 0 : round3(Number(rent || 0) * VAT_RATE);

/** A month's rent with its VAT, where there is any. */
export const totalOf = (rent, applied = true) =>
  round3(Number(rent || 0) + vatOf(rent, applied));

/** How each installment stands against today. */
export const SCHEDULE_STATE = {
  passed: { label: "Due date passed", tone: "bg-muted text-muted-foreground" },
  next: { label: "Next payment", tone: "bg-blue-100 text-blue-800" },
  upcoming: { label: "Upcoming", tone: "bg-amber-100 text-amber-800" },
};

/**
 * Every installment of the contract: its date and its amount.
 *
 * The whole contract comes to the monthly rent with VAT times its months, split
 * evenly across the installments - the last one takes whatever fils the split
 * leaves over, so the installments always add up to the contract exactly.
 * They fall at even steps through the contract, on the chosen day of the month
 * (or the month's last day, where it is shorter), and never before the
 * contract starts.
 *
 * Whether an installment was actually paid is not recorded yet, so a past date
 * is only called what it is - passed - and not "paid" or "overdue".
 */
export function installmentsOf(lease, today = todayIso()) {
  const months = leaseMonths(lease.start, lease.end);
  const count = Number(lease.installments);
  const rent = Number(lease.rent || 0);
  if (!months || !count || rent <= 0) return [];

  const day = Number(lease.paymentDay) || toDate(lease.start).getDate();
  const contractTotal = round3(totalOf(rent, lease.vatApplied) * months);
  const each = Math.floor((contractTotal * 1000) / count) / 1000;
  const first = toDate(lease.start);

  const rows = [];
  for (let k = 0; k < count; k++) {
    const offset = Math.round((k * months) / count);
    const month = new Date(first.getFullYear(), first.getMonth() + offset, 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    month.setDate(Math.min(day, lastDay));
    let due = toIso(month);
    if (due < lease.start) due = lease.start;

    rows.push({
      no: k + 1,
      due,
      amount: k === count - 1 ? round3(contractTotal - each * (count - 1)) : each,
      chequeNo: (lease.cheques && lease.cheques[k + 1]) || "",
    });
  }

  const next = rows.find((row) => row.due >= today && row.due <= lease.end);
  return rows.map((row) => ({
    ...row,
    when: next && row.no === next.no ? "next" : row.due < today ? "passed" : "upcoming",
  }));
}

/** The next installment that falls due, today or later. An ended lease has none. */
export function nextPaymentDate(lease, today = todayIso()) {
  if (!lease.end || lease.end < today) return "";
  return installmentsOf(lease, today).find((row) => row.when === "next")?.due || "";
}

const EVERY = { 1: "Monthly", 3: "Quarterly", 6: "Semi-Annually", 12: "Annually" };

/**
 * How often rent is paid, read off the contract's months and its installments:
 * twelve months in four installments is Quarterly. A split that is not a whole
 * number of months apart is described by its count instead.
 */
export function frequencyLabel(lease) {
  const months = leaseMonths(lease.start, lease.end);
  const count = Number(lease.installments);
  if (!months || !count) return "";
  const step = months / count;
  if (EVERY[step]) return EVERY[step];
  if (Number.isInteger(step)) return "Every " + step + " Months";
  return count + " Installments";
}

/** Where the property is, in one line: its address, or its building and unit. */
export const addressOf = (lease) =>
  lease.address || [lease.building, lease.unit].filter(Boolean).join(", ");

/**
 * Where a lease stands, read off its end date.
 *
 * A lease that has not started yet is still one the firm is bound by, so it
 * counts as active rather than as something in between. One whose contract
 * dates have not been entered yet cannot be anything but pending: calling it
 * active would claim a contract nobody has recorded.
 */
export function leaseState(lease, today = todayIso()) {
  if (!lease.start || !lease.end) return "pending";
  if (lease.end < today) return "expired";
  const daysLeft = Math.ceil((toDate(lease.end) - toDate(today)) / DAY);
  return daysLeft <= LEASE_WARNING_DAYS ? "soon" : "active";
}

export const LEASE_STATE = {
  pending: { label: "Contract details pending", dot: "bg-gray-400" },
  active: { label: "Active", dot: "bg-green-500" },
  soon: { label: "Expiring Soon", dot: "bg-amber-400" },
  expired: { label: "Expired", dot: "bg-black" },
};

/* ------------------------------------------------------------ the contracts */

// branchId points at the firm's own branches (1 Muscat, 2 Salalah, 3 Sohar)
// and bankAccountId at its own accounts (1 Bank Muscat, 2 National Bank of
// Oman, 4 Sohar International). Rent is monthly. The contract number is the
// one written on the signed contract, so it is entered rather than generated.
const l = (id, branchId, propertyType, building, unit, landlord, contractNo, start, end, rent, vatApplied, method, bankAccountId, installments, paymentDay) => ({
  id, branchId, propertyType, building, unit, landlord, contractNo, start, end, rent, vatApplied, method, bankAccountId, installments, paymentDay,
  address: "", contractStatus: "New Contract", contractFile: "", paymentFile: "", cheques: {}, nonRenewalDate: "", nonRenewalFile: "",
});

export const initialLeases = [
  l(1, 1, "Office", "Al Khuwair Office Building", "Office 101", "Al Badr Trading LLC", "RNT-2025-001", "2026-10-01", "2027-09-30", 500, true, "Bank Transfer", 1, 12, 1),
  l(2, 1, "Office", "Qurum Business Center", "Office 201", "Oman Real Estate Co.", "RNT-2025-002", "2026-08-15", "2027-08-14", 750, true, "Cheque", "", 4, 15),
  l(3, 2, "Storage", "Salalah Industrial Area", "Warehouse 3", "Salalah Logistics LLC", "RNT-2025-003", "2026-07-01", "2028-06-30", 400, true, "Bank Transfer", 1, 12, 1),
  l(4, 1, "Apartment", "Al Ghubrah", "Apartment 5B", "Mohammed Al Riyami", "RNT-2024-010", "2024-11-01", "2026-10-31", 350, false, "Bank Transfer", 1, 12, 1),
  l(5, 1, "Office", "Ruwi Commercial Building", "Office 3", "National Properties LLC", "RNT-2023-005", "2023-01-01", "2024-12-31", 600, true, "Bank Transfer", 1, 12, 1),
  l(6, 3, "Office", "Sohar Business Tower", "Office 12", "Batinah Properties LLC", "RNT-2025-004", "2025-03-01", "2027-02-28", 450, true, "Bank Transfer", 4, 12, 1),
  l(7, 3, "Apartment", "Falaj Al Qabail", "Apartment 2A", "Said Al Maamari", "RNT-2025-005", "2025-10-16", "2026-10-15", 280, false, "Cheque", "", 12, 16),
  l(8, 2, "Office", "Al Saada Commercial Centre", "Office 7", "Dhofar Estates LLC", "RNT-2024-006", "2024-09-01", "2027-08-31", 520, true, "Bank Transfer", 2, 6, 1),
  l(9, 1, "Parking", "Shatti Al Qurum", "Parking Bays 14-16", "Al Mouj Parking Services", "RNT-2025-006", "2026-01-01", "2026-12-31", 90, true, "Standing Order", 1, 4, 1),
  l(10, 1, "Storage", "Ghala Industrial Area", "Store 22", "Ghala Storage Co.", "RNT-2024-008", "2024-04-01", "2026-03-31", 300, true, "Bank Transfer", 1, 12, 1),
  l(11, 2, "Apartment", "Al Haffa", "Apartment 9", "Ahmed Al Kathiri", "RNT-2025-007", "2025-12-01", "2026-11-30", 260, false, "Cash", "", 12, 1),
  l(12, 3, "Warehouse", "Sohar Industrial Estate", "Warehouse 5", "Sohar Logistics Hub", "RNT-2026-001", "2026-05-01", "2028-04-30", 380, true, "Bank Transfer", 4, 8, 1),
];
