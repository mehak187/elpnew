import { useState } from "react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Lock } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import { useLanguage, inLanguage } from "@/lib/language/context";
import { nextBranchNumber, firmStaff } from "../firmData";

const emptyBranch = {
  name: "",
  nameAr: "",
  active: true,
  address: "",
  phone: "+968 ",
  email: "",
  managerId: "",
};

const managerName = (id) =>
  firmStaff.find((s) => s.id === Number(id))?.name || "";

/** The fields a branch is made of, shared by the add form and the edit dialog. */
function BranchFields({ draft, set, idPrefix, assignedNumber }) {
  const id = (name) => idPrefix + "-" + name;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={id("number")}>Branch Number</Label>
        <div className="relative">
          <Input
            id={id("number")}
            value={assignedNumber}
            readOnly
            disabled
            className="bg-muted pr-9"
          />
          {/* Locked on purpose: case files are numbered from it */}
          <Lock
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("name")}>Branch Name &ndash; English *</Label>
        <Input
          id={id("name")}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Enter branch name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("nameAr")}>Branch Name &ndash; Arabic</Label>
        <Input
          id={id("nameAr")}
          value={draft.nameAr}
          onChange={(e) => set("nameAr", e.target.value)}
          placeholder="أدخل اسم الفرع"
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("manager")}>Branch Manager</Label>
        <Select
          value={draft.managerId ? String(draft.managerId) : ""}
          onValueChange={(value) => set("managerId", Number(value))}
        >
          <SelectTrigger id={id("manager")}>
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            {firmStaff
              .filter((person) => person.role === "General Supervisor")
              .map((person) => (
                <SelectItem key={person.id} value={String(person.id)}>
                  {person.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("address")}>Address</Label>
        <Input
          id={id("address")}
          value={draft.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Enter branch address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("phone")}>Phone Number</Label>
        <Input
          id={id("phone")}
          value={draft.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+968"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("email")}>Email Address</Label>
        <Input
          id={id("email")}
          type="email"
          value={draft.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="branch@company.com"
        />
      </div>

      {/* Last: standing is the decision taken once everything else about the
          branch has been settled. */}
      <div className="space-y-2">
        <Label htmlFor={id("status")}>Status</Label>
        <Select
          value={draft.active ? "Active" : "Inactive"}
          onValueChange={(value) => set("active", value === "Active")}
        >
          <SelectTrigger id={id("status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/**
 * The offices the company works from.
 *
 * The branch number is assigned by the system and shown read-only, so it can be
 * seen before saving but never typed. It is then stored on the branch record -
 * case numbering reads it from there, which is why adding a branch never needs
 * a change to the numbering logic, and why a branch is deactivated rather than
 * deleted once anything is filed under its number.
 */
export default function BranchesSection({ canEdit }) {
  const { branches, addBranch, updateBranch } = useFirm();
  const [adding, setAdding] = useState(false);
  const { language } = useLanguage();
  const dir = language === "ar" ? "rtl" : "ltr";

  const cancelAdd = () => {
    setDraft(emptyBranch);
    setAdding(false);
  };
  const [draft, setDraft] = useState(emptyBranch);
  const [editing, setEditing] = useState(null);

  const assignedNumber = nextBranchNumber(branches);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setEdit = (name, value) =>
    setEditing((prev) => ({ ...prev, [name]: value }));

  const handleSave = () => {
    addBranch(draft);
    setDraft(emptyBranch);
    setAdding(false);
  };

  const saveEdit = () => {
    updateBranch(editing.id, editing);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        {/* The count belongs to the list, so it goes when the list does */}
        {!adding && (
          <p className="text-sm text-muted-foreground">
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </p>
        )}
        {adding && <span />}
        {canEdit && (
          <Button size="sm" onClick={() => setAdding((open) => !open)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Branch
          </Button>
        )}
      </div>

      {adding && canEdit && (
        <Card>
          <CardContent className="space-y-4 p-4">
            {/* The way back out of the form, in the same place and with the
                same mark as on every page that opens over another. */}
            <div className="flex items-center gap-3">
              <BackButton onBack={cancelAdd} />
              <div>
                <p className="font-semibold text-primary">Add New Branch</p>
                <p className="text-xs text-muted-foreground">
                  Branch number is generated by the system
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <BranchFields
                draft={draft}
                set={set}
                idPrefix="new-branch"
                assignedNumber={assignedNumber + " (Automatic)"}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelAdd}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!draft.name.trim()}>
                Save Branch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adding replaces the list rather than sitting above it - the branches
          were already read on the way in, and showing them twice says nothing
          the first showing did not. */}
      {!adding && (
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-3 font-semibold">Branch No.</th>
                <th className="p-3 font-semibold">Branch Name</th>
                <th className="p-3 font-semibold">Address</th>
                <th className="p-3 font-semibold">Branch Manager</th>
                <th className="p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr
                  key={branch.id}
                  className="border-b transition-colors last:border-0 hover:bg-primary/10"
                >
                  {/* The number opens the branch for editing */}
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...branch })}
                      className="rounded font-semibold text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {branch.branchNumber}
                    </button>
                  </td>
                  {/* One language, not both: the list is read in whichever
                      language the interface is set to. Both are still held
                      on the record and both are still entered on the form. */}
                  <td className="p-3">
                    <span className="block font-medium" dir={dir}>
                      {inLanguage(language, branch.name, branch.nameAr)}
                    </span>
                  </td>
                  <td className="p-3" dir={dir}>
                    {inLanguage(language, branch.address, branch.addressAr) ||
                      "-"}
                  </td>
                  <td className="p-3">
                    {managerName(branch.managerId) || (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={branch.active ? "success" : "secondary"}>
                      {branch.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      )}

      {/* The branch number opens its details for reading and editing */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(next) => !next && setEditing(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Branch {editing?.branchNumber}</DialogTitle>
            <DialogDescription>
              The branch number stays with the branch and cannot be changed.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BranchFields
                draft={editing}
                set={setEdit}
                idPrefix="edit-branch"
                assignedNumber={editing.branchNumber}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Close
            </Button>
            {canEdit && <Button onClick={saveEdit}>Save Changes</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
