import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Desk } from "../types";

interface BookingDrawerProps {
  desk: Desk | null;
  date: string;
  pending: boolean;
  onClose: () => void;
  onBook: (desk: Desk) => void;
  onCancel: (desk: Desk) => void;
}

function prettyDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function BookingDrawer({ desk, date, pending, onClose, onBook, onCancel }: BookingDrawerProps) {
  const available = desk?.status === "available";
  const mine = desk?.booked_by_me;

  return (
    <AnimatePresence>
      {desk && (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-surface shadow-drawer sm:w-[400px]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 330, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Desk details
              </p>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{desk.zone}</p>
              <h2 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">
                {desk.label}
              </h2>

              <span
                className={[
                  "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                  available
                    ? "bg-mint-tint text-mint"
                    : mine
                      ? "bg-primary-tint text-primary-dark"
                      : "bg-clay-tint text-clay",
                ].join(" ")}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: available ? "#0FA876" : mine ? "#5A50E6" : "#5E6B7E" }}
                />
                {available ? "Available" : mine ? "Booked by you" : "Occupied"}
              </span>

              <dl className="mt-6 space-y-0 text-sm">
                <Row label="Date" value={prettyDate(date)} />
                <Row label="Features" value={desk.features || "Standard desk"} />
                <Row label="Zone" value={desk.zone} />
              </dl>
            </div>

            <div className="border-t border-line px-6 py-5">
              {available ? (
                <button
                  disabled={pending}
                  onClick={() => onBook(desk)}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {pending ? "Reserving…" : `Reserve ${desk.label}`}
                </button>
              ) : mine ? (
                <button
                  disabled={pending}
                  onClick={() => onCancel(desk)}
                  className="w-full rounded-xl border border-line py-3 text-sm font-semibold text-ink transition-colors hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  {pending ? "Cancelling…" : "Cancel reservation"}
                </button>
              ) : (
                <p className="rounded-xl bg-paper py-3 text-center text-sm text-ink-soft">
                  Taken for {prettyDate(date)}. Try another date or desk.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3">
      <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
