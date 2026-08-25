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
import { Truck, ArrowLeft, Save } from "lucide-react";
import {
  COUNTRY_DIAL_CODES,
  DEFAULT_DIAL_CODE,
  RECEIVING_BANKS,
} from "@/lib/constants";
import { useSuppliers } from "@/lib/suppliers/context";
import { SUPPLIER_CATEGORIES, SUPPLIER_STATUSES } from "./supplierData";

const emptySupplier = {
  name: "",
  category: "",
  commercialRegistration: "",
  taxIdentificationNumber: "",
  vatNumber: "",
  bank: "",
  accountNumber: "",
  dialCode: DEFAULT_DIAL_CODE,
  phone: "",
  status: "Active",
};

/** Phone is stored as one string; the form edits the code and number apart. */
const splitPhone = (phone) => {
  const match = /^(\+\d+)\s*(.*)$/.exec(phone || "");
  return match
    ? { dialCode: match[1], phone: match[2] }
    : { dialCode: DEFAULT_DIAL_CODE, phone: phone || "" };
};

const draftFrom = (supplier) => {
  if (!supplier) return emptySupplier;
  const { phone, ...rest } = supplier;
  return { ...emptySupplier, ...rest, ...splitPhone(phone) };
};

export default function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { suppliers, addSupplier, updateSupplier } = useSuppliers();

  const existing = id ? suppliers.find((s) => String(s.id) === id) : null;
  const isEdit = Boolean(id);

  const [draft, setDraft] = useState(() => draftFrom(existing));
  const [loadedId, setLoadedId] = useState(id);
  const [error, setError] = useState("");

  // Moving straight from one supplier to another reloads the form.
  if (id !== loadedId) {
    setLoadedId(id);
    setDraft(draftFrom(existing));
    setError("");
  }

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const onChange = (e) => set(e.target.name, e.target.value);

  const canSave = draft.name.trim() && draft.category;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) {
      setError("A supplier needs at least a name and a category.");
      return;
    }
    const { dialCode, phone, ...rest } = draft;
    const record = { ...rest, phone: phone ? dialCode + " " + phone : "" };
    if (isEdit) {
      updateSupplier(existing.id, record);
    } else {
      addSupplier(record);
    }
    navigate("/suppliers");
  };

  if (isEdit && !existing) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            That supplier no longer exists.
          </p>
          <Button className="mt-4" onClick={() => navigate("/suppliers")}>
            Back to Suppliers
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/suppliers")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Truck className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              {isEdit ? "Supplier Details" : "Add Supplier"}
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              {isEdit
                ? existing.supplierId + " - review and modify"
                : "Create a new supplier record"}
            </p>
          </div>
        </div>
        <Button type="submit" form="supplier-form" disabled={!canSave}>
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? "Save Changes" : "Save Supplier"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name *</Label>
                <Input
                  id="supplierName"
                  name="name"
                  value={draft.name}
                  onChange={onChange}
                  placeholder="e.g. Muscat Stationery Est."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierCategory">Category *</Label>
                <Select
                  value={draft.category}
                  onValueChange={(value) => set("category", value)}
                >
                  <SelectTrigger id="supplierCategory">
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
                <Label htmlFor="commercialRegistration">
                  Commercial Registration (CR)
                </Label>
                <Input
                  id="commercialRegistration"
                  name="commercialRegistration"
                  value={draft.commercialRegistration}
                  onChange={onChange}
                  placeholder="Enter CR number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxIdentificationNumber">
                  Tax Identification Number (TIN)
                </Label>
                <Input
                  id="taxIdentificationNumber"
                  name="taxIdentificationNumber"
                  value={draft.taxIdentificationNumber}
                  onChange={onChange}
                  placeholder="Enter TIN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  name="vatNumber"
                  value={draft.vatNumber}
                  onChange={onChange}
                  placeholder="Enter VAT number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierBank">Supplier&apos;s Bank</Label>
                <Select
                  value={draft.bank}
                  onValueChange={(value) => set("bank", value)}
                >
                  <SelectTrigger id="supplierBank">
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
                <Label htmlFor="supplierAccount">
                  Supplier&apos;s Account Number
                </Label>
                <Input
                  id="supplierAccount"
                  name="accountNumber"
                  value={draft.accountNumber}
                  onChange={onChange}
                  placeholder="Account number or IBAN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierPhone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select
                    value={draft.dialCode}
                    onValueChange={(value) => set("dialCode", value)}
                  >
                    <SelectTrigger
                      className="w-24 shrink-0"
                      aria-label="Country code"
                    >
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
                    id="supplierPhone"
                    name="phone"
                    value={draft.phone}
                    onChange={onChange}
                    placeholder="XXXX XXXX"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierStatus">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) => set("status", value)}
                >
                  <SelectTrigger id="supplierStatus">
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
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
