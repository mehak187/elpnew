import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Info } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import { nextBranchNumber } from "../firmData";

const emptyBranch = { name: "", address: "", phone: "" };

/**
 * Section 3 of the specification.
 *
 * The branch number is assigned by the system and shown read-only while adding,
 * so the user can see what it will be without being able to type it. It is then
 * stored on the branch record - case numbering reads it from there, which is
 * why a new branch never requires a change to the numbering logic.
 */
export default function BranchesSection() {
  const { branches, addBranch } = useFirm();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyBranch);

  const assignedNumber = nextBranchNumber(branches);

  const handleSave = () => {
    addBranch(draft);
    setDraft(emptyBranch);
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {branches.length} {branches.length === 1 ? "branch" : "branches"}
        </p>
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="branchNumber">Branch Number</Label>
                <Input
                  id="branchNumber"
                  value={assignedNumber}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name *</Label>
                <Input
                  id="branchName"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Nizwa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchAddress">Address</Label>
                <Input
                  id="branchAddress"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  placeholder="Enter branch address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchPhone">Phone</Label>
                <Input
                  id="branchPhone"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="+968 XXXX XXXX"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Branch Number {assignedNumber} is assigned automatically and
                cannot be edited. It is saved with the branch and later used to
                build the case file number.
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!draft.name}>
                Save Branch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="p-3 font-semibold">Branch Name</th>
                <th className="p-3 font-semibold">Branch Number</th>
                <th className="p-3 font-semibold">Address</th>
                <th className="p-3 font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{branch.name}</td>
                  <td className="p-3">{branch.branchNumber}</td>
                  <td className="p-3 text-muted-foreground">
                    {branch.address || "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {branch.phone || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
