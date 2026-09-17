import { useMemo, useState } from "react";
import { LeavesContext } from "./context";
import { initialLeaves, nextLeaveNo } from "@/pages/employees/leaveData";

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

      /**
       * A new request, which nobody has decided on yet: it is numbered as it
       * is submitted and waits on the department that has to review it.
       */
      addLeave: (record) =>
        setLeaves((prev) => [
          ...prev,
          {
            ...record,
            id: prev.reduce((max, leave) => Math.max(max, leave.id), 0) + 1,
            leaveNo: nextLeaveNo(prev),
            stage: "department",
            status: "Pending",
            decidedAt: "",
            comments: "",
          },
        ]),

      /** One stage's part of a request: a review, or the decision on it. */
      updateLeave: (id, patch) =>
        setLeaves((prev) =>
          prev.map((leave) => (leave.id === id ? { ...leave, ...patch } : leave))
        ),
    }),
    [leaves]
  );

  return <LeavesContext.Provider value={value}>{children}</LeavesContext.Provider>;
}
