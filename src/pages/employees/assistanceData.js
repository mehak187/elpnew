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
 * Assistance already given.
 *
 * `account` is written out as it should read on the row rather than held as a
 * reference, because a payment records the account it actually left - renaming
 * an account later must not rewrite what happened.
 */
export const assistanceRecords = [
  { id: 1, paymentDate: "2026-08-26", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Charitable Donations", amount: 500, method: "Bank Transfer", account: "Bank Muscat - Operating Account (1234)", proof: "assistance_260826.pdf", notes: "Support for local charity" },
  { id: 2, paymentDate: "2026-08-20", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Employee Assistance", amount: 300, method: "Bank Transfer", account: "NBO - Corporate Account (5678)", proof: "assistance_200826.png", notes: "Medical support" },
  { id: 3, paymentDate: "2026-08-15", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Social Support", amount: 700, method: "Cash", account: CASH_ACCOUNT, proof: "assistance_150826.pdf", notes: "Family emergency aid" },
  { id: 4, paymentDate: "2026-08-05", expenseType: "Employee Expenses", category: "Assistance", subcategory: "Education Aid", amount: 400, method: "Bank Transfer", account: "Oman Arab Bank - Account (9012)", proof: "assistance_050826.pdf", notes: "Student tuition support" },
];
