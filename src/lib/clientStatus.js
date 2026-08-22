// Client status model, per the client's Phase 1 specification.

export const CLIENT_STATUSES = ["Active", "Inactive", "Merged"];

/**
 * The statuses an admin may set by hand.
 *
 * Merged is deliberately absent: it is only ever the outcome of a merge, run
 * from the Merge Clients screen, so it is never something to pick from a list.
 */
export const MANUAL_CLIENT_STATUSES = CLIENT_STATUSES.filter(
  (status) => status !== "Merged"
);

export const CLIENT_STATUS_VARIANT = {
  Active: "success",
  Inactive: "secondary",
  Merged: "outline",
};

/**
 * Status is derived from case activity alone - never from finances. A client
 * whose cases are all closed but who still owes on an invoice stays Inactive.
 *
 *   Merged   - merged into another client. The record stays readable so the
 *              cases it brought in before the merger remain visible.
 *   Active   - at least one open case. Applied the moment a case is opened,
 *              which covers both first activation and later reactivation.
 *   Inactive - no open cases. Applied the moment the last one closes, with no
 *              waiting period.
 *
 * `statusOverride` lets an admin pin a status by hand; a merge still wins over
 * it, since the merge is a structural fact rather than a judgement call.
 */
export function deriveClientStatus(client) {
  if (client.mergedIntoClientNo) return "Merged";
  if (client.statusOverride) return client.statusOverride;
  return client.activeCases > 0 ? "Active" : "Inactive";
}
