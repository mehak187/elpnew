/**
 * Money the firm gives away.
 *
 * Every kind of assistance is booked to the same account - Donations &
 * Assistance - so the category never varies. What changes is who it went to,
 * which is what the expense type and subcategory record.
 */

const subs = (names) => names.map((name) => ({ name }));

/** A category with the one name it always has, under each type. */
const donations = (subcategories) => [
  { name: "Donations & Assistance", children: subcategories },
];

/** Expense Type -> Category -> Subcategory -> Description. */
export const ASSISTANCE_CLASSIFICATION = [
  {
    name: "Charitable Assistance",
    children: donations([
      {
        name: "Charitable Donations",
        children: subs([
          "Registered Charity",
          "Ramadan Donation",
          "Mosque Support",
        ]),
      },
      { name: "Community Support", children: subs(["Local Initiative"]) },
    ]),
  },
  {
    name: "Employee Support",
    children: donations([
      {
        name: "Employee Assistance",
        children: subs(["Hardship Grant", "Family Support"]),
      },
      {
        name: "Medical Assistance",
        children: subs(["Treatment Costs", "Medical Insurance Top-up"]),
      },
      { name: "Emergency Assistance", children: subs(["Emergency Grant"]) },
    ]),
  },
  {
    name: "Social Aid",
    children: donations([
      {
        name: "Social Support",
        children: subs(["Family Emergency", "Housing Support"]),
      },
    ]),
  },
  {
    name: "Educational Support",
    children: donations([
      {
        name: "Education Aid",
        children: subs(["Tuition Fees", "Books & Materials"]),
      },
      { name: "Scholarship", children: subs(["Annual Scholarship"]) },
    ]),
  },
];

export const categoriesOf = (type) =>
  ASSISTANCE_CLASSIFICATION.find((t) => t.name === type)?.children || [];

export const subcategoriesOf = (type, category) =>
  categoriesOf(type).find((c) => c.name === category)?.children || [];

export const descriptionsOf = (type, category, subcategory) =>
  subcategoriesOf(type, category).find((s) => s.name === subcategory)
    ?.children || [];

/* -------------------------------------------------------------- the list */

/** Where the money left from, when it did not leave a bank at all. */
export const CASH_ACCOUNT = "Paid in cash";

/**
 * Assistance already given.
 *
 * `account` is written out as it should read on the row rather than held as a
 * reference, because a payment records the account it actually left - renaming
 * an account later must not rewrite what happened.
 */
export const assistanceRecords = [
  { id: 1, paymentDate: "2026-08-26", expenseType: "Charitable Assistance", category: "Donations & Assistance", subcategory: "Charitable Donations", amount: 500, method: "Bank Transfer", account: "Bank Muscat - Operating Account (1234)", proof: "assistance_260826.pdf", notes: "Support for local charity" },
  { id: 2, paymentDate: "2026-08-20", expenseType: "Employee Support", category: "Donations & Assistance", subcategory: "Employee Assistance", amount: 300, method: "Bank Transfer", account: "NBO - Corporate Account (5678)", proof: "assistance_200826.png", notes: "Medical support" },
  { id: 3, paymentDate: "2026-08-15", expenseType: "Social Aid", category: "Donations & Assistance", subcategory: "Social Support", amount: 700, method: "Cash", account: CASH_ACCOUNT, proof: "assistance_150826.pdf", notes: "Family emergency aid" },
  { id: 4, paymentDate: "2026-08-05", expenseType: "Educational Support", category: "Donations & Assistance", subcategory: "Education Aid", amount: 400, method: "Bank Transfer", account: "Oman Arab Bank - Account (9012)", proof: "assistance_050826.pdf", notes: "Student tuition support" },
];
