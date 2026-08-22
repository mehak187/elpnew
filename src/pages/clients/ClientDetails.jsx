import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Save, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { deriveClientStatus } from "@/lib/clientStatus";
import { findClient } from "./clientRecords";
import { StatusDot } from "@/components/shared/panels";

import BasicSection from "./sections/BasicSection";
import ContactSection from "./sections/ContactSection";
import FinancialSection from "./sections/FinancialSection";
import DocumentsSection from "./sections/DocumentsSection";
import LinkedCasesSection from "./sections/LinkedCasesSection";
import InvoicesSection from "./sections/InvoicesSection";
import AnalyticsSection from "./sections/AnalyticsSection";
import MergeSection from "./sections/MergeSection";

/**
 * Sections of the client record.
 *
 * `form` marks the three that edit the client itself and share one save button.
 * `existingOnly` hides the sections that need a saved client behind them -
 * there are no documents, cases or invoices to show while one is being created.
 * `required` is a function so conditional fields (VATIN, custom payment days)
 * are only demanded when they actually apply.
 */
const SECTIONS = [
  {
    key: "basic",
    label: "Basic",
    form: true,
    required: () => [
      "dateOfRegistration",
      "arabicName",
      "englishName",
      "referenceNo",
      "referenceExpiryDate",
      "poaNo",
      "poaExpiryDate",
    ],
  },
  {
    key: "contact",
    label: "Contact Details",
    form: true,
    required: () => [
      "mobile",
      "email",
      "languageOfCommunication",
      "whatsappNotification",
      "emailNotification",
    ],
  },
  {
    key: "financial",
    label: "Financial Details",
    form: true,
    required: (formData, clientType) => [
      ...(clientType !== "Individual" ? ["vatinNo"] : []),
      "receivingBank",
      "receivingAccount",
      ...(formData.paymentDelayPeriod === "custom"
        ? ["paymentDelayCustomDays"]
        : []),
    ],
  },
  { key: "documents", label: "Documents", existingOnly: true },
  { key: "cases", label: "Linked Cases", existingOnly: true },
  { key: "invoices", label: "Invoices", existingOnly: true },
  { key: "analytics", label: "Client Analytics", existingOnly: true },
  { key: "merge", label: "Merge Clients", existingOnly: true },
];


const toFormData = (record) =>
  !record
    ? emptyFormData
    : {
        dateOfRegistration: record.dateOfRegistration || "",
        arabicName: record.arabicName || "",
        englishName: record.clientName || "",
        referenceNo: record.referenceNo || "",
        referenceExpiryDate: record.referenceExpiryDate || "",
        vatinNo: record.vatinNo || "",
        poaNo: record.poaNo || "",
        poaExpiryDate: record.poaExpiryDate || "",
        email: record.email || "",
        mobile: record.mobile || "",
        receivingBank: record.receivingBank || "",
        receivingAccount: record.receivingAccount || "",
        commissionRate: record.commissionRate || "",
        payFeesOnBehalf: record.payFeesOnBehalf || "",
        paymentDelayPeriod: record.paymentDelayPeriod || "",
        paymentDelayCustomDays: record.paymentDelayCustomDays || "",
        languageOfCommunication: record.languageOfCommunication || "",
        whatsappNotification: record.whatsappNotification || "No",
        emailNotification: record.emailNotification || "No",
        closeDate: record.closeDate || "",
      };

const emptyFormData = {
  dateOfRegistration: "",
  arabicName: "",
  englishName: "",
  referenceNo: "",
  referenceExpiryDate: "",
  vatinNo: "",
  poaNo: "",
  poaExpiryDate: "",
  email: "",
  mobile: "",
  receivingBank: "",
  receivingAccount: "",
  commissionRate: "",
  payFeesOnBehalf: "",
  paymentDelayPeriod: "",
  paymentDelayCustomDays: "",
  languageOfCommunication: "",
  whatsappNotification: "No",
  emailNotification: "No",
  closeDate: "",
};

