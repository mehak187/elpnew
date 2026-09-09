/**
 * A titled panel inside a form.
 *
 * The title sits in a bar of its own rather than floating above the fields, so
 * a long form reads as a few named parts instead of one run of inputs.
 */
export default function Panel({ title, children }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <p className="border-b bg-secondary/60 px-4 py-3 text-base font-bold text-primary">
        {title}
      </p>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
