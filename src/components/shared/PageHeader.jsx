import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The head of a page: what it is, what it holds, and what can be added to it.
 *
 * Every list in the system is topped by the same three things in the same
 * places, so they are written once here rather than a dozen times over. The
 * action sits at the logical end of the title's own row - a person looking up
 * from the table finds the page's name and the way to add to it together,
 * instead of hunting for the button among the search and filter controls.
 */
export default function PageHeader({
  icon: Icon,
  title,
  note,
  onAdd,
  addLabel = "Add",
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Icon className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary sm:text-2xl">{title}</h1>
          {note && <p className="text-xs text-primary/75 sm:text-sm">{note}</p>}
        </div>
      </div>

      {/* `action` is for a page needing something other than adding, or more
          than one thing; `onAdd` is the ordinary case written short. */}
      {(action || onAdd) && (
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {onAdd && (
            <Button type="button" variant="add" onClick={onAdd}>
              <Plus className="me-2 h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
