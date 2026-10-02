import { Fragment, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecordSidebar from "@/components/shared/RecordSidebar";
import DateField from "@/components/shared/DateField";
import PageHeader from "@/components/shared/PageHeader";
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
  FileSpreadsheet,
  Eye,
  CloudUpload,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Gavel,
  CircleCheck,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { amountValue } from "@/lib/money";
import { readDocumentControl } from "@/lib/settings/documentControl";
import { Rial } from "@/components/shared/Rial";
import { EmptyState } from "@/components/shared/panels";
import {
  NATIONALITIES,
  GENDERS,
  EMPLOYEE_CATEGORIES,
  JOB_LEVELS,
  DEPARTMENTS,
  JOB_TITLES,
  EMPLOYEE_STATUSES,
  DECISION_MAKERS,
  MANAGEMENT_DECISION_REASONS,
  LEAVING_REASONS,
  DEFAULT_DIAL_CODE,
  COUNTRY_DIAL_CODES,
  EMERGENCY_RELATIONSHIPS,
  EMPLOYMENT_TYPES,
  EMPLOYEE_CONTRACT_TYPES,
  PRACTICE_LEVELS,
  RECEIVING_BANKS,
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
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { formatDate } from "@/pages/firm/firmData";
import {
  employeeRecords,
  employeeDocuments,
  nextEmployeeNo,
  documentsFor,
  documentTypesFor,
  documentStatus,
  documentCategory,
  isVersioned,
  documentVersions,
  accessHold,
  documentExpires,
  hasRelatedRecord,
  relatedExpiry,
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
  // Pay once the person and the job are settled.
  { key: "salary", label: "Salary & Banking" },
  // Only for somebody registered with the Fund, as Employment says; anybody
  // else skips it.
  {
    key: "socialProtection",
    label: "Social Protection",
    when: (values) => values.socialProtection === "Yes",
  },
  // Not a step in the sequence: papers can be filed whenever there is an
  // employee to file them against, so the tab opens once Personal Details is
  // saved and the record is finished without it.
  { key: "documents", label: "Documents", standalone: true },
];

/** The sections a record with these values is saved through, in order. */
const flowFor = (values) =>
  ADD_STEPS.filter((s) => !s.standalone && (!s.when || s.when(values)));

/** Said under the tabs while the draft is being built, where no step says more. */
const DRAFT_NOTE = "Draft employee · sections are saved one at a time";

/**
 * Social Protection Fund contributions, as a share of basic pay.
 *
 * The employee's 7% is what payroll already holds back as the social
 * insurance contribution on every record; the employer's share is the Fund's
 * published rate. Both are the firm's to confirm - they are here, once, so
 * changing a rate changes it everywhere it is worked out.
 */
const SPF_EMPLOYEE_RATE = 0.07;
const SPF_EMPLOYER_RATE = 0.115;

/** The pay a new employee is taken on at, in the order it is asked for. */
const PAY_FIELDS = [
  { key: "salary", label: "Basic Salary", required: true },
  { key: "special", label: "Special Allowance" },
  { key: "housing", label: "Housing Allowance" },
  // Not `phone`: that is the employee's own number.
  { key: "phoneAllowance", label: "Phone Allowance" },
  { key: "electricity", label: "Electricity Allowance" },
  { key: "transport", label: "Transport Allowance" },
];

/** What comes off each month's pay. */
/**
 * What comes off the pay every month.
 *
 * Three of the four are counted off records the firm already holds - the
 * loans, the advances, the disciplinary decisions - so they are shown rather
 * than asked for. Typing over a figure that is worked out elsewhere only
 * creates a second answer to the same question. The fourth is for whatever
 * those three do not cover, and that one is typed.
 */
const DEDUCTION_FIELDS = [
  {
    key: "loan",
    label: "Loan Installment",
    note: "Auto-calculated from active loan(s)",
  },
  {
    key: "salaryAdvance",
    label: "Salary Advance Deduction",
    note: "Auto-calculated from active salary advance(s)",
  },
  {
    key: "disciplinary",
    label: "Disciplinary Deduction",
    note: "Auto-calculated from active disciplinary record(s)",
  },
  { key: "otherDeduction", label: "Other Deduction" },
];

/** Today as a date field holds it, in local time rather than UTC's. */
const todayIso = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
};

const sumOf = (fields, values) =>
  fields.reduce((total, field) => total + Number(values[field.key] || 0), 0);

/**
 * The bar of steps across the top of Add Employee.
 *
 * A step that has been saved carries a green check and stays open to go back
 * to; the one being filled in is underlined; the rest wait, greyed, until the
 * step before them is saved.
 */
function StepTabs({ steps, active, done, canOpen, onSelect }) {
  return (
    <nav aria-label="Add employee steps" className="overflow-x-auto">
      <ol className="flex min-w-max border-b border-container-border">
        {steps.map((step, index) => {
          const isDone = done.includes(step.key);
          const isActive = step.key === active;
          const reachable = canOpen(step.key);
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
 * What each field may hold, checked as it is typed.
 *
 * A wrong character - Arabic in the English name, a letter in a phone number -
 * is wrong the moment it is typed, so it is said at once, under the field,
 * rather than on Save. Whole-value checks that are only wrong once finished,
 * like an email address, wait until the field is left. Keyed by the field's
 * name, or its id where a field has no name.
 */
const FIELD_RULES = {
  arabicName: { allowed: /^[؀-ۿ\s]*$/, message: "Arabic letters only." },
  employeeName: { allowed: /^[A-Za-z\s.'-]*$/, message: "English letters only." },
  emergencyName: { allowed: /^[A-Za-z؀-ۿ\s.'-]*$/, message: "Letters only." },
  phone: { allowed: /^[0-9\s-]*$/, message: "Numbers only." },
  emergencyPhone: { allowed: /^[0-9\s-]*$/, message: "Numbers only." },
  workPhone: { allowed: /^[0-9\s-]*$/, message: "Numbers only." },
  civilId: { allowed: /^[0-9]*$/, message: "Numbers only." },
  passportNumber: { allowed: /^[A-Za-z0-9]*$/, message: "English letters and numbers only." },
  visaNo: { allowed: /^[A-Za-z0-9-]*$/, message: "English letters and numbers only." },
  workPermitNo: { allowed: /^[A-Za-z0-9-]*$/, message: "English letters and numbers only." },
  lawyerCardNo: { allowed: /^[A-Za-z0-9-]*$/, message: "English letters and numbers only." },
  spRegistrationNo: { allowed: /^[A-Za-z0-9-]*$/, message: "English letters and numbers only." },
  accountNumber: { allowed: /^[0-9\s]*$/, message: "Numbers only." },
  iban: { allowed: /^[A-Za-z0-9\s]*$/, message: "English letters and numbers only." },
  swiftCode: { allowed: /^[A-Za-z0-9]*$/, message: "English letters and numbers only." },
};

/** Whether a field holds something its rule does not allow. */
const ruleBroken = (name, value) => {
  const rule = FIELD_RULES[name];
  return Boolean(rule && value && !rule.allowed.test(value));
};

/** What is wrong with a field, said under it the moment it is wrong. */
function RuleNote({ name, value }) {
  if (!ruleBroken(name, value)) return null;
  return (
    <p role="alert" className="field-error">
      {FIELD_RULES[name].message}
    </p>
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
        invalid={ruleBroken(id, value)}
      />
      <RuleNote name={id} value={value} />
    </div>
  );
}

/**
 * A labelled choice from a fixed list.
 *
 * `required` marks the cell for the save check, which reads an unchosen select
 * by the placeholder its trigger is still showing.
 */
function ChoiceField({
  id,
  label,
  placeholder,
  value,
  onChange,
  options,
  required,
  // A field whose choices depend on another is shut until that one is
  // answered: an empty list of options says nothing about why it is empty.
  disabled,
}) {
  return (
    <div className="form-field space-y-2" data-required={required || undefined}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => next && onChange(next)}
        disabled={disabled}
      >
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

/**
 * An amount in Rials, the currency written inside the box after the figure.
 *
 * Put to three places once the person leaves it, because a Baisa is a
 * thousandth and "19" and "19.000" should not both be on one payslip.
 * `locked` shows a figure the page works out rather than asks for.
 */
function MoneyField({ id, label, value, onChange, required, locked, note }) {
  return (
    <div className="form-field space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {locked ? (
          <Input
            id={id}
            value={amountValue(value)}
            readOnly
            tabIndex={-1}
            className="bg-locked pe-14"
          />
        ) : (
          <Input
            id={id}
            name={id}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.001"
            placeholder="0.000"
            value={value}
            onChange={onChange}
            onBlur={(e) =>
              e.target.value !== "" &&
              onChange({
                target: { name: id, value: Number(e.target.value).toFixed(3) },
              })
            }
            required={required}
            className="pe-14"
          />
        )}
        <Rial className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
      </div>
      {/* Where a figure is worked out rather than asked for, the box says so
          under itself - a greyed field with no reason given reads as broken. */}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** What holding access is called once it has happened. */
const HELD_AS = { "Restrict access": "restricted", "Suspend access": "suspended" };

/**
 * Said at the head of a record whose critical paper has lapsed: amber while
 * the grace period runs, with the day it runs out; red once access is held.
 */
function AccessNotice({ hold, graceDays }) {
  const held = hold.state === "held";
  const outcome = HELD_AS[hold.action] || "held";
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        held
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      )}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">
          {held ? "Access " + outcome : "Grace period"}
        </span>
        {" - "}
        {held
          ? `${hold.type} expired on ${formatDate(hold.expiry)} and was not renewed within the ${graceDays}-day grace period.`
          : `${hold.type} expired on ${formatDate(hold.expiry)}. Renew it by ${formatDate(hold.until)} or access will be ${outcome}.`}
      </p>
    </div>
  );
}

/** One figure of the coming payroll: what it is, then the amount. */
function PayTile({ label, value, className }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-sm text-primary/75">{label}</p>
      <p className={cn("text-xl font-bold text-primary", className)}>
        {amountValue(value)} <Rial className="text-sm font-medium" />
      </p>
    </div>
  );
}

/**
 * One side of a salary statement: each line that has an amount, then its
 * total. Lines at nothing are left out - a statement lists what is paid.
 */
function StatementLines({ title, fields, values, total, totalLabel }) {
  const lines = fields.filter((field) => Number(values[field.key] || 0) > 0);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-primary">{title}</p>
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        lines.map((field) => (
          <div key={field.key} className="flex items-center justify-between text-sm">
            <span className="text-primary/75">{field.label}</span>
            <span className="text-primary">
              {amountValue(values[field.key])} <Rial />
            </span>
          </div>
        ))
      )}
      <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
        <span className="text-primary">{totalLabel}</span>
        <span className="text-primary">
          {amountValue(total)} <Rial />
        </span>
      </div>
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
          aria-invalid={ruleBroken(numberName, values[numberName]) || undefined}
          required
        />
        <RuleNote name={numberName} value={values[numberName]} />
      </div>
      <div className="form-field space-y-2">
        <Label htmlFor={expiryName}>{label} Expiry Date</Label>
        <DateField
          id={expiryName}
          name={expiryName}
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
const emptyDocument = { category: "", type: "", expiry: "", notes: "" };

/** Said in place of the upload when the paper's details are not on file yet. */
const UPLOAD_BLOCKED =
  "This document cannot be uploaded yet. Please complete the required information first in the relevant section.";

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

/**
 * How each standing of a paper is marked: green while it holds, amber as it
 * runs out, red once it has, and grey once a newer version has been filed.
 */
const DOCUMENT_STATUS_PILL = {
  Active: "border-green-200 bg-green-50 text-green-700",
  "Expiring Soon": "border-amber-200 bg-amber-50 text-amber-700",
  Expired: "border-red-200 bg-red-50 text-red-700",
  Archived: "border-slate-200 bg-slate-100 text-slate-600",
};

/** Somebody who has left, and so owes the record a reason and a last day. */
const HAS_LEFT = ["Inactive"];

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
  workPermitNo: "",
  workPermitExpiry: "",
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
  decisionMaker: "",
  managementReason: "",
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

  // Pay, from the day it takes effect. Basic pay is `salary`, as on every
  // record; the allowances and deductions use the keys the net is worked from.
  salary: "",
  special: "",
  housing: "",
  phoneAllowance: "",
  electricity: "",
  transport: "",
  loan: "",
  salaryAdvance: "",
  disciplinary: "",
  otherDeduction: "",
  salaryEffectiveDate: "",
  // Where it is paid to.
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  iban: "",
  swiftCode: "",

  // The Fund's own number for the employee, and when they were registered.
  spRegistrationNo: "",
  spRegistrationDate: "",
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
  // The salary statement, opened over the pay step to read before saving.
  const [showStatement, setShowStatement] = useState(false);
  const savedOmani = String(saved.nationality || "").trim().toLowerCase() === "omani";
  const savedLawyer = saved.occupation === "Lawyer";
  const formRef = useRef(null);

  // A page that sends somebody here can say which section to open - a newly
  // added employee opens on Documents, the next thing they need.
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(
    () => location.state?.section || "information"
  );
  // Which side of Financial Benefits is open. Held here because the tabs
  // that choose it sit in the section's heading, which this page draws.
  const [benefitsTab, setBenefitsTab] = useState("salaries");
  // The section whose add form is open, if any. Held here because the button
  // that opens it lives in the page header, above the section itself.
  // A new employee's pay takes effect from today unless somebody says when.
  const [formData, setFormData] = useState(() =>
    record ? toFormData(record) : { ...emptyFormData, salaryEffectiveDate: todayIso() }
  );

  // Papers are a list of their own, kept beside the fields rather than in them.
  // This person's papers, not every paper in the firm.
  const [documents, setDocuments] = useState(() => documentsFor(record?.id));
  const [docDraft, setDocDraft] = useState(emptyDocument);
  const [docFile, setDocFile] = useState(null);
  // The page is the list of documents until someone asks to add to it.
  const [addingDoc, setAddingDoc] = useState(false);
  // Whether Save has been tried without a copy attached, so it can say so.
  const [docTried, setDocTried] = useState(false);
  const docFormRef = useRef(null);

  /** Back to the list, with nothing half-written left behind. */
  const closeDocForm = () => {
    setAddingDoc(false);
    setDocDraft(emptyDocument);
    setDocFile(null);
    setDocTried(false);
  };

  /** A new choice clears what depended on the old one. */
  const chooseCategory = (category) => {
    setDocDraft({ ...emptyDocument, category });
    setDocFile(null);
  };
  const chooseType = (type) => {
    setDocDraft((prev) => ({ ...prev, type, expiry: "" }));
    setDocFile(null);
  };

  // Reload when the route moves to a different employee without unmounting.
  const [loadedId, setLoadedId] = useState(id);
  if (id !== loadedId) {
    setLoadedId(id);
    // The same fresh start the page gives when it first opens: a record's own
    // details, or a blank employee whose pay starts today.
    setFormData(
      record ? toFormData(record) : { ...emptyFormData, salaryEffectiveDate: todayIso() }
    );
    setDocuments(documentsFor(record?.id));
    setActiveSection(location.state?.section || "information");
    // Nothing of an earlier employee being added carries over to the next.
    setStep(ADD_STEPS[0].key);
    setSavedSteps([]);
    setSaved({});
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

  // A paper is filed with its copy, and with its expiry if it is a kind that
  // runs out. It is never corrected in place: a newer one of the same kind is
  // added and the old one becomes Replaced.
  const canSaveDocument =
    docDraft.type && docFile && (!documentExpires(docDraft.type) || docDraft.expiry);

  const addDocument = () => {
    setDocTried(true);
    if (!checkRequired(docFormRef.current) || !canSaveDocument) return;
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

    setDocuments((prev) => [
      {
        id: prev.reduce((max, d) => Math.max(max, d.id), 0) + 1,
        employeeId: record?.id,
        uploadedAt,
        type: docDraft.type,
        expiry: docDraft.expiry,
        ...file,
        notes: docDraft.notes,
      },
      ...prev,
    ]);
    closeDocForm();
  };

  const openDocument = (doc) => {
    if (doc.fileUrl) window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  // Newest paper first.
  const orderedDocuments = [...documents].sort(
    (a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)) || b.id - a.id
  );

  // Whether this person's access is held for a lapsed critical paper, under
  // the grace period and action set on System Settings.
  const documentControl = readDocumentControl();
  const hold = isEditMode ? accessHold(documents, documentControl) : null;

  // The papers whose earlier versions are open under them.
  const [openHistory, setOpenHistory] = useState([]);
  const toggleHistory = (type) =>
    setOpenHistory((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

  /**
   * One paper on the list. A versioned paper says which version it is; the
   * current one also offers the versions before it, which open underneath,
   * set in and greyed, as the archived record they are.
   */
  const documentRow = (document, status, { version, older = 0, historyOpen, archivedRow } = {}) => (
    <Row key={document.id} className={cn(archivedRow && "bg-muted/40")}>
      <Td className={cn(archivedRow && "ps-8 text-muted-foreground")}>
        {archivedRow ? "" : documentCategory(document.type)}
      </Td>
      <Td>
        <span className={cn(archivedRow && "text-muted-foreground")}>{document.type}</span>
        {version && (
          <span className="block text-xs text-muted-foreground">
            Version {version}
            {!archivedRow && " · Current"}
          </span>
        )}
        {older > 0 && (
          <button
            type="button"
            onClick={() => toggleHistory(document.type)}
            aria-expanded={historyOpen}
            className="mt-1 inline-flex items-center gap-1 rounded text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {historyOpen ? (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            )}
            Version history ({older})
          </button>
        )}
      </Td>
      <Td className="whitespace-nowrap">{formatDate(document.uploadedAt)}</Td>
      <Td className="whitespace-nowrap">
        {document.expiry ? (
          formatDate(document.expiry)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </Td>
      <Td className="text-center">
        <button
          type="button"
          onClick={() => openDocument(document)}
          title={"View " + (document.fileName || document.type)}
          className="rounded p-1.5 text-primary transition-colors hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">View {document.fileName || document.type}</span>
        </button>
      </Td>
      <Td>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold",
            DOCUMENT_STATUS_PILL[status]
          )}
        >
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-current" />
          {status}
        </span>
      </Td>
    </Row>
  );

  // Which papers this employee can file at all, and what decides it.
  const isOmani =
    String(formData.nationality || "").trim().toLowerCase() === "omani";
  const docTypes = documentTypesFor(formData);
  // The details a paper stands for, as saved: on a record, the record; while
  // adding, Identity & Immigration once that step has been saved.
  const filedDetails = isAdding
    ? savedSteps.includes("identity")
      ? saved
      : {}
    : record || {};
  const docCategories = [...new Set(docTypes.map(documentCategory))];
  const typesInCategory = docTypes.filter(
    (type) => documentCategory(type) === docDraft.category
  );
  // A paper whose details are not on file yet cannot be uploaded.
  const uploadBlocked =
    Boolean(docDraft.type) && !hasRelatedRecord(docDraft.type, filedDetails);

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
   * The finished employee, filed with the others and opened as a record.
   *
   * Held in the session's lists until there is a server to send it to - so
   * the record page, the list and the papers all find it - along with any
   * papers filed while it was being added.
   */
  const finishEmployee = () => {
    const newId = employeeRecords.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    employeeRecords.push({
      ...toRecord(formData),
      id: newId,
      empNo: employeeNo,
      // What the list shows a person as doing.
      designation: formData.occupation,
      role: formData.occupation,
    });
    let docId = employeeDocuments.reduce((max, d) => Math.max(max, d.id), 0);
    documents.forEach((document) => {
      docId += 1;
      employeeDocuments.push({ ...document, id: docId, employeeId: newId });
    });
    // Opened on Documents: the details are in, and the papers are next.
    navigate("/employees/" + newId, { state: { section: "documents" } });
  };

  /**
   * Saves the step on screen and opens the next one.
   *
   * Nothing moves on while a required field is empty: the check marks the
   * gaps and takes the cursor to the first, and the step stays where it is.
   * Which step is next is read from what is being saved now - Social
   * Protection only follows for somebody registered - and the last one
   * finishes the employee and opens their record.
   */
  const saveStep = () => {
    if (!checkRequired(formRef.current)) return;
    // Filled but in the wrong shape - an email with no @ - holds the step too,
    // and the cursor is taken to it; the field already says what is wrong.
    // So does a character the field does not allow, already said under it.
    const misshapen = [...formRef.current.querySelectorAll("input")].find(
      (input) =>
        !input.disabled &&
        input.value &&
        (!input.checkValidity() || ruleBroken(input.name || input.id, input.value))
    );
    if (misshapen) {
      misshapen.scrollIntoView({ block: "center", behavior: "smooth" });
      misshapen.focus({ preventScroll: true });
      return;
    }
    console.log("Saving " + step + ":", { ...toRecord(formData), empNo: employeeNo });
    setSavedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    setSaved(formData);

    const flow = flowFor(formData);
    const next = flow[flow.findIndex((s) => s.key === step) + 1];
    if (!next) {
      finishEmployee();
      return;
    }
    setStep(next.key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The steps on the bar: every one that applies to what has been saved.
  const shownSteps = ADD_STEPS.filter((s) => !s.when || s.when(saved));
  const savedFlow = flowFor(saved);
  // The section before this one, to go back to without losing anything.
  const previousStep = savedFlow[savedFlow.findIndex((s) => s.key === step) - 1];
  // A tab opens once it has been saved or is the one being filled in; the
  // papers open as soon as there is an employee to file them against.
  const canOpen = (key) =>
    savedSteps.includes(key) ||
    key === step ||
    (key === "documents" && savedSteps.includes("personal"));

  // The month's pay, worked out from its parts rather than typed, so the
  // totals can never disagree with the lines they add up.
  const gross = sumOf(PAY_FIELDS, formData);
  const held = sumOf(DEDUCTION_FIELDS, formData);
  const net = gross - held;
  const today = todayIso();
  const effective = formData.salaryEffectiveDate;
  // A salary starting later is scheduled; it is paid from the first payroll
  // on or after the day it starts.
  const scheduled = Boolean(effective) && effective > today;
  const payrollMonth = new Date((scheduled ? effective : today) + "T00:00").toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );
  const currentStep = ADD_STEPS.find((s) => s.key === step) || ADD_STEPS[0];
  // What goes to the Social Protection Fund each month, on the basic pay.
  const spEmployee = Number(formData.salary || 0) * SPF_EMPLOYEE_RATE;
  const spEmployer = Number(formData.salary || 0) * SPF_EMPLOYER_RATE;

  // The step's way back, and Cancel and Save, at the end of what they act on.
  // Documents is filed paper by paper, so it has nothing to save here.
  const stepActions = isAdding && (
    <div className="flex flex-wrap items-center gap-3">
      {previousStep && (
        <Button type="button" variant="ghost" onClick={() => setStep(previousStep.key)}>
          Back to previous saved section
        </Button>
      )}
      <div className="ms-auto flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate("/employees")}>
          Cancel
        </Button>
        {step !== "documents" && (
          <Button type="submit">
            <Save className="me-2 h-4 w-4" />
            Save
          </Button>
        )}
      </div>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // The documents page saves each paper with its own button; Enter in one
    // of its fields must not save, or leave, the record around it.
    if (isDocuments) return;
    if (isAdding) {
      // Enter in the documents search must search, not save a section.
      if (step !== "documents") saveStep();
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
          {hold && <AccessNotice hold={hold} graceDays={documentControl.graceDays} />}
          {isAdding && (
            <div className="space-y-2">
              <StepTabs
                steps={shownSteps}
                active={step}
                done={savedSteps}
                canOpen={canOpen}
                onSelect={setStep}
              />
              {/* What the step asks for, where the step says it; otherwise,
                  once there is a draft, that it is saved a section at a time. */}
              {(currentStep.hint || savedSteps.length > 0) && (
                <p className="text-sm text-primary/75">
                  {currentStep.hint || DRAFT_NOTE}
                </p>
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
                        aria-invalid={ruleBroken("arabicName", formData.arabicName) || undefined}
                        required
                      />
                      <RuleNote name="arabicName" value={formData.arabicName} />
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
                        aria-invalid={ruleBroken("employeeName", formData.employeeName) || undefined}
                        required
                      />
                      <RuleNote name="employeeName" value={formData.employeeName} />
                    </div>

                    <div className="form-field space-y-2">
                      <Label htmlFor="dateOfBirth">
                        Date of Birth
                        <Required show={asksFor} />
                      </Label>
                      <DateField
                        id="dateOfBirth"
                        name="dateOfBirth"
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
                        aria-invalid={ruleBroken("civilId", formData.civilId) || undefined}
                        required={isAdding}
                      />
                      <RuleNote name="civilId" value={formData.civilId} />
                    </div>

                    <div className="form-field space-y-2">
                      <Label htmlFor="idExpiry">
                        ID Expiry Date
                        <Required show={asksFor} />
                      </Label>
                      <DateField
                        id="idExpiry"
                        name="idExpiry"
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
                          <DateField
                            id="passportExpiry"
                            name="passportExpiry"
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
                        aria-invalid={ruleBroken("emergencyName", formData.emergencyName) || undefined}
                        required={isAdding}
                      />
                      <RuleNote name="emergencyName" value={formData.emergencyName} />
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
                        <DateField
                          id="dateOfJoining"
                          name="dateOfJoining"
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
                        <DateField
                          id="employmentEndDate"
                          name="employmentEndDate"
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

                      {/* The department is chosen first and decides which
                          titles there are. Changing it clears the title and
                          any lawyer grade under it, so a record cannot keep a
                          title its department does not have. */}
                      <div className="form-field space-y-2" data-required={isAdding || undefined}>
                        <Label htmlFor="department">
                          Department
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              department: value,
                              occupation: "",
                              practiceLevel: "",
                            }))
                          }
                        >
                          <SelectTrigger id="department">
                            <SelectValue placeholder="Select department" />
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
                          Job Title
                          <Required show={asksFor} />
                        </Label>
                        <Select
                          value={formData.occupation}
                          disabled={!formData.department}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              occupation: value,
                              practiceLevel:
                                value === "Lawyer" ? prev.practiceLevel : "",
                            }))
                          }
                        >
                          <SelectTrigger id="occupation">
                            <SelectValue
                              placeholder={
                                formData.department
                                  ? "Select job title"
                                  : "Select a department first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(JOB_TITLES[formData.department] || []).map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Only a lawyer holds a grade, so only a lawyer is
                          asked for one. */}
                      {formData.occupation === "Lawyer" && (
                        <div className="form-field space-y-2">
                          <Label htmlFor="practiceLevelRecord">Lawyer Grade</Label>
                          <Select
                            value={formData.practiceLevel}
                            onValueChange={(value) => set("practiceLevel", value)}
                          >
                            <SelectTrigger id="practiceLevelRecord">
                              <SelectValue placeholder="Select lawyer grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRACTICE_LEVELS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
                            <DateField
                              id="lastWorkingDate"
                              name="lastWorkingDate"
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
                          {/* Inactive asks who decided it, and the firm's
                              own decision asks on what ground. Each answer is
                              dropped when the one above it changes, so a
                              record cannot keep a reason for an ending that
                              is no longer there. */}
                          <ChoiceField
                            id="status"
                            label="Employee Status"
                            value={formData.status}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                status: value,
                                decisionMaker:
                                  value === "Inactive" ? prev.decisionMaker : "",
                                managementReason:
                                  value === "Inactive" ? prev.managementReason : "",
                              }))
                            }
                            options={EMPLOYEE_STATUSES}
                            required
                          />
                          {formData.status === "Inactive" && (
                            <ChoiceField
                              id="decisionMaker"
                              label="Decision Maker"
                              placeholder="Select decision maker"
                              value={formData.decisionMaker}
                              onChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  decisionMaker: value,
                                  managementReason:
                                    value === "Management Decision"
                                      ? prev.managementReason
                                      : "",
                                }))
                              }
                              options={DECISION_MAKERS}
                              required
                            />
                          )}
                          {formData.decisionMaker === "Management Decision" && (
                            <ChoiceField
                              id="managementReason"
                              label="Management Decision Reason"
                              placeholder="Select reason"
                              value={formData.managementReason}
                              onChange={(value) => set("managementReason", value)}
                              options={MANAGEMENT_DECISION_REASONS}
                              required
                            />
                          )}
                          <ChoiceField
                            id="branch"
                            label="Branch / Work Location"
                            placeholder="Select Branch"
                            value={formData.branch}
                            onChange={(value) => set("branch", value)}
                            options={initialBranches.map((branch) => branch.name)}
                            required
                          />
                          {/* The department is chosen first and decides what
                              titles there are to choose from. Changing it
                              clears the title under it: a Partner who becomes
                              an Administrator cannot stay a Managing Partner
                              while nobody is looking. */}
                          <ChoiceField
                            id="department"
                            label="Department"
                            placeholder="Select department"
                            value={formData.department}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                department: value,
                                occupation: "",
                                practiceLevel: "",
                              }))
                            }
                            options={DEPARTMENTS}
                            required
                          />
                          {/* Choosing anything but Lawyer takes the practice
                              level away with it, so no level is saved for
                              somebody who cannot hold one. */}
                          <ChoiceField
                            id="occupation"
                            label="Job Title"
                            placeholder={
                              formData.department
                                ? "Select job title"
                                : "Select a department first"
                            }
                            value={formData.occupation}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                occupation: value,
                                practiceLevel:
                                  value === "Lawyer" ? prev.practiceLevel : "",
                              }))
                            }
                            options={JOB_TITLES[formData.department] || []}
                            disabled={!formData.department}
                            required
                          />
                          {formData.occupation === "Lawyer" && (
                            <ChoiceField
                              id="practiceLevel"
                              label="Lawyer Grade"
                              placeholder="Select lawyer grade"
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
                            <DateField
                              id="dateOfJoining"
                              name="dateOfJoining"
                              value={formData.dateOfJoining}
                              onChange={onChange}
                              required
                            />
                          </div>
                          <div className="form-field space-y-2">
                            <Label htmlFor="contractStartDate">Contract Start Date</Label>
                            <DateField
                              id="contractStartDate"
                              name="contractStartDate"
                              value={formData.contractStartDate}
                              onChange={onChange}
                              required
                            />
                          </div>
                          {/* A fixed-term contract is one with an end, so it
                              has to be given; an open-ended one has none. */}
                          <div className="form-field space-y-2">
                            <Label htmlFor="employmentEndDate">Contract End Date</Label>
                            <DateField
                              id="employmentEndDate"
                              name="employmentEndDate"
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
                          <PaperFields
                            label="Work Permit"
                            numberName="workPermitNo"
                            expiryName="workPermitExpiry"
                            values={formData}
                            onChange={onChange}
                          />
                        </>
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* What the employee is paid, what comes off it, where it is
                    sent, and what the first payroll will come to. */}
                {isAdding && step === "salary" && (
                  <>
                    <SectionCard title="Salary Information">
                      <div className="form-grid gap-y-6">
                        {PAY_FIELDS.map((field) => (
                          <MoneyField
                            key={field.key}
                            id={field.key}
                            label={field.label}
                            value={formData[field.key]}
                            onChange={onChange}
                            required={field.required}
                          />
                        ))}
                        <MoneyField
                          id="grossSalary"
                          label="Gross Salary"
                          value={gross}
                          locked
                          note="Auto-calculated from salary components"
                        />
                        <div className="form-field space-y-2">
                          <Label htmlFor="salaryEffectiveDate">Effective Date</Label>
                          <div className="flex items-center gap-2">
                            <DateField
                              id="salaryEffectiveDate"
                              name="salaryEffectiveDate"
                              value={formData.salaryEffectiveDate}
                              onChange={onChange}
                              required
                              className="min-w-0 flex-1"
                            />
                            {scheduled && (
                              <span className="shrink-0 rounded-md border border-primary px-2.5 py-1.5 text-xs font-semibold text-primary">
                                Scheduled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {scheduled && (
                        <p className="mt-4 text-sm text-primary/75">
                          Effective {formatDate(effective)}. Current salary remains in
                          force until that date.
                        </p>
                      )}
                    </SectionCard>

                    <SectionCard title="Recurring Deductions">
                      <p className="mb-6 flex items-start gap-2 rounded-md bg-menu-hover p-3 text-sm text-primary">
                        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        Recurring deductions are automatically calculated from
                        active loans, salary advances and disciplinary records.
                        Manual entry is allowed only for other deductions.
                      </p>
                      <div className="form-grid gap-y-6">
                        {DEDUCTION_FIELDS.map((field) => (
                          <MoneyField
                            key={field.key}
                            id={field.key}
                            label={field.label}
                            value={formData[field.key]}
                            onChange={onChange}
                            note={field.note}
                            locked={Boolean(field.note)}
                          />
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard title="Bank Information">
                      <div className="form-grid gap-y-6">
                        <ChoiceField
                          id="bankName"
                          label="Bank Name"
                          placeholder="Select Bank"
                          value={formData.bankName}
                          onChange={(value) => set("bankName", value)}
                          options={RECEIVING_BANKS}
                          required
                        />
                        <div className="form-field space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={onChange}
                            placeholder="Enter account number"
                            inputMode="numeric"
                            aria-invalid={ruleBroken("accountNumber", formData.accountNumber) || undefined}
                            required
                          />
                          <RuleNote name="accountNumber" value={formData.accountNumber} />
                        </div>
                        <div className="form-field space-y-2">
                          <Label htmlFor="accountHolder">Account Holder Name</Label>
                          <Input
                            id="accountHolder"
                            name="accountHolder"
                            value={formData.accountHolder}
                            onChange={onChange}
                            placeholder="Enter account holder name"
                            required
                          />
                        </div>

                        <div className="form-field space-y-2">
                          <Label htmlFor="iban">IBAN</Label>
                          <Input
                            id="iban"
                            name="iban"
                            value={formData.iban}
                            onChange={onChange}
                            placeholder="Enter IBAN"
                            aria-invalid={ruleBroken("iban", formData.iban) || undefined}
                            required
                          />
                          <RuleNote name="iban" value={formData.iban} />
                        </div>
                        {/* Only a transfer abroad needs it, so it is not
                            demanded of an Omani bank account. */}
                        <div className="form-field space-y-2">
                          <Label htmlFor="swiftCode">SWIFT Code</Label>
                          <Input
                            id="swiftCode"
                            name="swiftCode"
                            value={formData.swiftCode}
                            onChange={onChange}
                            placeholder="Enter SWIFT code"
                            aria-invalid={ruleBroken("swiftCode", formData.swiftCode) || undefined}
                          />
                          <RuleNote name="swiftCode" value={formData.swiftCode} />
                        </div>
                      </div>
                    </SectionCard>

                    {/* The first payroll this pay goes into, worked out from
                        the lines above as they are typed. An estimate: the
                        month's own absences and changes settle the final
                        figure when payroll is run. */}
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h2 className="text-lg font-bold text-primary">
                          Next Payroll <span aria-hidden="true">•</span> {payrollMonth}
                        </h2>
                        <div className="mt-4 grid items-center gap-4 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                          <PayTile label="Gross Salary" value={gross} />
                          <PayTile label="Total Recurring Deductions" value={held} />
                          <PayTile
                            label="Estimated Net Salary"
                            value={net}
                            className={net < 0 ? "text-destructive" : "text-emerald-700"}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="justify-self-start font-semibold text-primary"
                            onClick={() => setShowStatement(true)}
                          >
                            View Salary Statement
                            <ArrowRight className="ms-2 h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                        <p className="mt-3 text-sm text-primary/75">
                          {amountValue(gross)} &minus; {amountValue(held)} ={" "}
                          {amountValue(net)} · Final amount is confirmed at payroll
                          processing.
                        </p>
                      </CardContent>
                    </Card>

                    {stepActions}

                    <Dialog open={showStatement} onOpenChange={setShowStatement}>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Salary Statement · {payrollMonth}</DialogTitle>
                          <DialogDescription>
                            {saved.employeeName || formData.employeeName} · Employee No.{" "}
                            {employeeNo}
                          </DialogDescription>
                        </DialogHeader>
                        <StatementLines
                          title="Earnings"
                          fields={PAY_FIELDS}
                          values={formData}
                          total={gross}
                          totalLabel="Gross Salary"
                        />
                        <StatementLines
                          title="Deductions"
                          fields={DEDUCTION_FIELDS}
                          values={formData}
                          total={held}
                          totalLabel="Total Deductions"
                        />
                        <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
                          <span className="text-primary">Estimated Net Salary</span>
                          <span className={net < 0 ? "text-destructive" : "text-emerald-700"}>
                            {amountValue(net)} <Rial />
                          </span>
                        </div>
                        {formData.bankName && (
                          <p className="text-sm text-primary/75">
                            Paid to {formData.bankName}
                            {formData.accountNumber && " · " + formData.accountNumber}
                          </p>
                        )}
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {/* The Fund's number and date are asked for; what is paid into
                    it is worked out from the basic pay saved on Salary &
                    Banking, and payroll is where those figures come from. */}
                {isAdding && step === "socialProtection" && (
                  <SectionCard title="Social Protection" icon={ShieldCheck} footer={stepActions}>
                    <div className="form-grid gap-y-6">
                      <div className="form-field space-y-2">
                        <Label htmlFor="spRegistrationNo">Registration No.</Label>
                        <Input
                          id="spRegistrationNo"
                          name="spRegistrationNo"
                          value={formData.spRegistrationNo}
                          onChange={onChange}
                          placeholder="Enter registration number"
                          aria-invalid={ruleBroken("spRegistrationNo", formData.spRegistrationNo) || undefined}
                          required
                        />
                        <RuleNote name="spRegistrationNo" value={formData.spRegistrationNo} />
                      </div>
                      <div className="form-field space-y-2">
                        <Label htmlFor="spRegistrationDate">Registration Date</Label>
                        <DateField
                          id="spRegistrationDate"
                          name="spRegistrationDate"
                          value={formData.spRegistrationDate}
                          onChange={onChange}
                          required
                        />
                      </div>
                      <MoneyField
                        id="spEmployee"
                        label="Employee Contribution"
                        value={spEmployee}
                        locked
                      />
                      <MoneyField
                        id="spEmployer"
                        label="Employer Contribution"
                        value={spEmployer}
                        locked
                      />
                      <MoneyField
                        id="spTotal"
                        label="Total Contribution"
                        value={spEmployee + spEmployer}
                        locked
                      />
                      <div className="form-field space-y-2">
                        <Label htmlFor="spSource">Data Source</Label>
                        <Input id="spSource" value="Payroll" readOnly tabIndex={-1} className="bg-locked" />
                      </div>
                      <div className="form-field space-y-2">
                        <Label htmlFor="spUpdated">Last Updated</Label>
                        <Input
                          id="spUpdated"
                          value={formatDate(today)}
                          readOnly
                          tabIndex={-1}
                          className="bg-locked"
                        />
                      </div>
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
                    {/* What is on file. A paper is never corrected or taken
                        off: a new one of the same kind is added, and the old
                        one stays on the list as Replaced - so the file shows
                        what was held and when, not only what is held now. */}
                    <div className="space-y-4">
                      {/* The list's name, and the way to add to it, on one row. */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                        <div className="flex items-center gap-3">
                          <span aria-hidden="true" className="h-8 w-1 rounded-full bg-primary" />
                          <FileText
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className="size-7 shrink-0 text-primary"
                          />
                          <div>
                            <h2 className="text-xl font-bold text-primary">Employee Documents</h2>
                            {addingDoc && (
                              <p className="text-sm text-primary/75">Add Document</p>
                            )}
                          </div>
                        </div>
                        {/* Gone while the form is open: it is the form. */}
                        {!readOnly && !addingDoc && (
                          <Button type="button" variant="add" onClick={() => setAddingDoc(true)}>
                            <Plus className="me-2 h-4 w-4" />
                            Add Document
                          </Button>
                        )}
                      </div>

                      {/* Asked for a step at a time: the category, then the
                          type and its copy, then - once the copy is attached -
                          when it runs out and anything to note. A paper that
                          stands for details not yet saved on the record cannot
                          be uploaded until they are. */}
                      {addingDoc ? (
                        <div ref={docFormRef} className="space-y-6">
                          <div className="form-grid gap-y-6">
                            <ChoiceField
                              id="docCategory"
                              label="Document Category"
                              placeholder="Select category"
                              value={docDraft.category}
                              onChange={chooseCategory}
                              options={docCategories}
                              required
                            />

                            {docDraft.category && (
                              <div
                                className="form-field space-y-2"
                                data-required="true"
                              >
                                <Label htmlFor="docType">Document Type</Label>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={docDraft.type}
                                    onValueChange={(value) => value && chooseType(value)}
                                  >
                                    <SelectTrigger id="docType" className="min-w-0 flex-1">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {typesInCategory.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {/* Open only once there is a type, and only
                                      when its details are on file. */}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-primary [&_svg]:size-6"
                                    disabled={!docDraft.type || uploadBlocked}
                                    title="Upload document"
                                    asChild={Boolean(docDraft.type) && !uploadBlocked}
                                  >
                                    {docDraft.type && !uploadBlocked ? (
                                      <label className="cursor-pointer">
                                        <CloudUpload aria-hidden="true" />
                                        <span className="sr-only">Upload document</span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setDocFile(file);
                                            // Started from the expiry the record
                                            // already holds for this paper.
                                            setDocDraft((prev) => ({
                                              ...prev,
                                              expiry:
                                                prev.expiry ||
                                                relatedExpiry(prev.type, filedDetails),
                                            }));
                                          }}
                                        />
                                      </label>
                                    ) : (
                                      <span>
                                        <CloudUpload aria-hidden="true" />
                                        <span className="sr-only">Upload document</span>
                                      </span>
                                    )}
                                  </Button>
                                </div>
                                {uploadBlocked && (
                                  <p role="alert" className="text-xs text-destructive">
                                    {UPLOAD_BLOCKED}
                                  </p>
                                )}
                                {docFile && (
                                  <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-sm text-primary">
                                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{docFile.name}</span>
                                    <CircleCheck
                                      aria-hidden="true"
                                      className="size-4 shrink-0 fill-green-600 text-white"
                                    />
                                  </span>
                                )}
                                {docTried && docDraft.type && !uploadBlocked && !docFile && (
                                  <p className="text-xs text-destructive">
                                    Upload the document to save it.
                                  </p>
                                )}
                              </div>
                            )}

                            {docFile && documentExpires(docDraft.type) && (
                              <div className="form-field space-y-2">
                                <Label htmlFor="docExpiry">Expiry Date</Label>
                                <DateField
                                  id="docExpiry"
                                  value={docDraft.expiry}
                                  onChange={(e) =>
                                    setDocDraft((prev) => ({ ...prev, expiry: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                            )}

                            {docFile && (
                              <div className="form-field space-y-2">
                                <Label htmlFor="docNotes">Notes</Label>
                                <Input
                                  id="docNotes"
                                  maxLength={NOTES_LIMIT}
                                  placeholder="Enter notes"
                                  value={docDraft.notes}
                                  onChange={(e) =>
                                    setDocDraft((prev) => ({ ...prev, notes: e.target.value }))
                                  }
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={closeDocForm}>
                              Cancel
                            </Button>
                            <Button type="button" onClick={addDocument}>
                              <Save className="me-2 h-4 w-4" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : orderedDocuments.length === 0 ? (
                        <EmptyState>No documents uploaded yet.</EmptyState>
                      ) : (
                        <RecordTable minWidth={860}>
                          <HeadRow>
                            <Th width="20%">Document Category</Th>
                            <Th width="20%">Document Type</Th>
                            <Th width="15%">Upload Date</Th>
                            <Th width="15%">Expiry Date</Th>
                            <Th width="12%" className="text-center">Document</Th>
                            <Th width="18%">Status</Th>
                          </HeadRow>
                          <tbody>
                            {/* One row for each paper held now - the current
                                version of a versioned paper stands for all of
                                its versions, and the older ones open under it. */}
                            {orderedDocuments
                              .filter((document) => documentStatus(document, documents) !== "Archived")
                              .map((document) => {
                                const versions = isVersioned(document.type)
                                  ? documentVersions(document.type, documents)
                                  : [];
                                const older = versions.slice(0, -1).reverse();
                                const historyOpen = openHistory.includes(document.type);
                                return (
                                  <Fragment key={document.id}>
                                    {documentRow(document, documentStatus(document, documents), {
                                      version: versions.length || null,
                                      older: older.length,
                                      historyOpen,
                                    })}
                                    {historyOpen &&
                                      older.map((version) =>
                                        documentRow(version, "Archived", {
                                          version: version.version,
                                          archivedRow: true,
                                        })
                                      )}
                                  </Fragment>
                                );
                              })}
                          </tbody>
                        </RecordTable>
                      )}
                    </div>
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
