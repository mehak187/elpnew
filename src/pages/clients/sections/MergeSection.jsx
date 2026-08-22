import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { ArrowRight, Check } from "lucide-react";
import { clientRecords } from "../clientRecords";
import { MERGE_TRANSFER_ITEMS } from "../clientMockData";

// Stands in for the signed-in user until auth is wired up.
const CURRENT_USER = "Mohammed Al Yahyaei";

export default function MergeSection({ client }) {
  const navigate = useNavigate();

  // The profile being viewed is always the first of the two, so it is stated
  // rather than chosen.
  const [otherId, setOtherId] = useState("");
  const [survivorId, setSurvivorId] = useState(String(client.id));
  const [resultingName, setResultingName] = useState(client.clientName);
  const [nameEdited, setNameEdited] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);

  const other = clientRecords.find((c) => String(c.id) === otherId) || null;
  const survivorOptions = [client, other].filter(Boolean);

  /* The name follows whichever client survives, until it is typed over. */
  const chooseSurvivor = (id) => {
    setSurvivorId(id);
    if (!nameEdited) {
      const picked = survivorOptions.find((c) => String(c.id) === id);
      if (picked) setResultingName(picked.clientName);
    }
  };

  const chooseOther = (id) => {
    setOtherId(id);
    // Picking a different second client cannot leave it selected as survivor.
    if (survivorId !== String(client.id)) {
      setSurvivorId(String(client.id));
      if (!nameEdited) setResultingName(client.clientName);
    }
  };

  const canMerge = other && resultingName.trim();

  const handleMerge = () => {
    setResult({
      mergedFrom: [client.clientName, other.clientName],
      resultingName: resultingName.trim(),
      mergeDate: new Date().toISOString().slice(0, 10),
      performedBy: CURRENT_USER,
    });
    setConfirmOpen(false);
  };

  if (result) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <h3 className="font-semibold">Merge completed</h3>
          </div>

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Merged clients: </span>
              {result.mergedFrom.join(" + ")}
            </p>
            <p>
              <span className="text-muted-foreground">Resulting client: </span>
              <span className="font-medium">{result.resultingName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Merge date: </span>
              {new Date(result.mergeDate).toLocaleDateString("en-GB")}
            </p>
            <p>
              <span className="text-muted-foreground">Performed by: </span>
              {result.performedBy}
            </p>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">
              Moved to {result.resultingName}
            </p>
            <ul className="grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              {MERGE_TRANSFER_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-3 w-3 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Both original clients were kept, not deleted. Their status is now
            Merged and each profile shows where its records went.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setResult(null)}>
              Merge another client
            </Button>
            <Button onClick={() => navigate("/clients")}>Back to Clients</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="oldClientOne">Old Client 1</Label>
              <Input
                id="oldClientOne"
                value={client.clientNo + " - " + client.clientName}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oldClientTwo">Old Client 2 *</Label>
              <SearchableSelect
                id="oldClientTwo"
                value={otherId}
                onValueChange={chooseOther}
                options={clientRecords
                  .filter((c) => c.id !== client.id)
                  .map((c) => ({
                    value: String(c.id),
                    label: c.clientNo + " - " + c.clientName,
                  }))}
                placeholder="Select client"
                searchPlaceholder="Search by number or name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="survivor">Resulting Client *</Label>
              <Select
                value={survivorId}
                onValueChange={chooseSurvivor}
                disabled={!other}
              >
                <SelectTrigger id="survivor">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {survivorOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.clientNo} - {option.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => navigate("/clients/create")}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Or create a new client
              </button>
            </div>

            {/* Defaults to the surviving client's name, but can be changed. */}
            <div className="space-y-2">
              <Label htmlFor="resultingName">Resulting Client Name *</Label>
              <Input
                id="resultingName"
                value={resultingName}
                onChange={(e) => {
                  setResultingName(e.target.value);
                  setNameEdited(true);
                }}
                placeholder="Enter the name to keep"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!canMerge}
              onClick={() => setConfirmOpen(true)}
            >
              Merge Clients
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm merge</DialogTitle>
            <DialogDescription>
              Everything below moves to the resulting client. It is recorded
              against your name and cannot be undone from this screen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span>{client.clientName}</span>
              <span className="text-muted-foreground">+</span>
              <span>{other?.clientName}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{resultingName}</span>
            </p>

            <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {MERGE_TRANSFER_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <p className="text-muted-foreground">
              Both original clients are kept and marked as Merged.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMerge}>Confirm merge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
