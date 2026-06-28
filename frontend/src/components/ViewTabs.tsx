import { motion } from "framer-motion";

export type View = "floor" | "bookings";

interface ViewTabsProps {
  view: View;
  onChange: (v: View) => void;
  bookingCount: number;
}

export function ViewTabs({ view, onChange, bookingCount }: ViewTabsProps) {
  const tabs: { key: View; label: string; badge?: number }[] = [
    { key: "floor", label: "Floor plan" },
    { key: "bookings", label: "My bookings", badge: bookingCount },
  ];

  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-panel">
      {tabs.map((t) => {
        const active = view === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="relative rounded-lg px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {active && (
              <motion.span
                layoutId="viewtab-pill"
                className="absolute inset-0 rounded-lg bg-ink"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className={`relative z-10 ${active ? "text-white" : "text-ink-soft hover:text-ink"}`}>
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                    active ? "bg-white/20 text-white" : "bg-paper text-ink-soft"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
