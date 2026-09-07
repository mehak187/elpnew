import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirm } from "@/lib/firm/context";
import { daysUntil, EXPIRY_WARNING_DAYS } from "../firmData";

/**
 * What the company is, on paper.
 *
 * Edited as a draft and written to the shared record on Save. The company
 * is read all over the system - its name is in the page header and on every
 * document - so a half-typed name has no business reaching any of that
 * until someone says it is right.
 */
export default function FirmInformationSection({ canEdit }) {
  const { firmInfo, updateFirmInfo, branches } = useFirm();

  const [draft, setDraft] = useState(firmInfo);
  // Reload if the saved record changes underneath this form.
  const [loaded, setLoaded] = useState(firmInfo);
  if (firmInfo !== loaded) {
    setLoaded(firmInfo);
    setDraft(firmInfo);
  }

  const set = (field) => (e) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(firmInfo);
  const save = () => updateFirmInfo(draft);

  const crDays = draft.crExpiryDate ? daysUntil(draft.crExpiryDate) : null;

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
      <div className="space-y-2">
        <Label htmlFor="firmNameEn">Law Firm Name &ndash; English *</Label>
        <Input
          id="firmNameEn"
          value={firmInfo.nameEn}
          onChange={set("nameEn")}
          disabled={!canEdit}
          placeholder="Enter name in English"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="firmNameAr">Law Firm Name &ndash; Arabic *</Label>
        <Input
          id="firmNameAr"
          value={firmInfo.nameAr}
          onChange={set("nameAr")}
          disabled={!canEdit}
          placeholder="أدخل اسم المكتب بالعربية"
          dir="rtl"
        />
      </div>

      {/* The name it trades under, which need not be the registered one */}
      <div className="space-y-2">
        <Label htmlFor="tradeName">Company Trade Name</Label>
        <Input
          id="tradeName"
          value={firmInfo.tradeName}
          onChange={set("tradeName")}
          disabled={!canEdit}
          placeholder="Enter trade name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mojLicenseNo">Ministry of Justice License No.</Label>
        <Input
          id="mojLicenseNo"
          value={firmInfo.mojLicenseNo}
          onChange={set("mojLicenseNo")}
          disabled={!canEdit}
          placeholder="Enter licence number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="crNumber">Commercial Registration No.</Label>
        <Input
          id="crNumber"
          value={firmInfo.crNumber}
          onChange={set("crNumber")}
          disabled={!canEdit}
          placeholder="Enter CR number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="firmAddress">Address</Label>
        <Input
          id="firmAddress"
          value={firmInfo.address}
          onChange={set("address")}
          disabled={!canEdit}
          placeholder="Enter the company address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="crExpiryDate">CR Expiry Date</Label>
        <Input
          id="crExpiryDate"
          type="date"
          value={firmInfo.crExpiryDate}
          onChange={set("crExpiryDate")}
          disabled={!canEdit}
        />
        {/* Only worth saying when something is wrong - a registration that is
            simply in date needs no badge, the date itself says so. */}
        {crDays !== null && crDays <= EXPIRY_WARNING_DAYS && (
          <div className="pt-1">
            {crDays < 0 ? (
              <Badge variant="destructive">
                Expired {Math.abs(crDays)} days ago
              </Badge>
            ) : (
              <Badge variant="warning">Expires in {crDays} days</Badge>
            )}
          </div>
        )}
      </div>

      {/* Chosen from the branches the company actually has */}
      <div className="space-y-2">
        <Label htmlFor="primaryBranch">Primary Branch</Label>
        <Select
          value={String(draft.primaryBranchId || "")}
          onValueChange={(value) =>
            setDraft((prev) => ({ ...prev, primaryBranchId: Number(value) }))
          }
          disabled={!canEdit}
        >
          <SelectTrigger id="primaryBranch">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    {canEdit && (
      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={!dirty}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    )}
    </div>
  );
}
