import { cn } from "@/lib/utils";

/**
 * The tabs of a section, sitting in the corner of its heading.
 *
 * They belong on the heading's line rather than above the content: the heading
 * names the section and the tabs say which side of it is open, which is one
 * statement, not two. It also leaves the heading below free to name the tab
 * itself without the two headings repeating each other.
 */
export default function TabBar({ options, value, onChange }) {
  return (
    <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg border p-1">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === option.key
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-muted/50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
