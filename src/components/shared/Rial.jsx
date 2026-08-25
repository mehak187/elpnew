import { cn } from "@/lib/utils";

const MASK = {
  maskImage: "url(/images/rial.png)",
  WebkitMaskImage: "url(/images/rial.png)",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

/**
 * The Rial sign, drawn rather than typed.
 *
 * The sign has a Unicode codepoint (U+20C0) but almost no text font carries the
 * glyph, so typing it lands on a blank box, and the older U+FDFC codepoint is a
 * ligature that fonts draw as the whole word "ريال".
 *
 * The artwork is the same file the practice's other systems use. It is applied
 * as a mask rather than shown as an image so the mark takes the colour of the
 * text it sits in - amounts are printed in red, green and grey around the
 * application, and a flat black mark beside them reads as a mistake. It is
 * sized in `em` for the same reason, so it follows the figure it belongs to.
 */
export function Rial({ className }) {
  return (
    <span
      role="img"
      aria-label="Rial"
      style={MASK}
      className={cn(
        "inline-block h-[0.6em] w-[1.2em] shrink-0 translate-y-[0.06em] bg-current",
        className
      )}
    />
  );
}
