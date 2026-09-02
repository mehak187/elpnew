import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/panels";
import { Plus, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCirculars,
  TARGET_GROUPS,
  nextCircularNo,
} from "@/lib/circulars/context";
import { formatDate, dayOffset } from "../firmData";

const CONTENT_LIMIT = 1000;

const emptyDraft = {
  date: dayOffset(0),
  targetGroup: "All Employees",
  content: "",
};

/** A required field, with the mark that says so. */
function FieldLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-destructive"> *</span>
    </Label>
  );
}

/**
 * The firm's circulars, and who has read them.
 *
 * A circular is not a document on a shelf: once issued it stops everybody it
 * is addressed to from using the system until they acknowledge it, and the
 * acknowledgement is written against the circular here. That is why the number
 * is given by the system and the acknowledgement column is never editable -
 * both are the record that the notice was actually received.
 */
export default function CircularsSection({ canEdit }) {
  const { circulars, addCircular } = useCirculars();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const circularNo = nextCircularNo(circulars);

  const canSave =
    canEdit && draft.date && draft.targetGroup && draft.content.trim();

  const closeAdd = () => {
    setDraft(emptyDraft);
    setAdding(false);
  };

  const save = () => {
    if (!canSave) return;
    addCircular({
      circularNo,
      date: draft.date,
      targetGroup: draft.targetGroup,
      content: draft.content.trim(),
    });
    closeAdd();
  };

  /* --------------------------------------------------------- issuing one */

  if (adding && canEdit) {
    return (
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <p className="border-l-4 border-primary pl-3 text-lg font-bold text-primary">
            New Circular
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="circularNo">Circular Number</Label>
              <div className="relative">
                {/* Given by the system: a circular is referred to by its
                    number long after it was issued, so it cannot be typed. */}
                <Input
                  id="circularNo"
                  readOnly
                  tabIndex={-1}
                  className="bg-muted pr-9"
                  value={circularNo}
                />
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="circularDate">Circular Date</FieldLabel>
              <Input
                id="circularDate"
                type="date"
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="targetGroup">Target Group</FieldLabel>
              <Select
                value={draft.targetGroup}
                onValueChange={(value) => set("targetGroup", value)}
              >
                <SelectTrigger id="targetGroup">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="circularContent">Circular Content</FieldLabel>
            <Textarea
              id="circularContent"
              rows={5}
              maxLength={CONTENT_LIMIT}
              placeholder="What the circular says"
              value={draft.content}
              onChange={(e) => set("content", e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {draft.content.length}/{CONTENT_LIMIT}
            </p>
          </div>

          <p className="rounded-lg border border-primary/30 bg-secondary p-4 text-sm text-primary">
            Once issued, everyone in {draft.targetGroup} is stopped at sign-in
            until they acknowledge this circular.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" onClick={closeAdd}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave}>
              Issue Circular
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ------------------------------------------------------ what is on file */

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {circulars.length} {circulars.length === 1 ? "circular" : "circulars"}
        </p>
        {canEdit && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Circular
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {circulars.length === 0 ? (
            <div className="p-6">
              <EmptyState>No circulars have been issued yet.</EmptyState>
            </div>
          ) : (
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-semibold" style={{ width: "13%" }}>
                    Circular Number
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "11%" }}>
                    Circular Date
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "14%" }}>
                    Target Group
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "40%" }}>
                    Circular Content
                  </th>
                  <th className="p-3 font-semibold" style={{ width: "22%" }}>
                    Acknowledgment
                  </th>
                </tr>
              </thead>
              <tbody>
                {circulars.map((circular) => (
                  <tr
                    key={circular.id}
                    className="border-b align-top transition-colors last:border-0 hover:bg-primary/10"
                  >
                    <td className="whitespace-nowrap p-3 font-semibold text-primary">
                      {circular.circularNo}
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {formatDate(circular.date)}
                    </td>
                    <td className="p-3">{circular.targetGroup}</td>
                    <td className="p-3 text-muted-foreground">
                      {circular.content}
                    </td>
                    {/* Written by the act of acknowledging, never by hand */}
                    <td className="p-3">
                      {circular.acknowledgements.length === 0 ? (
                        <span className="text-muted-foreground">
                          Awaiting acknowledgment
                        </span>
                      ) : (
                        <ul className="space-y-1">
                          {circular.acknowledgements.map((entry) => (
                            <li
                              key={entry.name + entry.at}
                              className={cn(
                                "flex items-start gap-1.5 leading-tight"
                              )}
                            >
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                              <span>
                                <span className="block">{entry.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {entry.at}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
