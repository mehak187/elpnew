import { expiryState, EXPIRY_LABEL, daysUntil, addDays } from "@/lib/expiry";
/**
 * The people the firm employs.
 *
 * One record each, read by the list and by the form behind it, so a change to
 * the shape is made once.
 */

import {
  OMANI_DOCUMENT_TYPES,
  NON_OMANI_DOCUMENT_TYPES,
  LAWYER_DOCUMENT_TYPE,
  COMMON_DOCUMENT_TYPES,
  CRITICAL_DOCUMENT_TYPES,
} from "@/lib/constants";

export const employeeRecords = [
  { id: 1, empNo: "EMP-0001", bankName: "Bank Muscat", accountNumber: "0312 0123 4567 0890", name: "Mohammed Al Yahyaei", nameAr: "محمد اليحيائي", branch: "Muscat", dateOfJoining: "2020-01-15", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "2500.000", housing: 300, transport: 125, special: 75, electricity: 0, water: 0, loan: 0, administrative: 175, status: "Active" , role: "Partner", contractType: "Indefinite-term" },
  { id: 2, empNo: "EMP-0002", bankName: "National Bank of Oman", accountNumber: "0312 0123 4567 0891", name: "Fatima Al Rashdi", nameAr: "فاطمة الراشدي", branch: "Muscat", dateOfJoining: "2021-03-20", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "2000.000", housing: 240, transport: 100, special: 60, electricity: 0, water: 0, loan: 0, administrative: 140, status: "Active" , role: "Lawyer", practiceLevel: "Trainee", contractType: "Indefinite-term" },
  { id: 3, empNo: "EMP-0003", bankName: "Bank Dhofar", accountNumber: "0312 0123 4567 0892", name: "Ahmed Al Balushi", nameAr: "أحمد البلوشي", branch: "Salalah", dateOfJoining: "2022-06-10", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Supervisor", salary: "800.000", housing: 96, transport: 40, special: 24, electricity: 0, water: 0, loan: 0, administrative: 56, status: "On Leave" , role: "Lawyer", practiceLevel: "Primary", contractType: "Fixed-term" },
  { id: 4, empNo: "EMP-0004", bankName: "Oman Arab Bank", accountNumber: "0312 0123 4567 0893", name: "Sarah Al Lawati", nameAr: "سارة اللواتي", branch: "Muscat", dateOfJoining: "2019-09-05", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "650.000", housing: 78, transport: 33, special: 19, electricity: 0, water: 0, loan: 0, administrative: 46, status: "Active" , role: "Administrative", contractType: "Indefinite-term" },
  { id: 5, empNo: "EMP-0005", bankName: "Sohar International", accountNumber: "0312 0123 4567 0894", name: "Rajesh Kumar", nameAr: "راجيش كومار", branch: "Salalah", dateOfJoining: "2023-02-28", gender: "Male", nationality: "Indian", department: "Accountant", designation: "Accountant", salary: "1200.000", housing: 144, transport: 60, special: 36, electricity: 0, water: 0, loan: 0, administrative: 84, status: "Inactive" , role: "Accountant", contractType: "Indefinite-term" },
  { id: 6, empNo: "EMP-0006", bankName: "Bank Muscat", accountNumber: "0312 0123 4567 0895", name: "Khalid Al Hinai", nameAr: "خالد الهنائي", branch: "Muscat", dateOfJoining: "2018-04-12", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "3000.000", housing: 360, transport: 150, special: 90, electricity: 0, water: 0, loan: 0, administrative: 210, status: "Active" , role: "Partner", contractType: "Fixed-term" },
  { id: 7, empNo: "EMP-0007", bankName: "National Bank of Oman", accountNumber: "0312 0123 4567 0896", name: "Aisha Al Kindi", nameAr: "عائشة الكندي", branch: "Muscat", dateOfJoining: "2021-08-01", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1800.000", housing: 216, transport: 90, special: 54, electricity: 0, water: 0, loan: 0, administrative: 126, status: "Active" , role: "Lawyer", practiceLevel: "Appeal", contractType: "Indefinite-term" },
  { id: 8, empNo: "EMP-0008", bankName: "Bank Dhofar", accountNumber: "0312 0123 4567 0897", name: "Salim Al Rawahi", nameAr: "سالم الرواحي", branch: "Salalah", dateOfJoining: "2020-11-15", gender: "Male", nationality: "Omani", department: "Advisor", designation: "Advisor", salary: "2200.000", housing: 264, transport: 110, special: 66, electricity: 0, water: 0, loan: 0, administrative: 154, status: "Active" , role: "Advisor", contractType: "Indefinite-term" },
  { id: 9, empNo: "EMP-0009", bankName: "Oman Arab Bank", accountNumber: "0312 0123 4567 0898", name: "Layla Al Habsi", nameAr: "ليلى الحبسي", branch: "Muscat", dateOfJoining: "2022-02-20", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "600.000", housing: 72, transport: 30, special: 18, electricity: 0, water: 0, loan: 0, administrative: 42, status: "Active" , role: "Administrative", contractType: "Fixed-term" },
  { id: 10, empNo: "EMP-0010", bankName: "Sohar International", accountNumber: "0312 0123 4567 0899", name: "Hamad Al Busaidi", nameAr: "حمد البوسعيدي", branch: "Salalah", dateOfJoining: "2019-07-08", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Supervisor", salary: "1500.000", housing: 180, transport: 75, special: 45, electricity: 0, water: 0, loan: 0, administrative: 105, status: "Active" , role: "Lawyer", practiceLevel: "Supreme", contractType: "Indefinite-term" },
  { id: 11, empNo: "EMP-0011", bankName: "Bank Muscat", accountNumber: "0312 0123 4567 0900", name: "Maryam Al Harthi", nameAr: "مريم الحارثي", branch: "Muscat", dateOfJoining: "2023-01-10", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1600.000", housing: 192, transport: 80, special: 48, electricity: 0, water: 0, loan: 0, administrative: 112, status: "Active" , role: "Lawyer", practiceLevel: "Trainee", contractType: "Indefinite-term" },
  { id: 12, empNo: "EMP-0012", bankName: "National Bank of Oman", accountNumber: "0312 0123 4567 0901", name: "Yousuf Al Wahaibi", nameAr: "يوسف الوهيبي", branch: "Muscat", dateOfJoining: "2017-09-25", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "3500.000", housing: 420, transport: 175, special: 105, electricity: 0, water: 0, loan: 0, administrative: 245, status: "Active" , role: "Partner", contractType: "Fixed-term" },
  { id: 13, empNo: "EMP-0013", bankName: "Bank Dhofar", accountNumber: "0312 0123 4567 0902", name: "Nadia Al Siyabi", nameAr: "نادية السيابي", branch: "Salalah", dateOfJoining: "2021-05-18", gender: "Female", nationality: "Omani", department: "Accountant", designation: "Accountant", salary: "900.000", housing: 108, transport: 45, special: 27, electricity: 0, water: 0, loan: 0, administrative: 63, status: "Active" , role: "Accountant", contractType: "Indefinite-term" },
  { id: 14, empNo: "EMP-0014", bankName: "Oman Arab Bank", accountNumber: "0312 0123 4567 0903", name: "Omar Al Maskari", nameAr: "عمر المسكري", branch: "Muscat", dateOfJoining: "2020-03-30", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1700.000", housing: 204, transport: 85, special: 51, electricity: 0, water: 0, loan: 0, administrative: 119, status: "On Leave" , role: "Lawyer", practiceLevel: "Primary", contractType: "Indefinite-term" },
  { id: 15, empNo: "EMP-0015", bankName: "Sohar International", accountNumber: "0312 0123 4567 0904", name: "Huda Al Jabri", nameAr: "هدى الجابري", branch: "Muscat", dateOfJoining: "2022-09-12", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "550.000", housing: 66, transport: 28, special: 16, electricity: 0, water: 0, loan: 0, administrative: 39, status: "Active" , role: "Administrative", contractType: "Fixed-term" },
  { id: 16, empNo: "EMP-0016", bankName: "Bank Muscat", accountNumber: "0312 0123 4567 0905", name: "Imran Sheikh", nameAr: "عمران شيخ", branch: "Salalah", dateOfJoining: "2021-11-22", gender: "Male", nationality: "Pakistani", department: "Lawyer", designation: "Litigation", salary: "1400.000", housing: 168, transport: 70, special: 42, electricity: 0, water: 0, loan: 0, administrative: 98, status: "Active" , role: "Lawyer", practiceLevel: "Appeal", contractType: "Indefinite-term" },
  { id: 17, empNo: "EMP-0017", bankName: "National Bank of Oman", accountNumber: "0312 0123 4567 0906", name: "Amina Al Farsi", nameAr: "أمينة الفارسي", branch: "Muscat", dateOfJoining: "2019-12-05", gender: "Female", nationality: "Omani", department: "Advisor", designation: "Advisor", salary: "2100.000", housing: 252, transport: 105, special: 63, electricity: 0, water: 0, loan: 0, administrative: 147, status: "Active" , role: "Advisor", contractType: "Indefinite-term" },
  { id: 18, empNo: "EMP-0018", bankName: "Bank Dhofar", accountNumber: "0312 0123 4567 0907", name: "Hassan Al Zadjali", nameAr: "حسن الزدجالي", branch: "Salalah", dateOfJoining: "2020-08-17", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Supervisor", salary: "1450.000", housing: 174, transport: 73, special: 43, electricity: 0, water: 0, loan: 0, administrative: 102, status: "Terminated" , role: "Lawyer", practiceLevel: "Supreme", contractType: "Fixed-term" },
  { id: 19, empNo: "EMP-0019", bankName: "Oman Arab Bank", accountNumber: "0312 0123 4567 0908", name: "Zainab Al Hosni", nameAr: "زينب الحوسني", branch: "Muscat", dateOfJoining: "2023-04-03", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1550.000", housing: 186, transport: 78, special: 46, electricity: 0, water: 0, loan: 0, administrative: 109, status: "Active" , role: "Lawyer", practiceLevel: "Trainee", contractType: "Indefinite-term" },
  { id: 20, empNo: "EMP-0020", bankName: "Sohar International", accountNumber: "0312 0123 4567 0909", name: "Abdul Rahman", nameAr: "عبد الرحمن", branch: "Muscat", dateOfJoining: "2018-06-14", gender: "Male", nationality: "Egyptian", department: "Accountant", designation: "Accountant", salary: "1100.000", housing: 132, transport: 55, special: 33, electricity: 0, water: 0, loan: 0, administrative: 77, status: "Active" , role: "Accountant", contractType: "Indefinite-term" },
  { id: 21, empNo: "EMP-0021", bankName: "Bank Muscat", accountNumber: "0312 0123 4567 0910", name: "Sumaya Al Riyami", nameAr: "سمية الريامي", branch: "Salalah", dateOfJoining: "2022-07-25", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "580.000", housing: 70, transport: 29, special: 17, electricity: 0, water: 0, loan: 0, administrative: 41, status: "Active" , role: "Administrative", contractType: "Fixed-term" },
  { id: 22, empNo: "EMP-0022", bankName: "National Bank of Oman", accountNumber: "0312 0123 4567 0911", name: "Tariq Al Ghafri", nameAr: "طارق الغافري", branch: "Muscat", dateOfJoining: "2019-02-11", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "2800.000", housing: 336, transport: 140, special: 84, electricity: 0, water: 0, loan: 0, administrative: 196, status: "Active" , role: "Partner", contractType: "Indefinite-term" },
  { id: 23, empNo: "EMP-0023", bankName: "Bank Dhofar", accountNumber: "0312 0123 4567 0912", name: "Reem Al Mahrouqi", nameAr: "ريم المحروقي", branch: "Muscat", dateOfJoining: "2021-10-08", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1650.000", housing: 198, transport: 83, special: 49, electricity: 0, water: 0, loan: 0, administrative: 116, status: "Inactive" , role: "Lawyer", practiceLevel: "Primary", contractType: "Indefinite-term" },
  { id: 24, empNo: "EMP-0024", bankName: "Oman Arab Bank", accountNumber: "0312 0123 4567 0913", name: "Nasir Al Shukri", nameAr: "ناصر الشكري", branch: "Salalah", dateOfJoining: "2020-05-20", gender: "Male", nationality: "Omani", department: "Advisor", designation: "Advisor", salary: "2000.000", housing: 240, transport: 100, special: 60, electricity: 0, water: 0, loan: 0, administrative: 140, status: "Active" , role: "Advisor", contractType: "Fixed-term" },
  { id: 25, empNo: "EMP-0025", bankName: "Sohar International", accountNumber: "0312 0123 4567 0914", name: "Priya Sharma", nameAr: "بريا شارما", branch: "Muscat", dateOfJoining: "2022-12-01", gender: "Female", nationality: "Indian", department: "Administrative", designation: "Administrative", salary: "620.000", housing: 74, transport: 31, special: 19, electricity: 0, water: 0, loan: 0, administrative: 43, status: "Active" , role: "Administrative", contractType: "Indefinite-term" },
];

/** The number the next new employee will be given: EMP-0026 and so on. */
export function nextEmployeeNo(records) {
  const highest = records.reduce((max, e) => {
    const serial = Number(String(e.empNo || '').split('-')[1]) || 0;
    return Math.max(max, serial);
  }, 0);
  return 'EMP-' + String(highest + 1).padStart(4, '0');
}

/**
 * Papers already on an employee's file.
 *
 * `uploadedAt` carries the time as well as the date because two documents are
 * often filed on the same day and the list is read newest first.
 */
export const employeeDocuments = [
  { id: 1, employeeId: 1, uploadedAt: "2026-08-26T10:30", type: "Resident Card", fileName: "Resident_Card_Mohammed.pdf", expiry: "2030-09-12", notes: "Clear copy of the resident card" },
  { id: 2, employeeId: 1, uploadedAt: "2026-08-20T14:15", type: "Passport", fileName: "Passport_Mohammed.jpg", expiry: "2030-09-12", notes: "Valid until 12/09/2030" },
  { id: 3, employeeId: 1, uploadedAt: "2026-08-15T09:45", type: "Lawyer Card (Bar Card)", fileName: "Bar_Card_Mohammed.pdf", expiry: "2027-03-31", notes: "Issued by Oman Bar Association" },
  { id: 4, employeeId: 1, uploadedAt: "2026-08-10T11:20", type: "Academic Qualification", fileName: "Bachelor_Law.pdf", expiry: "", notes: "Bachelor of Law" },
  { id: 5, employeeId: 3, uploadedAt: "2026-08-05T13:05", type: "Experience Certificate", fileName: "Experience_Certificate.pdf", expiry: "", notes: "5 years of legal experience" },
  { id: 6, employeeId: 3, uploadedAt: "2026-08-01T15:40", type: "Administrative & Penal Decisions", fileName: "Decision_2026_14.pdf", expiry: "", notes: "Decision No. 14/2026" },
  { id: 7, employeeId: 7, uploadedAt: "2026-07-29T12:10", type: "Other Documents", fileName: "Training_Certificate.jpg", expiry: "2026-06-30", notes: "Legal training certificate" },
  { id: 8, employeeId: 8, uploadedAt: "2026-07-25T16:25", type: "Other Documents", fileName: "Reference_Letter.pdf", expiry: "", notes: "Reference letter" },
];

/** The papers filed against one employee. */
export const documentsFor = (employeeId) =>
  employeeDocuments.filter((doc) => doc.employeeId === employeeId);

/** Whether any paper has been filed against them at all. */
export const hasDocuments = (employeeId) =>
  employeeDocuments.some((doc) => doc.employeeId === employeeId);

/**
 * The document types one employee can file.
 *
 * An Omani carries an ID card where a foreigner carries a resident card and a
 * passport; only a lawyer has a bar card. Everything else everybody has.
 */
export function documentTypesFor(employee) {
  const omani = String(employee?.nationality || "").trim().toLowerCase() === "omani";
  const lawyer = /lawyer/i.test(String(employee?.occupation || ""));
  return [
    ...(omani ? OMANI_DOCUMENT_TYPES : NON_OMANI_DOCUMENT_TYPES),
    ...(lawyer ? [LAWYER_DOCUMENT_TYPE] : []),
    ...COMMON_DOCUMENT_TYPES,
  ];
}

/** An employee's papers are chased three months before they lapse. */
export const DOCUMENT_EXPIRING_DAYS = 90;

/**
 * The papers a person holds one of at a time, and so keeps versions of: a
 * renewed passport is version 2 of the passport, and version 1 is archived.
 * A second degree or certificate is simply another paper, so the other types
 * are never versioned.
 */
const ONE_AT_A_TIME = [
  ...OMANI_DOCUMENT_TYPES,
  ...NON_OMANI_DOCUMENT_TYPES,
  LAWYER_DOCUMENT_TYPE,
];

/** The heading each kind of paper is filed under. */
const DOCUMENT_CATEGORY = {
  "ID Card": "Identity & Residency",
  "Resident Card": "Identity & Residency",
  Passport: "Identity & Residency",
  "Work Permit": "Identity & Residency",
  [LAWYER_DOCUMENT_TYPE]: "Professional License",
  "Academic Qualification": "Qualifications & Experience",
  "Experience Certificate": "Qualifications & Experience",
  "Administrative & Penal Decisions": "Administrative Decisions",
  "Other Documents": "Other",
};

export const documentCategory = (type) => DOCUMENT_CATEGORY[type] || "Other";

/**
 * The papers that stand for details held elsewhere on the record: the copy
 * can only be filed once the number and expiry it is a copy of are saved,
 * so the paper and the record cannot disagree about which passport it is.
 * These are also the papers that expire; the rest are held as they are.
 */
const RELATED_RECORD = {
  "ID Card": { number: "civilId", expiry: "idExpiry" },
  "Resident Card": { number: "civilId", expiry: "idExpiry" },
  Passport: { number: "passportNumber", expiry: "passportExpiry" },
  "Work Permit": { number: "workPermitNo", expiry: "workPermitExpiry" },
  // Asked for on Identity & Immigration; the Legal Practice section that
  // once held it was taken out.
  [LAWYER_DOCUMENT_TYPE]: { number: "lawyerCardNo", expiry: "lawyerCardExpiry" },
};

/** Whether a paper of this type runs out, and so asks for its expiry date. */
export const documentExpires = (type) => type in RELATED_RECORD;

/**
 * Whether this employee's saved record holds what a paper of this type
 * stands for. Types that stand for nothing can always be filed.
 */
export const hasRelatedRecord = (type, employee) => {
  const related = RELATED_RECORD[type];
  return !related || Boolean(employee?.[related.number] && employee?.[related.expiry]);
};

/** The expiry the record already holds for this type, to start the copy from. */
export const relatedExpiry = (type, employee) =>
  RELATED_RECORD[type] ? employee?.[RELATED_RECORD[type].expiry] || "" : "";

/** Filed later than the other paper - by upload time, then by the order kept. */
const newer = (a, b) =>
  String(a.uploadedAt).localeCompare(String(b.uploadedAt)) > 0 ||
  (a.uploadedAt === b.uploadedAt && a.id > b.id);

/** Whether a paper of this type is kept in versions. */
export const isVersioned = (type) => ONE_AT_A_TIME.includes(type);

/**
 * Every version of a versioned paper on file, oldest first, numbered from 1.
 *
 * Nothing is ever overwritten: renewing a paper files a new one, so the
 * history is simply the papers of that type in the order they were filed.
 * The last is the current one; every one before it is archived.
 */
export function documentVersions(type, papers) {
  return papers
    .filter((paper) => paper.type === type)
    .sort((a, b) => (newer(a, b) ? 1 : -1))
    .map((paper, index, all) => ({
      ...paper,
      version: index + 1,
      current: index === all.length - 1,
    }));
}

/** Whether a newer version of this paper has been filed after it. */
const archived = (document, papers) =>
  isVersioned(document?.type) &&
  papers.some(
    (other) =>
      other.id !== document.id && other.type === document.type && newer(other, document)
  );

/**
 * Where a document stands.
 *
 * Archived first: once a newer version of the same paper is on file, the old
 * one is history whatever its date says, and nobody is chased about it.
 * Otherwise it is read off the expiry date on the firm's calendar - Expired
 * from the day after it, Expiring Soon from today to ninety days out, Active
 * beyond that. A paper with no expiry date never lapses, so it is Active.
 *
 * Worked out every time rather than stored, so a paper cannot claim to be
 * valid on a day its own expiry date has passed. `papers` is the employee's
 * file it is read against; a page holding its own copy of that file passes it.
 */
export function documentStatus(document, papers = documentsFor(document?.employeeId)) {
  if (archived(document, papers)) return "Archived";
  const state = expiryState(document?.expiry, DOCUMENT_EXPIRING_DAYS);
  return state === "none" ? "Active" : EXPIRY_LABEL[state];
}

/**
 * Reminders for employees' papers, for the notification bell.
 *
 * A paper is brought up ninety days before it expires, again at thirty, on
 * the day, and once it has expired - each of those is its own reminder, so
 * one read three months ago does not silence the one due today. Only the
 * current version is followed: an archived paper has been renewed.
 */
export function employeeDocumentAlerts() {
  const alerts = [];
  for (const employee of employeeRecords) {
    const papers = documentsFor(employee.id);
    for (const paper of papers) {
      if (!paper.expiry || archived(paper, papers)) continue;
      const days = daysUntil(paper.expiry);
      const milestone =
        days < 0 ? "expired" : days === 0 ? "today" : days <= 30 ? "30" : days <= 90 ? "90" : null;
      if (!milestone) continue;
      alerts.push({
        id: "employee:" + paper.id + ":" + milestone,
        title: employee.name,
        detail: paper.type,
        expiryDate: paper.expiry,
        state: days < 0 ? "expired" : "soon",
        status: days < 0 ? "Expired" : "Expiring Soon",
        href: "/employees/" + employee.id,
      });
    }
  }
  return alerts;
}

/**
 * Whether an employee's access is held for a lapsed critical paper.
 *
 * Only the current version of a critical paper counts - an archived one has
 * been renewed. Its first day expired starts the grace period; once that has
 * run out without a renewal, access is held with the action the firm chose.
 * The most serious answer wins: one held paper holds the whole account.
 *
 * Returns null when nothing is wrong, or { state: "grace" | "held", type,
 * expiry, until, daysLeft, action }.
 */
export function accessHold(papers, control) {
  let worst = null;
  for (const paper of papers) {
    if (!CRITICAL_DOCUMENT_TYPES.includes(paper.type) || !paper.expiry) continue;
    if (archived(paper, papers)) continue;

    const daysExpired = -daysUntil(paper.expiry);
    if (daysExpired < 1) continue;

    const until = addDays(paper.expiry, control.graceDays);
    const held = daysExpired > control.graceDays;
    const found = {
      state: held ? "held" : "grace",
      type: paper.type,
      expiry: paper.expiry,
      until,
      daysLeft: Math.max(control.graceDays - daysExpired + 1, 0),
      action: control.action,
    };
    if (!worst || (held && worst.state !== "held")) worst = found;
  }
  return worst;
}

/** "2026-08-26T10:30" as "26/08/2026  10:30 AM". */
export function formatUploadedAt(value) {
  const [date, time] = String(value).split("T");
  const [year, month, day] = date.split("-");
  const [rawHour, minute] = (time || "00:00").split(":");
  const hour = Number(rawHour);
  const suffix = hour < 12 ? "AM" : "PM";
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return `${day}/${month}/${year}  ${String(shown).padStart(2, "0")}:${minute} ${suffix}`;
}

/** The allowances that sit on top of basic pay. */
// `phoneAllowance`, not `phone`: `phone` is the employee's number.
export const ALLOWANCE_KEYS = [
  "special",
  "housing",
  "phoneAllowance",
  "transport",
  "electricity",
  "water",
];

/**
 * What can be held back from a month's pay. A record without one of these
 * simply has nothing held back under it.
 */
export const DEDUCTION_KEYS = [
  "loan",
  "salaryAdvance",
  "disciplinary",
  "otherDeduction",
  "administrative",
];

const sum = (employee, keys) =>
  keys.reduce((total, key) => total + Number(employee[key] || 0), 0);

/**
 * The three figures a payslip is read by.
 *
 * None of them is stored: a total held beside its parts can disagree with
 * them, and then nobody knows which of the two is the truth. Every one is
 * worked out from the components on the record.
 */
export const totalAllowances = (employee) => sum(employee, ALLOWANCE_KEYS);

export const totalDeductions = (employee) => sum(employee, DEDUCTION_KEYS);

export const netSalary = (employee) =>
  Number(employee.salary || 0) +
  totalAllowances(employee) -
  totalDeductions(employee);

/** An amount as it is shown anywhere in the system: figure then currency. */
export { money as amount } from "@/lib/money";
