import { useMemo, useState } from "react";
import { AdvancesContext } from "./context";
import { initialAdvances } from "@/pages/employees/advanceSalaryData";

/**
 * Every salary advance that has been asked for, in one place - so a request
 * made on My Profile is still there after the page moves to another section.
 */
export default function AdvancesProvider({ children }) {
  const [advances, setAdvances] = useState(initialAdvances);

  // Editing the seed data while the app is open hot-reloads this provider
  // with its old state kept. Start again from the new seed whenever it changes.
  const [seed, setSeed] = useState(initialAdvances);
  if (seed !== initialAdvances) {
    setSeed(initialAdvances);
    setAdvances(initialAdvances);
  }

  const value = useMemo(
    () => ({
      advances,

      /** A request is only ever asked for; the office decides it later. */
      addAdvance: (request) =>
        setAdvances((prev) => [
          ...prev,
          {
            ...request,
            id: prev.reduce((max, advance) => Math.max(max, advance.id), 0) + 1,
            status: "Pending",
          },
        ]),

      /** What the office decided, written onto the request it answers. */
      decideAdvance: (id, decision) =>
        setAdvances((prev) =>
          prev.map((advance) =>
            advance.id === id ? { ...advance, ...decision } : advance
          )
        ),
    }),
    [advances]
  );

  return (
    <AdvancesContext.Provider value={value}>{children}</AdvancesContext.Provider>
  );
}
