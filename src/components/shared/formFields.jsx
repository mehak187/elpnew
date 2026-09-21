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
export function Settled({ id, label, value, held, payable }) {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
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
