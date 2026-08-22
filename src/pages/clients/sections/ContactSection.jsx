import { Input } from "@/components/ui/input";
import { MessageCircle, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactSection({ formData, onChange, onSelectChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Mobile */}
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile *</Label>
        <Input
          id="mobile"
          name="mobile"
          value={formData.mobile}
          onChange={onChange}
          placeholder="+968 XXXX XXXX"
          required
        />
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

      {/* Instant WhatsApp Notification */}
      <div className="space-y-2">
        <Label
          htmlFor="whatsappNotification"
          className="flex items-center gap-1.5"
        >
          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
          Instant WhatsApp Notification
        </Label>
        <Select
          value={formData.whatsappNotification}
          onValueChange={(value) => onSelectChange("whatsappNotification", value)}
        >
          <SelectTrigger id="whatsappNotification">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Instant Email Notification */}
      <div className="space-y-2">
        <Label htmlFor="emailNotification" className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          Instant Email Notification
        </Label>
        <Select
          value={formData.emailNotification}
          onValueChange={(value) => onSelectChange("emailNotification", value)}
        >
          <SelectTrigger id="emailNotification">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Both channels fire on every saved update, so say so plainly. */}
      {(formData.whatsappNotification === "Yes" ||
        formData.emailNotification === "Yes") && (
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="rounded-md border-l-4 border-l-blue-500 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Every update saved against this client is sent immediately by
            {formData.whatsappNotification === "Yes" &&
            formData.emailNotification === "Yes"
              ? " WhatsApp and email"
              : formData.whatsappNotification === "Yes"
              ? " WhatsApp"
              : " email"}
            .
          </p>
        </div>
      )}
    </div>
  );
}
