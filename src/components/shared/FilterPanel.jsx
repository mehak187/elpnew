import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown, Info, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * The filters that narrow a table, gathered behind one control.
 *
 * Nothing chosen in here touches the table until Apply is pressed. A filter
 * that took effect the moment it was clicked would re-sort the list under the
 * hand of somebody still deciding, and a list that moves while it is being
 * set up is a list nobody trusts. Clear empties every choice at once.
 *
 * Search is not one of these. It stays in its own field beside this button,
 * because it answers a different question - which record, rather than which
 * kind of record.
 */

/** One choice in a row of them, drawn as a radio rather than named as one. */
function Choice({ name, value, checked, onSelect, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onSelect(value)}
          className="peer absolute inset-0 cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className={cn(
            "size-4 rounded-full border transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            checked ? "border-[5px] border-primary" : "border-field-border"
          )}
        />
      </span>
      {children}
    </label>
  );
}

export default function FilterPanel({
  fields = [],
  value = {},
  onChange,
  label = "Filters",
  className,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const set = (key, next) => setDraft((prev) => ({ ...prev, [key]: next }));
  const applied = Object.values(value).filter(
    (v) => v && v !== "all"
  ).length;

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        // Reopening shows what is actually in force, not what was abandoned
        // last time the panel was closed without applying.
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="cancel"
          className={cn("group h-[42px] gap-2", applied > 0 && "border-primary", className)}
        >
          <SlidersHorizontal strokeWidth={1.5} />
          {label}
          {applied > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {applied}
            </span>
          )}
          <ChevronDown
            strokeWidth={1.5}
            aria-hidden="true"
            className="size-3 transition-transform duration-[160ms] ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn(
            "z-50 w-[280px] rounded-container border border-container-border bg-card p-4 shadow-md",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1",
            "duration-[160ms] ease-out motion-reduce:animate-none"
          )}
        >
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <p className="text-[13px] font-semibold text-primary">{field.label}</p>

                {field.type === "select" ? (
                  <Select
                    value={draft[field.key] || "all"}
                    onValueChange={(next) => set(field.key, next)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{field.allLabel || "All"}</SelectItem>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {field.options.map((option) => (
                      <Choice
                        key={option.value}
                        name={field.key}
                        value={option.value}
                        checked={(draft[field.key] || "all") === option.value}
                        onSelect={(next) => set(field.key, next)}
                      >
                        {option.label}
                      </Choice>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Said once, here, rather than learned by watching nothing happen. */}
          <p className="mt-4 flex items-start gap-2 rounded-md bg-menu-hover p-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Choices take effect after Apply; Clear resets them.
          </p>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="cancel"
              onClick={() => {
                setDraft({});
                onChange?.({});
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={() => {
                onChange?.(draft);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
