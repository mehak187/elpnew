import { useState } from "react";
import UploadIcon from "@/components/shared/UploadIcon";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
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

  CalendarClock,
  Megaphone,
  Gauge,
  Lock,
  CalendarCheck,
  ShieldCheck,
  ClipboardList,
  MapPin,
  Phone,
  Mail,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  Trash2,
  Briefcase,
  Users,
  Gavel,
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
  employeeDocuments,
  documentTypesFor,
  documentStatus,
  formatUploadedAt,
} from "./employeeData";

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
    label: "Employee Profile",
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
 * A phone number and the country it belongs to.
 *
 * The dial code is a field of its own rather than something typed into the
 * number, so a number can be dialled without guessing which country it is
 * from - and so two people cannot write the same number two ways.
 */
function PhoneField({ id, label, placeholder, dialCode, onDialCode, value, onChange }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <PhoneInput
        id={id}
        dialCode={dialCode}
        onDialCode={onDialCode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

/** A labelled field with its own icon sitting inside the box. */
function IconField({ icon, id, label, ...props }) {
  const Icon = icon;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input id={id} className="pl-9" {...props} />
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
function SectionCard({ title, aside, children }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3 border-b pb-3">
          <h2 className="border-s-4 border-primary ps-3 text-lg font-bold text-primary">{title}</h2>
          {aside}
        </div>
        {children}
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

  const [activeSection, setActiveSection] = useState("information");
  // Which side of Financial Benefits is open. Held here because the tabs
  // that choose it sit in the section's heading, which this page draws.
  const [benefitsTab, setBenefitsTab] = useState("salaries");
  // The section whose add form is open, if any. Held here because the button
  // that opens it lives in the page header, above the section itself.
  const [formData, setFormData] = useState(() => toFormData(record));

  // Papers are a list of their own, kept beside the fields rather than in them.
  const [documents, setDocuments] = useState(employeeDocuments);
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
    if (!canSaveDocument) return;
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
  const shownDocuments = smartSearch(orderedDocuments, docQuery);

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
  const isInfo = activeSection === "information";
  // Both of these draw their own boxes, so the page's card steps out of the
  // way rather than drawing a border around borders.
  const isDocuments = activeSection === "documents";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isEditMode ? "Updating employee:" : "Creating employee:", {
      ...toRecord(formData),
      empNo: employeeNo,
    });
    navigate("/employees");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallback="/employees" />
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

      <div className="flex flex-col items-start gap-4 sm:gap-6 lg:flex-row">
        {/* Section navigation */}
        <Card className="w-full lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto">
          <CardContent className="p-3">
            <p className="mb-2 border-b px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Employee Details
            </p>
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={cn(
                      "flex items-center gap-2.5 text-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                      activeSection === section.key
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* min-w-0 or the column will not shrink: a flex child sizes itself to
            its widest content by default, so one wide table in here would
            stretch the whole page and push the sidebar off screen. */}
        <div className="w-full min-w-0 flex-1">
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
                onSubmit={handleSubmit}
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
                <SectionCard title="Personal Details">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                    <div className="space-y-2">
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

                    <div className="space-y-2">
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

                    <div className="space-y-2">
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

                    <div className="space-y-2">
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

                    <div className="space-y-2">
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

                    {/* The card the person is identified by. The copy of it
                        is filed on the Documents page, with the rest. */}
                    <div className="space-y-2">
                      <Label htmlFor="civilId">
                        Civil ID / Resident Card No.
                        <Required show={asksFor} />
                      </Label>
                      <Input
                        id="civilId"
                        name="civilId"
                        value={formData.civilId}
                        onChange={onChange}
                        placeholder="Enter civil ID or resident card number"
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
                    />

                    {/* Two addresses, said apart: the firm writes to the work
                        one, and reaches a person on the other. */}
                    <IconField
                      icon={Mail}
                      id="personalEmail"
                      name="personalEmail"
                      type="email"
                      label="Personal Email"
                      placeholder="Enter personal email address"
                      value={formData.personalEmail}
                      onChange={onChange}
                    />

                    <IconField
                      icon={MapPin}
                      id="address"
                      name="address"
                      label={<>Address<Required show={asksFor} /></>}
                      placeholder="Enter full address"
                      value={formData.address}
                      onChange={onChange}
                    />

                    {/* Who to call, and on what number, if something happens */}
                    <IconField
                      icon={User}
                      id="emergencyName"
                      name="emergencyName"
                      label={<>Emergency Contact Name<Required show={asksFor} /></>}
                      placeholder="Enter emergency contact name"
                      value={formData.emergencyName}
                      onChange={onChange}
                    />

                    {/* Who they are to the employee: whoever answers that call
                        needs to know who they are speaking to. */}
                    <div className="space-y-2">
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

                    <PhoneField
                      id="emergencyPhone"
                      label={<>Emergency Contact Phone Number<Required show={asksFor} /></>}
                      placeholder="Enter emergency contact phone number"
                      dialCode={formData.emergencyDialCode}
                      onDialCode={(value) => set("emergencyDialCode", value)}
                      value={formData.emergencyPhone}
                      onChange={(e) => set("emergencyPhone", e.target.value)}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Employment Details">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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

                      <div className="space-y-2">
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
                      />

                      <div className="space-y-2">
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
                      <div className="space-y-2">
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

                      <div className="space-y-2">
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

                      <div className="space-y-2">
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

                      <div className="space-y-2">
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

                      <div className="space-y-2">
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
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
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

                  </fieldset>
                )}

                {/* The employee's papers, in a section of their own. Only once
                    the employee exists - there is nobody to file a paper
                    against before. */}
                {isDocuments && isEditMode && (
                  <Card>
                  <CardContent className="p-4 sm:p-6">
                  <div className="space-y-6">
                    {/* Nothing is asked for until it is asked for: the page
                        is the documents on file, and the form is opened over
                        them when there is one to add. */}
                    {/* No heading: the page above is already called Documents.
                        The firm files the papers on an employee's record; on My
                        Profile they are read, not added to. */}
                    {addingDoc && (
                    <div className="rounded-lg border p-4">
                      <div className="mb-4">
                        <FormHeading
                          title={editingDoc ? "Edit Document" : "Add Document"}
                          icon={FileText}
                        />
                      </div>

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
                              className="pr-16"
                              value={docDraft.notes}
                              onChange={(e) =>
                                setDocDraft((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {docDraft.notes.length}/{NOTES_LIMIT}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeDocForm}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={addDocument}
                          disabled={!canSaveDocument}
                        >
                          Save Document
                        </Button>
                      </div>
                    </div>
                    )}

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
                        {!readOnly && !addingDoc && (
                          <Button
                            type="button"
                            className="ml-auto"
                            onClick={() => setAddingDoc(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
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
                            <Th width="16%">Expiry Date &amp; Status</Th>
                            <Th width="26%">Notes</Th>
                            <Th width="8%">Delete</Th>
                          </HeadRow>
                          <tbody>
                            {shownDocuments.map((document, index) => {
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
                                        {shownDocuments.length - index}
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => editDocument(document)}
                                        className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                      >
                                        {shownDocuments.length - index}
                                      </button>
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

                                  {/* When it runs out, and whether it has. */}
                                  <Td className="whitespace-nowrap align-top">
                                    {document.expiry ? (
                                      <>
                                        <span className="block">
                                          {formatDate(document.expiry)}
                                        </span>
                                        <span
                                          className={cn(
                                            "mt-1 inline-flex items-center gap-1.5 text-xs font-semibold",
                                            status === "Active"
                                              ? "text-green-700"
                                              : "text-destructive"
                                          )}
                                        >
                                          <span
                                            aria-hidden="true"
                                            className="h-2 w-2 shrink-0 rounded-full bg-current"
                                          />
                                          {status}
                                        </span>
                                      </>
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
                                      from My Profile, which only reads. */}
                                  <Td className="text-center align-top">
                                    {!readOnly && (
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
                                    )}
                                  </Td>
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

                {activeSection === "daily" && <DailyActivitiesSection />}

                {activeSection === "circulars" && (
                  <EmployeeCircularsSection employee={formData} />
                )}

                {activeSection === "performance" && <PerformanceSection />}

                {activeSection === "violations" && (
                  <ViolationsSection employee={formData} canEdit={!readOnly} />
                )}

                {activeSection === "leaves" && (
                  <LeavesSection employee={formData} />
                )}

                {activeSection === "generalRequest" && (
                  <GeneralRequestSection employee={formData} />
                )}

                {/* Not yet specified, so nothing is invented for it */}
                {activeSection === "permissions" && (
                  <EmptyState>{current.label} is not set up yet.</EmptyState>
                )}

                {/* Save at the end of what it saves, where the last field
                    leaves off. A section that saves its own records has
                    nothing here: there is no draft on the page to save. */}
                {!current.noSave && !readOnly && (
                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
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
