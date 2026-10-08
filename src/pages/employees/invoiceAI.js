/**
 * Invoice analysis for requests that are made on an invoice - medical,
 * travel, air ticket and transport allowances.
 *
 * The employee uploads the invoice first; the analysis reads it before the
 * request exists: invoice number, supplier (with its VAT number), what it was
 * for, the amount and the VAT. It then checks the invoice against what is
 * already on record - the same invoice number claimed before, the same
 * medication claimed before, a supplier the firm does not know yet - and
 * marks the invoice safe (green) or suspicious (red) for management.
 *
 * DEMO: there is no AI service yet. The reading is chosen from a few sample
 * invoices by the file's name, so the same file always reads the same way,
 * and every check below runs for real against the records. When the AI
 * service is connected, `readInvoice` is the one function to replace; the
 * checks and the screens stay as they are.
 */

/** Requests that are made on an invoice, and so start with its analysis. */
export const INVOICE_KINDS = ["medical", "travel", "airTicket", "transport"];

export const needsInvoice = (kind) => INVOICE_KINDS.includes(kind);

/** Oman's standard VAT rate. Medicines and medical care are zero-rated. */
export const VAT_RATE = 0.05;

const r3 = (n) => Number(Number(n || 0).toFixed(3));

/**
 * Sample invoices the demo reads uploads as, one list per kind. Each is what
 * the AI would return: the supplier as printed (name, VAT and CR numbers,
 * phone), the invoice's own number and date, what it was for and its lines.
 */
const SAMPLES = {
  medical: [
    {
      supplier: { name: "Muscat Pharmacy LLC", vatNumber: "OM1100458812", commercialRegistration: "1458812", phone: "+968 2412 5566", category: "Medical" },
      invoiceNo: "MP-2026-08841",
      invoiceDate: "2026-10-02",
      purpose: "Prescription medication",
      vatRate: 0,
      items: [
        { name: "Augmentin 625mg (14 tablets)", quantity: 1, amount: 7.4 },
        { name: "Panadol Extra (24 tablets)", quantity: 2, amount: 2.4 },
      ],
    },
    {
      supplier: { name: "Starcare Hospital", vatNumber: "OM1100223344", commercialRegistration: "1223344", phone: "+968 2455 7000", category: "Medical" },
      invoiceNo: "SC-INV-31207",
      invoiceDate: "2026-10-04",
      purpose: "Outpatient consultation and blood tests",
      vatRate: 0,
      items: [
        { name: "Specialist consultation", quantity: 1, amount: 35 },
        { name: "Complete blood count (CBC)", quantity: 1, amount: 12 },
        { name: "Vitamin D test", quantity: 1, amount: 18 },
      ],
    },
    {
      supplier: { name: "Al Nahda Hospital", vatNumber: "OM1100778899", commercialRegistration: "1778899", phone: "+968 2483 1255", category: "Medical" },
      invoiceNo: "AN-55902",
      invoiceDate: "2026-09-29",
      purpose: "Dental treatment",
      vatRate: 0,
      items: [
        { name: "Dental filling", quantity: 2, amount: 40 },
        { name: "Dental X-ray", quantity: 1, amount: 10 },
      ],
    },
  ],
  travel: [
    {
      supplier: { name: "Crowne Plaza Salalah", vatNumber: "OM1100665544", commercialRegistration: "1665544", phone: "+968 2323 5333", category: "Other" },
      invoiceNo: "CPS-77120",
      invoiceDate: "2026-09-30",
      purpose: "Hotel stay for the Salalah court hearing",
      vatRate: VAT_RATE,
      items: [
        { name: "Room - 2 nights", quantity: 2, amount: 90 },
        { name: "Meals", quantity: 1, amount: 24 },
      ],
    },
  ],
  airTicket: [
    {
      supplier: { name: "Oman Air", vatNumber: "OM1100100100", commercialRegistration: "1100100", phone: "+968 2453 1111", category: "Other" },
      invoiceNo: "WY-910-2266",
      invoiceDate: "2026-09-26",
      purpose: "Return ticket Muscat - Salalah",
      vatRate: 0,
      items: [{ name: "Economy return ticket MCT-SLL-MCT", quantity: 1, amount: 64 }],
    },
  ],
  transport: [
    {
      supplier: { name: "Shell Oman Marketing", vatNumber: "OM1100300300", commercialRegistration: "1300300", phone: "+968 2457 0100", category: "Other" },
      invoiceNo: "SHL-4418-0921",
      invoiceDate: "2026-10-01",
      purpose: "Fuel for court and client visits",
      vatRate: VAT_RATE,
      items: [{ name: "Fuel - M91", quantity: 1, amount: 22 }],
    },
  ],
};

/** A small, stable number from a file's name, to pick the same sample each time. */
const hashOf = (text) =>
  [...String(text)].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 100003, 7);

