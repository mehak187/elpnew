import { useMemo, useState } from "react";
import { BonusesContext } from "./context";
import { initialBonuses } from "@/pages/employees/bonusData";

/**
 * Every bonus the firm has paid, in one place - so one recorded on an
 * employee's page is still there after the page moves to another section.
 */
export default function BonusesProvider({ children }) {
  const [bonuses, setBonuses] = useState(initialBonuses);

  // Editing the seed data while the app is open hot-reloads this provider
  // with its old state kept. Start again from the new seed whenever it changes.
  const [seed, setSeed] = useState(initialBonuses);
  if (seed !== initialBonuses) {
    setSeed(initialBonuses);
    setBonuses(initialBonuses);
  }

  const value = useMemo(
    () => ({
      bonuses,

      addBonus: (record) =>
        setBonuses((prev) => [
          ...prev,
          { ...record, id: prev.reduce((max, bonus) => Math.max(max, bonus.id), 0) + 1 },
        ]),
    }),
    [bonuses]
  );

  return <BonusesContext.Provider value={value}>{children}</BonusesContext.Provider>;
}
