import { useMemo, useState } from "react";
import { ViolationsContext } from "./context";
import {
  initialViolations,
  nextViolationNo,
} from "@/pages/employees/violationData";

/**
 * Every violation on record, in one place - so one recorded on an employee's
 * page is still there after the page moves to another section, and each stage
 * of it picks up where the last one left off.
 */
export default function ViolationsProvider({ children }) {
  const [violations, setViolations] = useState(initialViolations);

  // Editing the seed data while the app is open hot-reloads this provider
  // with its old state kept. Start again from the new seed whenever it changes.
  const [seed, setSeed] = useState(initialViolations);
  if (seed !== initialViolations) {
    setSeed(initialViolations);
    setViolations(initialViolations);
  }

  const value = useMemo(
    () => ({
      violations,

      /** The id the next violation will take, so the page can keep it open. */
      nextId: violations.reduce((max, v) => Math.max(max, v.id), 0) + 1,

      addViolation: (record) =>
        setViolations((prev) => [
          ...prev,
          { ...record, id: prev.reduce((max, v) => Math.max(max, v.id), 0) + 1 },
        ]),

      /**
       * One stage's part of a record. `number` gives the violation its
       * register number, which happens once, when the penalty is approved.
       */
      updateViolation: (id, patch, { number = false } = {}) =>
        setViolations((prev) =>
          prev.map((v) =>
            v.id !== id
              ? v
              : {
                  ...v,
                  ...patch,
                  ...(number && !v.violationNo
                    ? { violationNo: nextViolationNo(prev) }
                    : {}),
                }
          )
        ),
    }),
    [violations]
  );

  return (
    <ViolationsContext.Provider value={value}>
      {children}
    </ViolationsContext.Provider>
  );
}
