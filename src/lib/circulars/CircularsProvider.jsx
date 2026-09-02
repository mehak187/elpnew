import { useState } from "react";
import { CircularsContext } from "./context";

/**
 * Circulars already issued.
 *
 * `acknowledgements` is a list rather than a flag because a circular is issued
 * to a group: it is read by many people, and the firm has to be able to say
 * which of them have read it and when.
 */
const initialCirculars = [
  {
    id: 1,
    circularNo: "CIR-2026-001",
    date: "2026-01-12",
    targetGroup: "All Employees",
    content:
      "Office hours over Ramadan will be 09:00 to 14:00. Court attendance is unaffected.",
    acknowledgements: [
      { name: "Mohammed Al Yahyaei", at: "2026-01-12 09:40 AM" },
    ],
  },
  {
    id: 2,
    circularNo: "CIR-2026-002",
    date: "2026-02-03",
    targetGroup: "Lawyers",
    content:
      "All pleadings must be filed through the case file, not by direct email to the court registry.",
    acknowledgements: [],
  },
  {
    id: 3,
    circularNo: "CIR-2026-003",
    date: "2026-03-18",
    targetGroup: "Administration",
    content:
      "Expense claims raised after the 25th of a month will be settled in the following month's run.",
    acknowledgements: [],
  },
];

/**
 * Holds the firm's circulars and who has acknowledged them.
 *
 * Kept above the router so the same list is read by the Company Profile page
 * that issues circulars and by the prompt that blocks the application until
 * they are read - one list, so a circular cannot be outstanding in one place
 * and settled in the other.
 */
export default function CircularsProvider({ children }) {
  const [circulars, setCirculars] = useState(initialCirculars);

  const addCircular = (circular) =>
    setCirculars((prev) => [
      ...prev,
      {
        ...circular,
        id: prev.reduce((max, c) => Math.max(max, c.id), 0) + 1,
        acknowledgements: [],
      },
    ]);

  const acknowledge = (id, name) =>
    setCirculars((prev) =>
      prev.map((circular) =>
        circular.id === id
          ? {
              ...circular,
              acknowledgements: [
                ...circular.acknowledgements,
                { name, at: stamp() },
              ],
            }
          : circular
      )
    );

  return (
    <CircularsContext value={{ circulars, addCircular, acknowledge }}>
      {children}
    </CircularsContext>
  );
}

/** "02/09/2026 03:15 PM" - the moment an acknowledgement was given. */
function stamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const hour = now.getHours();
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return (
    pad(now.getDate()) +
    "/" +
    pad(now.getMonth() + 1) +
    "/" +
    now.getFullYear() +
    " " +
    pad(shown) +
    ":" +
    pad(now.getMinutes()) +
    (hour < 12 ? " AM" : " PM")
  );
}
