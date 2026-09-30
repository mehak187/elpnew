import { useRef, useState } from "react";
import UploadIcon from "@/components/shared/UploadIcon";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecordSidebar from "@/components/shared/RecordSidebar";
import PageHeader from "@/components/shared/PageHeader";
import FormHeading from "@/components/shared/FormHeading";
import PhoneInput from "@/components/shared/PhoneInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Plus,
  ArrowLeft,
  Info,
  User,
  FileText,
  Wallet,
  ListTree,

  CalendarClock,
  Megaphone,
  Gauge,
  Lock,
  CalendarCheck,
  ShieldCheck,
  ClipboardList,
  Phone,
  Mail,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  Trash2,
  Briefcase,
  Users,
  Gavel,
  CircleCheck,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/panels";
import {
  NATIONALITIES,
  GENDERS,
  EMPLOYEE_CATEGORIES,
  JOB_LEVELS,
  DEPARTMENTS,
  OCCUPATIONS,
  EMPLOYEE_STATUSES,
  LEAVING_REASONS,
  DEFAULT_DIAL_CODE,
  COUNTRY_DIAL_CODES,
  EMERGENCY_RELATIONSHIPS,
  EMPLOYMENT_TYPES,
  EMPLOYEE_CONTRACT_TYPES,
  PRACTICE_LEVELS,
} from "@/lib/constants";
import { initialBranches } from "@/pages/firm/firmData";
import FinancialBenefitsSection from "./sections/FinancialBenefitsSection";
import EntitlementsSection from "./sections/EntitlementsSection";


import DailyActivitiesSection from "./sections/DailyActivitiesSection";
import PerformanceSection from "./sections/PerformanceSection";
import ViolationsSection from "./sections/ViolationsSection";
import EmployeeCircularsSection from "./sections/CircularsSection";
import LeavesSection from "./sections/LeavesSection";
import GeneralRequestSection from "./sections/GeneralRequestSection";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";
import AiSearch from "@/components/shared/AiSearch";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { smartSearch } from "@/lib/search/smartSearch";
import { formatDate } from "@/pages/firm/firmData";
import {
  employeeRecords,
  nextEmployeeNo,
  documentsFor,
  documentTypesFor,
  documentStatus,
  formatUploadedAt,
} from "./employeeData";
import { checkRequired } from "@/components/shared/formFields";

/**
 * The employee record, section by section.
 *
 * The sections are the sides of one person's file rather than steps in a wizard,
 * so any of them can be opened at any time and they all save together.
 */
const SECTIONS = [
  {
    // Who the person is, what they do and how to reach them: three
    // entries in this menu that were all one answer, so they are one page
    // with a box each.
    key: "information",
    label: "Employee Data",
    title: "Employee",
    icon: User,
    note: "Employee profile, job description and contact details",
  },
  {
    // The papers the details above were taken from, in a section of their own
    // again - they are looked up as often as the details themselves.
    noSave: true,
    key: "documents",
    label: "Documents",
    icon: FileText,
    note: "The papers on file for this employee",
  },
  {
    // Salary, loans, assistance and commission were four entries in this
    // menu, all answering the same question: what the firm pays this
    // person, and why. One page with four tabs instead.
    key: "benefits",
    label: "Financial Benefits",
    icon: Wallet,
    noSave: true,
    note: "Salaries, bonuses, loans, assistance and commission",
  },
  {
    // Allowances on top of the pay, and the sums the law requires when
    // somebody leaves. Nine lists, one page, a tab each.
    key: "entitlements",
    label: "Employee Entitlements",
    icon: FileSpreadsheet,
    noSave: true,
    note: "Employee allowances and statutory entitlements",
  },
  {
    // Anything asked of the administration that has no form of its own - a
    // parking card, a laptop. Nothing to save on the page: each request is
    // submitted on its own.
    key: "generalRequest",
    label: "General Requests",
    icon: ClipboardList,
    noSave: true,
    note: "Submit your request to the administration",
  },
  {
    key: "leaves",
    label: "Leaves",
    icon: CalendarCheck,
    noSave: true,
    note: "Leave requests and what was decided about them",
  },
  {
    noSave: true,
    key: "circulars",
    label: "Circulars",
    icon: Megaphone,
    note: "Notices addressed to this employee",
  },
  {
    key: "daily",
    label: "Daily Activities",
    icon: CalendarClock,
    note: "Record today's working time and activities",
    save: "Save Daily Activity",
  },
  {
    noSave: true,
    key: "performance",
    label: "Performance Evaluation",
    icon: Gauge,
    note: "Statistics collected by the system from recorded activity",
  },
  {
    // Recorded by the firm; on My Profile the history is only read.
    noSave: true,
    key: "violations",
    label: "Violations & Penalties",
    icon: Gavel,
    note: "Violations recorded and the penalties that followed",
  },
  {
    // What one employee may see and change. Set for someone by whoever
    // administers the firm, so it is not on the page a person opens on
    // themselves - nobody grants themselves permissions.
    noSave: true,
    key: "permissions",
    label: "System Permissions",
    icon: ShieldCheck,
    note: "What this employee may see and change",
    notOnOwnProfile: true,
  },
];

/**
 * The mark beside a field that has to be filled in.
 *
 * It is a demand, so it is only shown where the page is asking for something:
 * on My Profile, where the record is only being read, there is nothing to
 * demand and the mark would be noise.
 */
function Required({ show }) {
  if (!show) return null;
  return ;
}

/**
 * How the sides of one employee's file are grouped in the sidebar.
 *
 * Standard 07 names two: the dossier - who the person is and the papers that
 * prove it - and the money the firm owes them. Everything else is gathered
 * below until the standard says where it belongs.
 */
const SECTION_GROUPS = [
  {
    key: "dossier",
    label: "Employee Dossier",
    icon: User,
    items: ["information", "documents"],
  },
  {
    key: "financial",
    label: "Financial Requests",
    icon: Wallet,
    items: ["benefits", "entitlements"],
  },
  {
    key: "other",
    label: "Other sections",
    icon: ListTree,
    items: [
      "generalRequest",
      "leaves",
      "circulars",
      "daily",
      "performance",
      "violations",
      "permissions",
    ],
  },
];

/**
 * Adding an employee, one step at a time.
 *
 * An employee is built in order - who they are, then the job they are taking,
 * then the papers - and each step is saved before the next opens, so nothing
 * is filed against somebody the system has not got yet. Every step is on the
 * bar from the start, so how far there is to go is plain before anybody
 * begins; the ones not reached yet are shown but cannot be opened.
 */
const ADD_STEPS = [
  { key: "personal", label: "Personal Details" },
  {
    key: "employment",
    label: "Employment & Contract",
    hint: "Complete this section and save to continue to Identity & Immigration.",
  },
  // After the job, because which papers apply follows from it: a lawyer's
  // card only for a lawyer, a passport and visa only for a foreigner.
  { key: "identity", label: "Identity & Immigration" },
  { key: "documents", label: "Documents" },
];

