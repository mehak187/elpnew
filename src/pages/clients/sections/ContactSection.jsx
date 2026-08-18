import { Input } from "@/components/ui/input";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
    </div>
  );
}
