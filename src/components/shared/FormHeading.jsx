import BackButton from "./BackButton";

/**
 * The heading of a section or of a form that opened over one.
 *
 * The rule down the left is the mark of a heading and is always there. The
 * way back is not: it belongs only where the form took the whole page, so
 * there is nothing behind it to look at. Where the list is still underneath,
 * an arrow would offer to leave a page nobody left.
 */
export default function FormHeading({ title, note, onBack }) {
  return (
    <div className="flex items-center gap-3">
      {onBack && <BackButton onBack={onBack} />}
      <div className="border-l-4 border-primary pl-3">
        <p className="text-lg font-bold text-primary">{title}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}
