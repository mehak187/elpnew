/**
 * Document Intake: the papers a new employee is added from.
 *
 * Each kind of paper says what it is filed as on the record, which of its
 * details are the paper's own number and expiry, and what it would fill in on
 * the employee's profile once read.
 *
 * DEMO: nothing here reads the file. Until there is a server to send a paper
 * to - OCR or an AI model reading it - each kind fills in the same sample
 * details, so the screens after it can be seen filled. Swap `extractDemo` for
 * the real call when there is one; everything else stays as it is.
 */
import { LAWYER_DOCUMENT_TYPE } from "@/lib/constants";

/** The kinds of paper offered as tiles, in the order the design lists them. */
export const INTAKE_TYPES = [
  {
    key: "civilId",
    label: "Civil ID",
    fileAs: "National ID",
    numberKey: "civilId",
    expiryKey: "idExpiry",
    demo: {
      employeeName: "Salma Al Harthy",
      arabicName: "سلمى الحارثية",
      nationality: "Omani",
      gender: "Female",
      dateOfBirth: "1994-03-12",
      civilId: "12345678",
      idExpiry: "2030-04-15",
    },
  },
  {
    key: "passport",
    label: "Passport",
    fileAs: "Passport",
    numberKey: "passportNumber",
    expiryKey: "passportExpiry",
    demo: {
      nationality: "Omani",
      gender: "Female",
      dateOfBirth: "1994-03-12",
      passportNumber: "A12345678",
      passportExpiry: "2028-08-22",
    },
  },
  {
    key: "contract",
    label: "Employment Contract",
    fileAs: "Employment Contract",
    demo: {
      position: "Employee",
      employmentType: "Full-Time",
      contractType: "Indefinite-term",
      dateOfJoining: "2026-10-15",
      noticePeriod: "1 Month",
      salary: "900.000",
      housing: "100.000",
      transport: "50.000",
    },
  },
  {
    key: "cv",
    label: "CV / Resume",
    fileAs: "CV",
    demo: {
      personalEmail: "salma.harthy@example.com",
      phone: "9123 4567",
      address: "Al Khuwair, Muscat",
    },
  },
  {
    // A degree fills nothing on the profile; what it says is checked by eye.
    key: "education",
    label: "Educational Certificate",
    fileAs: "University Degree",
    demo: {},
    review: 3,
  },
  {
    key: "lawyerCard",
    label: "Lawyer Card",
    fileAs: LAWYER_DOCUMENT_TYPE,
    numberKey: "lawyerCardNo",
    expiryKey: "lawyerCardExpiry",
    demo: {
      lawyerCardNo: "OBA-2026-0412",
      lawyerCardExpiry: "2027-12-31",
      grade: "Primary Court Lawyer",
      practiceLevel: "Primary Court Lawyer",
      occupation: "Lawyer",
    },
  },
  {
    key: "bank",
    label: "Bank Document",
    fileAs: "Bank Document",
    demo: {
      bankName: "Bank Muscat",
      accountNumber: "0312 0456 7890 1234",
      iban: "OM81 0270 3120 4567 8901 234",
      swiftCode: "BMUSOMRX",
    },
  },
  { key: "other", label: "Other", fileAs: "Other", demo: {} },
];

export const intakeType = (key) => INTAKE_TYPES.find((type) => type.key === key);

/** What a paper may be uploaded as, and how large. */
export const INTAKE_ACCEPT = ".pdf,.jpg,.jpeg,.png";
export const INTAKE_MAX_BYTES = 10 * 1024 * 1024;
export const intakeFileProblem = (file) =>
  !/\.(pdf|jpe?g|png)$/i.test(file.name)
    ? "Only PDF, JPG, JPEG and PNG files can be uploaded."
    : file.size > INTAKE_MAX_BYTES
      ? "The file is larger than 10 MB."
      : "";

/**
 * The fields the profile cannot be saved without, across every step - what
 * "still missing" counts.
 */
export const PROFILE_REQUIRED = [
  "arabicName",
  "employeeName",
  "dateOfBirth",
  "gender",
  "nationality",
  "phone",
  "address",
  "emergencyName",
  "emergencyPhone",
  "branch",
  "position",
  "department",
  "grade",
  "workEmail",
  "contractType",
  "dateOfJoining",
  "civilId",
  "idExpiry",
  "salary",
  "bankName",
  "accountNumber",
  "iban",
  "swiftCode",
];

/**
 * What a paper of this kind says, as the reading would return it: the details
 * it carries, its number and expiry, and how many of its details need a person
 * to check them.
 *
 * DEMO - see the note at the head of this file.
 */
export function extractDemo(typeKey) {
  const type = intakeType(typeKey);
  const values = { ...(type?.demo || {}) };
  return {
    values,
    number: type?.numberKey ? values[type.numberKey] || "" : "",
    expiry: type?.expiryKey ? values[type.expiryKey] || "" : "",
    review: type?.review || 0,
  };
}
