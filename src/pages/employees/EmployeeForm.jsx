import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Info,
  User,
  Briefcase,
  FileText,
  Wallet,
  HandCoins,
  Gauge,
  MapPin,
  ShieldCheck,
  Phone,
  Mail,
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
} from "@/lib/constants";
import { employeeRecords, nextEmployeeNo } from "./employeeData";

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
    note: "Identity papers and what they expire on",
  },
  { key: "salary", label: "Salary", icon: Wallet, note: "Basic pay" },
  {
    key: "allowances",
    label: "Allowances & Loans",
    icon: HandCoins,
    note: "What is paid on top, and what is owed back",
  },
  {
    key: "performance",
    label: "Performance Evaluation",
    icon: Gauge,
    note: "Reviews and how they went",
  },
  {
    key: "permissions",
    label: "System Permissions",
    icon: ShieldCheck,
    note: "What this employee may see and change",
  },
];

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

  nationalIdentityExpire: "",
  passportExpire: "",
  visaExpire: "",
  lawyerCardExpire: "",

  salary: "",

  phone: "",
  email: "",
  address: "",
  emergencyName: "",
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

  const set = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));
  const onChange = (e) => set(e.target.name, e.target.value);

  const current = SECTIONS.find((s) => s.key === activeSection) || SECTIONS[0];
  const employeeNo = record?.empNo || nextEmployeeNo(employeeRecords);
  const hasLeft = HAS_LEFT.includes(formData.status);

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
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary text-primary hover:bg-accent"
            onClick={() => navigate("/employees")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              {activeSection === "information"
                ? isEditMode
                  ? formData.employeeName || "Employee"
                  : "New Employee"
                : current.label}
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">{current.note}</p>
          </div>
        </div>
        <Button type="submit" form="employee-form">
          <Save className="mr-2 h-4 w-4" />
          {activeSection === "information" ? "Save Employee" : "Save " + current.label}
        </Button>
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nationalIdentityExpire">
                        National ID Expiry
                      </Label>
                      <Input
                        id="nationalIdentityExpire"
                        name="nationalIdentityExpire"
                        type="date"
                        value={formData.nationalIdentityExpire}
                        onChange={onChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passportExpire">Passport Expiry</Label>
                      <Input
                        id="passportExpire"
                        name="passportExpire"
                        type="date"
                        value={formData.passportExpire}
                        onChange={onChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visaExpire">Visa Expiry</Label>
                      <Input
                        id="visaExpire"
                        name="visaExpire"
                        type="date"
                        value={formData.visaExpire}
                        onChange={onChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lawyerCardExpire">
                        Lawyer Card Expiry
                      </Label>
                      <Input
                        id="lawyerCardExpire"
                        name="lawyerCardExpire"
                        type="date"
                        value={formData.lawyerCardExpire}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                )}

                {activeSection === "salary" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="salary">Basic Salary</Label>
                      <Input
                        id="salary"
                        name="salary"
                        type="number"
                        min="0"
                        value={formData.salary}
                        onChange={onChange}
                        placeholder="0.000"
                      />
                    </div>
                  </div>
                )}

                {activeSection === "addresses" && (
                  <div className="space-y-6">
                    <p className="font-semibold text-primary">
                      Contact &amp; Address Information
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                      <IconField
                        icon={Phone}
                        id="phone"
                        name="phone"
                        label="Phone Number *"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={onChange}
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

                      <IconField
                        icon={Phone}
                        id="emergencyPhone"
                        name="emergencyPhone"
                        label="Emergency Contact Phone Number *"
                        placeholder="Enter emergency contact phone number"
                        value={formData.emergencyPhone}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                )}

                {/* Not yet specified, so nothing is invented for them */}
                {["allowances", "performance", "permissions"].includes(
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
