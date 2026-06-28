import { motion } from "framer-motion";

interface StatsBarProps {
  available: number;
  occupied: number;
  total: number;
}

export function StatsBar({ available, occupied, total }: StatsBarProps) {
  const occupancy = total === 0 ? 0 : Math.round((occupied / total) * 100);
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-4 shadow-panel sm:gap-7 sm:px-6">
      {/* Occupancy ring */}
      <div className="flex items-center gap-3">
        <div className="relative h-[68px] w-[68px]">
          <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
            <circle cx="34" cy="34" r={R} fill="none" stroke="#E1E6EE" strokeWidth="7" />
            <motion.circle
              cx="34"
              cy="34"
              r={R}
              fill="none"
              stroke="#5A50E6"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - (C * occupancy) / 100 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold text-ink tnum">
            {occupancy}%
          </span>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Occupancy</p>
          <p className="font-display text-sm font-bold text-ink">
            {occupied} of {total} booked
          </p>
        </div>
      </div>

      <div className="h-10 w-px bg-line" />

      <div className="flex items-center gap-5 sm:gap-7">
        <Stat dot="#0FA876" label="Open" value={available} />
        <Stat dot="#5E6B7E" label="Taken" value={occupied} />
      </div>
    </div>
  );
}

function Stat({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
        <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
        {label}
      </p>
      <p className="mt-0.5 font-display text-xl font-bold text-ink tnum">{value}</p>
    </div>
  );
}
