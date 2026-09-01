import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
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
  Briefcase,
  FileText,
  Wallet,
  HandCoins,
  HeartHandshake,
  CalendarClock,
  Gauge,
  MapPin,
  ShieldCheck,
  Phone,
  Mail,
  UploadCloud,
  FileCheck,
  FileImage,
} from "lucide-react";
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
  EMPLOYEE_DOCUMENT_TYPES,
} from "@/lib/constants";
import SalariesSection from "./sections/SalariesSection";
import LoansSection from "./sections/LoansSection";
import AssistanceSection from "./sections/AssistanceSection";
import DailyActivitiesSection from "./sections/DailyActivitiesSection";
import PerformanceSection from "./sections/PerformanceSection";
import {
  employeeRecords,
  nextEmployeeNo,
  employeeDocuments,
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
    key: "information",
    label: "Employee Information",
    title: "Employee",
    icon: User,
    note: "Employee profile and basic information",
  },
  {
    key: "job",
    label: "Job Description",
    icon: Briefcase,
    note: "Define and manage employee job description details",
  },
  {
    key: "addresses",
    label: "Addresses",
    icon: MapPin,
    note: "Manage employee contact and address details",
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
    note: "Manage employee documents and attachments",
    save: "Save Changes",
  },
  {
    key: "salaries",
    label: "Salaries / Allowances",
    icon: Wallet,
    note: "Manage employee salaries, allowances, and other payments",
    // The payment form saves itself, so the header offers to jump to it.
    action: "Add Salary / Allowance",
  },
  {
    key: "loans",
    label: "Loans",
    icon: HandCoins,
    note: "Manage loans taken by the firm",
    // The loan form saves itself, so the header offers to jump to it.
    action: "Add Loan",
  },
  {
    key: "assistance",
    label: "Assistance",
    icon: HeartHandshake,
    note: "Manage financial assistance and charitable aid",
    // The assistance form saves itself, so the header offers to jump to it.
    action: "Add Assistance",
  },
  {
    key: "daily",
    label: "Daily Activities",
    icon: CalendarClock,
    note: "Record today's working time and activities",
    save: "Save Daily Activity",
  },
  {
    key: "performance",
    label: "Performance Evaluation",
    icon: Gauge,
    note: "Statistics collected by the system from recorded activity",
  },
  {
    key: "permissions",
    label: "System Permissions",
    icon: ShieldCheck,
    note: "What this employee may see and change",
  },
];

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
      <div className="flex gap-2">
        <Select
          value={dialCode || DEFAULT_DIAL_CODE}
          onValueChange={onDialCode}
        >
          <SelectTrigger className="w-24 shrink-0" aria-label="Country code">
            {/* The trigger shows the code alone. The flag and country belong
                in the list, where they are what you choose by; once chosen,
                the code is the only part that is dialled. */}
            <SelectValue>{dialCode || DEFAULT_DIAL_CODE}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_DIAL_CODES.map((country) => (
              <SelectItem key={country.code} value={country.dial}>
                {country.flag} {country.dial}
                {/* Dimmed by opacity, not by a fixed grey: the row turns navy
                    on hover, and a grey that reads on white vanishes on it. */}
                <span className="opacity-70"> {country.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          className="flex-1"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
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

const STATUS_DOT = {
  Active: "bg-green-500",
  "On Leave": "bg-amber-500",
  Inactive: "bg-muted-foreground",
  Terminated: "bg-red-500",
};

/** How much of a note the field will take, shown as a count while typing. */
const NOTES_LIMIT = 300;

/** The first field of the form a section's header button jumps to. */
const JUMP_TARGET = {
  salaries: "salary-expense-type",
  loans: "loan-expense-type",
  assistance: "assistance-expense-type",
};

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



  dialCode: DEFAULT_DIAL_CODE,
  phone: "",
  email: "",
  address: "",
  emergencyName: "",
  emergencyDialCode: DEFAULT_DIAL_CODE,
  emergencyPhone: "",
};

const toFormData = (record) =>
  record ? { ...emptyFormData, ...record } : emptyFormData;

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const record = isEditMode
    ? employeeRecords.find((e) => e.id === Number(id)) || null
    : null;

  const [activeSection, setActiveSection] = useState("information");
  const [formData, setFormData] = useState(() => toFormData(record));

  // Reload when the route moves to a different employee without unmounting.
  const [loadedId, setLoadedId] = useState(id);
  if (id !== loadedId) {
    setLoadedId(id);
    setFormData(toFormData(record));
    setActiveSection("information");
  }

  // Papers are a list of their own, kept beside the fields rather than in them.
  const [documents, setDocuments] = useState(employeeDocuments);
  const [docDraft, setDocDraft] = useState({ type: "", notes: "" });
  const [docFile, setDocFile] = useState(null);

  const addDocument = () => {
    if (!docDraft.type || !docFile) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    setDocuments((prev) => [
      {
        id: prev.reduce((max, d) => Math.max(max, d.id), 0) + 1,
        uploadedAt:
          now.getFullYear() +
          "-" +
          pad(now.getMonth() + 1) +
          "-" +
          pad(now.getDate()) +
          "T" +
          pad(now.getHours()) +
          ":" +
          pad(now.getMinutes()),
        type: docDraft.type,
        fileName: docFile.name,
        fileUrl: URL.createObjectURL(docFile),
        notes: docDraft.notes,
      },
      ...prev,
    ]);
    setDocDraft({ type: "", notes: "" });
    setDocFile(null);
  };

  const openDocument = (doc) => {
    if (doc.fileUrl) window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  const set = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));
  const onChange = (e) => set(e.target.name, e.target.value);

  const current = SECTIONS.find((s) => s.key === activeSection) || SECTIONS[0];
  const employeeNo = record?.empNo || nextEmployeeNo(employeeRecords);
  const hasLeft = HAS_LEFT.includes(formData.status);

  // The section saves itself lower down, so the header brings the form to the
  // top of the screen rather than pretending to save from up here.
  const jumpToForm = () => {
    const field = window.document.getElementById(
      JUMP_TARGET[activeSection] || "salary-expense-type"
    );
    if (!field) return;
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isEditMode ? "Updating employee:" : "Creating employee:", {
      ...formData,
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
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              {current.title || current.label}
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">{current.note}</p>
          </div>
        </div>
        {current.action ? (
          <Button type="button" onClick={jumpToForm}>
            <Plus className="mr-2 h-4 w-4" />
            {current.action}
          </Button>
        ) : (
          <Button type="submit" form="employee-form">
            <Save className="mr-2 h-4 w-4" />
            {current.save ||
              (activeSection === "information"
                ? "Save Employee"
                : "Save " + current.label)}
          </Button>
        )}
      </div>

      <div className="flex flex-col items-start gap-4 sm:gap-6 lg:flex-row">
        {/* Section navigation */}
        <Card className="w-full lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto">
          <CardContent className="p-3">
            <p className="mb-2 border-b px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Employee Details
            </p>
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
              {SECTIONS.map((section) => {
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

        <div className="w-full flex-1">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-6 flex items-center gap-3 border-b pb-3">
                <h2 className="text-base font-semibold text-primary">
                  {current.label}
                </h2>
                {/* Standing travels with the record, whichever side is open */}
                <span className="inline-flex items-center gap-1.5 text-sm">
                  {formData.status}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2 w-2 rounded-full",
                      STATUS_DOT[formData.status] || "bg-muted-foreground"
                    )}
                  />
                </span>
              </div>

              <form id="employee-form" onSubmit={handleSubmit}>
                {activeSection === "information" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                      {/* Given by the system, so it is shown and not asked for */}
                      <div className="space-y-2">
                        <Label htmlFor="employeeNo">Employee No. *</Label>
                        <Input
                          id="employeeNo"
                          value={employeeNo}
                          readOnly
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="arabicName">Full Name (Arabic) *</Label>
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
                          Full Name (English) *
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
                        <Label htmlFor="nationality">Nationality *</Label>
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
                        <Label htmlFor="gender">Gender *</Label>
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
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={onChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                        <Input
                          id="dateOfJoining"
                          name="dateOfJoining"
                          type="date"
                          value={formData.dateOfJoining}
                          onChange={onChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
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
                    </div>

                    {/* Asked for only once the status says somebody has left */}
                    {hasLeft && (
                      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          A status of {formData.status} needs the reason and the
                          last day worked on record.
                        </p>

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
                )}

                {activeSection === "job" && (
                  <div className="space-y-6">
                    <p className="font-semibold text-primary">
                      Job Description Information
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category / Role *</Label>
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
                        <Label htmlFor="jobLevel">Job Level *</Label>
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
                          Department / Division *
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
                          Profession / Occupation *
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
                  </div>
                )}

                {activeSection === "documents" && (
                  <div className="space-y-6">
                    {/* Add a document */}
                    <div className="rounded-lg border p-4">
                      <p className="mb-4 font-semibold text-primary">
                        Add Document
                      </p>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="docType">
                            Document Type{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex gap-2">
                            <Select
                              value={docDraft.type}
                              onValueChange={(value) =>
                                setDocDraft((prev) => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger id="docType" className="flex-1">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                {EMPLOYEE_DOCUMENT_TYPES.map((type) => (
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
                                  <UploadCloud className="h-4 w-4" />
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

                        <div className="space-y-2 sm:col-span-2">
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

                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={addDocument}
                          disabled={!docDraft.type || !docFile}
                        >
                          Add Document
                        </Button>
                      </div>
                    </div>

                    {/* What is already on file */}
                    <div className="rounded-lg border">
                      <p className="border-b p-4 font-semibold text-primary">
                        Uploaded Documents
                      </p>

                      {documents.length === 0 ? (
                        <div className="p-6">
                          <EmptyState>No documents uploaded yet.</EmptyState>
                        </div>
                      ) : (
                        <div className="overflow-x-auto p-4 pt-0">
                          <table className="mt-4 w-full min-w-[720px] border text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                                <th className="p-3 font-semibold">No.</th>
                                <th className="p-3 font-semibold">
                                  Upload Date
                                </th>
                                <th className="p-3 font-semibold">
                                  Document Type &amp; Attachment
                                </th>
                                <th className="p-3 font-semibold">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {documents.map((document, index) => {
                                const Icon = fileIcon(document.fileName);
                                return (
                                  <tr
                                    key={document.id}
                                    className="border-b transition-colors last:border-0 hover:bg-primary/10"
                                  >
                                    {/* The row number opens the paper it stands for */}
                                    <td className="p-3 align-top">
                                      <button
                                        type="button"
                                        onClick={() => openDocument(document)}
                                        className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                                      >
                                        {index + 1}
                                      </button>
                                    </td>
                                    <td className="whitespace-nowrap p-3 align-top">
                                      {formatUploadedAt(document.uploadedAt)}
                                    </td>
                                    <td className="p-3 align-top">
                                      <span className="block">
                                        {document.type}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openDocument(document)}
                                        className="mt-1 inline-flex items-center gap-1.5 rounded text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
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
                                    </td>
                                    <td className="p-3 align-top text-muted-foreground">
                                      {document.notes || "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "salaries" && <SalariesSection />}

                {activeSection === "loans" && <LoansSection />}

                {activeSection === "assistance" && <AssistanceSection />}

                {activeSection === "daily" && <DailyActivitiesSection />}

                {activeSection === "performance" && <PerformanceSection />}

                {activeSection === "addresses" && (
                  <div className="space-y-6">
                    <p className="font-semibold text-primary">
                      Contact &amp; Address Information
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                      <PhoneField
                        id="phone"
                        label="Phone Number *"
                        placeholder="Enter phone number"
                        dialCode={formData.dialCode}
                        onDialCode={(value) => set("dialCode", value)}
                        value={formData.phone}
                        onChange={(e) => set("phone", e.target.value)}
                      />

                      <IconField
                        icon={Mail}
                        id="email"
                        name="email"
                        type="email"
                        label="Email Address *"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={onChange}
                      />

                      <IconField
                        icon={MapPin}
                        id="address"
                        name="address"
                        label="Address *"
                        placeholder="Enter full address"
                        value={formData.address}
                        onChange={onChange}
                      />

                      {/* Who to call, and on what number, if something happens */}
                      <IconField
                        icon={User}
                        id="emergencyName"
                        name="emergencyName"
                        label="Emergency Contact Name *"
                        placeholder="Enter emergency contact name"
                        value={formData.emergencyName}
                        onChange={onChange}
                      />

                      <PhoneField
                        id="emergencyPhone"
                        label="Emergency Contact Phone Number *"
                        placeholder="Enter emergency contact phone number"
                        dialCode={formData.emergencyDialCode}
                        onDialCode={(value) => set("emergencyDialCode", value)}
                        value={formData.emergencyPhone}
                        onChange={(e) => set("emergencyPhone", e.target.value)}
                      />
                    </div>

                    <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-secondary p-4 text-sm text-primary">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="font-semibold">Note: </span>
                        Please provide accurate contact details to ensure
                        effective communication in case of emergencies.
                      </span>
                    </p>
                  </div>
                )}

                {/* Not yet specified, so nothing is invented for them */}
                {["permissions"].includes(
                  activeSection
                ) && <EmptyState>{current.label} is not set up yet.</EmptyState>}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
