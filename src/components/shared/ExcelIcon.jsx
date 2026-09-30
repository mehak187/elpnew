/**
 * The mark on the export control.
 *
 * Drawn rather than taken from the icon set: a generic spreadsheet outline
 * says "a table", while this says "the file you will get is one Excel opens",
 * which is the only question anybody asks of that button.
 *
 * Built the way the application's own mark is - a pale sheet inside a green
 * edge, the X on a green panel down its start, a few cells beside it. Nothing
 * finer: at the size a toolbar gives an icon, detail that cannot be resolved
 * reads as blur rather than as detail.
 */
export default function ExcelIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* The sheet, and the edge that names it. */}
      <rect
        x="2.6"
        y="2.6"
        width="18.8"
        height="18.8"
        rx="2.4"
        fill="#FFFFFF"
        stroke="#1D6F42"
        strokeWidth="1.6"
      />

      {/* The green panel down the start, carrying the X. */}
      <path
        d="M3.4 5a1.6 1.6 0 0 1 1.6-1.6h5.2v17.2H5A1.6 1.6 0 0 1 3.4 19V5Z"
        fill="#1D6F42"
      />
      <path
        d="m5.7 9 3.2 6m0-6-3.2 6"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      {/* Four cells, enough to read as a sheet. */}
      <path
        d="M12.4 12h8M16.4 7.2v9.6"
        stroke="#1D6F42"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
