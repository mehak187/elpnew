import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFirm } from "@/lib/firm/context";
import { daysUntil, formatDate, EXPIRY_WARNING_DAYS } from "../firmData";

/**
 * Section 1 of the specification.
 *
 * Fields appear in the order the document lists them. Both name fields stay
 * editable, and every change is written straight to the shared firm record, so
 * the name shown in the page header updates as it is typed - the name is stored
 * once and read everywhere rather than re-entered per section.
 */
export default function FirmInformationSection() {
  const { firmInfo, updateFirmInfo } = useFirm();

  const set = (field) => (e) => updateFirmInfo({ [field]: e.target.value });

  const crDays = firmInfo.crExpiryDate ? daysUntil(firmInfo.crExpiryDate) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="firmNameAr">Law Firm Name &ndash; Arabic *</Label>
          <Input
            id="firmNameAr"
            value={firmInfo.nameAr}
            onChange={set("nameAr")}
            placeholder="أدخل اسم المكتب بالعربية"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firmNameEn">Law Firm Name &ndash; English *</Label>
          <Input
            id="firmNameEn"
            value={firmInfo.nameEn}
            onChange={set("nameEn")}
            placeholder="Enter name in English"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="firmAddress">Address</Label>
          <Input
            id="firmAddress"
            value={firmInfo.address}
            onChange={set("address")}
            placeholder="Enter the firm address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mojLicenseNo">
            Ministry of Justice License Number
          </Label>
          <Input
            id="mojLicenseNo"
            value={firmInfo.mojLicenseNo}
            onChange={set("mojLicenseNo")}
            placeholder="Enter licence number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crNumber">Commercial Registration (CR) Number</Label>
          <Input
            id="crNumber"
            value={firmInfo.crNumber}
            onChange={set("crNumber")}
            placeholder="Enter CR number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crExpiryDate">CR Expiry Date</Label>
          <Input
            id="crExpiryDate"
            type="date"
            value={firmInfo.crExpiryDate}
            onChange={set("crExpiryDate")}
          />
          {crDays !== null && (
            <div className="pt-1">
              {crDays < 0 ? (
                <Badge variant="destructive">
                  Expired {Math.abs(crDays)} days ago
                </Badge>
              ) : crDays <= EXPIRY_WARNING_DAYS ? (
                <Badge variant="warning">Expires in {crDays} days</Badge>
              ) : (
                <Badge variant="success">
                  Valid until {formatDate(firmInfo.crExpiryDate)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The firm name recorded here is what the rest of the system displays. It
        is not entered again anywhere else.
      </p>
    </div>
  );
}
