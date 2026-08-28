import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { EmptyState, Tile } from "@/components/shared/panels";
import { Save, Plus, Trash2, CalendarDays, Activity } from "lucide-react";
import { liveCases } from "@/pages/clients/clientCases";
import {
  ACTIVITY_TYPES,
  activityType,
  LEGAL_DOCUMENT_TYPES,
  spanMinutes,
  formatDuration,
  today,
  longDate,
  recordedDays,
} from "../activityData";

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

/** A heading with a rule under it, matching the other sections. */
function Block({ title, children }) {
  return (
    <div className="space-y-4">
      <p className="border-b pb-2 text-sm font-semibold text-primary">{title}</p>
      {children}
    </div>
  );
}

const emptyActivity = {
  type: "",
  caseNo: "",
  location: "",
  person: "",
  from: "",
  to: "",
};

const emptyDocument = { type: "", caseNo: "", description: "", count: "1" };

/**
 * The working day as the employee records it.
 *
 * Nothing here asks for a number that can be counted instead: sessions,
 * meetings and documents are entered one by one and the totals fall out of the
 * entries, so a day cannot claim three hearings and list two. Office time and
 * system active time are both shown but neither is typed - the first is read
 * off the clock, the second off what the employee actually did in YANDS.
 */
export default function DailyActivitiesSection() {
  const date = today();

  // What the system saw of today, rather than what anybody says about it.
  const recorded = recordedDays().find((day) => day.date === date);
  const activeMinutes = recorded?.activeMinutes ?? 0;

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [otherWork, setOtherWork] = useState("");

  const [activity, setActivity] = useState(emptyActivity);
  const [document, setDocument] = useState(emptyDocument);

  const officeMinutes = spanMinutes(startTime, endTime);

  const setActivityField = (name, value) =>
    setActivity((prev) => ({ ...prev, [name]: value }));
  const setDocumentField = (name, value) =>
    setDocument((prev) => ({ ...prev, [name]: value }));

  const shape = activityType(activity.type);

  const canAddActivity =
    activity.type && activity.from && activity.to && spanMinutes(activity.from, activity.to) > 0;

  const addActivity = () => {
    if (!canAddActivity) return;
    setActivities((prev) => [...prev, { ...activity, id: prev.length + 1 }]);
    setActivity(emptyActivity);
  };

  const canAddDocument = document.type && Number(document.count) > 0;

  const addDocument = () => {
    if (!canAddDocument) return;
    setDocuments((prev) => [
      ...prev,
      { ...document, count: Number(document.count), id: prev.length + 1 },
    ]);
    setDocument(emptyDocument);
  };

  // Counted, never typed.
  const countOf = (key) =>
    activities.filter((a) => activityType(a.type).key === key).length;
  const minutesOf = (key) =>
    activities
      .filter((a) => activityType(a.type).key === key)
      .reduce((total, a) => total + spanMinutes(a.from, a.to), 0);
  const documentCount = documents.reduce((total, d) => total + d.count, 0);

  const save = () => {
    console.log("Saving daily activity:", {
      date,
      startTime,
      endTime,
      officeMinutes,
      activeMinutes,
      activities,
      documents,
      otherWork,
    });
  };

  return (
    <div className="space-y-6">
      {/* The day itself */}
      <div className="rounded-lg border p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-primary">Working Day</p>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {longDate(date)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="space-y-2">
            <FieldLabel htmlFor="day-start" required>
              Start Time / Check-in
            </FieldLabel>
            <Input
              id="day-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="day-end" required>
              End Time / Check-out
            </FieldLabel>
            <Input
              id="day-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="day-office">Total Office Working Time</FieldLabel>
            <Input
              id="day-office"
              readOnly
              tabIndex={-1}
              className="bg-muted text-muted-foreground"
              value={formatDuration(officeMinutes)}
            />
            <p className="text-xs text-muted-foreground">
              Calculated from check-in and check-out
            </p>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="day-active">System Active Time</FieldLabel>
            <Input
              id="day-active"
              readOnly
              tabIndex={-1}
              className="bg-muted text-muted-foreground"
              value={formatDuration(activeMinutes)}
            />
            <p className="text-xs text-muted-foreground">
              Recorded by YANDS - idle time is not counted
            </p>
          </div>
        </div>
      </div>

      {/* What the day was spent on */}
      <div className="rounded-lg border p-4">
        <p className="mb-4 font-semibold text-primary">Daily Activities</p>

        <Block title="Add Activity">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="activity-type" required>
                Activity Type
              </FieldLabel>
              <Select
                value={activity.type}
                onValueChange={(value) => setActivityField("type", value)}
              >
                <SelectTrigger id="activity-type">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="activity-case">Related Case / File</FieldLabel>
              <Select
                value={activity.caseNo}
                onValueChange={(value) => setActivityField("caseNo", value)}
              >
                <SelectTrigger id="activity-case">
                  <SelectValue placeholder="Select case, if any" />
                </SelectTrigger>
                <SelectContent>
                  {liveCases.map((legalCase) => (
                    <SelectItem key={legalCase.id} value={legalCase.caseNo}>
                      {legalCase.caseNo} - {legalCase.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="activity-location">
                {shape.location}
              </FieldLabel>
              <Input
                id="activity-location"
                placeholder={"Enter " + shape.location.toLowerCase()}
                value={activity.location}
                onChange={(e) => setActivityField("location", e.target.value)}
              />
            </div>

            {/* Only the types that meet somebody ask who it was */}
            {shape.person && (
              <div className="space-y-2">
                <FieldLabel htmlFor="activity-person">{shape.person}</FieldLabel>
                <Input
                  id="activity-person"
                  placeholder={"Enter " + shape.person.toLowerCase()}
                  value={activity.person}
                  onChange={(e) => setActivityField("person", e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <FieldLabel htmlFor="activity-from" required>
                From Time
              </FieldLabel>
              <Input
                id="activity-from"
                type="time"
                value={activity.from}
                onChange={(e) => setActivityField("from", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="activity-to" required>
                To Time
              </FieldLabel>
              <Input
                id="activity-to"
                type="time"
                value={activity.to}
                onChange={(e) => setActivityField("to", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={addActivity}
              disabled={!canAddActivity}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </div>
        </Block>

        <div className="mt-6 overflow-x-auto">
          {activities.length === 0 ? (
            <EmptyState>No activities recorded for today yet.</EmptyState>
          ) : (
            <table className="w-full min-w-[720px] border text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-semibold">Activity Type</th>
                  <th className="p-3 font-semibold">Case / File</th>
                  <th className="p-3 font-semibold">Court / Location</th>
                  <th className="p-3 font-semibold">Client / Expert</th>
                  <th className="p-3 font-semibold">From - To</th>
                  <th className="p-3 font-semibold">Duration</th>
                  <th className="p-3 font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors last:border-0 hover:bg-primary/10"
                  >
                    <td className="p-3 font-medium">{row.type}</td>
                    <td className="p-3">{row.caseNo || "-"}</td>
                    <td className="p-3">{row.location || "-"}</td>
                    <td className="p-3">{row.person || "-"}</td>
                    <td className="whitespace-nowrap p-3">
                      {row.from} - {row.to}
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {formatDuration(spanMinutes(row.from, row.to))}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() =>
                          setActivities((prev) =>
                            prev.filter((a) => a.id !== row.id)
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove {row.type}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* What was written */}
      <div className="rounded-lg border p-4">
        <p className="mb-4 font-semibold text-primary">
          Memos &amp; Pleadings Written
        </p>

        <Block title="Add Document">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <div className="space-y-2">
              <FieldLabel htmlFor="document-type" required>
                Document Type
              </FieldLabel>
              <Select
                value={document.type}
                onValueChange={(value) => setDocumentField("type", value)}
              >
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="document-case">Related Case / File</FieldLabel>
              <Select
                value={document.caseNo}
                onValueChange={(value) => setDocumentField("caseNo", value)}
              >
                <SelectTrigger id="document-case">
                  <SelectValue placeholder="Select case, if any" />
                </SelectTrigger>
                <SelectContent>
                  {liveCases.map((legalCase) => (
                    <SelectItem key={legalCase.id} value={legalCase.caseNo}>
                      {legalCase.caseNo} - {legalCase.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="document-description">
                Short Description
              </FieldLabel>
              <Input
                id="document-description"
                placeholder="What the document covers"
                value={document.description}
                onChange={(e) => setDocumentField("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="document-count" required>
                Number Completed
              </FieldLabel>
              <Input
                id="document-count"
                type="number"
                min="1"
                value={document.count}
                onChange={(e) => setDocumentField("count", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={addDocument}
              disabled={!canAddDocument}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          </div>
        </Block>

        <div className="mt-6 overflow-x-auto">
          {documents.length === 0 ? (
            <EmptyState>No memos or pleadings recorded for today yet.</EmptyState>
          ) : (
            <table className="w-full min-w-[640px] border text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-semibold">Document Type</th>
                  <th className="p-3 font-semibold">Case / File</th>
                  <th className="p-3 font-semibold">Short Description</th>
                  <th className="p-3 font-semibold">Number</th>
                  <th className="p-3 font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors last:border-0 hover:bg-primary/10"
                  >
                    <td className="p-3 font-medium">{row.type}</td>
                    <td className="p-3">{row.caseNo || "-"}</td>
                    <td className="p-3 text-muted-foreground">
                      {row.description || "-"}
                    </td>
                    <td className="p-3">{row.count}</td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() =>
                          setDocuments((prev) =>
                            prev.filter((d) => d.id !== row.id)
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove {row.type}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Everything the categories do not cover */}
      <div className="rounded-lg border p-4">
        <p className="mb-4 font-semibold text-primary">Other Work / Notes</p>
        <Textarea
          rows={4}
          placeholder="Any other work carried out today"
          value={otherWork}
          onChange={(e) => setOtherWork(e.target.value)}
        />
      </div>

      {/* Where the day adds up */}
      <div className="rounded-lg border p-4">
        <p className="mb-4 inline-flex items-center gap-2 font-semibold text-primary">
          <Activity className="h-4 w-4" />
          Day Summary
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tile label="Office Working Time" value={formatDuration(officeMinutes)} />
          <Tile label="System Active Time" value={formatDuration(activeMinutes)} />
          <Tile label="Memos & Pleadings" value={documentCount} />
          <Tile
            label="Court Sessions"
            value={countOf("court") + " (" + formatDuration(minutesOf("court")) + ")"}
          />
          <Tile
            label="Client Meetings"
            value={countOf("client") + " (" + formatDuration(minutesOf("client")) + ")"}
          />
          <Tile
            label="Expert Meetings"
            value={countOf("expert") + " (" + formatDuration(minutesOf("expert")) + ")"}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={!startTime || !endTime}>
          <Save className="mr-2 h-4 w-4" />
          Save Daily Activity
        </Button>
      </div>
    </div>
  );
}
