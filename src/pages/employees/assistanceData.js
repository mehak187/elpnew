/** Money the firm gives an employee to help with something in their life. */

/**
 * The kinds of help an employee can ask for, each with the document the office
 * will want to see before deciding - so it is attached with the request rather
 * than chased afterwards.
 *
 * Donations to charities are not here: that is the firm giving to the
 * community, and it is booked under Donations & Assistance in the expenses.
 */
export const ASSISTANCE_KINDS = [
  {
    name: "Social Assistance",
    document: "Marriage contract, birth certificate or death certificate",
  },
  { name: "Medical Assistance", document: "Medical report or hospital invoice" },
  { name: "Education Assistance", document: "School or university fee invoice" },
  { name: "Other Assistance", document: "Any document that supports the request" },
];

/** The document to attach for a kind of help, if one has been chosen. */
export const documentFor = (subcategory) =>
  ASSISTANCE_KINDS.find((kind) => kind.name === subcategory)?.document || "";

/**
 * Who the help is for.
 *
 * The request is always the employee's, but the help is not always for them -
 * a bereavement is a parent's, school fees are a child's - and the office
 * decides on the request knowing which.
 */
export const ASSISTANCE_BENEFICIARIES = [
  "Employee (Self)",
  "Spouse",
  "Son",
  "Daughter",
  "Father",
  "Mother",
  "Other Family Member",
];

export const DEFAULT_BENEFICIARY = "Employee (Self)";

/**
 * Where assistance lands in the accounts.
 *
 * One type and one category, because every kind of help the firm gives is
 * booked the same way. What changes is what the help was for, which is what the
 * subcategory records - and so it is the only list with more than one entry.
 */
export const ASSISTANCE_BOOKING = [
  {
    name: "Employee Expenses",
    categories: [
      {
        name: "Assistance",
        subcategories: ASSISTANCE_KINDS.map((kind) => kind.name),
      },
    ],
  },
];

export const categoriesOf = (type) =>
  ASSISTANCE_BOOKING.find((t) => t.name === type)?.categories || [];

export const subcategoriesOf = (type, category) =>
  categoriesOf(type).find((c) => c.name === category)?.subcategories || [];

export const DEFAULT_ASSISTANCE_BOOKING = {
  expenseType: "Employee Expenses",
  category: "Assistance",
  subcategory: "",
};

/** Where the money left from, when it did not leave a bank at all. */
export const CASH_ACCOUNT = "Paid in cash";

/* -------------------------------------------------------------- the list */

/**
 * What the office decided about a request.
 *
 * Only the decision is recorded. Whether the money has actually gone out is
 * the payment date's business, so `statusOf` reads the two together rather
 * than trusting a third field that could disagree with both.
 */
export const DECISIONS = ["Pending", "Approved", "Rejected"];

/** "ASR-001", counted across the firm so a number is never reused. */
export const nextAssistanceNo = (records) =>
  "ASR-" +
  String(
    records.reduce(
      (max, record) =>
        Math.max(max, Number(String(record.requestNo || "").replace(/\D/g, "")) || 0),
      0
    ) + 1
  ).padStart(3, "0");

/** Pending -> Approved -> Paid, unless it was refused. */
export const statusOf = (record) => {
  if (record.decision === "Rejected") return "Rejected";
  if (record.decision !== "Approved") return "Pending";
  return record.paymentDate ? "Paid" : "Approved";
};

/** The colour each status is read in. */
export const STATUS_TONE = {
  Pending: "text-amber-600",
  Approved: "text-blue-600",
  Paid: "text-green-600",
  Rejected: "text-destructive",
};

/** The same statuses as a chip, where the table shows one. */
export const STATUS_CHIP = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  Paid: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

/**
 * Assistance already asked for.
 *
 * `account` is written out as it should read on the row rather than held as a
 * reference, because a payment records the account it actually left - renaming
 * an account later must not rewrite what happened. A request that was refused
 * has no payment at all, which is why those fields are empty on it.
 */
export const assistanceRecords = [
  { id: 1, requestNo: "ASR-001", employee: "Mohammed Al Yahyaei", requestDate: "2026-08-15", beneficiary: "Employee (Self)", decision: "Pending", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Social Assistance", purpose: "House damaged by flooding", amount: 700, paymentDate: "", method: "", account: "", proof: "assistance_150826.pdf", notes: "Family emergency aid" },
  { id: 2, requestNo: "ASR-002", employee: "Mohammed Al Yahyaei", requestDate: "2026-08-26", beneficiary: "Employee (Self)", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Social Assistance", purpose: "Marriage of the employee", amount: 500, paymentDate: "2026-08-26", method: "Bank Transfer", account: "Bank Muscat (1234)", proof: "assistance_260826.pdf", notes: "Marriage contract attached" },
  { id: 3, requestNo: "ASR-003", employee: "Priya Sharma", requestDate: "2026-08-20", beneficiary: "Father", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Medical Assistance", purpose: "Hospital treatment for the employee's father", amount: 300, paymentDate: "2026-08-20", method: "Bank Transfer", account: "NBO (5678)", proof: "assistance_200826.png", notes: "Medical support" },
  { id: 4, requestNo: "ASR-004", employee: "Priya Sharma", requestDate: "2026-08-05", beneficiary: "Son", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Education Assistance", purpose: "School fees for the new term", amount: 400, paymentDate: "2026-08-05", method: "Bank Transfer", account: "Oman Arab Bank (9012)", proof: "assistance_050826.pdf", notes: "Student tuition support" },
  { id: 5, requestNo: "ASR-005", employee: "Mohammed Al Yahyaei", requestDate: "2026-07-28", beneficiary: "Employee (Self)", decision: "Rejected", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Other Assistance", purpose: "Car maintenance support", amount: 350, paymentDate: "", method: "", account: "", proof: "", notes: "Car maintenance support" },
  { id: 6, requestNo: "ASR-006", employee: "Priya Sharma", requestDate: "2026-07-12", beneficiary: "Mother", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Social Assistance", purpose: "Funeral of the employee's mother", amount: 600, paymentDate: "2026-07-12", method: "Bank Transfer", account: "Sohar Bank (3344)", proof: "assistance_120726.pdf", notes: "Condolences from the firm" },
];
