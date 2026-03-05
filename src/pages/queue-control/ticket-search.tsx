import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { useTicketSearch } from "./use-ticket-ops";
import type { TicketSearchResult } from "./types";
import { formatWaitTime } from "./format";

interface Props {
  serviceId: string | null;
  onSelectTicket: (ticketId: string) => void;
}

const statusColor: Record<string, string> = {
  WAITING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CALLED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SERVING: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  NO_SHOW: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusColor[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ResultRow({
  ticket,
  onSelect,
}: {
  ticket: TicketSearchResult;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
    >
      <span className="shrink-0 font-mono font-medium">{ticket.ticketNumber}</span>
      <StatusBadge status={ticket.status} />
      <span className="text-muted-foreground truncate">
        {ticket.serviceName.en}
      </span>
      <span className="ml-auto shrink-0 tabular-nums text-xs text-muted-foreground">
        {formatWaitTime(ticket.createdAt)}
      </span>
    </button>
  );
}

export function TicketSearch({ serviceId, onSelectTicket }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading, search, clear } = useTicketSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      clear();
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(query, serviceId ?? undefined);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, serviceId, search, clear]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (ticketId: string) => {
    setOpen(false);
    setQuery("");
    clear();
    onSelectTicket(ticketId);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search ticket # or phone..."
          className="pl-9 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); clear(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (query.trim().length >= 2) && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No tickets found
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto p-1">
              {results.map((t) => (
                <ResultRow
                  key={t.id}
                  ticket={t}
                  onSelect={() => handleSelect(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
