/**
 * The people the firm employs.
 *
 * One record each, read by the list and by the form behind it, so a change to
 * the shape is made once.
 */

export const employeeRecords = [
  { id: 1, empNo: "EMP-0001", name: "Mohammed Al Yahyaei", branch: "Muscat", dateOfJoining: "2020-01-15", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "2500.000", housing: 300, transport: 125, special: 75, electricity: 0, water: 0, loan: 0, administrative: 175, status: "Active" , role: "Partner" },
  { id: 2, empNo: "EMP-0002", name: "Fatima Al Rashdi", branch: "Muscat", dateOfJoining: "2021-03-20", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "2000.000", housing: 240, transport: 100, special: 60, electricity: 0, water: 0, loan: 0, administrative: 140, status: "Active" , role: "Lawyer" },
  { id: 3, empNo: "EMP-0003", name: "Ahmed Al Balushi", branch: "Salalah", dateOfJoining: "2022-06-10", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Supervisor", salary: "800.000", housing: 96, transport: 40, special: 24, electricity: 0, water: 0, loan: 0, administrative: 56, status: "On Leave" , role: "Lawyer" },
  { id: 4, empNo: "EMP-0004", name: "Sarah Al Lawati", branch: "Muscat", dateOfJoining: "2019-09-05", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "650.000", housing: 78, transport: 33, special: 19, electricity: 0, water: 0, loan: 0, administrative: 46, status: "Active" , role: "Administrative" },
  { id: 5, empNo: "EMP-0005", name: "Rajesh Kumar", branch: "Salalah", dateOfJoining: "2023-02-28", gender: "Male", nationality: "Indian", department: "Accountant", designation: "Accountant", salary: "1200.000", housing: 144, transport: 60, special: 36, electricity: 0, water: 0, loan: 0, administrative: 84, status: "Inactive" , role: "Accountant" },
  { id: 6, empNo: "EMP-0006", name: "Khalid Al Hinai", branch: "Muscat", dateOfJoining: "2018-04-12", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "3000.000", housing: 360, transport: 150, special: 90, electricity: 0, water: 0, loan: 0, administrative: 210, status: "Active" , role: "Partner" },
  { id: 7, empNo: "EMP-0007", name: "Aisha Al Kindi", branch: "Muscat", dateOfJoining: "2021-08-01", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1800.000", housing: 216, transport: 90, special: 54, electricity: 0, water: 0, loan: 0, administrative: 126, status: "Active" , role: "Lawyer" },
  { id: 8, empNo: "EMP-0008", name: "Salim Al Rawahi", branch: "Salalah", dateOfJoining: "2020-11-15", gender: "Male", nationality: "Omani", department: "Advisor", designation: "Advisor", salary: "2200.000", housing: 264, transport: 110, special: 66, electricity: 0, water: 0, loan: 0, administrative: 154, status: "Active" , role: "Advisor" },
  { id: 9, empNo: "EMP-0009", name: "Layla Al Habsi", branch: "Muscat", dateOfJoining: "2022-02-20", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "600.000", housing: 72, transport: 30, special: 18, electricity: 0, water: 0, loan: 0, administrative: 42, status: "Active" , role: "Administrative" },
  { id: 10, empNo: "EMP-0010", name: "Hamad Al Busaidi", branch: "Salalah", dateOfJoining: "2019-07-08", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Supervisor", salary: "1500.000", housing: 180, transport: 75, special: 45, electricity: 0, water: 0, loan: 0, administrative: 105, status: "Active" , role: "Lawyer" },
  { id: 11, empNo: "EMP-0011", name: "Maryam Al Harthi", branch: "Muscat", dateOfJoining: "2023-01-10", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1600.000", housing: 192, transport: 80, special: 48, electricity: 0, water: 0, loan: 0, administrative: 112, status: "Active" , role: "Lawyer" },
  { id: 12, empNo: "EMP-0012", name: "Yousuf Al Wahaibi", branch: "Muscat", dateOfJoining: "2017-09-25", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "3500.000", housing: 420, transport: 175, special: 105, electricity: 0, water: 0, loan: 0, administrative: 245, status: "Active" , role: "Partner" },
  { id: 13, empNo: "EMP-0013", name: "Nadia Al Siyabi", branch: "Salalah", dateOfJoining: "2021-05-18", gender: "Female", nationality: "Omani", department: "Accountant", designation: "Accountant", salary: "900.000", housing: 108, transport: 45, special: 27, electricity: 0, water: 0, loan: 0, administrative: 63, status: "Active" , role: "Accountant" },
  { id: 14, empNo: "EMP-0014", name: "Omar Al Maskari", branch: "Muscat", dateOfJoining: "2020-03-30", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1700.000", housing: 204, transport: 85, special: 51, electricity: 0, water: 0, loan: 0, administrative: 119, status: "On Leave" , role: "Lawyer" },
  { id: 15, empNo: "EMP-0015", name: "Huda Al Jabri", branch: "Muscat", dateOfJoining: "2022-09-12", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "550.000", housing: 66, transport: 28, special: 16, electricity: 0, water: 0, loan: 0, administrative: 39, status: "Active" , role: "Administrative" },
  { id: 16, empNo: "EMP-0016", name: "Imran Sheikh", branch: "Salalah", dateOfJoining: "2021-11-22", gender: "Male", nationality: "Pakistani", department: "Lawyer", designation: "Litigation", salary: "1400.000", housing: 168, transport: 70, special: 42, electricity: 0, water: 0, loan: 0, administrative: 98, status: "Active" , role: "Lawyer" },
  { id: 17, empNo: "EMP-0017", name: "Amina Al Farsi", branch: "Muscat", dateOfJoining: "2019-12-05", gender: "Female", nationality: "Omani", department: "Advisor", designation: "Advisor", salary: "2100.000", housing: 252, transport: 105, special: 63, electricity: 0, water: 0, loan: 0, administrative: 147, status: "Active" , role: "Advisor" },
  { id: 18, empNo: "EMP-0018", name: "Hassan Al Zadjali", branch: "Salalah", dateOfJoining: "2020-08-17", gender: "Male", nationality: "Omani", department: "Lawyer", designation: "Supervisor", salary: "1450.000", housing: 174, transport: 73, special: 43, electricity: 0, water: 0, loan: 0, administrative: 102, status: "Terminated" , role: "Lawyer" },
  { id: 19, empNo: "EMP-0019", name: "Zainab Al Hosni", branch: "Muscat", dateOfJoining: "2023-04-03", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1550.000", housing: 186, transport: 78, special: 46, electricity: 0, water: 0, loan: 0, administrative: 109, status: "Active" , role: "Lawyer" },
  { id: 20, empNo: "EMP-0020", name: "Abdul Rahman", branch: "Muscat", dateOfJoining: "2018-06-14", gender: "Male", nationality: "Egyptian", department: "Accountant", designation: "Accountant", salary: "1100.000", housing: 132, transport: 55, special: 33, electricity: 0, water: 0, loan: 0, administrative: 77, status: "Active" , role: "Accountant" },
  { id: 21, empNo: "EMP-0021", name: "Sumaya Al Riyami", branch: "Salalah", dateOfJoining: "2022-07-25", gender: "Female", nationality: "Omani", department: "Administrative", designation: "Administrative", salary: "580.000", housing: 70, transport: 29, special: 17, electricity: 0, water: 0, loan: 0, administrative: 41, status: "Active" , role: "Administrative" },
  { id: 22, empNo: "EMP-0022", name: "Tariq Al Ghafri", branch: "Muscat", dateOfJoining: "2019-02-11", gender: "Male", nationality: "Omani", department: "Partner", designation: "Partner", salary: "2800.000", housing: 336, transport: 140, special: 84, electricity: 0, water: 0, loan: 0, administrative: 196, status: "Active" , role: "Partner" },
  { id: 23, empNo: "EMP-0023", name: "Reem Al Mahrouqi", branch: "Muscat", dateOfJoining: "2021-10-08", gender: "Female", nationality: "Omani", department: "Lawyer", designation: "Litigation", salary: "1650.000", housing: 198, transport: 83, special: 49, electricity: 0, water: 0, loan: 0, administrative: 116, status: "Inactive" , role: "Lawyer" },
  { id: 24, empNo: "EMP-0024", name: "Nasir Al Shukri", branch: "Salalah", dateOfJoining: "2020-05-20", gender: "Male", nationality: "Omani", department: "Advisor", designation: "Advisor", salary: "2000.000", housing: 240, transport: 100, special: 60, electricity: 0, water: 0, loan: 0, administrative: 140, status: "Active" , role: "Advisor" },
  { id: 25, empNo: "EMP-0025", name: "Priya Sharma", branch: "Muscat", dateOfJoining: "2022-12-01", gender: "Female", nationality: "Indian", department: "Administrative", designation: "Administrative", salary: "620.000", housing: 74, transport: 31, special: 19, electricity: 0, water: 0, loan: 0, administrative: 43, status: "Active" , role: "Administrative" },
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
  { id: 1, uploadedAt: "2026-08-26T10:30", type: "ID Card", fileName: "ID_Card_Mohammed.pdf", notes: "Clear copy of the ID card" },
  { id: 2, uploadedAt: "2026-08-20T14:15", type: "Passport", fileName: "Passport_Mohammed.jpg", notes: "Valid until 12/09/2030" },
  { id: 3, uploadedAt: "2026-08-15T09:45", type: "Bar Card", fileName: "Bar_Card_Mohammed.pdf", notes: "Issued by Oman Bar Association" },
  { id: 4, uploadedAt: "2026-08-10T11:20", type: "Academic Qualification", fileName: "Bachelor_Law.pdf", notes: "Bachelor of Law" },
  { id: 5, uploadedAt: "2026-08-05T13:05", type: "Experience Certificate", fileName: "Experience_Certificate.pdf", notes: "5 years of legal experience" },
  { id: 6, uploadedAt: "2026-08-01T15:40", type: "Decisions", fileName: "Decision_2026_14.pdf", notes: "Decision No. 14/2026" },
  { id: 7, uploadedAt: "2026-07-29T12:10", type: "Other Certificates", fileName: "Training_Certificate.jpg", notes: "Legal training certificate" },
  { id: 8, uploadedAt: "2026-07-25T16:25", type: "Other Documents", fileName: "Reference_Letter.pdf", notes: "Reference letter" },
];

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
export const ALLOWANCE_KEYS = ["special", "housing", "transport", "electricity", "water"];

/** What can be held back from a month's pay. */
export const DEDUCTION_KEYS = ["loan", "administrative"];

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

/** Three decimals, thousands separated - the way Rials are written here. */
export const amount = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
