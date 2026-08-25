/**
 * Suppliers the firm buys from.
 *
 * The Expense Requests page used to hold its own list of supplier names. This
 * is the record behind those names, so a supplier added here is immediately
 * selectable on an invoice, and its tax numbers travel with it.
 */

import { COUNTRY_DIAL_CODES, DEFAULT_DIAL_CODE } from "@/lib/constants";

export const SUPPLIER_CATEGORIES = [
  "Office Supplies",
  "Utilities",
  "Telecommunications",
  "Professional Services",
  "Marketing",
  "Maintenance",
  "IT & Software",
  "Government",
  "Banking",
  "Other",
];

export const SUPPLIER_STATUSES = ["Active", "Inactive"];

/* ------------------------------------------------------------ new supplier */

// The draft a supplier form starts from. The dial code is held apart from the
// number while editing and folded back in on save.
export const emptySupplier = {
  name: "",
  category: "",
  commercialRegistration: "",
  taxIdentificationNumber: "",
  vatNumber: "",
  bank: "",
  accountNumber: "",
  dialCode: DEFAULT_DIAL_CODE,
  phone: "",
  status: "Active",
};

/** A supplier needs at least a name and a category before it can be saved. */
export const canSaveSupplier = (draft) =>
  Boolean(draft.name.trim() && draft.category);

/** Folds the dial code back onto the phone number the record stores. */
export function toSupplierRecord(draft) {
  const { dialCode, phone, ...rest } = draft;
  return { ...rest, phone: phone ? dialCode + " " + phone : "" };
}

const s = (id, name, category, cr, tin, vat, bank, account, phone, status) => ({
  id,
  supplierId: "SUP-" + String(id).padStart(3, "0"),
  name,
  category,
  commercialRegistration: cr,
  taxIdentificationNumber: tin,
  vatNumber: vat,
  // Where the firm pays this supplier. The finance manager needs these at the
  // moment of payment, so they live on the supplier rather than being retyped
  // on every invoice.
  bank,
  accountNumber: account,
  phone,
  status,
});

export const initialSuppliers = [
  s(1, "Al Maha Properties", "Utilities", "1102233", "TIN-8841200", "OM1102233", "Bank Muscat", "OM20 10000000", "+968 2456 1100", "Active"),
  s(2, "Oman Electricity Distribution", "Utilities", "1004455", "TIN-8841311", "OM1004455", "National Bank of Oman", "OM21 10987654", "+968 2440 2200", "Active"),
  s(3, "Omantel", "Telecommunications", "1006677", "TIN-8841422", "OM1006677", "Bank Dhofar", "OM22 11975308", "+968 2424 3300", "Active"),
  s(4, "Ooredoo", "Telecommunications", "1008899", "TIN-8841533", "OM1008899", "Oman Arab Bank", "OM23 12962962", "+968 2433 4400", "Active"),
  s(5, "Muscat Stationery Est.", "Office Supplies", "1201122", "TIN-8841644", "OM1201122", "Sohar International", "OM24 13950616", "+968 2411 5500", "Active"),
  s(6, "Gulf Cleaning Services", "Maintenance", "1303344", "TIN-8841755", "OM1303344", "Ahli Bank", "OM25 14938270", "+968 2422 6600", "Active"),
  s(7, "Bank Muscat", "Banking", "1000011", "TIN-8841866", "OM1000011", "Bank Nizwa", "OM26 15925924", "+968 2479 7700", "Active"),
  s(8, "Tax Authority", "Government", "-", "TIN-0000001", "-", "Bank Muscat", "OM27 16913578", "+968 2447 8800", "Active"),
  s(9, "Al Wathba Insurance", "Professional Services", "1405566", "TIN-8841977", "OM1405566", "National Bank of Oman", "OM28 17901232", "+968 2450 9900", "Active"),
  s(10, "Ministry of Commerce", "Government", "-", "TIN-0000002", "-", "Bank Dhofar", "OM29 18888886", "+968 2481 1000", "Active"),
  s(11, "KPMG Oman", "Professional Services", "1507788", "TIN-8842088", "OM1507788", "Oman Arab Bank", "OM30 19876540", "+968 2474 1100", "Active"),
  s(12, "Blue Ocean Media", "Marketing", "1609900", "TIN-8842199", "OM1609900", "Sohar International", "OM31 20864194", "+968 2465 1200", "Active"),
  s(13, "Nizwa Print House", "Marketing", "1701133", "TIN-8842200", "OM1701133", "Ahli Bank", "OM32 21851848", "+968 2541 1300", "Inactive"),
  s(14, "Falcon IT Solutions", "IT & Software", "1802244", "TIN-8842311", "OM1802244", "Bank Nizwa", "OM33 22839502", "+968 2456 1400", "Active"),
];
