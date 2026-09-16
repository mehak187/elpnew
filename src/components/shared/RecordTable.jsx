import { cn } from "@/lib/utils";

/**
 * The one table every list of records is drawn with.
 *
 * The salary history settled what such a table looks like - bordered cells, a
 * tinted single-line header, sub-headings folded into the heading in brackets -
 * and every other list in the system follows it rather than inventing its own.
 * Anything a particular table needs on top of that is passed as a class; the
 * frame itself is not re-described in each file.
 *
 * Text reads from the left and money from the right, the way a ledger is read:
 * that is what `text-right` on an amount column is for, and it is put on the
 * heading and the cells together so the figures line up under their name.
 */
export function RecordTable({ minWidth = 1040, children, className }) {
  return (
    <div className="overflow-x-auto">
      <table
        style={{ minWidth }}
        className={cn("w-full border text-left text-sm", className)}
      >
        {children}
      </table>
    </div>
  );
}

/** The header, which is always one row: no column is split over two lines. */
export function HeadRow({ children }) {
  return (
    <thead>
      <tr className="border-b bg-secondary/60 text-primary">{children}</tr>
    </thead>
  );
}

/**
 * One column heading.
 *
 * `note` is what the column is made of, kept on the same line and in brackets
 * rather than stacked underneath as a second header row.
 */
export function Th({ width, note, className, children }) {
  return (
    <th
      style={width ? { width } : undefined}
      className={cn("border-r p-3 font-semibold last:border-r-0", className)}
    >
      {children}
      {note && (
        <>
          {" "}
          <span className="font-normal text-muted-foreground">({note})</span>
        </>
      )}
    </th>
  );
}

/** One record. Cells are top-aligned, since some of them run to several lines. */
export function Row({ className, children }) {
  return (
    <tr
      className={cn(
        "border-b align-top transition-colors last:border-0 hover:bg-primary/5",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({ className, colSpan, children }) {
  return (
    <td className={cn("border-r p-3 last:border-r-0", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}
