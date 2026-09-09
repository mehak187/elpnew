/** Money the firm gives away. */

/**
 * Where assistance lands in the accounts.
 *
 * One type and one category, because every kind of help the firm gives is
 * booked the same way. What changes is who it went to, which is what the
 * subcategory records - and so it is the only list with more than one entry.
 */
export const ASSISTANCE_BOOKING = [
  {
    name: "Employee Expenses",
    categories: [
      {
        name: "Assistance",
        subcategories: [
          "Charitable Donations",
          "Employee Assistance",
          "Medical Assistance",
          "Social Support",
          "Education Aid",
          "Emergency Assistance",
          "Other Assistance",
        ],
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

/**
 * Assistance already asked for.
 *
 * `account` is written out as it should read on the row rather than held as a
 * reference, because a payment records the account it actually left - renaming
 * an account later must not rewrite what happened. A request that was refused
 * has no payment at all, which is why those fields are empty on it.
 */
export const assistanceRecords = [
  { id: 1, requestDate: "2026-08-15", decision: "Pending", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Employee Assistance", purpose: "Family emergency aid", amount: 700, paymentDate: "", method: "", account: "", proof: "assistance_150826.pdf", notes: "Family emergency aid" },
  { id: 2, requestDate: "2026-08-26", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Charitable Donations", purpose: "Support for local charity", amount: 500, paymentDate: "2026-08-26", method: "Bank Transfer", account: "Bank Muscat (1234)", proof: "assistance_260826.pdf", notes: "Support for local charity" },
  { id: 3, requestDate: "2026-08-20", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Medical Assistance", purpose: "Medical treatment", amount: 300, paymentDate: "2026-08-20", method: "Bank Transfer", account: "NBO (5678)", proof: "assistance_200826.png", notes: "Medical support" },
  { id: 4, requestDate: "2026-08-05", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Education Aid", purpose: "Student tuition support", amount: 400, paymentDate: "2026-08-05", method: "Bank Transfer", account: "Oman Arab Bank (9012)", proof: "assistance_050826.pdf", notes: "Student tuition support" },
  { id: 5, requestDate: "2026-07-28", decision: "Rejected", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Other Assistance", purpose: "Car maintenance support", amount: 350, paymentDate: "", method: "", account: "", proof: "", notes: "Car maintenance support" },
  { id: 6, requestDate: "2026-07-12", decision: "Approved", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Social Support", purpose: "Social assistance", amount: 600, paymentDate: "2026-07-12", method: "Bank Transfer", account: "Sohar Bank (3344)", proof: "assistance_120726.pdf", notes: "Social assistance" },
];
