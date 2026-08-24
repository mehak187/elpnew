// Amounts are written with the sign after the figure, the way the accounting
// systems here show them.

import { Rial } from "@/components/shared/Rial";

/** An already-formatted figure with the Rial sign after it. */
export function withRial(text) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {text}
      <Rial />
    </span>
  );
}
