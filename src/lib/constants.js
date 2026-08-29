// The Rial sign is drawn, not typed - see components/shared/money.jsx.

/* ------------------------------------------------------------- employees */

// Nationalities are written as the adjective, which is how a personnel record
// reads: "Omani", not "Oman".
export const NATIONALITIES = [
  "Omani",
  "Emirati",
  "Saudi",
  "Qatari",
  "Kuwaiti",
  "Bahraini",
  "Yemeni",
  "Egyptian",
  "Jordanian",
  "Syrian",
  "Lebanese",
  "Sudanese",
  "Indian",
  "Pakistani",
  "Bangladeshi",
  "Sri Lankan",
  "Filipino",
  "British",
  "Other",
];

export const GENDERS = ["Male", "Female"];

export const EMPLOYEE_STATUSES = ["Active", "On Leave", "Inactive", "Terminated"];

/**
 * Why someone left. Only asked for once a status says they have - a reason for
 * leaving on an employee who is still here is a contradiction, not a blank.
 */
export const LEAVING_REASONS = [
  "Resignation",
  "End of Contract",
  "Termination",
  "Retirement",
  "Transfer",
  "Other",
];

/* ---------------------------------------------------------- job description */

/** A partner owns a share of the firm; everyone else is employed by it. */
export const EMPLOYEE_CATEGORIES = ["Partner", "Employee"];

/** How far up the firm somebody sits, regardless of what they do. */
export const JOB_LEVELS = ["Top Management", "Executive Management", "Staff"];

/** The side of the firm's work somebody belongs to. */
export const DEPARTMENTS = [
  "Litigation",
  "Execution",
  "Administrative Affairs",
  "Accounting",
];

/** What somebody actually does, which is not the same as their level. */
export const OCCUPATIONS = [
  "Legal Consultant",
  "Lawyer",
  "Administrator",
  "Accountant",
  "Junior Accountant",
  "Other Business",
];

export const EDUCATION_LEVELS = [
  "Secondary Education",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
];

// Client types as specified by the client (Phase 1 requirements)
export const CLIENT_TYPES = [
  "Bank",
  "Finance Company",
  "Insurance Company",
  "Telecom Company",
  "Real Estate Company",
  "Automotive Company",
  "Commercial Company",
  "Other Entities",
  "Individual",
];

// Banks a client can nominate to receive payments.
export const RECEIVING_BANKS = [
  "Bank Muscat",
  "National Bank of Oman",
  "Bank Dhofar",
  "Oman Arab Bank",
  "Sohar International",
  "Ahli Bank",
  "Bank Nizwa",
  "Alizz Islamic Bank",
];

// Standard payment delay periods, in days. "Custom" reveals a free-text field
// so an unusual term can be entered directly.
export const PAYMENT_DELAY_OPTIONS = ["15", "30", "45", "60", "90"];

// Contracts are not filed here - they have their own page, because a contract
// is renewed and amended over time while these are simply held on record.
export const DOCUMENT_TYPES = [
  "Power of Attorney",
  "Commercial Registration",
  "ID Card",
  "Instructions",
];

/**
 * A general contract governs the whole relationship; a specific one is written
 * for a single matter, so it names the case file it belongs to.
 */
export const CONTRACT_TYPES = ["General", "Specific"];

// Document types that carry an expiry date of their own.
export const DOCUMENT_EXPIRY_LABELS = {
  "Power of Attorney": "Power of Attorney Expiry Date",
  "Commercial Registration": "Commercial Registration Expiry Date",
};

export const DOCUMENT_STATUSES = ["Valid", "Expiring Soon", "Expired", "Not Required"];

export const INVOICE_STATUSES = [
  "Paid",
  "Partially Paid",
  "Unpaid",
  "Overdue",
  "Cancelled",
];

export const INVOICE_STATUS_VARIANT = {
  Paid: "success",
  "Partially Paid": "warning",
  Unpaid: "secondary",
  Overdue: "destructive",
  Cancelled: "outline",
};

/**
 * The dot that carries an invoice's status where the words sit in plain black.
 *
 * `ring` is given separately because a pale fill on a white row disappears
 * without an edge, and a cancelled invoice is drawn hollow - nothing is owed on
 * it and nothing has been paid, so there is nothing to fill in.
 */
export const INVOICE_STATUS_DOT = {
  Paid: { fill: "#0B6623", ring: "#0B6623" },
  "Partially Paid": { fill: "#D9F7E3", ring: "#0B6623" },
  Unpaid: { fill: "#F59E0B", ring: "#F59E0B" },
  Overdue: { fill: "#DC2626", ring: "#DC2626" },
  Cancelled: { fill: "transparent", ring: "#9CA3AF" },
};

/**
 * Dial codes for the phone fields.
 *
 * Oman leads the list because it is the default, and the Gulf states follow
 * since they are the common case here; the rest are alphabetical.
 */
export const DEFAULT_DIAL_CODE = "+968";

export const COUNTRY_DIAL_CODES = [
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "YE", name: "Yemen", dial: "+967", flag: "🇾🇪" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "IR", name: "Iran", dial: "+98", flag: "🇮🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", dial: "+249", flag: "🇸🇩" },
  { code: "SY", name: "Syria", dial: "+963", flag: "🇸🇾" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
];

/**
 * Papers held against a person rather than against the firm - the two lists are
 * kept apart because a bar card belongs to a lawyer and a commercial
 * registration belongs to the company.
 */
export const EMPLOYEE_DOCUMENT_TYPES = [
  "ID Card",
  "Passport",
  "Bar Card",
  "Academic Qualification",
  "Experience Certificate",
  "Decisions",
  "Other Certificates",
  "Other Documents",
];

/** The branches the firm's banks are held at. */
export const BANK_BRANCHES = [
  "Main Branch",
  "Shatti Al Qurum",
  "Ruwi",
  "Al Khuwair",
  "Seeb",
  "Nizwa",
  "Sohar",
  "Salalah",
];

/** What kind of account it is, which decides how the money can be used. */
export const ACCOUNT_TYPES = [
  "Current Account",
  "Savings Account",
  "Call Account",
  "Fixed Deposit",
];
