import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * How many columns the strip is divided into, by how many cells it holds.
 *
 * Written out rather than built up, because the class names have to be
 * readable in the file for the stylesheet to include them.
 */
const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
  6: "sm:grid-cols-2 lg:grid-cols-6",
};

/**
 * The figures above a table, in one container rather than a row of cards.
 *
 * These are several readings of the same set of records, so they read across
 * as one line: one border around the lot, thin rules between them, and no gaps.
 * Separate cards said the opposite - that each figure was its own subject.
 *
 * A cell with an `onClick` is also the filter for the table below it, and the
 * selected one is underlined. The count belongs inside the label, because it
 * says how many of these there are rather than being a figure of its own.
 */
export default function SummaryStrip({ items, className }) {
  const columns = COLUMNS[Math.min(Math.max(items.length, 2), 6)];

  return (
    <Card className={className}>
      <CardContent
        className={cn(
          "grid grid-cols-1 divide-y p-0 sm:divide-x lg:divide-y-0",
          columns
        )}
      >
        {items.map((item) => {
          const Cell = item.onClick ? "button" : "div";

          return (
            <Cell
              key={item.key ?? item.label}
              type={item.onClick ? "button" : undefined}
              onClick={item.onClick}
              className={cn(
                "relative px-4 py-3 text-left",
                item.onClick &&
                  "transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  item.tone || "text-primary"
                )}
              >
                {item.label}
                {item.count !== undefined && " (" + item.count + ")"}
              </p>
              <p className="mt-1 text-lg font-bold">{item.value}</p>
              {item.note && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.note}
                </p>
              )}
              {item.selected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary"
                />
              )}
            </Cell>
          );
        })}
      </CardContent>
    </Card>
  );
}
