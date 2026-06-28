import type { ReactNode } from "react";

export type AvailabilityFilter = "all" | "available" | "occupied";

interface FiltersProps {
  zones: string[];
  activeZone: string | "all";
  onZoneChange: (zone: string | "all") => void;
  availability: AvailabilityFilter;
  onAvailabilityChange: (next: AvailabilityFilter) => void;
}

const availabilityOptions: { key: AvailabilityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Open" },
  { key: "occupied", label: "Taken" },
];

export function Filters({
  zones,
  activeZone,
  onZoneChange,
  availability,
  onAvailabilityChange,
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={activeZone === "all"} onClick={() => onZoneChange("all")}>
          All zones
        </Chip>
        {zones.map((zone) => (
          <Chip key={zone} active={activeZone === zone} onClick={() => onZoneChange(zone)}>
            {zone}
          </Chip>
        ))}
      </div>

      <div className="inline-flex shrink-0 self-start rounded-xl border border-line bg-surface p-1 shadow-panel lg:self-auto">
        {availabilityOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onAvailabilityChange(opt.key)}
            className={[
              "rounded-lg px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              availability === opt.key ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "bg-primary text-white shadow-panel"
          : "border border-line bg-surface text-ink-soft hover:border-ink/20 hover:text-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
