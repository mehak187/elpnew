import { Wallet, HandCoins, HandHeart, Percent } from "lucide-react";

/**
 * The four kinds of money an employee is owed, in the order they are asked
 * about.
 *
 * They live in a file of their own because two places need them: the heading
 * of the section, which carries the tabs, and the section itself, which shows
 * whichever one is open.
 *
 * `add` is the wording of the button that opens that category's form; a
 * category without one has nothing to add here - commission is agreed on the
 * Company Profile, and only read from this side.
 */
export const BENEFIT_TABS = [
  {
    key: "salaries",
    label: "Salaries / Allowances",
    icon: Wallet,
    note: "View your salary payments and allowances",
    // The employee asks for an advance here; the firm records the salary
    // run itself, which is what the history below shows.
    add: "Request Salary Advance",
  },
  {
    key: "loans",
    label: "Loans",
    icon: HandCoins,
    note: "View your loans and repayment details",
    add: "Add Loan",
  },
  {
    key: "assistance",
    label: "Assistance",
    icon: HandHeart,
    note: "View your financial assistance requests and payments",
    add: "Add Assistance",
  },
  {
    key: "commission",
    label: "Commission",
    icon: Percent,
    note: "Commission agreed with you on collected legal fees",
  },
];
