import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, X } from "lucide-react";
import { CLIENT_TYPES } from "@/lib/constants";

export default function BasicSection({
  formData,
  clientType,
  agreementFile,
  onChange,
  onClientTypeChange,
  onAgreementFileChange,
  onRemoveAgreementFile,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Date of Registration */}
      <div className="space-y-2">
        <Label htmlFor="dateOfRegistration">Date of Registration *</Label>
        <Input
          id="dateOfRegistration"
          name="dateOfRegistration"
          type="date"
          value={formData.dateOfRegistration}
          onChange={onChange}
          required
        />
      </div>

      {/* Client Type */}
      <div className="space-y-2">
        <Label htmlFor="clientType">Client Type *</Label>
        <Select value={clientType} onValueChange={onClientTypeChange}>
          <SelectTrigger id="clientType">
            <SelectValue placeholder="Select client type" />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client's Arabic Name */}
      <div className="space-y-2">
        <Label htmlFor="arabicName">Client&apos;s Arabic Name *</Label>
        <Input
          id="arabicName"
          name="arabicName"
          value={formData.arabicName}
          onChange={onChange}
          placeholder="أدخل الاسم بالعربية"
          dir="rtl"
          required
        />
      </div>

      {/* Client's English Name */}
      <div className="space-y-2">
        <Label htmlFor="englishName">Client&apos;s English Name *</Label>
        <Input
          id="englishName"
          name="englishName"
          value={formData.englishName}
          onChange={onChange}
          placeholder="Enter name in English"
          required
        />
      </div>

      {/* Reference No */}
      <div className="space-y-2">
        <Label htmlFor="referenceNo">Reference No. *</Label>
        <Input
          id="referenceNo"
          name="referenceNo"
          value={formData.referenceNo}
          onChange={onChange}
          placeholder="Enter reference number"
          required
        />
      </div>

      {/* Reference Expiry Date */}
      <div className="space-y-2">
        <Label htmlFor="referenceExpiryDate">Reference Expiry Date *</Label>
        <Input
          id="referenceExpiryDate"
          name="referenceExpiryDate"
          type="date"
          value={formData.referenceExpiryDate}
          onChange={onChange}
          required
        />
      </div>

      {/* POA No */}
      <div className="space-y-2">
        <Label htmlFor="poaNo">POA No. *</Label>
        <Input
          id="poaNo"
          name="poaNo"
          value={formData.poaNo}
          onChange={onChange}
          placeholder="Enter POA number"
          required
        />
      </div>

      {/* POA Expiry Date */}
      <div className="space-y-2">
        <Label htmlFor="poaExpiryDate">POA Expiry Date *</Label>
        <Input
          id="poaExpiryDate"
          name="poaExpiryDate"
          type="date"
          value={formData.poaExpiryDate}
          onChange={onChange}
          required
        />
      </div>

      {/* Deactivation Date - the client turns Inactive on this day */}
      <div className="space-y-2">
        <Label htmlFor="deactivationDate">Deactivation Date</Label>
        <Input
          id="deactivationDate"
          name="deactivationDate"
          type="date"
          value={formData.deactivationDate}
          onChange={onChange}
        />
      </div>

      {/* Agreement PDF Upload */}
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label>Agreement PDF</Label>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
          {!agreementFile ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500">
                Upload agreement document (PDF only)
              </p>
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={onAgreementFileChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-sm">{agreementFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(agreementFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemoveAgreementFile}
                className="h-8 w-8 text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
