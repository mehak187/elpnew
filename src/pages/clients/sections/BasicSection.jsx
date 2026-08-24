import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Paperclip, X } from "lucide-react";
import { CLIENT_TYPES } from "@/lib/constants";

/**
 * A number and the copy that proves it, kept in one field.
 *
 * The upload sits inside the field rather than beside it, so it cannot drift
 * into the neighbouring column when the grid narrows.
 */
function NumberWithCopy({
  id,
  name,
  label,
  placeholder,
  value,
  file,
  onChange,
  onFileChange,
}) {
  const fileName = typeof file === "string" ? file.split("/").pop() : "";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1"
          required
        />
        <label
          title={file ? "Replace copy" : "Upload copy"}
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border text-muted-foreground hover:bg-muted/50"
        >
          <Upload className="h-4 w-4" />
          <span className="sr-only">Upload copy</span>
          <Input
            type="file"
            className="hidden"
            onChange={(e) =>
              e.target.files[0] && onFileChange(e.target.files[0].name)
            }
          />
        </label>
      </div>

      {file && (
        <div className="flex h-8 items-center justify-between gap-2 rounded-md bg-muted px-3">
          <span className="inline-flex min-w-0 items-center gap-1 text-xs text-primary">
            <Paperclip className="h-3 w-3 shrink-0" />
            <span className="truncate">{fileName}</span>
          </span>
          <button
            type="button"
            onClick={() => onFileChange("")}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Remove copy</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function BasicSection({
  formData,
  clientType,
  onChange,
  onClientTypeChange,
  onFileChange,
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

      {/* Reference No, with the copy of it */}
      <NumberWithCopy
        id="referenceNo"
        name="referenceNo"
        label="Reference No. *"
        placeholder="Enter reference number"
        value={formData.referenceNo}
        file={formData.referenceCopy}
        onChange={onChange}
        onFileChange={(file) => onFileChange("referenceCopy", file)}
      />

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

      {/* POA No, with the copy of it */}
      <NumberWithCopy
        id="poaNo"
        name="poaNo"
        label="POA No. *"
        placeholder="Enter POA number"
        value={formData.poaNo}
        file={formData.poaCopy}
        onChange={onChange}
        onFileChange={(file) => onFileChange("poaCopy", file)}
      />

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

    </div>
  );
}
