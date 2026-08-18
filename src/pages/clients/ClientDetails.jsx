import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Save, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLIENT_STATUS_VARIANT, deriveClientStatus } from "@/lib/clientStatus";

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
      "poaExpiryDate",
    ],
  },
  {
    key: "contact",
    label: "Contact Details",
    form: true,
    required: () => ["mobile", "email", "languageOfCommunication"],
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

// Mock client data - in real app, this would come from API
const clientsData = [
  { id: 1, clientNo: "1", type: "Commercial Company", clientName: "ABC Holdings LLC", arabicName: "شركة ABC القابضة", referenceNo: "REF-2024-001", dateOfRegistration: "2024-01-15", referenceExpiryDate: "2025-06-15", poaExpiryDate: "2025-12-31", vatinNo: "OM123456789", email: "john@abc.com", mobile: "+968 2411 1111", receivingBank: "Bank Muscat", receivingAccount: "1234567890", commissionRate: "10", payFeesOnBehalf: "Yes", paymentDelayPeriod: "30", paymentDelayCustomDays: "", languageOfCommunication: "English", closeDate: "", activeCases: 3, mergedIntoClientNo: null, statusOverride: null },
  { id: 2, clientNo: "2", type: "Individual", clientName: "Fatima Rashid", arabicName: "فاطمة راشد", referenceNo: "REF-2024-002", dateOfRegistration: "2024-02-20", referenceExpiryDate: "2025-11-05", poaExpiryDate: "2026-03-12", vatinNo: "", email: "fatima@email.com", mobile: "+968 9234 5678", receivingBank: "National Bank of Oman", receivingAccount: "0987654321", commissionRate: "7.5", payFeesOnBehalf: "No", paymentDelayPeriod: "15", paymentDelayCustomDays: "", languageOfCommunication: "Arabic", closeDate: "", activeCases: 1, mergedIntoClientNo: null, statusOverride: null },
  { id: 3, clientNo: "3", type: "Commercial Company", clientName: "Al Madina Trading", arabicName: "شركة المدينة للتجارة", referenceNo: "REF-2024-003", dateOfRegistration: "2024-03-10", referenceExpiryDate: "2025-07-22", poaExpiryDate: "2026-02-10", vatinNo: "OM987654321", email: "ahmed@almadina.com", mobile: "+968 2422 2222", receivingBank: "Bank Dhofar", receivingAccount: "5678901234", commissionRate: "12", payFeesOnBehalf: "Yes", paymentDelayPeriod: "60", paymentDelayCustomDays: "", languageOfCommunication: "Both", closeDate: "", activeCases: 2, mergedIntoClientNo: null, statusOverride: null },
  { id: 4, clientNo: "4", type: "Commercial Company", clientName: "Gulf Construction Co", arabicName: "شركة الخليج للإنشاءات", referenceNo: "REF-2024-004", dateOfRegistration: "2024-04-05", referenceExpiryDate: "2025-09-12", poaExpiryDate: "2026-04-05", vatinNo: "OM456789123", email: "khalid@gulfconst.com", mobile: "+968 2433 3333", receivingBank: "Oman Arab Bank", receivingAccount: "3456789012", commissionRate: "10", payFeesOnBehalf: "No", paymentDelayPeriod: "custom", paymentDelayCustomDays: "75", languageOfCommunication: "English", closeDate: "", activeCases: 1, mergedIntoClientNo: null, statusOverride: null },
  { id: 5, clientNo: "5", type: "Individual", clientName: "Ahmed Al Lawati", arabicName: "أحمد اللواتي", referenceNo: "REF-2024-005", dateOfRegistration: "2024-05-01", referenceExpiryDate: "2025-03-08", poaExpiryDate: "2025-09-22", vatinNo: "", email: "ahmed.lawati@email.com", mobile: "+968 9345 6789", receivingBank: "Bank Muscat", receivingAccount: "7890123456", commissionRate: "8", payFeesOnBehalf: "No", paymentDelayPeriod: "45", paymentDelayCustomDays: "", languageOfCommunication: "Both", closeDate: "", activeCases: 0, mergedIntoClientNo: "1", statusOverride: null },
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
        closeDate: record.closeDate || "",
      };

const emptyFormData = {
  dateOfRegistration: "",
  arabicName: "",
  englishName: "",
  referenceNo: "",
  referenceExpiryDate: "",
  vatinNo: "",
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
  closeDate: "",
};

export default function ClientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isExisting = Boolean(id);

  const record = isExisting
    ? clientsData.find((c) => c.id === parseInt(id))
    : null;

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
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                {title}
              </h1>
              {status && (
                <Badge variant={CLIENT_STATUS_VARIANT[status]}>{status}</Badge>
              )}
            </div>
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
              <div className="border-b pb-3 mb-6">
                <h2 className="text-base font-semibold text-primary">
                  {current.label}
                </h2>
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
