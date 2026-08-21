import { useMemo, useState } from "react";
import { ExpensesContext } from "./context";
import { initialExpenses } from "@/pages/expenses/expenseData";

export default function ExpensesProvider({ children }) {
  const [expenses, setExpenses] = useState(initialExpenses);

  const value = useMemo(
    () => ({
      expenses,
      addExpense: (expense) =>
        setExpenses((prev) => [
          { ...expense, id: prev.reduce((max, e) => Math.max(max, e.id), 0) + 1 },
          ...prev,
        ]),
      removeExpense: (id) =>
        setExpenses((prev) => prev.filter((e) => e.id !== id)),
    }),
    [expenses]
  );

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}
