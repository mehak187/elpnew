import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import { Save } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import { useLanguage, inLanguage } from "@/lib/language/context";
import { BRANCH_ROLES, staffFor } from "@/pages/firm/firmData";

/**
 * Who runs this client's work at each branch.
 *
 * Held per branch rather than as one set: the same client can be handled by
 * Muscat and by Salalah, and each office staffs the four roles from its own
 * people. Switching the branch picker therefore shows that branch's team - it
 * does not throw the other branch's away.
 */
const INITIAL_TEAMS = {
  1: {
    "General Supervisor": "1",
    "Legal Consultant": "3",
    Lawyer: "14",
    "Enforcement Officer": "6",
  },
  2: {
    "General Supervisor": "7",
    "Legal Consultant": "8",
    Lawyer: "16",
    "Enforcement Officer": "10",
  },
};

/** The person filling one role at one branch, or nothing. */
const personIn = (branchId, role, teams) => {
  const id = teams[branchId]?.[role];
  if (!id) return null;
  return staffFor(branchId, role).find((s) => String(s.id) === id) || null;
};

const emptyRoles = () =>
  Object.fromEntries(BRANCH_ROLES.map((role) => [role, ""]));

export default function ClientManagementSection({ client }) {
  const { branches } = useFirm();
  const { language } = useLanguage();

  const [teams, setTeams] = useState(INITIAL_TEAMS);

  const firstBranch = client.branchId
    ? String(client.branchId)
    : String(branches[0]?.id || "");

  const [branchId, setBranchId] = useState(firstBranch);
  // Edited here and only written to the client on Save, so a half-made team
  // never reaches the table below.
  const [draft, setDraft] = useState(
    () => teams[firstBranch] || emptyRoles()
  );

  const branchName = (branch) =>
    inLanguage(language, branch.name, branch.nameAr);

  /** Move the form to a branch, showing whatever that branch already has. */
  const openBranch = (id) => {
    setBranchId(id);
    setDraft(teams[id] || emptyRoles());
  };

  const assign = (role, personId) =>
    setDraft((prev) => ({ ...prev, [role]: personId }));

  const save = () =>
    setTeams((prev) => ({ ...prev, [branchId]: { ...draft } }));

  // Every role is required, so a branch is never listed half-staffed.
  const canSave =
    branchId && BRANCH_ROLES.every((role) => draft[role]);

  /** The branches with a team on them, and who is on each. */
  const staffed = branches
    .map((branch) => ({
      branch,
      team: BRANCH_ROLES.map((role) => ({
        role,
        person: personIn(String(branch.id), role, teams),
      })),
    }))
    .filter((row) => row.team.some((r) => r.person));

  return (
    <div className="space-y-6">
      {/* The branch plus its four roles, on one row where there is room */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="managementBranch">
            Branch Name<span className="text-destructive"> *</span>
          </Label>
          <Select value={branchId} onValueChange={openBranch}>
            <SelectTrigger id="managementBranch">
              <SelectValue placeholder="Please Select" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.branchNumber} - {branchName(branch)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* The roles this branch staffs, filled from that branch only */}
        {BRANCH_ROLES.map((role) => {
          const people = staffFor(branchId, role);
          const fieldId = "role-" + role.replace(/\s+/g, "-").toLowerCase();

          return (
            <div key={role} className="space-y-2">
              <Label htmlFor={fieldId}>
                {role}
                <span className="text-destructive"> *</span>
              </Label>
              <Select
                value={draft[role] || ""}
                onValueChange={(value) => assign(role, value)}
                disabled={people.length === 0}
              >
                <SelectTrigger id={fieldId}>
                  <SelectValue
                    placeholder={
                      people.length ? "Please Select" : "No one in this branch"
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

      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={!canSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      {/* Every branch that has a team, one row each. The branch name opens
          that team in the form above, which is the only way to change it. */}
      <Card>
        <CardContent className="p-0">
          {staffed.length === 0 ? (
            <div className="p-6">
              <EmptyState>
                No branch team has been saved for this client yet.
              </EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-sm font-semibold text-primary">
                    <th className="p-4">Branch Name</th>
                    {BRANCH_ROLES.map((role) => (
                      <th key={role} className="p-4">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffed.map(({ branch, team }) => (
                    <tr
                      key={branch.id}
                      className="border-b transition-colors last:border-0 hover:bg-primary/10"
                    >
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => openBranch(String(branch.id))}
                          className="rounded font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {branch.branchNumber} - {branchName(branch)}
                        </button>
                      </td>
                      {team.map(({ role, person }) => (
                        <td key={role} className="p-4">
                          {person ? (
                            person.name
                          ) : (
                            <span className="text-muted-foreground">
                              Not assigned
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
