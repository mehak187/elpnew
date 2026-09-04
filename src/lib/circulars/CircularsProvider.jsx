import { useState } from "react";
import { CircularsContext, ACTIVE, COMPLETED, CANCELLED, stamp } from "./context";

/**
 * Circulars already issued.
 *
 * `acknowledgements` is a list rather than a flag because a circular is issued
 * to a group: it is read by many people, and the firm has to be able to say
 * which of them have read it and when.
 *
 * `supersedes` and `supersededBy` link the versions of one instruction. A
 * correction never edits what went out - it issues a new circular and points
 * the two at each other, so the original and everyone who acknowledged it stay
 * exactly as they were.
 */
const initialCirculars = [
  {
    id: 1,
    circularNo: "CIR-2026-001",
    date: "2026-01-12",
    targetGroup: "All Employees",
    content:
      "Office hours over Ramadan will be 09:00 to 14:00. Court attendance is unaffected.",
    issuedBy: "Mohammed Al Yahyaei",
    status: COMPLETED,
    supersedes: null,
    supersededBy: 2,
    acknowledgements: [
      { name: "Mohammed Al Yahyaei", at: "12/01/2026 09:40 AM" },
      { name: "Fatima Al Rashdi", at: "12/01/2026 10:02 AM" },
      { name: "Ahmed Al Balushi", at: "12/01/2026 11:18 AM" },
    ],
  },
  {
    id: 2,
    circularNo: "CIR-2026-004",
    date: "2026-01-20",
    targetGroup: "All Employees",
    content:
      "Office hours over Ramadan will be 09:00 to 15:00. Court attendance is unaffected. This replaces CIR-2026-001.",
    issuedBy: "Mohammed Al Yahyaei",
    status: ACTIVE,
    supersedes: 1,
    supersededBy: null,
    acknowledgements: [
      { name: "Fatima Al Rashdi", at: "20/01/2026 08:55 AM" },
    ],
  },
  {
    id: 3,
    circularNo: "CIR-2026-002",
    date: "2026-02-03",
    targetGroup: "Lawyers",
    content:
      "All pleadings must be filed through the case file, not by direct email to the court registry.",
    issuedBy: "Mohammed Al Yahyaei",
    status: ACTIVE,
    supersedes: null,
    supersededBy: null,
    acknowledgements: [],
  },
  {
    id: 4,
    circularNo: "CIR-2026-003",
    date: "2026-03-18",
    targetGroup: "Administration",
    content:
      "Expense claims raised after the 25th of a month will be settled in the following month's run.",
    issuedBy: "Mohammed Al Yahyaei",
    status: ACTIVE,
    supersedes: null,
    supersededBy: null,
    acknowledgements: [],
  },
];

/** What has happened to the circulars, in the order it happened. */
const initialAudit = [
  { id: 1, at: "12/01/2026 09:30 AM", action: "Issued", circularNo: "CIR-2026-001", by: "Mohammed Al Yahyaei", detail: "All Employees" },
  { id: 2, at: "12/01/2026 09:40 AM", action: "Acknowledged", circularNo: "CIR-2026-001", by: "Mohammed Al Yahyaei", detail: "" },
  { id: 3, at: "12/01/2026 10:02 AM", action: "Acknowledged", circularNo: "CIR-2026-001", by: "Fatima Al Rashdi", detail: "" },
  { id: 4, at: "12/01/2026 11:18 AM", action: "Acknowledged", circularNo: "CIR-2026-001", by: "Ahmed Al Balushi", detail: "" },
  { id: 5, at: "20/01/2026 08:50 AM", action: "New version", circularNo: "CIR-2026-004", by: "Mohammed Al Yahyaei", detail: "Supersedes CIR-2026-001" },
  { id: 6, at: "20/01/2026 08:55 AM", action: "Acknowledged", circularNo: "CIR-2026-004", by: "Fatima Al Rashdi", detail: "" },
  { id: 7, at: "03/02/2026 09:05 AM", action: "Issued", circularNo: "CIR-2026-002", by: "Mohammed Al Yahyaei", detail: "Lawyers" },
  { id: 8, at: "18/03/2026 02:20 PM", action: "Issued", circularNo: "CIR-2026-003", by: "Mohammed Al Yahyaei", detail: "Administration" },
];

/**
 * Holds the firm's circulars, who has acknowledged them, and what has happened
 * to them.
 *
 * Kept above the router so the same list is read by the page that issues
 * circulars, by the employee's own copy, and by the prompt that blocks the
 * application until they are read - one list, so a circular cannot be
 * outstanding in one place and settled in another.
 *
 * Nothing here ever deletes or overwrites: a correction adds a version, a
 * withdrawal changes a status, and every one of those writes a line to the
 * audit trail.
 */
export default function CircularsProvider({ children }) {
  const [circulars, setCirculars] = useState(initialCirculars);
  const [audit, setAudit] = useState(initialAudit);

  const log = (action, circularNo, by, detail = "") =>
    setAudit((prev) => [
      ...prev,
      {
        id: prev.reduce((max, e) => Math.max(max, e.id), 0) + 1,
        at: stamp(),
        action,
        circularNo,
        by,
        detail,
      },
    ]);

  const issueCircular = (circular) => {
    setCirculars((prev) => [
      ...prev,
      {
        ...circular,
        id: prev.reduce((max, c) => Math.max(max, c.id), 0) + 1,
        status: ACTIVE,
        supersedes: null,
        supersededBy: null,
        acknowledgements: [],
      },
    ]);
    log("Issued", circular.circularNo, circular.issuedBy, circular.targetGroup);
  };

  /**
   * Corrects a circular by issuing a new one in its place.
   *
   * The old circular keeps its number, its date and every acknowledgement
   * against it; it is only marked as superseded. Anyone who acknowledged the
   * old version has not acknowledged the new one, so they will be asked again.
   */
  const reviseCircular = (originalId, circular) => {
    setCirculars((prev) => {
      const id = prev.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      return prev
        .map((c) =>
          c.id === originalId
            ? { ...c, status: COMPLETED, supersededBy: id }
            : c
        )
        .concat({
          ...circular,
          id,
          status: ACTIVE,
          supersedes: originalId,
          supersededBy: null,
          acknowledgements: [],
        });
    });

    const original = circulars.find((c) => c.id === originalId);
    log(
      "New version",
      circular.circularNo,
      circular.issuedBy,
      "Supersedes " + (original?.circularNo || "")
    );
  };

  const cancelCircular = (id, by) => {
    const circular = circulars.find((c) => c.id === id);
    setCirculars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: CANCELLED } : c))
    );
    if (circular) log("Cancelled", circular.circularNo, by);
  };

  const acknowledge = (id, name) => {
    const circular = circulars.find((c) => c.id === id);
    if (!circular) return;
    setCirculars((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              acknowledgements: [...c.acknowledgements, { name, at: stamp() }],
            }
          : c
      )
    );
    log("Acknowledged", circular.circularNo, name);
  };

  return (
    <CircularsContext
      value={{
        circulars,
        audit,
        issueCircular,
        reviseCircular,
        cancelCircular,
        acknowledge,
      }}
    >
      {children}
    </CircularsContext>
  );
}
