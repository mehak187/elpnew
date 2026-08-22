import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Check, Info } from "lucide-react";
import { clientDirectory, MERGE_TRANSFER_ITEMS } from "../clientMockData";

// Stands in for the signed-in user until auth is wired up.
const CURRENT_USER = "Mohammed Al Yahyaei";

const nameOf = (clientNo) =>
  clientDirectory.find((c) => c.clientNo === clientNo)?.clientName || "";

export default function MergeSection() {
  const navigate = useNavigate();
  const [oldClientOne, setOldClientOne] = useState("");
  const [oldClientTwo, setOldClientTwo] = useState("");
  const [targetClient, setTargetClient] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);

  const oldClients = [oldClientOne, oldClientTwo].filter(Boolean);

  // A client cannot be merged into itself, and the same record cannot sit on
  // both sides of the merge.
  const isTargetValid = targetClient && !oldClients.includes(targetClient);
  const canMerge =
    oldClientOne && oldClientTwo && oldClientOne !== oldClientTwo && isTargetValid;

  const handleMerge = () => {
    setResult({
      mergedFrom: oldClients.map(nameOf),
      mergedInto: nameOf(targetClient),
      mergeDate: new Date().toISOString().slice(0, 10),
      performedBy: CURRENT_USER,
    });
    setConfirmOpen(false);
  };

  if (result) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <h3 className="font-semibold">Merge completed</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Merged clients: </span>
              {result.mergedFrom.join(", ")}
            </p>
            <p>
              <span className="text-muted-foreground">Merged into: </span>
              <span className="font-medium">{result.mergedInto}</span>
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
          <p className="text-sm text-muted-foreground">
            The old clients were kept, not deleted. Their status is now Merged
            and each profile shows which client it was merged into.
          </p>
          <Button variant="outline" onClick={() => setResult(null)}>
            Merge another pair
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oldClientOne">Old Client 1 *</Label>
              <Select value={oldClientOne} onValueChange={setOldClientOne}>
                <SelectTrigger id="oldClientOne">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clientDirectory.map((client) => (
                    <SelectItem key={client.clientNo} value={client.clientNo}>
                      {client.clientNo} - {client.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oldClientTwo">Old Client 2 *</Label>
              <Select value={oldClientTwo} onValueChange={setOldClientTwo}>
                <SelectTrigger id="oldClientTwo">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clientDirectory
                    .filter((client) => client.clientNo !== oldClientOne)
                    .map((client) => (
                      <SelectItem key={client.clientNo} value={client.clientNo}>
                        {client.clientNo} - {client.clientName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetClient">Resulting Client *</Label>
              <Select value={targetClient} onValueChange={setTargetClient}>
                <SelectTrigger id="targetClient">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clientDirectory
                    .filter((client) => !oldClients.includes(client.clientNo))
                    .map((client) => (
                      <SelectItem key={client.clientNo} value={client.clientNo}>
                        {client.clientNo} - {client.clientName}
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
          </div>

          {/* What the merge will move */}
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                Everything below is transferred to the resulting client
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 text-sm text-muted-foreground">
              {MERGE_TRANSFER_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
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
              This links all history from the selected clients to the resulting
              client. It is recorded against your name and cannot be undone from
              this screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Merging: </span>
              {oldClients.map(nameOf).join(" + ")}
            </p>
            <p>
              <span className="text-muted-foreground">Into: </span>
              <span className="font-medium">{nameOf(targetClient)}</span>
            </p>
            <p className="text-muted-foreground">
              The old clients are kept and marked as Merged.
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