/** The invoice's figures, worked out from its lines. */
function totalsOf(sample) {
  const subtotal = r3(sample.items.reduce((sum, item) => sum + item.amount * item.quantity, 0));
  const vat = r3(subtotal * sample.vatRate);
  return { subtotal, vat, total: r3(subtotal + vat) };
}

/**
 * What the AI reads off an uploaded invoice (DEMO).
 *
 * A file named with "dup", "duplicate" or "repeat" is read as a copy of the
 * employee's last invoice of this kind, so the duplicate and repeated-item
 * alerts can be seen.
 */
export function readInvoice(file, kind, previous = []) {
  const pool = SAMPLES[kind] || SAMPLES.medical;
  const name = file?.name || "";
  const lastClaim = previous.find((row) => row.invoice);
  let sample = pool[hashOf(name + (file?.size || 0)) % pool.length];
  if (/dup|duplicate|repeat/i.test(name) && lastClaim) {
    const old = lastClaim.invoice;
    sample = {
      supplier: { name: old.supplierName, vatNumber: old.supplierVat, commercialRegistration: old.supplierCr || "", phone: old.supplierPhone || "", category: "Medical" },
      invoiceNo: old.invoiceNo,
      invoiceDate: old.invoiceDate,
      purpose: old.purpose,
      vatRate: old.subtotal ? old.vat / old.subtotal : 0,
      items: old.items,
    };
  }
  const totals = totalsOf(sample);
  return {
    invoiceNo: sample.invoiceNo,
    invoiceDate: sample.invoiceDate,
    supplierName: sample.supplier.name,
    supplierVat: sample.supplier.vatNumber,
    supplierCr: sample.supplier.commercialRegistration,
    supplierPhone: sample.supplier.phone,
    supplierCategory: sample.supplier.category,
    purpose: sample.purpose,
    items: sample.items,
    ...totals,
    // How sure the reading is of each field (DEMO figures).
    confidence: { invoiceNo: 98, supplier: 96, amount: 99, vat: 97, purpose: 91, date: 95 },
    fileName: name,
  };
}

/** The words a line is known by, for telling whether it was claimed before. */
const itemKey = (name) =>
  String(name)
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 2)
    .join(" ");

/**
 * The checks run on a read invoice against what is already on record.
 *
 * - The same invoice number claimed before, by anyone: red.
 * - For medical claims, the same medication (or service) this employee has
 *   claimed before: red, naming the earlier request.
 * - VAT that does not add up to the stated rate: red.
 * - An invoice more than 90 days old: red.
 * - A supplier the firm has not registered: noted, and registered on submit -
 *   not a risk in itself.
 */
export function checkInvoice(invoice, { kind, records = [], employeeName, suppliers = [], today = new Date() }) {
  const reasons = [];
  const notes = [];

  const sameNumber = records.find(
    (row) => row.invoice?.invoiceNo && row.invoice.invoiceNo.toLowerCase() === String(invoice.invoiceNo).toLowerCase()
  );
  if (sameNumber) {
    reasons.push(
      "Duplicate invoice number " + invoice.invoiceNo + " - already claimed in " +
        (sameNumber.entitlementNo || sameNumber.requestNo) +
        (sameNumber.employee !== employeeName ? " by " + sameNumber.employee : "") + "."
    );
  }

  const repeated = [];
  if (kind === "medical") {
    const mine = records.filter((row) => row.employee === employeeName && row.kind === "medical" && row.invoice);
    for (const item of invoice.items) {
      const key = itemKey(item.name);
      const before = mine.find((row) => row !== sameNumber && row.invoice.items.some((old) => itemKey(old.name) === key));
      if (before) repeated.push({ item: item.name, requestNo: before.entitlementNo || before.requestNo, date: before.requestDate });
    }
    for (const hit of repeated) {
      reasons.push("Same medication claimed before: " + hit.item + " (in " + hit.requestNo + ").");
    }
  }

  // The total must be the lines plus VAT, and the VAT one of Oman's rates:
  // zero-rated or the standard 5%.
  const rate = invoice.subtotal ? invoice.vat / invoice.subtotal : 0;
  const validRate = Math.abs(rate) < 0.001 || Math.abs(rate - VAT_RATE) < 0.001;
  if (Math.abs(r3(invoice.subtotal + invoice.vat) - invoice.total) > 0.01 || !validRate) {
    reasons.push("VAT and total do not add up to a valid VAT rate.");
  }

  const age = (today - new Date(invoice.invoiceDate + "T00:00")) / 86400000;
  if (age > 90) reasons.push("Invoice is more than 90 days old.");

  const known = suppliers.find(
    (s) => (invoice.supplierVat && s.vatNumber === invoice.supplierVat) || s.name.toLowerCase() === invoice.supplierName.toLowerCase()
  );
  if (!known) notes.push("New supplier - will be registered automatically with its VAT number.");

  return {
    level: reasons.length ? "high" : "low",
    reasons,
    notes,
    repeated,
    duplicateOf: sameNumber ? sameNumber.entitlementNo || sameNumber.requestNo : "",
    supplier: known || null,
  };
}
