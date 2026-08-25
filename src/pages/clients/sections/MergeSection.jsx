import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useClients } from "@/lib/clients/context";
import { clientDisplayName, mergedInto } from "../clientRecords";
import { MERGE_TRANSFER_ITEMS } from "../clientMockData";

/**
 * Folding one client into another.
 *
 * The profile being viewed is the main client - that is what makes this a page
 * rather than a form, so it is stated, not chosen. Only the client coming in is
 * asked for.
 */
export default function MergeSection({ client }) {
  const navigate = useNavigate();
  const { clients, mergeClients } = useClients();

  const [otherId, setOtherId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);

  const other = clients.find((c) => String(c.id) === otherId) || null;
  const absorbed = mergedInto(clients, client);

  // A client already folded into somewhere cannot be folded in again, and a
  // client this one was folded into cannot be pulled back the other way.
  const options = clients.filter(
    (c) =>
      c.id !== client.id &&
      !c.mergedIntoClientNo &&
      c.clientNo !== client.mergedIntoClientNo
  );

  const handleMerge = () => {
    mergeClients(other.clientNo, client.clientNo);
    setResult({ from: other.clientName, fromNo: other.clientNo });
    setOtherId("");
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
              <span className="text-muted-foreground">Merged in: </span>
              {result.from} ({result.fromNo})
            </p>
            <p>
              <span className="text-muted-foreground">Now reads as: </span>
              <span className="font-medium">
                {clientDisplayName(clients, client)}
              </span>
            </p>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">
              Moved to {client.clientName}
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
            {result.from} was kept, not deleted. Its profile stays open to read
            and now shows that it was merged with {client.clientName}.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mainClient">Main Client</Label>
              <Input
                id="mainClient"
                value={client.clientNo + " - " + client.clientName}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mergedClient">
                Client to be Merged into This Client *
              </Label>
              <SearchableSelect
                id="mergedClient"
                value={otherId}
                onValueChange={setOtherId}
                options={options.map((c) => ({
                  value: String(c.id),
                  label: c.clientNo + " - " + c.clientName,
                }))}
                placeholder="Select client"
                searchPlaceholder="Search by number or name..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!other}
              onClick={() => setConfirmOpen(true)}
            >
              Merge into {client.clientName}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What has already been folded in, so a second merge is an informed one */}
      {absorbed.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">
              Already merged into this client
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {absorbed.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Check className="h-3 w-3 shrink-0 text-green-600" />
                  {c.clientNo} - {c.clientName}
                  {c.mergedOn && (
                    <span className="text-xs">
                      on {new Date(c.mergedOn).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm merge</DialogTitle>
            <DialogDescription>
              Everything below moves to {client.clientName}. The client being
              merged is kept, not deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span>{other?.clientName}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{client.clientName}</span>
            </p>

            <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {MERGE_TRANSFER_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <p className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
              Afterwards this client reads as{" "}
              <span className="font-medium text-foreground">
                {client.clientName} — {other?.clientName} Previously
              </span>
              , so anything raised under the old name is still found by it.
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
