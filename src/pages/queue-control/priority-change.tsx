import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useTicketLock, useChangePriority, usePriorityCategories } from "./use-ticket-ops";
import type { TicketDetail, PriorityCategory } from "./types";
import { toast } from "sonner";

interface Props {
  ticket: TicketDetail | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PriorityChangeDialog({ ticket, open, onClose, onSuccess }: Props) {
  const { lock, unlock, locking } = useTicketLock();
  const { change, submitting } = useChangePriority();
  const { categories, fetch: fetchCategories } = usePriorityCategories();

  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<PriorityCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tracks the id of the ticket we actually hold a lock on (avoids stale
  // closure in the effect cleanup reading the `locked` boolean).
  const lockedTicketIdRef = useRef<string | null>(null);

  // Fetch categories + acquire lock when dialog opens
  useEffect(() => {
    if (open && ticket) {
      setError(null);
      setSelected(null);
      setLocked(false);
      fetchCategories();

      lock(ticket.id)
        .then(() => {
          lockedTicketIdRef.current = ticket.id;
          setLocked(true);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to lock ticket");
        });
    }

    // Cleanup: release lock on close
    return () => {
      const lockedId = lockedTicketIdRef.current;
      if (lockedId) {
        lockedTicketIdRef.current = null;
        unlock(lockedId).catch(() => {});
      }
    };
  }, [open, ticket?.id, fetchCategories, lock, unlock]);

  const handleSubmit = async () => {
    if (!ticket || !selected) return;
    setError(null);
    try {
      await change(ticket.id, selected.id, selected.weight);
      // Lock was atomically released by the server during change-priority;
      // clear the ref so the effect cleanup does not fire a redundant unlock.
      lockedTicketIdRef.current = null;
      toast.success(`Priority changed to ${selected.nameEn}`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Priority change failed");
    }
  };

  const handleClose = () => {
    const lockedId = lockedTicketIdRef.current;
    if (lockedId) {
      lockedTicketIdRef.current = null;
      unlock(lockedId).catch(() => {});
    }
    setLocked(false);
    onClose();
  };

  if (!ticket) return null;

  const currentWeight = ticket.priorityWeight;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Priority</DialogTitle>
          <DialogDescription>
            Ticket{" "}
            <span className="font-mono font-medium">{ticket.ticketNumber}</span>
            {" "}&mdash; currently{" "}
            <span className="font-medium">{ticket.priorityCategory.nameEn}</span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {locking ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Acquiring lock...
          </div>
        ) : locked ? (
          <div className="grid gap-2 py-2">
            {categories.map((cat) => {
              const isCurrent = cat.weight === currentWeight;
              const isSelected = selected?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelected(cat)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    isCurrent
                      ? "cursor-not-allowed border-dashed opacity-50"
                      : isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cat.nameEn}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    Weight {cat.weight}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selected || submitting || !locked}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Confirm Change"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
