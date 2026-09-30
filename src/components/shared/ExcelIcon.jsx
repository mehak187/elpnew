/**
 * The mark on the export control.
 *
 * Drawn rather than taken from the icon set: a generic spreadsheet outline
 * says "a table", while this says "the file you will get is one Excel opens",
 * which is the only question anybody asks of that button.
 *
 * Two halves, as the application's own mark has them - the X on the left and
 * a few cells of sheet on the right. Nothing finer than that: at the size a
 * toolbar gives an icon, detail that cannot be resolved reads as blur rather
 * than as detail.
 */
export default function ExcelIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="2.5" fill="#1D6F42" />

      {/* The X, in the white the application uses. */}
      <path
        d="m5.6 8 4 8m0-8-4 8"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
      />

      {/* Four cells of sheet: enough to read as one, few enough to stay open
          at 20px. */}
      <rect x="12" y="7" width="7.5" height="10" rx="0.75" fill="#FFFFFF" />
      <path
        d="M15.75 7v10M12 12h7.5"
        stroke="#1D6F42"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
