import * as React from "react";
import { cn } from "@/lib/utils";

// Forwards its ref, the way Input beside it does: a box that grows to fit
// what is typed has to be able to measure itself.
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-16 w-full rounded-field border border-field-border bg-field px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-[var(--focus-navy)] focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-text aria-invalid:border-[var(--error-border)] aria-invalid:focus-visible:shadow-[var(--error-ring)]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
