import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Megaphone } from "lucide-react";
import { useCirculars, pendingFor } from "@/lib/circulars/context";
import { CURRENT_USER } from "@/pages/dashboard/dashboardData";

/** "2026-02-03" as "03/02/2026". */
const formatDate = (value) => {
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
};

/**
 * The circulars a person has to read before they can do anything else.
 *
 * Shown one at a time, oldest first, with no way past it: no close button, no
 * escape key, no click outside. That is the point of a circular - the firm has
 * to be able to say everybody addressed by it has seen it, and a prompt that
 * can be dismissed proves nothing.
 *
 * The dialog is modal, so everything behind it is inert while it is open: no
 * navigation, no typing, no saving.
 */
export default function CircularGate() {
  const { circulars, acknowledge } = useCirculars();

  const outstanding = pendingFor(
    circulars,
    CURRENT_USER.group,
    CURRENT_USER.name
  );
  const circular = outstanding[0];

  if (!circular) return null;

  return (
    <Dialog open>
      <DialogContent
        hideClose
        className="max-w-lg"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded-lg bg-primary p-2 text-primary-foreground">
              <Megaphone className="h-4 w-4" />
            </span>
            Circular {circular.circularNo}
          </DialogTitle>
          <DialogDescription>
            {formatDate(circular.date)} &middot; {circular.targetGroup}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-lg border bg-secondary p-4 text-sm text-primary">
          {circular.content}
        </p>

        {/* Said plainly, because the reader cannot get past this either way */}
        <p className="text-xs text-muted-foreground">
          You cannot use the system until this circular is acknowledged. Your
          name and the time will be recorded against it.
          {outstanding.length > 1 &&
            " " + (outstanding.length - 1) + " more to read after this one."}
        </p>

        <DialogFooter>
          <Button onClick={() => acknowledge(circular.id, CURRENT_USER.name)}>
            I acknowledge this circular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
