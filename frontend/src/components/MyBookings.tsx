import { AnimatePresence, motion } from "framer-motion";
import type { BookingWithDesk } from "../types";
import { formatLong } from "../lib/dates";

interface MyBookingsProps {
  bookings: BookingWithDesk[];
  loading: boolean;
  pendingId: number | null;
  onCancel: (booking: BookingWithDesk) => void;
}

export function MyBookings({ bookings, loading, pendingId, onCancel }: MyBookingsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/15 bg-surface/60 p-14 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-paper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="6" width="18" height="8" rx="1.4" stroke="#5B6677" strokeWidth="1.7" />
            <path d="M7 14v4M17 14v4" stroke="#5B6677" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 font-display text-lg font-bold text-ink">No upcoming bookings</p>
        <p className="mt-1 text-sm text-ink-soft">
          Head to the floor plan and tap a glowing desk to reserve your spot.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AnimatePresence mode="popLayout">
        {bookings.map((b) => (
          <motion.div
            key={b.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-panel"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-tint text-primary-dark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="6" width="18" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M7 14v4M17 14v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-none text-ink">{b.desk.label}</p>
                <p className="mt-1 text-xs text-ink-soft">{b.desk.zone}</p>
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-primary">
                  {formatLong(b.booking_date)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={pendingId === b.id}
              onClick={() => onCancel(b)}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              {pendingId === b.id ? "Cancelling…" : "Cancel"}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
