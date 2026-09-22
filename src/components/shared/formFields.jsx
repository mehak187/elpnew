import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, Upload as UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The fields a stepped request form is built from.
 *
 * They live here rather than in one of the forms because every request in the
 * system now asks the same way - a request is written, and then decided - and
 * two copies of these would drift apart the first time one was changed.
 *
 * Each one is `flex h-full flex-col justify-end`, so that fields sitting in
 * the same row of a grid line up along the bottom however many lines their
 * labels take. Used on its own, outside a grid, a field wants `space-y-2`
 * instead: stretching to nothing is what leaves a hole under it.
 */

/** A label with its required mark, so the asterisk is coloured everywhere. */
export function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
    </Label>
  );
}

/**
 * A figure or fact the form shows rather than asks for.
 *
 * `held` marks money coming off the pay, and `payable` the one figure the
 * request is really about, so neither has to be hunted for among the rest.
 */
export function Settled({ id, label, value, held, payable, hint }) {
  return (
    <div className="relative flex h-full flex-col justify-end gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value}
        className={cn(
          "cursor-default bg-locked text-muted-foreground",
          held && "font-semibold text-destructive",
          payable && "font-semibold text-green-700"
        )}
      />
      {/* What the figure above means, hung below the box rather than set in
          the column: in the flow it would push this one field's box up out
          of line with the rest of the row. The row it sits in leaves the
          space for it. */}
      {hint && (
        <p className="absolute left-0 top-full mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * One fact of a transfer summary: what it is, then what it says.
 *
 * Not a field: the strip at the foot of a disbursement, read against the
 * transfer above it before that transfer is confirmed.
 */
export function Said({ label, value, settled }) {
  return (
    <div className="px-0 lg:px-4 lg:first:pl-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold",
          settled ? "text-green-700" : "text-primary"
        )}
      >
        {value || "-"}
      </p>
    </div>
  );
}

/** One thing chosen from a list, laid out like every other field. */
export function Choice({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
  disabled,
  required = true,
}) {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * The paperclip beside a field: one icon whether or not a file is on it.
 *
 * The file name lives in the tooltip rather than on the page, so attaching
 * something never pushes the field it belongs to out of its row.
 */
export function Attach({ file, onPick, label }) {
  if (file) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 border-green-600 text-green-600 hover:text-destructive"
        title={file.name + " - click to remove"}
        onClick={() => onPick(null)}
      >
        <FileCheck className="h-4 w-4" />
        <span className="sr-only">{file.name} attached. Remove it.</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0"
      title={"Upload " + label}
      asChild
    >
      <label className="cursor-pointer">
        <UploadIcon className="h-4 w-4" />
        <span className="sr-only">Upload {label}</span>
        <Input
          type="file"
          className="hidden"
          onChange={(e) => e.target.files[0] && onPick(e.target.files[0])}
        />
      </label>
    </Button>
  );
}

/* ------------------------------------------- stepped request forms */

/**
 * A named part of the form.
 *
 * The request is long enough that a run of fields tells nobody which question
 * they are answering, so each part says what it is and carries its own rule
 * down the left - the same mark the page's own heading uses, one step quieter.
 */
export function Group({ title, children }) {
  return (
    <section className="space-y-4">
      <p className="border-l-4 border-primary pl-3 text-base font-bold text-primary">
        {title}
      </p>
      {children}
    </section>
  );
}

/**
 * One row of fields.
 *
 * Three to a row on a wide screen, which is how the form was drawn, falling to
 * two and then one as there stops being room for them.
 */
export function Row({ cols = 3, children }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6",
        cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}

/**
 * A field: its label, its control, and whatever rule governs it underneath.
 *
 * All three are stacked from the top, so every control in a row sits at the
 * same height whether or not the field beside it has a note to carry. Hanging
 * them from the bottom instead would drop any field without a note lower than
 * its neighbours - which is the one thing a row of figures must not do, since
 * it reads as though they belong to different rows.
 *
 * The note is part of the field rather than a thing written after it: one
 * written outside belongs to no cell, and grows over whatever comes next.
 */
export function Field({ id, label, required, note, children }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {children}
      {note && <Note className="-mt-1">{note}</Note>}
    </div>
  );
}

/** A figure or a fact the form reads back rather than asks for. */
export function Locked({ id, label, value, highlight, note }) {
  return (
    <Field id={id} label={label} note={note}>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value}
        className={cn(
          "cursor-default bg-locked text-muted-foreground",
          highlight && "border-green-600/40 font-semibold text-green-700"
        )}
      />
    </Field>
  );
}

/** The rule a field is governed by, written under it rather than assumed. */
export function Note({ className, children }) {
  return (
    <p className={cn("text-xs leading-snug text-muted-foreground", className)}>
      {children}
    </p>
  );
}

/**
 * A comment with a limit, and the limit in sight.
 *
 * The count is shown rather than the typing simply stopping: a box that
 * refuses a keystroke without saying why reads as broken.
 */
export function Counted({ id, value, onChange, limit, rows, placeholder, grow }) {
  // A record written before this field existed has nothing under that name,
  // and an empty box is what that should read as - not a crash.
  const text = value || "";
  const box = useRef(null);

  /**
   * `grow` starts the box the height of an ordinary field and lets it get
   * taller as it fills.
   *
   * For a comment standing beside other fields rather than alone: a box three
   * rows deep from the start drags its whole row down to make space for
   * writing nobody has done yet. Measured after layout and before paint, so
   * the box never appears at one height and then jumps to another.
   */
  useLayoutEffect(() => {
    if (!grow || !box.current) return;
    box.current.style.height = "auto";
    box.current.style.height = box.current.scrollHeight + "px";
  }, [text, grow]);

  return (
    <div className="space-y-1">
      <Textarea
        ref={box}
        id={id}
        rows={grow ? 1 : rows}
        maxLength={limit}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // The handle would fight the growing, and a scrollbar would hide the
        // very thing the growing exists to show.
        className={grow ? "min-h-9 resize-none overflow-hidden" : undefined}
      />
      <p className="text-right text-xs text-muted-foreground">
        {text.length} / {limit}
      </p>
    </div>
  );
}

/**
 * One of the three answers the office can give, as a row that can be picked.
 *
 * Built from a button rather than a native radio so the whole row is the
 * target: the answer to a request for money is not a thing to have to aim at.
 */
export function Decision({ value, chosen, onChoose, tone }) {
  const picked = chosen === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={picked}
      onClick={() => onChoose(value)}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition",
        picked
          ? tone === "bad"
            ? "border-destructive bg-destructive/5 font-medium text-destructive"
            : "border-green-600 bg-green-50 font-medium text-green-800"
          : "hover:bg-muted/50"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          picked
            ? tone === "bad"
              ? "border-destructive"
              : "border-green-600"
            : "border-muted-foreground/50"
        )}
      >
        {picked && (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              tone === "bad" ? "bg-destructive" : "bg-green-600"
            )}
          />
        )}
      </span>
      {value}
    </button>
  );
}
