// Client status model, per the client's Phase 1 specification.

export const CLIENT_STATUSES = ["Active", "Inactive", "Merged"];

export const CLIENT_STATUS_VARIANT = {
  Active: "success",
  Inactive: "secondary",
  Merged: "default",
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
