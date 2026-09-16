import { useMemo, useState } from "react";
import { LeavesContext } from "./context";
import { initialLeaves } from "@/pages/employees/leaveData";

/**
 * Every leave request in the firm, in one place.
 *
 * Held here rather than inside the Leaves section: a request asked for on My
 * Profile is the same request the administration reads on the employee's
 * record, and it has to still be there after the page moves to another
 * section and back.
 */
export default function LeavesProvider({ children }) {
  const [leaves, setLeaves] = useState(initialLeaves);

  // Editing the seed data while the app is open hot-reloads this provider
  // with its old state kept. Start again from the new seed whenever it changes.
  const [seed, setSeed] = useState(initialLeaves);
  if (seed !== initialLeaves) {
    setSeed(initialLeaves);
    setLeaves(initialLeaves);
  }

  const value = useMemo(
    () => ({
      leaves,

      /** A new request, which nobody has decided on yet. */
      addLeave: (record) =>
        setLeaves((prev) => [
          ...prev,
          {
            ...record,
            id: prev.reduce((max, leave) => Math.max(max, leave.id), 0) + 1,
            status: "Pending",
            decidedAt: "",
            comments: "",
          },
        ]),
    }),
    [leaves]
  );

  return <LeavesContext.Provider value={value}>{children}</LeavesContext.Provider>;
}
