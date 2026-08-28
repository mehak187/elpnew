/**
 * What an employee is paid, and under what heading.
 *
 * Payroll is classified twice over, and the two are not the same thing:
 * the expense classification says which line of the firm's accounts the money
 * comes out of, while the payroll type says what the payment is to the person
 * receiving it. A transport allowance and a housing allowance are one payroll
 * type but sit under different categories.
 */

const subs = (names) => names.map((name) => ({ name }));

/** Expense Type -> Category -> Subcategory, for payroll only. */
export const PAYROLL_CLASSIFICATION = [
  {
    name: "Salary",
    children: [
      {
        name: "Monthly Salary",
        children: subs(["Basic Salary", "Overtime", "Arrears"]),
      },
      {
        name: "Salary Adjustment",
        children: subs(["Increment", "Correction"]),
      },
    ],
  },
  {
    name: "Allowance",
    children: [
      { name: "Transport Allowance", children: subs(["Monthly", "One-off"]) },
      { name: "Housing Allowance", children: subs(["Monthly", "Annual"]) },
      { name: "Phone Allowance", children: subs(["Monthly"]) },
      { name: "Other Allowance", children: subs(["One-off"]) },
    ],
  },
  {
    name: "End of Service",
    children: [
      {
        name: "End of Service Benefits",
        children: subs(["Settlement", "Gratuity"]),
      },
      { name: "Leave Settlement", children: subs(["Settlement"]) },
    ],
  },
  {
    name: "Bonus",
    children: [
      {
        name: "Performance Bonus",
        children: subs(["Quarterly", "Annual"]),
      },
      { name: "Incentive", children: subs(["One-off"]) },
    ],
  },
  {
    name: "Other Payment",
    children: [
      { name: "Leave Cash", children: subs(["Annual Leave Cash"]) },
      { name: "Reimbursement", children: subs(["Expense Reimbursement"]) },
    ],
  },
];

/** The categories under an expense type, and the subcategories under those. */
export const categoriesOf = (type) =>
  PAYROLL_CLASSIFICATION.find((t) => t.name === type)?.children || [];

export const subcategoriesOf = (type, category) =>
  categoriesOf(type).find((c) => c.name === category)?.children || [];

/** What the payment is to the person receiving it. */
export const PAYROLL_TYPES = [
  "Salary",
  "Allowance",
  "End of Service",
  "Bonus",
  "Other Payment",
];

/**
 * A payment covers a month, or a quarter when it is a quarterly bonus, so the
 * quarters sit in the same list rather than in a field of their own.
 */
export const PAYMENT_MONTHS = [
  { value: "Jan", label: "January" },
  { value: "Feb", label: "February" },
  { value: "Mar", label: "March" },
  { value: "Apr", label: "April" },
  { value: "May", label: "May" },
  { value: "Jun", label: "June" },
  { value: "Jul", label: "July" },
  { value: "Aug", label: "August" },
  { value: "Sep", label: "September" },
  { value: "Oct", label: "October" },
  { value: "Nov", label: "November" },
  { value: "Dec", label: "December" },
  { value: "Q1", label: "Q1 (Jan - Mar)" },
  { value: "Q2", label: "Q2 (Apr - Jun)" },
  { value: "Q3", label: "Q3 (Jul - Sep)" },
  { value: "Q4", label: "Q4 (Oct - Dec)" },
];

export const PAYMENT_YEARS = ["2024", "2025", "2026", "2027"];

/** Where the money leaves from. Cash is listed with the banks, not apart. */
export const PAYMENT_SOURCES = [
  "Bank Muscat",
  "National Bank of Oman",
  "Bank Dhofar",
  "Oman Arab Bank",
  "Sohar International",
  "Ahli Bank",
  "Cash",
];

/** How the banks are written in the history, where the column is narrow. */
export const SOURCE_SHORT = {
  "Bank Muscat": "Bank Muscat",
  "National Bank of Oman": "NBO",
  "Bank Dhofar": "Bank Dhofar",
  "Oman Arab Bank": "OAB",
  "Sohar International": "Sohar",
  "Ahli Bank": "Ahli",
  Cash: "Cash",
};

/* --------------------------------------------------------------- amounts */

/** Three decimals, thousands separated - the way Rials are written here. */
export const amount = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

/**
 * What is owed less what is held back.
 *
 * `entitlements` is a list rather than a single figure because a salary is
 * read as basic pay plus allowances, and the history shows both.
 */
export const netAmount = (record) =>
  record.entitlements.reduce((total, line) => total + line.value, 0) -
  (record.deductions || 0);

/** "Aug 2026", or "Q2 2026" for a quarterly payment. */
export const period = (record) => record.month + " " + record.year;

/** "26/08/2026" */
export const formatDate = (value) => {
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
};

/* ------------------------------------------------------------- the record */

/**
 * Payments already made.
 *
 * `deductions` is null where nothing could be held back, and 0 where it could
 * have been and was not - a settlement always states its deductions even when
 * they come to nothing, which is why the two cases are kept apart.
 */
