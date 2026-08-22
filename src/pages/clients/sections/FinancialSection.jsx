import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RECEIVING_BANKS, PAYMENT_DELAY_OPTIONS } from "@/lib/constants";

export default function FinancialSection({
  formData,
  clientType,
  onChange,
  onSelectChange,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* VATIN No. - entities only, individuals have none */}
      {clientType !== "Individual" && (
        <div className="space-y-2">
          <Label htmlFor="vatinNo">VATIN No. *</Label>
          <Input
            id="vatinNo"
            name="vatinNo"
            value={formData.vatinNo}
            onChange={onChange}
            placeholder="Enter VATIN number"
            required
          />
        </div>
      )}

      {/* Receiving Bank */}
      <div className="space-y-2">
        <Label htmlFor="receivingBank">Receiving Bank *</Label>
        <Select
          value={formData.receivingBank}
          onValueChange={(value) => onSelectChange("receivingBank", value)}
        >
          <SelectTrigger id="receivingBank">
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

      {/* Receiving Account No. */}
      <div className="space-y-2">
        <Label htmlFor="receivingAccount">Receiving Account No. *</Label>
        <Input
          id="receivingAccount"
          name="receivingAccount"
          value={formData.receivingAccount}
          onChange={onChange}
          placeholder="Enter account number"
          required
        />
      </div>

      {/* Pay Fees on Their Behalf */}
      <div className="space-y-2">
        <Label htmlFor="payFeesOnBehalf">Pay Fees on Their Behalf?</Label>
        <Select
          value={formData.payFeesOnBehalf}
          onValueChange={(value) => onSelectChange("payFeesOnBehalf", value)}
        >
          <SelectTrigger id="payFeesOnBehalf">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Delay Period - standard terms plus a custom number of days */}
      <div className="space-y-2">
        <Label htmlFor="paymentDelayPeriod">Payment Delay Period</Label>
        <Select
          value={formData.paymentDelayPeriod}
          onValueChange={(value) => onSelectChange("paymentDelayPeriod", value)}
        >
          <SelectTrigger id="paymentDelayPeriod">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_DELAY_OPTIONS.map((days) => (
              <SelectItem key={days} value={days}>
                {days} days
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom days...</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.paymentDelayPeriod === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="paymentDelayCustomDays">Custom Days *</Label>
          <Input
            id="paymentDelayCustomDays"
            name="paymentDelayCustomDays"
            type="number"
            min="1"
            value={formData.paymentDelayCustomDays}
            onChange={onChange}
            placeholder="Enter total number of days"
            required
          />
        </div>
      )}
    </div>
  );
}
