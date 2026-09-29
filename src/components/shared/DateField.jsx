import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A date, written the one way the firm writes dates: DD/MM/YYYY.
 *
 * A native date input is not used for the visible field because it prints
 * whatever order and numerals the reader's browser is set to - a record that
 * says 03/04 means two different days to two people, which is not something a
 * legal file can carry. The typed field is ours and always reads DD/MM/YYYY
 * in Latin digits, in both languages; `lang` and `dir` on the input are what
 * hold the digits and the order still when the page turns to Arabic.
 *
 * The calendar sits inside the field at its trailing edge and opens the
 * browser's own picker, so a date can still be chosen rather than typed.
 */

/** DD/MM/YYYY out of what the picker hands back (YYYY-MM-DD). */
const fromISO = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d && m && y ? d + "/" + m + "/" + y : "";
};

/** YYYY-MM-DD for the picker, out of a complete DD/MM/YYYY. */
const toISO = (text) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text || "");
  return m ? m[3] + "-" + m[2] + "-" + m[1] : "";
};

/** Digits only, with the slashes put in as they are typed. */
const format = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  return parts.filter(Boolean).join("/");
};

export default function DateField({ id, value = "", onChange, className, ...props }) {
  const pickerRef = useRef(null);

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        // Latin digits and day-month-year order, whichever way the page runs.
        lang="en"
        dir="ltr"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/YYYY"
        maxLength={10}
        value={value}
        onChange={(e) => onChange?.(format(e.target.value))}
        className="pe-10"
        {...props}
      />
      {/* Inside the border, at the end of the field, whichever end that is. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => pickerRef.current?.showPicker?.()}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-menu-icon transition-colors hover:text-primary"
      >
        <CalendarDays strokeWidth={1.5} className="size-[18px]" />
      </button>
      {/* Never seen; it exists so the browser's own picker can be opened. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-0 w-0 opacity-0"
        value={toISO(value)}
        onChange={(e) => onChange?.(fromISO(e.target.value))}
      />
    </div>
  );
}