/**
 * The bar of steps across the top of Add Employee.
 *
 * A step that has been saved carries a green check and stays open to go back
 * to; the one being filled in is underlined; the rest wait, greyed, until the
 * step before them is saved.
 */
function StepTabs({ steps, active, done, onSelect }) {
  return (
    <nav aria-label="Add employee steps" className="overflow-x-auto">
      <ol className="flex min-w-max border-b border-container-border">
        {steps.map((step, index) => {
          const isDone = done.includes(step.key);
          const isActive = step.key === active;
          const reachable = isDone || isActive;
          return (
            <li key={step.key} className="flex items-center">
              {index > 0 && (
                <span aria-hidden="true" className="h-5 w-px bg-container-border" />
              )}
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(step.key)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-6 py-3 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent",
                  !isActive && reachable && "text-primary hover:bg-menu-hover",
                  !reachable && "cursor-not-allowed text-muted-foreground"
                )}
              >
                {isDone && (
                  <CircleCheck
                    aria-hidden="true"
                    className="size-5 shrink-0 fill-green-600 text-white"
                  />
                )}
                {step.label}
                {isDone && <span className="sr-only">(completed)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * A phone number and the country it belongs to.
 *
 * The dial code is a field of its own rather than something typed into the
 * number, so a number can be dialled without guessing which country it is
 * from - and so two people cannot write the same number two ways.
 */
function PhoneField({ id, label, placeholder, dialCode, onDialCode, value, onChange, required }) {
  return (
    <div className="form-field space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <PhoneInput
        id={id}
        dialCode={dialCode}
        onDialCode={onDialCode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

/**
 * A labelled choice from a fixed list.
 *
 * `required` marks the cell for the save check, which reads an unchosen select
 * by the placeholder its trigger is still showing.
 */
function ChoiceField({ id, label, placeholder, value, onChange, options, required }) {
  return (
    <div className="form-field space-y-2" data-required={required || undefined}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** A paper's number and the day it runs out, side by side on the grid. */
function PaperFields({ label, numberName, expiryName, values, onChange }) {
  return (
    <>
      <div className="form-field space-y-2">
        <Label htmlFor={numberName}>{label} No.</Label>
        <Input
          id={numberName}
          name={numberName}
          value={values[numberName]}
          onChange={onChange}
          placeholder="Enter number"
          required
        />
      </div>
      <div className="form-field space-y-2">
        <Label htmlFor={expiryName}>{label} Expiry Date</Label>
        <Input
          id={expiryName}
          name={expiryName}
          type="date"
          value={values[expiryName]}
          onChange={onChange}
          required
        />
      </div>
    </>
  );
}

/** A labelled field with its own icon sitting inside the box. */
function IconField({ icon, id, label, ...props }) {
  const Icon = icon;
  return (
    <div className="form-field space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input id={id} className="ps-9" {...props} />
      </div>
    </div>
  );
}


/** How much of a note the field will take, shown as a count while typing. */
const NOTES_LIMIT = 300;

/** A blank paper: what is asked for before one is filed. */
const emptyDocument = { type: "", expiry: "", notes: "" };

/** The first field of the form a section's header button jumps to. */
/** Sections where the header button opens a form instead of scrolling to one. */

/**
 * One titled box on the Employee Information page.
 *
 * The boxes are separated by space rather than by a divider, so the page
 * reads as three things about one person rather than one long form.
 */
function SectionCard({ title, icon: Icon, note, aside, footer, children }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        {Icon ? (
          // A step of Add Employee: the rule, the icon, then the name and
          // what the step asks for - the page title's heading, one size down.
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <span aria-hidden="true" className="w-1 self-stretch rounded-full bg-primary" />
            <Icon strokeWidth={1.5} aria-hidden="true" className="size-8 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-primary">{title}</h2>
              {note && <p className="text-sm text-primary/75">{note}</p>}
            </div>
            {aside}
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 border-b pb-3">
            <h2 className="border-s-4 border-primary ps-3 text-lg font-bold text-primary">{title}</h2>
            {aside}
          </div>
        )}
        {children}
        {/* The step's own Cancel and Save, inside the box they act on, under
            a rule where the last field leaves off. */}
        {footer && <div className="mt-6 border-t pt-4">{footer}</div>}
      </CardContent>
    </Card>
  );
}

const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

const isImage = (name) =>
  IMAGE_TYPES.some((ext) => String(name).toLowerCase().endsWith(ext));

/** A picture is marked as one so a scan is not mistaken for a signed PDF. */
const fileIcon = (name) => (isImage(name) ? FileImage : FileText);

/** Somebody who has left, and so owes the record a reason and a last day. */
const HAS_LEFT = ["Inactive", "Terminated"];

const emptyFormData = {
  arabicName: "",
  employeeName: "",
  nationality: "",
  gender: "",
  dateOfBirth: "",
  dateOfJoining: "",
  status: "Active",
  reasonForLeaving: "",
  lastWorkingDate: "",

  category: "",
  jobLevel: "",
  department: "",
  occupation: "",
  // Where the person works, how they are engaged, and - where the engagement
  // runs out - the day it does.
  branch: "",
  employmentType: "",
  employmentEndDate: "",

  // The card a person is identified by in Oman: a citizen's civil ID, or a
  // resident's card. One field, because a person carries one or the other.
  civilId: "",
  idExpiry: "",
  // Asked of a foreign employee only; an Omani is identified by the ID card.
  passportNumber: "",
  passportExpiry: "",
  visaNo: "",
  visaExpiry: "",
  // The card that admits a lawyer to plead; nobody else carries one.
  lawyerCardNo: "",
  lawyerCardExpiry: "",

  dialCode: DEFAULT_DIAL_CODE,
  phone: "",
  // Which address is which matters when somebody has to be reached: the work
  // one is the firm's, the personal one is theirs.
  workEmail: "",
  personalEmail: "",
  email: "",
  address: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyDialCode: DEFAULT_DIAL_CODE,
  emergencyPhone: "",

  // Only a lawyer is admitted to a court, so only a lawyer has a level.
  practiceLevel: "",
  workDialCode: DEFAULT_DIAL_CODE,
  workPhone: "",
  // The contract: its kind, and the days it runs from and - if fixed - to.
  contractType: "",
  contractStartDate: "",
  // The one leave figure kept on the record; leave taken is recorded on the
  // leave page, not here. Thirty days is the statutory annual entitlement.
  annualLeaveDays: "30",
  // Registered with the Social Protection Fund unless somebody says not.
  socialProtection: "Yes",
};

/**
 * An employee record as the form reads it.
 *
 * The record calls the two names `name` and `nameAr`, because that is what
 * a list of employees needs; the form calls them English and Arabic full
 * names, because that is what somebody filling it in is being asked for.
 * The two are mapped here rather than renamed on either side.
 */
const toFormData = (record) =>
  record
    ? {
        ...emptyFormData,
        ...record,
        employeeName: record.name || "",
        arabicName: record.nameAr || "",
        // Records written before the two addresses were told apart hold one
        // `email`, which was always the work one.
        workEmail: record.workEmail || record.email || "",
        // Older records say what the person does in `designation`; the form
        // calls it the profession, and the papers they can file follow it.
        occupation: record.occupation || record.designation || record.role || "",
      }
    : emptyFormData;

/** And back again, so what is saved is what the list reads. */
const toRecord = (formData) => ({
  ...formData,
  name: formData.employeeName,
  nameAr: formData.arabicName,
  // The lists still read `email`, and the work address is the one they mean.
  email: formData.workEmail || formData.email,
});

/**
 * One employee, however they were reached.
 *
 * `self` opens the record of whoever is signed in, so My Profile is this
 * page rather than a second one built beside it: the same sections, the
 * same sidebar, the same code - only the record differs.
 */
export default function EmployeeForm({ self }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const record = self
    ? employeeRecords.find((e) => e.name === CURRENT_USER.name) || null
    : id
      ? employeeRecords.find((e) => e.id === Number(id)) || null
      : null;

  // A record on screen is one being edited; only Add starts an empty one.
  const isEditMode = Boolean(record);
  // A new employee is added step by step rather than on the record's pages:
  // there is no record yet for those pages to belong to.
  const isAdding = !isEditMode && !self;
  const [step, setStep] = useState(ADD_STEPS[0].key);
  const [savedSteps, setSavedSteps] = useState([]);
  // The record as it stood at its last save. Whose it is and which papers it
  // calls for are read from here, not from a step gone back to and being
  // retyped: a nationality changed but not saved has not changed yet.
  const [saved, setSaved] = useState({});
  const savedOmani = String(saved.nationality || "").trim().toLowerCase() === "omani";
  const savedLawyer = saved.occupation === "Lawyer";
  const formRef = useRef(null);

  const [activeSection, setActiveSection] = useState("information");
  // Which side of Financial Benefits is open. Held here because the tabs
  // that choose it sit in the section's heading, which this page draws.
  const [benefitsTab, setBenefitsTab] = useState("salaries");
  // The section whose add form is open, if any. Held here because the button
  // that opens it lives in the page header, above the section itself.
  const [formData, setFormData] = useState(() => toFormData(record));

  // Papers are a list of their own, kept beside the fields rather than in them.
  // This person's papers, not every paper in the firm.
  const [documents, setDocuments] = useState(() => documentsFor(record?.id));
  const [docDraft, setDocDraft] = useState(emptyDocument);
  const [docFile, setDocFile] = useState(null);
  const [docQuery, setDocQuery] = useState("");
  // The page is the list of documents until someone asks to add to it.
  const [addingDoc, setAddingDoc] = useState(false);
  // The paper opened from the list to be corrected, if any.
  const [editingDoc, setEditingDoc] = useState(null);

  /** Back to the list, with nothing half-written left behind. */
  const closeDocForm = () => {
    setAddingDoc(false);
    setEditingDoc(null);
    setDocDraft(emptyDocument);
    setDocFile(null);
  };

  /** A paper opened back into the form, to be replaced or corrected. */
  const editDocument = (document) => {
    setEditingDoc(document);
    setAddingDoc(true);
    setDocFile(null);
    setDocDraft({
      type: document.type,
      expiry: document.expiry || "",
      notes: document.notes || "",
    });
  };

  // Reload when the route moves to a different employee without unmounting.
  const [loadedId, setLoadedId] = useState(id);
  if (id !== loadedId) {
    setLoadedId(id);
    setFormData(toFormData(record));
    setActiveSection("information");
    closeDocForm();
  }

  // Leaving a section closes what was open in it. A form left open would
  // still be open on the way back - over another employee's papers, if the
  // list was visited in between.
  const [openSection, setOpenSection] = useState(activeSection);
  if (openSection !== activeSection) {
    setOpenSection(activeSection);
    closeDocForm();
  }

  // A paper is saved with the file it was filed with; correcting one keeps
  // that file unless a new one is attached over it.
  const canSaveDocument =
    docDraft.type && docDraft.expiry && (docFile || editingDoc);

  const addDocument = () => {
    if (!checkRequired() || !canSaveDocument) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const uploadedAt =
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate()) +
      "T" +
      pad(now.getHours()) +
      ":" +
      pad(now.getMinutes());
    const file = docFile
      ? { fileName: docFile.name, fileUrl: URL.createObjectURL(docFile) }
      : {};

    setDocuments((prev) =>
      editingDoc
        ? prev.map((document) =>
            document.id === editingDoc.id
              ? {
                  ...document,
                  ...file,
                  type: docDraft.type,
                  expiry: docDraft.expiry,
                  notes: docDraft.notes,
                  // A replaced file is filed on the day it replaced the old one.
                  ...(docFile ? { uploadedAt } : {}),
                }
              : document
          )
        : [
            {
              id: prev.reduce((max, d) => Math.max(max, d.id), 0) + 1,
              uploadedAt,
              type: docDraft.type,
              expiry: docDraft.expiry,
              ...file,
              notes: docDraft.notes,
            },
            ...prev,
          ]
    );
    closeDocForm();
  };

  const openDocument = (doc) => {
    if (doc.fileUrl) window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  // The paper waiting to be taken off the record, while that is confirmed.
  const [removingDoc, setRemovingDoc] = useState(null);

  const removeDocument = () => {
    if (!removingDoc) return;
    setDocuments((prev) => prev.filter((d) => d.id !== removingDoc.id));
    setRemovingDoc(null);
  };

  // Newest paper first, and numbered so: the most recent carries the highest
  // number, so a number means the same paper however long the list grows.
  const orderedDocuments = [...documents].sort(
    (a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)) || b.id - a.id
  );
  // The number is fixed by when the paper was filed, not by where it sits in
  // the list, so it survives the papers needing attention being lifted up.
  const serialOf = new Map(
    orderedDocuments.map((document, index) => [
      document.id,
      orderedDocuments.length - index,
    ])
  );
  // Papers that need chasing come first - expired, then expiring soon - and
  // everything else keeps its newest-first order under them.
  const URGENCY = { Expired: 0, "Expiring Soon": 1 };
  const urgency = (document) => URGENCY[documentStatus(document)] ?? 2;
  const shownDocuments = smartSearch(
    [...orderedDocuments].sort((a, b) => urgency(a) - urgency(b)),
    docQuery
  );

  // Which papers this employee can file at all, and what decides it.
  const isOmani =
    String(formData.nationality || "").trim().toLowerCase() === "omani";
  const docTypes = documentTypesFor(formData);

  const set = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));
  const onChange = (e) => set(e.target.name, e.target.value);

  // A new employee has one side to it: the basic information. Everything
  // else - documents, salary, loans - is filed against an employee, and there
  // is no employee to file it against until this form is saved.
  const sections = (isEditMode ? SECTIONS : SECTIONS.slice(0, 1)).filter(
    (section) => !(self && section.notOnOwnProfile)
  );

  const current = SECTIONS.find((s) => s.key === activeSection) || SECTIONS[0];
  // While adding, the step decides what is on screen rather than the sidebar.
  const isInfo = isAdding ? step !== "documents" : activeSection === "information";
  // Both of these draw their own boxes, so the page's card steps out of the
  // way rather than drawing a border around borders.
  const isDocuments = isAdding ? step === "documents" : activeSection === "documents";
  /** Whether a box belongs on screen: all of them on a record, one step's while adding. */
  const onStep = (key) => !isAdding || step === key;

  /**
   * Whether the record can be changed on this page.
   *
   * A person reads their own record here; the firm changes it on the
   * Employees page. Two places to edit one record is two records waiting
   * to disagree - and nobody amends their own job title or joining date.
   */
  const readOnly = Boolean(self);
  // Nothing is being asked for on a page that only shows the record.
  const asksFor = !readOnly;
  const employeeNo = record?.empNo || nextEmployeeNo(employeeRecords);
  const hasLeft = HAS_LEFT.includes(formData.status);

  // The section saves itself lower down, so the header brings the form to the
  // top of the screen rather than pretending to save from up here.

  /**
   * Saves the step on screen and opens the next one.
   *
   * Nothing moves on while a required field is empty: the check marks the
   * gaps and takes the cursor to the first, and the step stays where it is.
   * The last step finishes the employee and goes back to the list.
   */
  const saveStep = () => {
    if (!checkRequired(formRef.current)) return;
    // Filled but in the wrong shape - an email with no @ - holds the step too,
    // and the cursor is taken to it; the field already says what is wrong.
    const misshapen = [...formRef.current.querySelectorAll("input")].find(
      (input) => !input.disabled && input.value && !input.checkValidity()
    );
    if (misshapen) {
      misshapen.scrollIntoView({ block: "center", behavior: "smooth" });
      misshapen.focus({ preventScroll: true });
      return;
    }
    console.log("Saving " + step + ":", { ...toRecord(formData), empNo: employeeNo });
    setSavedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    setSaved(formData);

    const next = ADD_STEPS[ADD_STEPS.findIndex((s) => s.key === step) + 1];
    if (!next) {
      navigate("/employees");
      return;
    }
    setStep(next.key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLastStep = step === ADD_STEPS[ADD_STEPS.length - 1].key;
  const currentStep = ADD_STEPS.find((s) => s.key === step) || ADD_STEPS[0];

  // Cancel and Save for the step on screen, drawn inside that step's box.
  // Finishing is a click, not a submit: the documents step has a search box,
  // and Enter in it must search rather than send the person back to the list.
  const stepActions = isAdding && (
    <div className="flex items-center justify-end gap-3">
      <Button type="button" variant="ghost" onClick={() => navigate("/employees")}>
        Cancel
      </Button>
      {isLastStep ? (
        <Button type="button" onClick={saveStep}>
          <Save className="me-2 h-4 w-4" />
          Finish
        </Button>
      ) : (
        <Button type="submit">
          <Save className="me-2 h-4 w-4" />
          Save
        </Button>
      )}
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAdding) {
      if (!isLastStep) saveStep();
      return;
    }
    console.log(isEditMode ? "Updating employee:" : "Creating employee:", {
      ...toRecord(formData),
      empNo: employeeNo,
    });
    navigate("/employees");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Adding has no sidebar, so the way back to the list sits beside the
          title instead. */}
      {isAdding ? (
        <PageHeader
          icon={UserPlus}
          title="Add Employee"
          note="Create a new employee profile"
          crumb="Add Employee"
          backTo="/employees"
          className="px-0 sm:px-0"
          // Whose record this is, from the moment there is somebody: shown
          // once Personal Details is saved, with the number they will carry.
          action={
            saved.employeeName && (
              <div className="text-end">
                <p className="text-lg font-bold text-primary">{saved.employeeName}</p>
                <p className="text-sm text-primary/75">Employee No. {employeeNo}</p>
              </div>
            )
          }
        />
      ) : (
      /* Page Header.

          No back control here: the sidebar's own "All employees" link leads
          to the same place, and two ways back from one page is one way too
          many. The one that stayed says where it goes. */
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-primary sm:text-2xl">
                {current.title || current.label}
              </h1>
              {/* No standing beside the title: it is already on the row this
                  record was opened from, and the title says which record is
                  open, not how it stands. */}
            </div>
            <p className="text-xs text-primary/75 sm:text-sm">{current.note}</p>
          </div>
        </div>
        {/* No Save up here: it sits at the end of the form it saves, where
            the last field leaves off. */}
      </div>
      )}

      <div className="flex flex-col items-start gap-4 sm:gap-6 lg:flex-row">
        {/* Standard 07: the sides of this file, grouped, and belonging to
            this employee alone - the name at its head says whose file is
            open, and the list under it goes nowhere else. */}
        {!isAdding && (
        <RecordSidebar
          // Standard 07 #04: moving to another employee replaces the name,
          // the number, the links and which group is open - all together.
          // The key does that in one stroke, and stops one employee's
          // opened groups from being remembered as another's.
          key={record?.id || "new"}
          id={"employee-" + (record?.id || "new")}
          backTo="/employees"
          backLabel="All employees"
          title={formData.employeeName || "New employee"}
          subtitle={isEditMode ? employeeNo + " · " + formData.status : "New record"}
          active={activeSection}
          onSelect={setActiveSection}
          groups={SECTION_GROUPS.map((group) => ({
            key: group.key,
            label: group.label,
            icon: group.icon,
            items: group.items
              .map((key) => sections.find((section) => section.key === key))
              .filter(Boolean)
              .map((section) => ({ key: section.key, label: section.label })),
          })).filter((group) => group.items.length > 0)}
        />
        )}

        {/* min-w-0 or the column will not shrink: a flex child sizes itself to
            its widest content by default, so one wide table in here would
            stretch the whole page and push the sidebar off screen. */}
        <div className="w-full min-w-0 flex-1 space-y-4 sm:space-y-6">
          {isAdding && (
            <div className="space-y-2">
              <StepTabs
                steps={ADD_STEPS}
                active={step}
                done={savedSteps}
                onSelect={setStep}
              />
              {/* What the step asks for, where the step says it. */}
              {currentStep.hint && (
                <p className="text-sm text-primary/75">{currentStep.hint}</p>
              )}
            </div>
          )}
          {/* On the merged page the three boxes are the frame, so the
              page's own card steps out of the way rather than drawing a
              border around three borders. */}
          <Card className={cn((isInfo || isDocuments) && "border-0 bg-transparent shadow-none")}>
            <CardContent
              className={cn(
                "p-4 sm:p-6",
                (isInfo || isDocuments) && "space-y-4 p-0 sm:space-y-6 sm:p-0"
              )}
            >
              <form
                id="employee-form"
                ref={formRef}
                onSubmit={handleSubmit}
                // While adding, the step's own check says what is missing,
                // in the page's own marking rather than the browser's bubble.
                noValidate={isAdding}
                className={cn(isInfo && "space-y-4 sm:space-y-6")}
              >
                {isInfo && (
                  <fieldset
                    disabled={readOnly}
                    className={cn(
                      "space-y-4 border-0 p-0 sm:space-y-6",
                      // One background for everything that cannot be changed,
                      // so the page reads as a record rather than as a form
                      // somebody has greyed out field by field.
                      readOnly &&
                        "[&_input:disabled]:bg-locked [&_input:disabled]:opacity-100 [&_textarea:disabled]:bg-locked [&_textarea:disabled]:opacity-100 [&_button:disabled]:bg-locked [&_button:disabled]:opacity-100 [&_button:disabled]:text-foreground"
                    )}
                  >
                {/* A record that cannot be edited says so by being locked:
                    every field wears the one locked background, and nothing
                    explains that in words. */}
                {/* Standing travels with the record - but only once there
                    is one. A new employee has not been created yet, so
                    there is nothing to be Active. */}
                {/* No standing beside the heading: it is already on the row
                    this record was opened from, and it is a field below. */}
                {onStep("personal") && (
                <SectionCard
                  title="Personal Details"
                  icon={isAdding ? User : undefined}
                  note={isAdding ? "Complete personal details and save to continue." : undefined}
                  footer={stepActions}
                >
                  {/* Four to a row, in the order the person is described:
                      name, birth and sex; then nationality and the papers it
                      decides; then how to reach them. Adding sets the rows
                      closer than the standard 44px, as its design does. */}
                  <div className={cn("form-grid", isAdding && "gap-y-6")}>
                    <div className="form-field space-y-2">
                      <Label htmlFor="arabicName">
                        Full Name (Arabic)
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="arabicName"
                        name="arabicName"
                        value={formData.arabicName}
                        onChange={onChange}
                        placeholder="أدخل الاسم الكامل بالعربية"
                        dir="rtl"
                        required
                      />
                    </div>

                    <div className="form-field space-y-2">
                      <Label htmlFor="employeeName">
                        Full Name (English)
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="employeeName"
                        name="employeeName"
                        value={formData.employeeName}
                        onChange={onChange}
                        placeholder="Enter full name in English"
                        required
                      />
                    </div>

                    <div className="form-field space-y-2">
                      <Label htmlFor="dateOfBirth">
                        Date of Birth
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={onChange}
                        required
                      />
                    </div>

                    <div className="form-field space-y-2" data-required={isAdding || undefined}>
                      <Label htmlFor="gender">
                        Gender
                        <Required show={asksFor} />
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => set("gender", value)}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Omani first in the list: most of the firm is. */}
                    <div className="form-field space-y-2" data-required={isAdding || undefined}>
                      <Label htmlFor="nationality">
                        Nationality
                        <Required show={asksFor} />
                      </Label>
                      <Select
                        value={formData.nationality}
                        onValueChange={(value) => set("nationality", value)}
                      >
                        <SelectTrigger id="nationality">
                          <SelectValue placeholder="Select Nationality" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {NATIONALITIES.map((nationality) => (
                            <SelectItem key={nationality} value={nationality}>
                              {nationality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* The card the person is identified by: a citizen's ID or
                        a resident's card. Adding asks for it, and every other
                        paper's number, on Identity & Immigration instead. */}
                    {!isAdding && (
                    <>
                    <div className="form-field space-y-2">
                      <Label htmlFor="civilId">
                        ID Number
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="civilId"
                        name="civilId"
                        value={formData.civilId}
                        onChange={onChange}
                        placeholder="Enter ID number"
                        required={isAdding}
                      />
                    </div>

                    <div className="form-field space-y-2">
                      <Label htmlFor="idExpiry">
                        ID Expiry Date
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="idExpiry"
                        name="idExpiry"
                        type="date"
                        value={formData.idExpiry}
                        onChange={onChange}
                      />
                    </div>
                    </>
                    )}

                    {/* A foreign employee is also identified by a passport; an
                        Omani is not asked for one, and the row closes up. */}
                    {!isAdding && formData.nationality && !isOmani && (
                      <>
                        <div className="form-field space-y-2">
                          <Label htmlFor="passportNumber">
                            Passport Number
                            <Required show={asksFor} />
                          </Label>
                          <Input
                            id="passportNumber"
                            name="passportNumber"
                            value={formData.passportNumber}
                            onChange={onChange}
                            placeholder="Enter passport number"
                            required={isAdding}
                          />
                        </div>

                        <div className="form-field space-y-2">
                          <Label htmlFor="passportExpiry">
                            Passport Expiry Date
                            <Required show={asksFor} />
                          </Label>
                          <Input
                            id="passportExpiry"
                            name="passportExpiry"
                            type="date"
                            value={formData.passportExpiry}
                            onChange={onChange}
                            required={isAdding}
                          />
                        </div>
                      </>
                    )}

                    {/* Two addresses, said apart: the firm writes to the work
                        one, and reaches a person on this one. Optional, so
                        only its form is checked, once it has been typed in. */}
                    <div className="form-field space-y-2">
                      <Label htmlFor="personalEmail">Personal Email</Label>
                      <Input
                        id="personalEmail"
                        name="personalEmail"
                        type="email"
                        value={formData.personalEmail}
                        onChange={onChange}
                        placeholder="Enter email address"
                      />
                    </div>

                    <PhoneField
                      id="phone"
                      label={<>Phone Number<Required show={asksFor} /></>}
                      placeholder="Enter phone number"
                      dialCode={formData.dialCode}
                      onDialCode={(value) => set("dialCode", value)}
                      value={formData.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      required={isAdding}
                    />

                    <div className="form-field space-y-2">
                      <Label htmlFor="address">
                        Address
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={onChange}
                        placeholder="Enter full address"
                        required={isAdding}
                      />
                    </div>

                    {/* Who to call, and on what number, if something happens */}
                    <div className="form-field space-y-2">
                      <Label htmlFor="emergencyName">
                        Emergency Contact Name
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="emergencyName"
                        name="emergencyName"
                        value={formData.emergencyName}
                        onChange={onChange}
                        placeholder="Enter contact name"
                        required={isAdding}
                      />
                    </div>

                    {/* Who they are to the employee, kept on the record. Not
                        asked for when the employee is added. */}
                    {!isAdding && (
                    <div className="form-field space-y-2">
                      <Label htmlFor="emergencyRelationship">
                        Relationship to Employee
                        <Required show={asksFor} />
                      </Label>
                      <Select
                        value={formData.emergencyRelationship}
                        onValueChange={(value) =>
                          value && set("emergencyRelationship", value)
                        }
                      >
                        <SelectTrigger id="emergencyRelationship">
                          <SelectValue placeholder="Select Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMERGENCY_RELATIONSHIPS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    )}

                    <PhoneField
                      id="emergencyPhone"
                      label={<>Emergency Contact Phone<Required show={asksFor} /></>}
                      placeholder="Enter phone number"
                      dialCode={formData.emergencyDialCode}
                      onDialCode={(value) => set("emergencyDialCode", value)}
                      value={formData.emergencyPhone}
                      onChange={(e) => set("emergencyPhone", e.target.value)}
                      required={isAdding}
                    />
                  </div>
                </SectionCard>
                )}

                {/* On a record. Adding asks for the job in its own shape,
                    further down. */}
                {!isAdding && (
                <SectionCard title="Employment Details">
                  <div className="space-y-6">
                    <div className="form-grid">
                      {/* Where the employee stands comes first: it decides
                          what else the record has to say. It is the firm's
                          business, so My Profile does not show it. */}
                      {!self && (
                        <div className="space-y-2">
                          <Label htmlFor="status">
                            Status
                            <Required show={asksFor} />
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => set("status", value)}
                          >
                            <SelectTrigger id="status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EMPLOYEE_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Given by the system, so it is shown and not asked for */}
                      <div className="space-y-2">
                        <Label htmlFor="employeeNo">
                          Employee No.
                          <Required show={asksFor} />
                        </Label>
                        <Input
                          id="employeeNo"
                          value={employeeNo}
                          readOnly
                          disabled
                          className="bg-locked"
                        />
                      </div>

                      <div className="form-field space-y-2" data-required={isAdding || undefined}>
                        <Label htmlFor="branch">
                          Branch / Work Location
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.branch}
                          onValueChange={(value) => value && set("branch", value)}
                        >
                          <SelectTrigger id="branch">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {initialBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.name}>
                                {branch.name} Branch
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <IconField
                        icon={Mail}
                        id="workEmail"
                        name="workEmail"
                        type="email"
                        label={<>Work Email<Required show={asksFor} /></>}
                        placeholder="name@firm.com"
                        value={formData.workEmail}
                        onChange={onChange}
                        required={isAdding}
                      />

                      <div className="form-field space-y-2">
                        <Label htmlFor="dateOfJoining">
                          Date of Joining
                          <Required show={asksFor} />
                        </Label>
                        <Input
                          id="dateOfJoining"
                          name="dateOfJoining"
                          type="date"
                          value={formData.dateOfJoining}
                          onChange={onChange}
                          required
                        />
                      </div>

                      {/* How the person is engaged, and - where the engagement
                          runs out - the day it does. */}
                      <div className="form-field space-y-2" data-required={isAdding || undefined}>
                        <Label htmlFor="employmentType">
                          Employment Type
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.employmentType}
                          onValueChange={(value) =>
                            value && set("employmentType", value)
                          }
                        >
                          <SelectTrigger id="employmentType">
                            <SelectValue placeholder="Select Employment Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_TYPES.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employmentEndDate">
                          Employment End Date
                        </Label>
                        <Input
                          id="employmentEndDate"
                          name="employmentEndDate"
                          type="date"
                          value={formData.employmentEndDate}
                          onChange={onChange}
                        />
                      </div>

                      <div className="form-field space-y-2" data-required={isAdding || undefined}>
                        <Label htmlFor="category">
                          Category / Role
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => set("category", value)}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select Category / Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYEE_CATEGORIES.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="form-field space-y-2" data-required={isAdding || undefined}>
                        <Label htmlFor="jobLevel">
                          Job Level
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.jobLevel}
                          onValueChange={(value) => set("jobLevel", value)}
                        >
                          <SelectTrigger id="jobLevel">
                            <SelectValue placeholder="Select Job Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {JOB_LEVELS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="form-field space-y-2" data-required={isAdding || undefined}>
                        <Label htmlFor="department">
                          Department / Division
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => set("department", value)}
                        >
                          <SelectTrigger id="department">
                            <SelectValue placeholder="Select Department / Division" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="form-field space-y-2" data-required={isAdding || undefined}>
                        <Label htmlFor="occupation">
                          Profession / Occupation
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.occupation}
                          onValueChange={(value) => set("occupation", value)}
                        >
                          <SelectTrigger id="occupation">
                            <SelectValue placeholder="Select Profession / Occupation" />
                          </SelectTrigger>
                          <SelectContent>
                            {OCCUPATIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Asked for only once the status says somebody has left */}
                    {!self && hasLeft && (
                      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                        <div className="form-grid form-grid-2">
                          <div className="space-y-2">
                            <Label htmlFor="reasonForLeaving">
                              Reason for Leaving
                            </Label>
                            <Select
                              value={formData.reasonForLeaving}
                              onValueChange={(value) =>
                                set("reasonForLeaving", value)
                              }
                            >
                              <SelectTrigger id="reasonForLeaving">
                                <SelectValue placeholder="Select Reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {LEAVING_REASONS.map((reason) => (
                                  <SelectItem key={reason} value={reason}>
                                    {reason}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lastWorkingDate">
                              Last Working Date
                            </Label>
                            <Input
                              id="lastWorkingDate"
                              name="lastWorkingDate"
                              type="date"
                              value={formData.lastWorkingDate}
                              onChange={onChange}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
                )}

                {/* The job and the contract it is held on, as a new employee
                    is taken on: where they work and what as, then the terms. */}
                {isAdding && step === "employment" && (
                  <>
                  <SectionCard title="Employment & Contract">
                    <div className="space-y-6">
                      <section>
                        <h3 className="mb-4 text-base font-bold text-primary">
                          Organizational Information
                        </h3>
                        <div className="form-grid gap-y-6">
                          {/* Nobody is taken on as having left: a new record
                              starts working or on leave, never ended. */}
                          <ChoiceField
                            id="status"
                            label="Employee Status"
                            value={formData.status}
                            onChange={(value) => set("status", value)}
                            options={EMPLOYEE_STATUSES.filter(
                              (status) => !HAS_LEFT.includes(status)
                            )}
                            required
                          />
                          <ChoiceField
                            id="branch"
                            label="Branch / Work Location"
                            placeholder="Select Branch"
                            value={formData.branch}
                            onChange={(value) => set("branch", value)}
                            options={initialBranches.map((branch) => branch.name)}
                            required
                          />
                          <ChoiceField
                            id="department"
                            label="Department / Division"
                            placeholder="Select Department"
                            value={formData.department}
                            onChange={(value) => set("department", value)}
                            options={DEPARTMENTS}
                            required
                          />
                          {/* Choosing anything but Lawyer takes the practice
                              level away with it, so no level is saved for
                              somebody who cannot hold one. */}
                          <ChoiceField
                            id="occupation"
                            label="Occupation"
                            placeholder="Select Occupation"
                            value={formData.occupation}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                occupation: value,
                                practiceLevel:
                                  value === "Lawyer" ? prev.practiceLevel : "",
                              }))
                            }
                            options={OCCUPATIONS}
                            required
                          />
                          {formData.occupation === "Lawyer" && (
                            <ChoiceField
                              id="practiceLevel"
                              label="Practice Level"
                              placeholder="Select Practice Level"
                              value={formData.practiceLevel}
                              onChange={(value) => set("practiceLevel", value)}
                              options={PRACTICE_LEVELS}
                              required
                            />
                          )}
                          <PhoneField
                            id="workPhone"
                            label="Work Phone Number"
                            placeholder="Enter work phone number"
                            dialCode={formData.workDialCode}
                            onDialCode={(value) => set("workDialCode", value)}
                            value={formData.workPhone}
                            onChange={(e) => set("workPhone", e.target.value)}
                          />
                          <div className="form-field space-y-2">
                            <Label htmlFor="workEmail">Work Email</Label>
                            <Input
                              id="workEmail"
                              name="workEmail"
                              type="email"
                              placeholder="name@firm.com"
                              value={formData.workEmail}
                              onChange={onChange}
                              required
                            />
                          </div>
                        </div>
                      </section>

                      <section className="border-t pt-6">
                        <h3 className="mb-4 text-base font-bold text-primary">
                          Contract &amp; Timeline
                        </h3>
                        <div className="form-grid gap-y-6">
                          <ChoiceField
                            id="employmentType"
                            label="Employment Type"
                            placeholder="Select Employment Type"
                            value={formData.employmentType}
                            onChange={(value) => set("employmentType", value)}
                            options={EMPLOYMENT_TYPES}
                            required
                          />
                          <ChoiceField
                            id="contractType"
                            label="Contract Type"
                            placeholder="Select Contract Type"
                            value={formData.contractType}
                            onChange={(value) => set("contractType", value)}
                            options={EMPLOYEE_CONTRACT_TYPES}
                            required
                          />
                          <div className="form-field space-y-2">
                            <Label htmlFor="dateOfJoining">Date of Joining</Label>
                            <Input
                              id="dateOfJoining"
                              name="dateOfJoining"
                              type="date"
                              value={formData.dateOfJoining}
                              onChange={onChange}
                              required
                            />
                          </div>
                          <div className="form-field space-y-2">
                            <Label htmlFor="contractStartDate">Contract Start Date</Label>
                            <Input
                              id="contractStartDate"
                              name="contractStartDate"
                              type="date"
                              value={formData.contractStartDate}
                              onChange={onChange}
                              required
                            />
                          </div>
                          {/* A fixed-term contract is one with an end, so it
                              has to be given; an open-ended one has none. */}
                          <div className="form-field space-y-2">
                            <Label htmlFor="employmentEndDate">Contract End Date</Label>
                            <Input
                              id="employmentEndDate"
                              name="employmentEndDate"
                              type="date"
                              value={formData.employmentEndDate}
                              onChange={onChange}
                              required={formData.contractType === "Fixed-term"}
                            />
                          </div>
                          {/* The one leave figure on the record. Leave taken
                              is recorded on the leave page, not here. */}
                          <div className="form-field space-y-2">
                            <Label htmlFor="annualLeaveDays">
                              Annual Leave Entitlement (Days)
                            </Label>
                            <Input
                              id="annualLeaveDays"
                              name="annualLeaveDays"
                              type="number"
                              inputMode="numeric"
                              min="0"
                              step="1"
                              placeholder="30"
                              value={formData.annualLeaveDays}
                              onChange={onChange}
                              required
                            />
                          </div>
                          <ChoiceField
                            id="socialProtection"
                            label="Social Protection Registration"
                            value={formData.socialProtection}
                            onChange={(value) => set("socialProtection", value)}
                            options={["Yes", "No"]}
                            required
                          />
                        </div>
                      </section>
                    </div>
                  </SectionCard>
                  {stepActions}
                  </>
                )}

                {/* The numbers and expiry dates of the papers that apply to
                    this person, decided by what was saved on the steps before:
                    the ID card for everybody, the lawyer's card for a lawyer,
                    passport and visa for a foreigner. Numbers only - the
                    papers themselves are filed on Documents. */}
                {isAdding && step === "identity" && (
                  <SectionCard title="Identity & Immigration" footer={stepActions}>
                    <div className="form-grid gap-y-6">
                      <PaperFields
                        label={savedOmani ? "Civil ID" : "Resident Card"}
                        numberName="civilId"
                        expiryName="idExpiry"
                        values={formData}
                        onChange={onChange}
                      />
                      {savedLawyer && (
                        <PaperFields
                          label="Lawyer Card"
                          numberName="lawyerCardNo"
                          expiryName="lawyerCardExpiry"
                          values={formData}
                          onChange={onChange}
                        />
                      )}
                      {!savedOmani && (
                        <>
                          <PaperFields
                            label="Passport"
                            numberName="passportNumber"
                            expiryName="passportExpiry"
                            values={formData}
                            onChange={onChange}
                          />
                          <PaperFields
                            label="Visa"
                            numberName="visaNo"
                            expiryName="visaExpiry"
                            values={formData}
                            onChange={onChange}
                          />
                        </>
                      )}
                    </div>
                  </SectionCard>
                )}

                  </fieldset>
                )}

                {/* The employee's papers, in a section of their own. Only once
                    the employee exists - there is nobody to file a paper
                    against before, which is why adding reaches them last. */}
                {isDocuments && (isEditMode || isAdding) && (
                  <Card>
                  <CardContent className="p-4 sm:p-6">
                  <div className="space-y-6">
                    {/* Nothing is asked for until it is asked for: the page
                        is the documents on file, and the form is opened over
                        them when there is one to add. */}
                    {/* No heading: the page above is already called Documents.
                        The firm files the papers on an employee's record; on My
                        Profile they are read, not added to. */}
                    {/* Opened over the list rather than pushed in above it,
                        the way every other form on this record opens: the
                        papers already on file stay where they were, and the
                        page does not grow a second frame while one is being
                        added. */}
                    <Dialog
                      open={addingDoc}
                      onOpenChange={(next) => !next && closeDocForm()}
                    >
                      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingDoc ? "Edit Document" : "Add Document"}
                          </DialogTitle>
                        </DialogHeader>

                      {/* What decides which papers can be filed: an Omani
                          carries an ID card, a foreigner a resident card and
                          a passport, and only a lawyer a bar card. */}
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm text-primary">
                          <Users className="h-4 w-4 shrink-0 opacity-70" />
                          Nationality:{" "}
                          <span className="font-semibold">
                            {isOmani ? "Omani" : "Non-Omani"}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm text-primary">
                          <Briefcase className="h-4 w-4 shrink-0 opacity-70" />
                          Profession / Occupation:{" "}
                          <span className="font-semibold">
                            {formData.occupation || "-"}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="docType">
                            Document Type{" "}
                            
                          </Label>
                          <div className="flex w-full min-w-0 items-center gap-2">
                            <Select
                              value={docDraft.type}
                              onValueChange={(value) =>
                                value &&
                                setDocDraft((prev) => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger id="docType" className="min-w-0 flex-1">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                {docTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* The file name lives in the tooltip, so the
                                control stays icon-sized either way. */}
                            {docFile ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0 border-green-600 text-green-600 hover:text-destructive"
                                title={docFile.name + " - click to remove"}
                                onClick={() => setDocFile(null)}
                              >
                                <FileCheck className="h-4 w-4" />
                                <span className="sr-only">
                                  {docFile.name} attached. Remove it.
                                </span>
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                title="Upload document"
                                asChild
                              >
                                <label className="cursor-pointer">
                                  <UploadIcon className="h-4 w-4" />
                                  <span className="sr-only">
                                    Upload document
                                  </span>
                                  <Input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files[0] &&
                                      setDocFile(e.target.files[0])
                                    }
                                  />
                                </label>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* A paper that runs out has to say when. */}
                        <div className="space-y-2">
                          <Label htmlFor="docExpiry">
                            Expiry Date{" "}
                            
                          </Label>
                          <Input
                            id="docExpiry"
                            type="date"
                            value={docDraft.expiry}
                            onChange={(e) =>
                              setDocDraft((prev) => ({
                                ...prev,
                                expiry: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="docNotes">Notes</Label>
                          <div className="relative">
                            <Input
                              id="docNotes"
                              maxLength={NOTES_LIMIT}
                              placeholder="Enter notes (optional)"
                              className="pe-16"
                              value={docDraft.notes}
                              onChange={(e) =>
                                setDocDraft((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                            />
                            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {docDraft.notes.length}/{NOTES_LIMIT}
                            </span>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeDocForm}
                        >
                          Cancel
                        </Button>
                        <Button type="button" onClick={addDocument}>
                          Save Document
                        </Button>
                      </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* What is already on file */}
                    <div className="space-y-4 rounded-lg border p-4">
                      {/* The list's name on the left, and the way to add to
                          it on the right - one row, not two. It gives way to
                          the form it opens. */}
                      <FormHeading title="Uploaded Documents" icon={FileText} />

                      {/* The search on the left, and the way to add on the
                          right - the one row every list in the system has. */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <AiSearch
                          value={docQuery}
                          onChange={setDocQuery}
                          placeholder="Ask about documents..."
                        />
                        {/* Kept on the row while the window is open: it is
                            behind the overlay and cannot be pressed anyway,
                            and taking it away shifts the row underneath. */}
                        {!readOnly && (
                          <Button variant="outline"
                            type="button"
                            className="ms-auto"
                            onClick={() => setAddingDoc(true)}
                          >
                            <Plus className="me-2 h-4 w-4" />
                            Add Document
                          </Button>
                        )}
                      </div>

                      {shownDocuments.length === 0 ? (
                        <EmptyState>No documents uploaded yet.</EmptyState>
                      ) : (
                        <RecordTable minWidth={980}>
                          <HeadRow>
                            <Th width="8%">Serial No.</Th>
                            <Th width="16%">Upload Date</Th>
                            <Th width="26%">Document Type &amp; Attachment</Th>
                            <Th width="16%">Expiry Date</Th>
                            <Th width="26%">Notes</Th>
                            {!readOnly && <Th width="8%">Delete</Th>}
                          </HeadRow>
                          <tbody>
                            {shownDocuments.map((document) => {
                              const Icon = fileIcon(document.fileName);
                              const status = documentStatus(document);
                              return (
                                <Row key={document.id}>
                                  {/* The serial number opens the paper back
                                      into the form above, to be replaced or
                                      corrected. */}
                                  <Td className="align-top">
                                    {readOnly ? (
                                      <span className="font-medium text-primary">
                                        {serialOf.get(document.id)}
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => editDocument(document)}
                                        className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                      >
                                        {serialOf.get(document.id)}
                                      </button>
                                    )}
                                    {/* Only a paper that needs chasing says so;
                                        an active one is the normal case and
                                        carries no badge. */}
                                    {status && status !== "Active" && (
                                      <span
                                        className={cn(
                                          "mt-1 flex w-fit items-center gap-1.5 whitespace-nowrap text-xs font-semibold",
                                          status === "Expired"
                                            ? "text-destructive"
                                            : "text-amber-600"
                                        )}
                                      >
                                        <span
                                          aria-hidden="true"
                                          className="h-2 w-2 shrink-0 rounded-full bg-current"
                                        />
                                        {status}
                                      </span>
                                    )}
                                  </Td>

                                  <Td className="whitespace-nowrap align-top">
                                    {formatUploadedAt(document.uploadedAt)}
                                  </Td>

                                  <Td className="align-top">
                                    <span className="block">
                                      {document.type}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openDocument(document)}
                                      className="mt-1 inline-flex items-center gap-1.5 rounded text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                      <Icon
                                        className={cn(
                                          "h-4 w-4 shrink-0",
                                          isImage(document.fileName)
                                            ? "text-green-600"
                                            : "text-red-600"
                                        )}
                                      />
                                      {document.fileName}
                                    </button>
                                  </Td>

                                  {/* When it runs out. Whether it has is
                                      said under the serial number. */}
                                  <Td className="whitespace-nowrap align-top">
                                    {document.expiry ? (
                                      <span className="block">
                                        {formatDate(document.expiry)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </Td>

                                  <Td className="align-top text-muted-foreground">
                                    {document.notes || "-"}
                                  </Td>

                                  {/* Taken off the record by the firm, never
                                      from My Profile, which only reads - so
                                      there the column is not drawn at all
                                      rather than left labelled and empty. */}
                                  {!readOnly && (
                                    <Td className="text-center align-top">
                                      <button
                                        type="button"
                                        onClick={() => setRemovingDoc(document)}
                                        title={"Delete " + document.fileName}
                                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                        <span className="sr-only">
                                          Delete {document.fileName}
                                        </span>
                                      </button>
                                    </Td>
                                  )}
                                </Row>
                              );
                            })}
                          </tbody>
                        </RecordTable>
                      )}
                    </div>

                    {/* A deleted paper cannot be brought back, so the X asks
                        once before it takes one off the record. */}
                    <Dialog
                      open={Boolean(removingDoc)}
                      onOpenChange={(open) => !open && setRemovingDoc(null)}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete document</DialogTitle>
                          <DialogDescription>
                            {removingDoc?.type} - {removingDoc?.fileName} will be
                            removed from this employee's documents.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRemovingDoc(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={removeDocument}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {stepActions && (
                    <div className="mt-6 border-t pt-4">{stepActions}</div>
                  )}
                  </CardContent>
                  </Card>
                )}

                {activeSection === "benefits" && (
                  <FinancialBenefitsSection
                    employee={formData}
                    tab={benefitsTab}
                    onTabChange={setBenefitsTab}
                    canEdit={!readOnly}
                    onSaveSalary={(payslip) =>
                      setFormData((prev) => ({ ...prev, ...payslip }))
                    }
                  />
                )}

                {activeSection === "entitlements" && (
                  <EntitlementsSection
                    employee={formData}
                    canEdit={!readOnly}
                  />
                )}

                {activeSection === "daily" && (
                  <DailyActivitiesSection employee={formData} />
                )}

                {activeSection === "circulars" && (
                  <EmployeeCircularsSection employee={formData} self={self} />
                )}

                {activeSection === "performance" && <PerformanceSection />}

                {activeSection === "violations" && (
                  <ViolationsSection employee={formData} canEdit={!readOnly} />
                )}

                {activeSection === "leaves" && (
                  <LeavesSection employee={formData} canReview={!readOnly} />
                )}

                {activeSection === "generalRequest" && (
                  <GeneralRequestSection employee={formData} canDecide={!readOnly} />
                )}

                {/* Not yet specified, so nothing is invented for it */}
                {activeSection === "permissions" && (
                  <EmptyState>{current.label} is not set up yet.</EmptyState>
                )}

                {/* Save at the end of what it saves, where the last field
                    leaves off. A section that saves its own records has
                    nothing here: there is no draft on the page to save. */}
                {!isAdding && !current.noSave && !readOnly && (
                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="me-2 h-4 w-4" />
                      {current.save || "Save"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
