/**
 * How long a document has left.
 *
 * The rule lives here once because several pages ask the same question of the
 * same kind of date - a reference, a power of attorney, an uploaded copy - and
 * they must all answer it the same way. How each page *shows* the answer is its
 * own business; this only decides what the answer is.
 */

/** Papers are chased a month before they lapse, so that is the warning. */
export const EXPIRING_SOON_DAYS = 30;

const DAY = 24 * 60 * 60 * 1000;

/**
 * One of four states.
 *
 * A paper with no expiry date is not a failing - it simply says nothing,
 * because there is nothing to say.
 */
export function expiryState(date) {
  if (!date) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((new Date(date) - today) / DAY);
  if (days < 0) return "expired";
  if (days <= EXPIRING_SOON_DAYS) return "soon";
  return "valid";
}

/** What each state is called on screen. */
export const EXPIRY_LABEL = {
  valid: "Active",
  soon: "Expiring Soon",
  expired: "Expired",
};
