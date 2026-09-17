/**
 * Bonuses the firm pays an employee.
 *
 * A bonus is granted, not asked for: it is the firm's decision, recorded on
 * the employee's page once it has been paid. Every one is booked the same way
 * - Employee Expenses, under Bonus - and what changes is what it was for,
 * which is what the subcategory says.
 */

const DAY = 24 * 60 * 60 * 1000;
const dayOffset = (days) =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

export const BONUS_EXPENSE_TYPE = "Employee Expenses";
export const BONUS_CATEGORY = "Bonus";

/** What a bonus can be for. */
export const BONUS_SUBCATEGORIES = [
  "Performance and Excellence",
  "Completion of a Case or Task",
  "Collection",
  "Business Development",
  "Annual Bonus",
  "Exceptional Bonus",
  "Other",
];

/** Anything that is not one of the reasons above has to say what it was. */
export const OTHER_BONUS = "Other";

/**
 * Where a bonus has got to.
 *
 * Deciding a bonus is not paying it: it is recorded first and disbursed
 * after, so the list says which of the two has happened.
 */
export const BONUS_PENDING = "Pending Disbursement";
export const BONUS_DISBURSED = "Disbursed";

export const BONUS_STATUS_CHIP = {
  [BONUS_PENDING]: "bg-amber-100 text-amber-800",
  [BONUS_DISBURSED]: "bg-green-100 text-green-800",
};

/** The day the bonus was entered, which is what the list reads it by. */
export const bonusDate = (bonus) => bonus.recordedOn || bonus.paidOn;

/** What the bonus was for, as it reads on a row: "Other" says which other. */
export const bonusReason = (bonus) =>
  bonus.subcategory === OTHER_BONUS && bonus.bonusType
    ? bonus.bonusType
    : bonus.subcategory;

/** Everything paid to one person, newest first. */
export const bonusesFor = (bonuses, name) =>
  bonuses
    .filter((bonus) => bonus.employee === name)
    .sort(
      (a, b) =>
        String(bonusDate(b)).localeCompare(String(bonusDate(a))) || b.id - a.id
    );

export const initialBonuses = [
  {
    id: 1,
    employee: "Mohammed Al Yahyaei",
    expenseType: BONUS_EXPENSE_TYPE,
    category: BONUS_CATEGORY,
    subcategory: "Annual Bonus",
    bonusType: "",
    amount: 1500,
    paidOn: dayOffset(-250),
    status: BONUS_DISBURSED,
    notes: "Annual bonus for 2025.",
  },
  {
    id: 2,
    employee: "Mohammed Al Yahyaei",
    expenseType: BONUS_EXPENSE_TYPE,
    category: BONUS_CATEGORY,
    subcategory: "Business Development",
    bonusType: "",
    amount: 600,
    paidOn: dayOffset(-60),
    status: BONUS_DISBURSED,
    notes: "Two corporate clients brought to the firm.",
  },
  {
    id: 3,
    employee: "Fatima Al Rashdi",
    expenseType: BONUS_EXPENSE_TYPE,
    category: BONUS_CATEGORY,
    subcategory: "Completion of a Case or Task",
    bonusType: "",
    amount: 350,
    paidOn: dayOffset(-35),
    status: BONUS_DISBURSED,
    notes: "Execution file 21 closed in the firm's favour.",
  },
  {
    id: 4,
    employee: "Fatima Al Rashdi",
    expenseType: BONUS_EXPENSE_TYPE,
    category: BONUS_CATEGORY,
    subcategory: "Performance and Excellence",
    bonusType: "",
    amount: 250,
    paidOn: dayOffset(-120),
    status: BONUS_DISBURSED,
    notes: "",
  },
  {
    id: 5,
    employee: "Aisha Al Kindi",
    expenseType: BONUS_EXPENSE_TYPE,
    category: BONUS_CATEGORY,
    subcategory: "Collection",
    bonusType: "",
    amount: 420,
    paidOn: dayOffset(-15),
    status: BONUS_DISBURSED,
    notes: "Overdue fees collected on three files.",
  },
  {
    id: 6,
    employee: "Aisha Al Kindi",
    expenseType: BONUS_EXPENSE_TYPE,
    category: BONUS_CATEGORY,
    subcategory: OTHER_BONUS,
    bonusType: "Ramadan bonus",
    amount: 200,
    paidOn: dayOffset(-190),
    status: BONUS_DISBURSED,
    notes: "Paid to everyone in the Muscat office.",
  },
];
