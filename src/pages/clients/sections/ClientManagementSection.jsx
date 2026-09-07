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
import BackButton from "@/components/shared/BackButton";
import { EmptyState } from "@/components/shared/panels";
import { Plus, Save, AlertTriangle } from "lucide-react";
import { useFirm } from "@/lib/firm/context";
import { useLanguage, inLanguage } from "@/lib/language/context";
import { BRANCH_ROLES, staffFor } from "@/pages/firm/firmData";

/**
 * Who runs this client's work at each branch.
 *
 * Held per branch rather than as one set: the same client can be handled by
 * Muscat and by Salalah, and each office staffs the four roles from its own
 * people. A branch therefore has one team, and only one - a second assignment
 * against the same branch would be two answers to the same question.
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

export default function ClientManagementSection() {
  const { branches } = useFirm();
  const { language } = useLanguage();

  const [teams, setTeams] = useState(INITIAL_TEAMS);
  // Null while the page is just the list. "add" for a new branch team, or the
  // branch id being edited.
  const [mode, setMode] = useState(null);
  const [branchId, setBranchId] = useState("");
  const [draft, setDraft] = useState(emptyRoles);

  const branchName = (branch) =>
    inLanguage(language, branch.name, branch.nameAr);

  const openAdd = () => {
    setMode("add");
    setBranchId("");
    setDraft(emptyRoles());
  };

  /** Opens a branch's existing team in the section above the table. */
  const openBranch = (id) => {
    setMode("edit");
    setBranchId(id);
    setDraft({ ...emptyRoles(), ...teams[id] });
  };

  const close = () => {
    setMode(null);
    setBranchId("");
    setDraft(emptyRoles());
  };

  const assign = (role, personId) =>
    setDraft((prev) => ({ ...prev, [role]: personId }));

  /**
   * Changing the branch starts that branch's team afresh.
   *
   * People belong to one office, so the four names picked for Muscat mean
   * nothing at Salalah - carrying them across would offer staff who do not
   * work there.
   */
  const chooseBranch = (id) => {
    setBranchId(id);
    setDraft(emptyRoles());
  };

  // A branch already in the table cannot be added a second time. Said here
  // rather than by hiding it from the list, so the reason is on screen.
  const alreadyStaffed = mode === "add" && Boolean(teams[branchId]);

  const canSave =
    branchId && !alreadyStaffed && BRANCH_ROLES.every((role) => draft[role]);

  const save = () => {
    if (!canSave) return;
    setTeams((prev) => ({ ...prev, [branchId]: { ...draft } }));
    close();
  };

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

  const editingBranch = branches.find((b) => String(b.id) === branchId);

  return (
    <div className="space-y-6">
      {/* The section's own heading, so the way to add to it sits on the
          same line rather than costing a row of its own. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <h2 className="text-base font-semibold text-primary">Client Team</h2>
        <Button type="button" onClick={openAdd} disabled={mode === "add"}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Client Team
        </Button>
      </div>

      {/* The form opens above the table, never in place of it: the list of
          branch teams is the page, and it should not vanish to make room. */}
      {mode && (
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <BackButton onBack={close} />
              <p className="border-l-4 border-primary pl-3 text-lg font-bold text-primary">
                {mode === "add"
                  ? "Add Client Team"
                  : "Client Team - " +
                    (editingBranch ? branchName(editingBranch) : "")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="managementBranch">
                  Branch Name<span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={branchId}
                  onValueChange={chooseBranch}
                  // The branch of an existing team is what is being edited, so
                  // it is not up for changing here.
                  disabled={mode === "edit"}
                >
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
                      disabled={!branchId || alreadyStaffed || !people.length}
                    >
                      <SelectTrigger id={fieldId}>
                        <SelectValue
                          placeholder={
                            !branchId
                              ? "Select a branch first"
                              : people.length
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

            {alreadyStaffed && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This branch already has a Client Team. Please use the table
                  below to edit the existing assignment.
                </span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!canSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Every branch that has a team, one row each. The branch name opens
          that team above, which is the only way to change it.
 */}
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
