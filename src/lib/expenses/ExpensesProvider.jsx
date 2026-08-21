import { useMemo, useState } from "react";
import { ExpensesContext } from "./context";
import { initialExpenses, initialInvoices } from "@/pages/expenses/expenseData";

const nextId = (rows) => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

/**
 * Holds both halves of the expenses module: the expenses recorded directly,
 * and the general invoices that travel through the approval workflow. Keeping
 * them here lets the list pages and their add forms live on separate routes.
 */
export default function ExpensesProvider({ children }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [invoices, setInvoices] = useState(initialInvoices);

  const value = useMemo(
    () => ({
      expenses,
      addExpense: (expense) =>
        setExpenses((prev) => [{ ...expense, id: nextId(prev) }, ...prev]),
      removeExpense: (id) =>
        setExpenses((prev) => prev.filter((e) => e.id !== id)),

      invoices,
      addInvoice: (invoice) =>
        setInvoices((prev) => [
          {
            ...invoice,
            id: nextId(prev),
            reference: "GIN-2026-" + String(prev.length + 1).padStart(3, "0"),
          },
          ...prev,
        ]),
      updateInvoice: (id, changes) =>
        setInvoices((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...changes } : i))
        ),
    }),
    [expenses, invoices]
  );

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}
