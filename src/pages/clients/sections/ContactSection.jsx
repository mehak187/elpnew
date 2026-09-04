import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MessageCircle, Mail } from "lucide-react";
import { COUNTRY_DIAL_CODES } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * A notification channel, switched on or off.
 *
 * Stored as "Yes"/"No" the way it always was - the switch changes how the
 * setting is asked for, not what the client record holds.
 */
function NotificationToggle({ id, icon, label, value, onChange }) {
  const Icon = icon;
  const on = value === "Yes";

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {/* The height of a field, so the row stays level with the ones
          beside it. */}
      <div className="flex h-9 items-center gap-2">
        <Switch
          id={id}
          checked={on}
          onCheckedChange={(next) => onChange(next ? "Yes" : "No")}
        />
        <span
          className={cn(
            "text-sm font-medium",
            on ? "text-green-600" : "text-muted-foreground"
          )}
        >
          {on ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}

export default function ContactSection({ formData, onChange, onSelectChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Mobile - the country code is picked, not typed into the number */}
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile Number *</Label>
        <div className="flex gap-2">
          <Select
            value={formData.mobileDialCode}
            onValueChange={(value) => onSelectChange("mobileDialCode", value)}
          >
            <SelectTrigger className="w-24 shrink-0" aria-label="Country code">
              <SelectValue>{formData.mobileDialCode}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRY_DIAL_CODES.map((country) => (
                <SelectItem key={country.code} value={country.dial}>
                  <span className="inline-flex w-full items-center gap-2">
                    <span className="w-12 shrink-0 font-medium">
                      {country.dial}
                    </span>
                    {/* Opacity rather than a colour, so it stays readable
                        against the highlighted row. */}
                    <span className="opacity-70">{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={onChange}
            placeholder="XXXX XXXX"
            className="flex-1"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          placeholder="Enter email address"
          required
        />
      </div>

      {/* Communication Methods */}
      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <p className="text-sm font-semibold text-primary">
          Communication Methods
        </p>
      </div>

      {/* Language of Communication */}
      <div className="space-y-2">
        <Label htmlFor="languageOfCommunication">
          Language of Communication *
        </Label>
        <Select
          value={formData.languageOfCommunication}
          onValueChange={(value) =>
            onSelectChange("languageOfCommunication", value)
          }
        >
          <SelectTrigger id="languageOfCommunication">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arabic">Arabic</SelectItem>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Both">Both (Arabic &amp; English)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Both channels are a switch rather than a list: on or off is the
          whole of the setting, and it reads at a glance. */}
      <NotificationToggle
        id="whatsappNotification"
        icon={MessageCircle}
        label="Instant WhatsApp Notification"
        value={formData.whatsappNotification}
        onChange={(value) => onSelectChange("whatsappNotification", value)}
      />

      <NotificationToggle
        id="emailNotification"
        icon={Mail}
        label="Instant Email Notification"
        value={formData.emailNotification}
        onChange={(value) => onSelectChange("emailNotification", value)}
      />

      {/* Switching a channel on does not put the client on every save. Only
          an event the firm has marked as the client's business is sent, and
          an internal one never is - so say exactly that, here, where the
          switch is turned on. */}
      {(formData.whatsappNotification === "Yes" ||
        formData.emailNotification === "Yes") && (
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="rounded-md border-l-4 border-l-blue-500 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Sent by
            {formData.whatsappNotification === "Yes" &&
            formData.emailNotification === "Yes"
              ? " WhatsApp and email"
              : formData.whatsappNotification === "Yes"
                ? " WhatsApp"
                : " email"}
            , but only for events marked{" "}
            <span className="font-semibold">Client Notification: Yes</span>{" "}
            &mdash; Case, Hearing, Judgment, Financial, Document or Contract.
            Internal events are never sent to the client.
          </p>
        </div>
      )}
    </div>
  );
}
