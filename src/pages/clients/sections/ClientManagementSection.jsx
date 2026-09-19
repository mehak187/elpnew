import {
  useState } from "react";
import { Button } from "@/components/ui/button";
import { Card,
  CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from "@/components/ui/select";
import FormHeading from "@/components/shared/FormHeading";
import { EmptyState } from "@/components/shared/panels";
import { Plus,
  Save,
  AlertTriangle,
  UserCog,
} from "lucide-react";
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

  /**
   * The branches this client can still be given a team at.
   *
   * A branch with a team is not offered again: there is one team per branch,
   * and the way to change it is to open it from the table. Editing shows the
   * branch it belongs to, which is not among them.
   */
  const available =
    mode === "edit"
      ? branches
      : branches.filter((branch) => !teams[String(branch.id)]);

  // Every branch already staffed: there is nothing to add, only teams to open.
  const nothingToAdd = mode === "add" && available.length === 0;

  const canSave = branchId && BRANCH_ROLES.every((role) => draft[role]);

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
          same line rather than costing a row of its own. While a team is open
          the form's heading stands in its place: one heading at a time. */}
      {!mode && (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        {/* Named as the sidebar names it: the page is already one client's. */}
        <h2 className="border-l-4 border-primary pl-3 text-lg font-bold text-primary">Team</h2>
        {/* ml-auto keeps it right once it wraps below the heading. */}
        <Button
          type="button"
          className="ml-auto"
          onClick={openAdd}
          disabled={mode === "add"}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Client Team
        </Button>
      </div>
      )}

      {/* The form opens above the table, never in place of it: the list of
          branch teams is the page, and it should not vanish to make room. */}
      {mode && (
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            <FormHeading
              icon={UserCog}
              onBack={close}
              title={mode === "add"
                  ? "Add Client Team"
                  : "Client Team - " +
                    (editingBranch ? branchName(editingBranch) : "")}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="managementBranch">
                  Branch Name<span className="whitespace-nowrap text-destructive">&nbsp;*</span>
                </Label>
                <Select
                  value={branchId}
                  onValueChange={chooseBranch}
                  // The branch of an existing team is what is being edited, so
                  // it is not up for changing here.
                  disabled={mode === "edit"}
                >
                  <SelectTrigger id="managementBranch">
                    <SelectValue
                      placeholder={
                        nothingToAdd ? "No branch left" : "Please Select"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((branch) => (
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
                      <span className="whitespace-nowrap text-destructive">&nbsp;*</span>
                    </Label>
                    <Select
                      value={draft[role] || ""}
                      onValueChange={(value) => assign(role, value)}
                      disabled={!branchId || !people.length}
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

            {nothingToAdd && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Every branch already has a team for this client. Open a branch
                  in the table below to change the people on it.
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
              <table className="w-full min-w-[720px] border text-sm">
                <thead>
                  <tr className="border-b bg-secondary/60 text-left text-primary">
                    <th className="border-r p-3 font-semibold last:border-r-0">
                      Branch Name
                    </th>
                    {BRANCH_ROLES.map((role) => (
                      <th
                        key={role}
                        className="border-r p-3 font-semibold last:border-r-0"
                      >
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
                      <td className="border-r p-3 last:border-r-0">
                        {/* The way into an existing team: the branch name
                            opens it in the form above. */}
                        <button
                          type="button"
                          onClick={() => openBranch(String(branch.id))}
                          className="rounded font-medium text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {branch.branchNumber} - {branchName(branch)}
                        </button>
                      </td>
                      {team.map(({ role, person }) => (
                        <td key={role} className="border-r p-3 last:border-r-0">
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
