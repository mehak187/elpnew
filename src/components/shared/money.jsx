/**
 * The Rial sign, drawn rather than typed.
 *
 * The sign has a Unicode codepoint (U+20C0) but almost no text font carries the
 * glyph, so typing it lands on a blank box, and the older U+FDFC codepoint is a
 * ligature that fonts draw as the whole word "ريال". Drawing it settles both:
 * the mark is identical everywhere, whatever font the page is set in.
 *
 * It inherits font size and colour, so it sits with the figure it belongs to
 * without any per-use styling.
 */
export function Rial({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className || "inline-block h-[0.85em] w-[0.85em] shrink-0"}
    >
      {/* the two hooks */}
      <path d="M6.5 4.5v6.2c0 2.1 1.5 3.4 3.6 3.4" />
      <path d="M14 4.5v6.2c0 2.1 1.5 3.4 3.6 3.4" />
      {/* the two bars beneath them */}
      <path d="M3.5 17.7h17" />
      <path d="M3.5 21h17" />
    </svg>
  );
}

/** An already-formatted figure with the Rial sign after it. */
export function withRial(text) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {text}
      <Rial />
    </span>
  );
}
