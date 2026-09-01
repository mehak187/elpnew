import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/shared/panels";
import { Search, FileSpreadsheet } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";
import { useFirm } from "@/lib/firm/context";
import { useLanguage, inLanguage } from "@/lib/language/context";
import { BRANCH_ROLES, staffFor } from "@/pages/firm/firmData";

const PAGE_SIZES = [10, 25, 50];

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

export default function ClientManagementSection({ client }) {
  const { branches } = useFirm();
  const { language } = useLanguage();

  const [branchId, setBranchId] = useState(
    client.branchId ? String(client.branchId) : String(branches[0]?.id || "")
  );
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Every change lands on the record straight away - there is no draft here to
  // save, so a Save button would only be something else to forget to press.
  const assign = (role, personId) =>
    setTeams((prev) => ({
      ...prev,
      [branchId]: { ...prev[branchId], [role]: personId },
    }));

  const branchName = (branch) =>
    inLanguage(language, branch.name, branch.nameAr);

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

  const search = query.trim().toLowerCase();
  const shown = staffed.filter(({ branch, team }) => {
    if (!search) return true;
    return [branchName(branch), ...team.map((r) => r.person?.name)]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

  const exportTeams = () =>
    downloadCsv(
      toCsv(
        [{ key: "branch", header: "Branch" }].concat(
          BRANCH_ROLES.map((role) => ({ key: role, header: role }))
        ),
        shown.map(({ branch, team }) => {
          const row = { branch: branchName(branch) };
          team.forEach(({ role, person }) => {
            row[role] = person?.name || "";
          });
          return row;
        })
      ),
      "client-management.csv"
    );

  return (
    <div className="space-y-6">
      {/* The branch plus its four roles, on one row where there is room */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="managementBranch">
            Branch Name<span className="text-destructive"> *</span>
          </Label>
          <Select value={branchId} onValueChange={setBranchId}>
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
                value={teams[branchId]?.[role] || ""}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* How many branch sections to show at once */}
          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportTeams}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Excel
          </Button>
        </div>
      </div>

      {/* One section per branch, so a change shows up where it belongs */}
      {shown.length === 0 ? (
        <EmptyState>No branch team matches that search.</EmptyState>
      ) : (
        shown.slice(0, pageSize).map(({ branch, team }) => (
          <Card key={branch.id}>
            <CardContent className="p-0">
              <p className="p-4 text-lg font-bold text-primary">
                {branchName(branch)} Branch Management
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-y bg-muted/50 text-left text-xs font-semibold text-primary">
                      <th className="p-3">#</th>
                      {BRANCH_ROLES.map((role) => (
                        <th key={role} className="p-3">
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* One row: one person per role, for this branch alone */}
                    <tr className="transition-colors hover:bg-primary/10">
                      <td className="p-3 text-muted-foreground">1</td>
                      {team.map(({ role, person }) => (
                        <td key={role} className="p-3">
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
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
