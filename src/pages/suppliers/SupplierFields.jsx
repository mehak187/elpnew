// The supplier record's fields, shared by the Add Supplier page and the
// dialog the invoice form opens so a supplier can be created without leaving
// the request being raised.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_DIAL_CODES, RECEIVING_BANKS } from "@/lib/constants";
import { SUPPLIER_CATEGORIES, SUPPLIER_STATUSES } from "./supplierData";

export default function SupplierFields({
  draft,
  set,
  idPrefix = "supplier",
  // A supplier added mid-request is one about to be billed against, so the
  // dialog leaves it Active rather than offering the choice.
  showStatus = true,
}) {
  const id = (name) => idPrefix + "-" + name;
  const onChange = (e) => set(e.target.name, e.target.value);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={id("name")}>Supplier Name *</Label>
        <Input
          id={id("name")}
          name="name"
          value={draft.name}
          onChange={onChange}
          placeholder="e.g. Muscat Stationery Est."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("category")}>Category *</Label>
        <Select
          value={draft.category}
          onValueChange={(value) => set("category", value)}
        >
          <SelectTrigger id={id("category")}>
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            {SUPPLIER_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("cr")}>Commercial Registration (CR)</Label>
        <Input
          id={id("cr")}
          name="commercialRegistration"
          value={draft.commercialRegistration}
          onChange={onChange}
          placeholder="Enter CR number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("tin")}>Tax Identification Number (TIN)</Label>
        <Input
          id={id("tin")}
          name="taxIdentificationNumber"
          value={draft.taxIdentificationNumber}
          onChange={onChange}
          placeholder="Enter TIN"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("vat")}>VAT Number</Label>
        <Input
          id={id("vat")}
          name="vatNumber"
          value={draft.vatNumber}
          onChange={onChange}
          placeholder="Enter VAT number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("bank")}>Supplier&apos;s Bank</Label>
        <Select value={draft.bank} onValueChange={(value) => set("bank", value)}>
          <SelectTrigger id={id("bank")}>
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            {RECEIVING_BANKS.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("account")}>Supplier&apos;s Account Number</Label>
        <Input
          id={id("account")}
          name="accountNumber"
          value={draft.accountNumber}
          onChange={onChange}
          placeholder="Account number or IBAN"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("phone")}>Phone Number</Label>
        <div className="flex gap-2">
          <Select
            value={draft.dialCode}
            onValueChange={(value) => set("dialCode", value)}
          >
            <SelectTrigger className="w-24 shrink-0" aria-label="Country code">
              <SelectValue>{draft.dialCode}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRY_DIAL_CODES.map((country) => (
                <SelectItem key={country.code} value={country.dial}>
                  <span className="inline-flex w-full items-center gap-2">
                    <span className="w-12 shrink-0 font-medium">
                      {country.dial}
                    </span>
                    <span className="opacity-70">{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id={id("phone")}
            name="phone"
            value={draft.phone}
            onChange={onChange}
            placeholder="XXXX XXXX"
            className="flex-1"
          />
        </div>
      </div>

      {showStatus && (
        <div className="space-y-2">
          <Label htmlFor={id("status")}>Status</Label>
          <Select
            value={draft.status}
            onValueChange={(value) => set("status", value)}
          >
            <SelectTrigger id={id("status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPLIER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