export default function ClientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isExisting = Boolean(id);

  const record = isExisting ? findClient(id) : null;

  const [clientType, setClientType] = useState(() => record?.type || "Individual");
  const [statusOverride, setStatusOverride] = useState(
    () => record?.statusOverride || "auto"
  );
  const [activeSection, setActiveSection] = useState("basic");
  const [agreementFile, setAgreementFile] = useState(null);
  const [formData, setFormData] = useState(() => toFormData(record));

  // Reload when the route moves to a different client without unmounting.
  const [loadedId, setLoadedId] = useState(id);
  if (id !== loadedId) {
    setLoadedId(id);
    setClientType(record?.type || "Individual");
    setStatusOverride(record?.statusOverride || "auto");
    setFormData(toFormData(record));
    setAgreementFile(null);
    setActiveSection("basic");
  }

  const sections = SECTIONS.filter((s) => isExisting || !s.existingOnly);
  const current = sections.find((s) => s.key === activeSection) || sections[0];
  const status = record ? deriveClientStatus(record) : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") setAgreementFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // The browser only validates the section on screen, so check the other
    // form sections here and open the first one that is still incomplete.
    const incomplete = sections.find(
      (section) =>
        section.form &&
        section.key !== activeSection &&
        section.required(formData, clientType).some((field) => !formData[field])
    );
    if (incomplete) {
      setActiveSection(incomplete.key);
      return;
    }

    const clientData = {
      type: clientType,
      statusOverride: statusOverride === "auto" ? null : statusOverride,
      ...formData,
      agreementFile: agreementFile?.name,
    };
    if (isExisting) {
      console.log("Updating client:", clientData);
    } else {
      console.log("Creating client:", clientData);
    }
    navigate("/clients");
  };

  const title = isExisting
    ? [record?.clientNo, formData.englishName].filter(Boolean).join(" : ") ||
      "Client Details"
    : "Add New Client";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {!isExisting && (
            <div className="p-2 sm:p-3 rounded-xl bg-secondary">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isExisting
                ? "Client profile and related records"
                : "Create a new client record"}
            </p>
          </div>
        </div>

        {/* Only the editable sections have something to save */}
        {current.form && (
          <Button type="submit" form="client-form">
            <Save className="mr-2 h-4 w-4" />
            {isExisting ? "Update Client" : "Save Client"}
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
        {/* Section navigation */}
        <Card className="w-full lg:w-60 lg:shrink-0">
          <CardContent className="p-3">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Client Details
            </p>
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "text-left text-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeSection === section.key
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="w-full flex-1 space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-6 flex items-center gap-4 border-b pb-3">
                <h2 className="text-base font-semibold text-primary">
                  {current.label}
                </h2>
                <StatusDot status={status} isGood={status === "Active"} />
              </div>

              {/* Editable sections share one form and one save button */}
              <form id="client-form" onSubmit={handleSubmit}>
                {activeSection === "basic" && (
                  <BasicSection
                    formData={formData}
                    clientType={clientType}
                    statusOverride={statusOverride}
                    agreementFile={agreementFile}
                    onChange={handleChange}
                    onClientTypeChange={setClientType}
                    onStatusOverrideChange={setStatusOverride}
                    onAgreementFileChange={handleFileChange}
                    onRemoveAgreementFile={() => setAgreementFile(null)}
                  />
                )}
                {activeSection === "contact" && (
                  <ContactSection
                    formData={formData}
                    onChange={handleChange}
                    onSelectChange={handleSelectChange}
                  />
                )}
                {activeSection === "financial" && (
                  <FinancialSection
                    formData={formData}
                    clientType={clientType}
                    onChange={handleChange}
                    onSelectChange={handleSelectChange}
                  />
                )}
              </form>

              {activeSection === "documents" && <DocumentsSection />}
              {activeSection === "cases" && <LinkedCasesSection />}
              {activeSection === "invoices" && <InvoicesSection />}
              {activeSection === "analytics" && <AnalyticsSection />}
              {activeSection === "merge" && <MergeSection />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
