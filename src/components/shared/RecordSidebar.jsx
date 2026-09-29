import { useState } from "react";
import { Link } from "react-router-dom";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The navigation for one record.
 *
 * It belongs to the record open in front of it and to nothing else: the name
 * at the top is that record's, and every link below leads to a side of the
 * same file. The groups, their labels, their links and whatever counts they
 * carry are handed in by the record's own model, so employees, clients and
 * cases share this one component rather than growing three of it.
 *
 * Groups somebody opened stay open for the rest of the session - moving
 * between two sides of a file should not mean opening the same group twice -
 * and the group holding whatever is on screen opens itself.
 */

/** What is open, remembered for as long as the tab is. */
function remembered(id, fallback) {
  try {
    const held = sessionStorage.getItem("sadeed.sidebar." + id);
    return held ? JSON.parse(held) : fallback;
  } catch {
    return fallback;
  }
}

function remember(id, value) {
  try {
    sessionStorage.setItem("sadeed.sidebar." + id, JSON.stringify(value));
  } catch {
    /* A tab that will not store this still has to navigate. */
  }
}

/** One link under a group: the name, and a count where the model gives one. */
function Child({ item, active, reachable, onSelect }) {
  return (
    <button
      type="button"
      // A closed group is out of the tab order, not merely out of sight.
      tabIndex={reachable ? 0 : -1}
      onClick={() => onSelect(item.key)}
      aria-current={active ? "page" : undefined}
      className={cn(
        // 16px past the parent's text, and the marker rides the logical start
        // so it changes sides with the language rather than staying left.
        "flex w-full items-center justify-between gap-2 rounded-[6px] border-s-[3px] py-2 pe-2.5 ps-4 text-start text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-s-primary bg-menu-selected font-semibold text-primary"
          : "border-s-transparent text-primary hover:bg-menu-hover"
      )}
    >
      <span className="truncate">{item.label}</span>
      {item.count !== undefined && (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {item.count}
        </span>
      )}
    </button>
  );
}

export default function RecordSidebar({
  id = "record",
  backTo,
  backLabel = "Back",
  title,
  subtitle,
  groups = [],
  active,
  onSelect,
  className,
}) {
  const groupHolding = (key) =>
    groups.find((group) => group.items.some((item) => item.key === key));

  const [collapsed, setCollapsed] = useState(false);
  // Opens on whatever was already showing, so the first thing anybody sees is
  // where they are - and falls back to the first group for a fresh record.
  const [open, setOpen] = useState(() =>
    remembered(id, [groupHolding(active)?.key || groups[0]?.key].filter(Boolean))
  );

  const isOpen = (key) => open.includes(key);

  const change = (next) => {
    setOpen(next);
    remember(id, next);
  };

  const toggle = (key) =>
    change(
      open.includes(key) ? open.filter((held) => held !== key) : [...open, key]
    );

  /**
   * Going to a section opens the group that holds it, and leaves every other
   * group as the person left it.
   *
   * The opening happens here, on the way to the section, rather than as a rule
   * that a group holding the open section is always open: that rule reads the
   * same from outside but makes the group impossible to close, because every
   * attempt is undone by the section still being the one on screen.
   */
  const select = (key) => {
    const group = groupHolding(key);
    if (group && !open.includes(group.key)) change([...open, group.key]);
    onSelect?.(key);
  };

  return (
    <nav
      aria-label={title ? title + " sections" : "Record sections"}
      className={cn(
        "w-full shrink-0 self-start rounded-container border border-container-border bg-card",
        "lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto",
        collapsed ? "lg:w-16" : "lg:w-[312px]",
        className
      )}
    >
      <div className={cn("p-4", collapsed && "lg:px-2")}>
        {backTo && !collapsed && (
          <Link
            to={backTo}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {backLabel}
          </Link>
        )}

        <div className="flex items-start justify-between gap-2">
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-primary">{title}</p>
              {subtitle && (
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((was) => !was)}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="hidden size-8 shrink-0 items-center justify-center rounded-md border border-container-border text-primary transition-colors hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:flex"
          >
            {collapsed ? (
              <ChevronRight className="size-4 rtl:rotate-180" />
            ) : (
              <ChevronLeft className="size-4 rtl:rotate-180" />
            )}
            <span className="sr-only">
              {collapsed ? "Expand navigation" : "Collapse navigation"}
            </span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "space-y-1 border-t border-container-border p-2",
          collapsed && "lg:px-1"
        )}
      >
        {groups.map((group) => {
          const Icon = group.icon;
          const expanded = isOpen(group.key);
          const holds = group.items.some((item) => item.key === active);

          // Narrowed to icons, a group's children are read in a popover rather
          // than lost: an icon alone says nothing about what sits under it.
          if (collapsed) {
            return (
              <PopoverPrimitive.Root key={group.key}>
                <PopoverPrimitive.Trigger asChild>
                  <button
                    type="button"
                    title={group.label}
                    className={cn(
                      "hidden size-12 items-center justify-center rounded-md transition-colors lg:flex",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      holds
                        ? "bg-menu-selected text-primary"
                        : "text-primary hover:bg-menu-hover"
                    )}
                  >
                    {Icon && <Icon strokeWidth={1.5} className="size-5" />}
                    <span className="sr-only">{group.label}</span>
                  </button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="z-50 w-56 rounded-container border border-container-border bg-card p-2 shadow-md"
                  >
                    <p className="px-2.5 pb-1.5 text-sm font-bold text-primary">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <Child
                        key={item.key}
                        item={item}
                        active={active === item.key}
                        reachable
                        onSelect={select}
                      />
                    ))}
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>
            );
          }

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={expanded}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-sm font-bold text-primary transition-colors",
                  "hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                {Icon && <Icon strokeWidth={1.5} className="size-[18px] shrink-0" />}
                <span className="flex-1 truncate">{group.label}</span>
                <ChevronDown
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={cn(
                    "size-3 shrink-0 transition-transform duration-[160ms] ease-out motion-reduce:transition-none",
                    expanded && "rotate-180"
                  )}
                />
              </button>

              {/* Hidden rather than merely unpainted: a link nobody can see is
                  a link nobody should reach with the Tab key either. */}
              <div hidden={!expanded} className="ms-[18px] space-y-0.5 py-1">
                {group.items.map((item) => (
                  <Child
                    key={item.key}
                    item={item}
                    active={active === item.key}
                    reachable={expanded}
                    onSelect={select}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