export const salaryRecords = [
  { id: 1, paymentDate: "2026-08-26", expenseType: "Salary", category: "Monthly Salary", subcategory: "Basic Salary", month: "Aug", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Basic Salary", value: 800 }, { label: "Allowances", value: 150 }], deductions: 50, notes: "Monthly salary for August 2026" },
  { id: 2, paymentDate: "2026-08-20", expenseType: "Allowance", category: "Transport Allowance", subcategory: "Monthly", month: "Aug", year: "2026", method: "Bank Transfer", source: "National Bank of Oman", entitlements: [{ label: "Allowance", value: 100 }], deductions: null, notes: "Transport allowance" },
  { id: 3, paymentDate: "2026-08-15", expenseType: "End of Service", category: "End of Service Benefits", subcategory: "Settlement", month: "Aug", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Total Entitlement", value: 5250 }], deductions: 0, notes: "End of service settlement" },
  { id: 4, paymentDate: "2026-08-10", expenseType: "Bonus", category: "Performance Bonus", subcategory: "Quarterly", month: "Q2", year: "2026", method: "Bank Transfer", source: "National Bank of Oman", entitlements: [{ label: "Bonus", value: 500 }], deductions: null, notes: "Q2 Performance Bonus" },
  { id: 5, paymentDate: "2026-08-05", expenseType: "Other Payment", category: "Leave Cash", subcategory: "Annual Leave Cash", month: "Aug", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Leave Cash", value: 120 }], deductions: null, notes: "Cash for unused leave days" },
  { id: 6, paymentDate: "2026-07-26", expenseType: "Salary", category: "Monthly Salary", subcategory: "Basic Salary", month: "Jul", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Basic Salary", value: 800 }, { label: "Allowances", value: 150 }], deductions: 50, notes: "Monthly salary for July 2026" },
  { id: 7, paymentDate: "2026-07-20", expenseType: "Allowance", category: "Transport Allowance", subcategory: "Monthly", month: "Jul", year: "2026", method: "Bank Transfer", source: "National Bank of Oman", entitlements: [{ label: "Allowance", value: 100 }], deductions: null, notes: "Transport allowance" },
  { id: 8, paymentDate: "2026-07-18", expenseType: "Allowance", category: "Housing Allowance", subcategory: "Monthly", month: "Jul", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Allowance", value: 250 }], deductions: null, notes: "Housing allowance" },
  { id: 9, paymentDate: "2026-07-05", expenseType: "Salary", category: "Monthly Salary", subcategory: "Overtime", month: "Jul", year: "2026", method: "Cash", source: "Cash", entitlements: [{ label: "Overtime", value: 65 }], deductions: null, notes: "Overtime for June" },
  { id: 10, paymentDate: "2026-06-26", expenseType: "Salary", category: "Monthly Salary", subcategory: "Basic Salary", month: "Jun", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Basic Salary", value: 800 }, { label: "Allowances", value: 150 }], deductions: 50, notes: "Monthly salary for June 2026" },
  { id: 11, paymentDate: "2026-06-20", expenseType: "Allowance", category: "Phone Allowance", subcategory: "Monthly", month: "Jun", year: "2026", method: "Bank Transfer", source: "National Bank of Oman", entitlements: [{ label: "Allowance", value: 30 }], deductions: null, notes: "Phone allowance" },
  { id: 12, paymentDate: "2026-06-12", expenseType: "Other Payment", category: "Reimbursement", subcategory: "Expense Reimbursement", month: "Jun", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Reimbursement", value: 84.5 }], deductions: null, notes: "Travel to Salalah court" },
  { id: 13, paymentDate: "2026-05-26", expenseType: "Salary", category: "Monthly Salary", subcategory: "Basic Salary", month: "May", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Basic Salary", value: 800 }, { label: "Allowances", value: 150 }], deductions: 50, notes: "Monthly salary for May 2026" },
  { id: 14, paymentDate: "2026-05-14", expenseType: "Bonus", category: "Incentive", subcategory: "One-off", month: "May", year: "2026", method: "Bank Transfer", source: "National Bank of Oman", entitlements: [{ label: "Bonus", value: 200 }], deductions: null, notes: "Case completion incentive" },
  { id: 15, paymentDate: "2026-04-26", expenseType: "Salary", category: "Monthly Salary", subcategory: "Basic Salary", month: "Apr", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Basic Salary", value: 780 }, { label: "Allowances", value: 150 }], deductions: 50, notes: "Monthly salary for April 2026" },
  { id: 16, paymentDate: "2026-04-10", expenseType: "Bonus", category: "Performance Bonus", subcategory: "Quarterly", month: "Q1", year: "2026", method: "Bank Transfer", source: "National Bank of Oman", entitlements: [{ label: "Bonus", value: 450 }], deductions: null, notes: "Q1 Performance Bonus" },
  { id: 17, paymentDate: "2026-03-26", expenseType: "Salary", category: "Monthly Salary", subcategory: "Basic Salary", month: "Mar", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Basic Salary", value: 780 }, { label: "Allowances", value: 150 }], deductions: 50, notes: "Monthly salary for March 2026" },
  { id: 18, paymentDate: "2026-03-02", expenseType: "Salary", category: "Salary Adjustment", subcategory: "Increment", month: "Mar", year: "2026", method: "Bank Transfer", source: "Bank Muscat", entitlements: [{ label: "Increment", value: 20 }], deductions: null, notes: "Annual increment applied" },
];
