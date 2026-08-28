import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirm } from "@/lib/firm/context";
import { BRANCH_ROLES, staffFor } from "@/pages/firm/firmData";

/**
 * Who runs this client's work, and out of which branch.
 *
 * The branch list comes from the Law Firm Profile rather than a copy, so adding
 * a branch there makes it selectable here. Each branch keeps its own staff, so
 * the role pickers stay empty until a branch is chosen - there is no such thing
 * as a supervisor without a branch.
 */
export default function ClientManagementSection({ client }) {
  const { branches } = useFirm();

  const [branchId, setBranchId] = useState(
    client.branchId ? String(client.branchId) : ""
  );
  const [assignments, setAssignments] = useState({});

  const chooseBranch = (value) => {
    setBranchId(value);
    // Staff belong to one branch, so a previous branch's people cannot stay.
    setAssignments({});
  };

  return (
    <div className="space-y-6">
      {/* The branch plus its four roles, on one row where there is room */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="managementBranch">Branch Name *</Label>
          <Select value={branchId} onValueChange={chooseBranch}>
            <SelectTrigger id="managementBranch">
              <SelectValue placeholder="Please Select" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.branchNumber} - {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* The roles this branch staffs, filled from that branch only */}
        {branchId &&
          BRANCH_ROLES.map((role) => {
            const people = staffFor(branchId, role);
            const fieldId = "role-" + role.replace(/\s+/g, "-").toLowerCase();

            return (
              <div key={role} className="space-y-2">
                <Label htmlFor={fieldId}>{role} *</Label>
                <Select
                  value={assignments[role] || ""}
                  onValueChange={(value) =>
                    setAssignments((prev) => ({ ...prev, [role]: value }))
                  }
                  disabled={people.length === 0}
                >
                  <SelectTrigger id={fieldId}>
                    <SelectValue
                      placeholder={
                        people.length
                          ? "Please Select"
                          : "No one in this branch"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person.id} value={String(person.id)}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
      </div>

      {/* What has been assigned so far */}
      {branchId && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {BRANCH_ROLES.map((role) => {
                  const person = staffFor(branchId, role).find(
                    (s) => String(s.id) === assignments[role]
                  );
                  return (
                    <tr key={role} className="border-b transition-colors last:border-0 hover:bg-primary/10">
                      <td className="p-3 font-medium">{role}</td>
                      <td className="p-3">
                        {person ? (
                          person.name
                        ) : (
                          <span className="text-muted-foreground">
                            Not assigned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
