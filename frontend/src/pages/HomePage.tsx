import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { DateController } from "../components/DateController";
import { useAuth } from "../context/AuthContext";
import { fetchDesks } from "../api/desks";
import { listBookings } from "../api/bookings";
import {
  formatLong,
  isWeekend,
  relativeLabel,
  snapForward,
  todayIso,
  upcomingWeekdays,
} from "../lib/dates";
import type { BookingWithDesk, Desk } from "../types";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const days = useMemo(() => upcomingWeekdays(6), []);
  const [selected, setSelected] = useState<string>(() => snapForward(todayIso()));

  // Cache of full desk lists per date (powers per-day cards + zone breakdown).
  const [dayData, setDayData] = useState<Record<string, Desk[]>>({});
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingWithDesk[]>([]);

  // Prefetch availability for all upcoming weekdays in parallel.
  useEffect(() => {
    let active = true;
    Promise.all(days.map((d) => fetchDesks(d).then((r) => [d, r.desks] as const).catch(() => [d, []] as const)))
      .then((entries) => active && setDayData(Object.fromEntries(entries)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [days]);

  // Fetch a custom date picked from the calendar that isn't already cached.
  useEffect(() => {
    if (dayData[selected]) return;
    let active = true;
    fetchDesks(selected)
      .then((r) => active && setDayData((prev) => ({ ...prev, [selected]: r.desks })))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [selected, dayData]);

  useEffect(() => {
    listBookings().then(setBookings).catch(() => undefined);
  }, []);

  const selectedDesks = dayData[selected] ?? null;
  const counts = (iso: string) => {
    const ds = dayData[iso];
    if (!ds) return null;
    return { open: ds.filter((d) => d.status === "available").length, total: ds.length };
  };
  const sel = selectedDesks
    ? { open: selectedDesks.filter((d) => d.status === "available").length, total: selectedDesks.length }
    : null;
  const occupancy = sel && sel.total > 0 ? Math.round(((sel.total - sel.open) / sel.total) * 100) : 0;

  const zoneBreakdown = useMemo(() => {
    if (!selectedDesks) return [];
    const map: Record<string, { open: number; total: number }> = {};
    for (const d of selectedDesks) {
      (map[d.zone] ??= { open: 0, total: 0 }).total += 1;
      if (d.status === "available") map[d.zone].open += 1;
    }
    return Object.entries(map)
      .map(([zone, v]) => ({ zone, ...v }))
      .sort((a, b) => a.zone.localeCompare(b.zone));
  }, [selectedDesks]);

  const totalDesks = selectedDesks?.length ?? Object.values(dayData)[0]?.length ?? 0;
  const zoneCount = zoneBreakdown.length || new Set(Object.values(dayData)[0]?.map((d) => d.zone)).size;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  function pickDate(next: string) {
    setSelected(isWeekend(next) ? snapForward(next) : next);
  }
  const goToFloor = (date: string) => navigate(`/book?date=${date}`);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero band */}
      <div className="relative overflow-hidden bg-[#0C1A2E]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(125,170,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(125,170,235,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(90% 120% at 15% 0%, rgba(74,120,200,0.28), transparent 55%)" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-mint-node"
          >
            DeskFlex · Hot-desk planner
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
          >
            Hi {firstName} — when are<br className="hidden sm:block" /> you coming in?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="mt-3 max-w-md text-white/60"
          >
            Pick a weekday and we'll open the live floor plan so you can grab the perfect spot.
          </motion.p>

          {/* Hero stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-6 flex flex-wrap gap-2.5"
          >
            <HeroPill value={totalDesks || "—"} label="desks" />
            <HeroPill value={zoneCount || "—"} label="zones" />
            <HeroPill value={counts(days[0])?.open ?? "—"} label={`open ${relativeLabel(days[0]).toLowerCase()}`} accent />
          </motion.div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {/* Date picker card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="-mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-ink">Choose your day</h2>
            <DateController value={selected} onChange={pickDate} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {days.map((iso) => (
              <DayCard
                key={iso}
                iso={iso}
                active={iso === selected}
                avail={counts(iso)}
                loading={loading}
                onClick={() => pickDate(iso)}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <MiniRing percent={occupancy} loading={!sel} />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{formatLong(selected)}</p>
                <p className="font-display text-lg font-bold text-ink">
                  {!sel ? (
                    <span className="text-ink-soft">Checking availability…</span>
                  ) : (
                    <>
                      <span className="text-mint">{sel.open}</span> of {sel.total} desks open
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => goToFloor(selected)}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              View floor plan
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </motion.section>

        {/* Availability by zone */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-8"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-base font-bold text-ink">Availability by zone</h3>
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{relativeLabel(selected)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {!selectedDesks
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl border border-line bg-surface" />
                ))
              : zoneBreakdown.map((z) => (
                  <ZoneBar key={z.zone} zone={z.zone} open={z.open} total={z.total} onClick={() => goToFloor(selected)} />
                ))}
          </div>
        </motion.section>

        {/* Bookings + How it works */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <h3 className="mb-3 font-display text-base font-bold text-ink">Your upcoming desks</h3>
            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/15 bg-surface/60 p-8 text-center">
                <p className="font-display text-sm font-bold text-ink">No bookings yet</p>
                <p className="mt-1 text-sm text-ink-soft">Pick a day above and reserve a desk to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {bookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => goToFloor(b.booking_date)}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary-dark">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="3" y="6" width="18" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M7 14v4M17 14v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold leading-none text-ink">{b.desk.label}</p>
                      <p className="mt-1 truncate text-xs text-ink-soft">{b.desk.zone}</p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-primary">
                        {relativeLabel(b.booking_date)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <h3 className="mb-3 font-display text-base font-bold text-ink">How it works</h3>
            <ol className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-panel">
              <Step n={1} title="Pick a weekday" body="Choose the day you're coming in — weekends are off." />
              <Step n={2} title="Scan the floor" body="Glowing desks are open. Tap one to reserve it." />
              <Step n={3} title="One desk a day" body="You hold a single desk per day; cancel anytime." />
            </ol>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

function HeroPill({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 backdrop-blur ${
        accent ? "border-mint-node/40 bg-mint-node/10" : "border-white/15 bg-white/5"
      }`}
    >
      <span className={`font-display text-base font-bold ${accent ? "text-mint-node" : "text-white"}`}>{value}</span>
      <span className="font-mono text-[11px] uppercase tracking-wide text-white/55">{label}</span>
    </span>
  );
}

function DayCard({
  iso,
  active,
  avail,
  loading,
  onClick,
}: {
  iso: string;
  active: boolean;
  avail: { open: number; total: number } | null;
  loading: boolean;
  onClick: () => void;
}) {
  const [, m, d] = iso.split("-").map(Number);
  const label = relativeLabel(iso);
  const pct = avail && avail.total > 0 ? (avail.open / avail.total) * 100 : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col items-center rounded-2xl border px-2 py-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary bg-primary text-white shadow-panel"
          : "border-line bg-surface text-ink hover:border-primary/40",
      ].join(" ")}
    >
      <span className={`font-mono text-[10px] uppercase tracking-wide ${active ? "text-white/80" : "text-ink-soft"}`}>
        {label.length > 4 ? label.slice(0, 3) : label}
      </span>
      <span className="mt-1 font-display text-xl font-extrabold leading-none">{d}</span>
      <span className={`mt-0.5 text-[10px] ${active ? "text-white/70" : "text-ink-soft"}`}>
        {new Date(Date.UTC(2026, m - 1, 1)).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })}
      </span>

      {/* per-day availability */}
      <span className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${active ? "bg-white/25" : "bg-paper"}`}>
        {!loading && avail && (
          <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: active ? "#fff" : "#34E0A1" }} />
        )}
      </span>
      <span className={`mt-1 font-mono text-[9px] ${active ? "text-white/80" : "text-ink-soft"}`}>
        {loading || !avail ? "··" : `${avail.open} open`}
      </span>
    </button>
  );
}

function ZoneBar({ zone, open, total, onClick }: { zone: string; open: number; total: number; onClick: () => void }) {
  const pct = total > 0 ? (open / total) * 100 : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-line bg-surface p-4 text-left shadow-panel transition-all hover:-translate-y-0.5 hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm font-bold text-ink">{zone}</span>
        <span className="font-mono text-[11px] text-ink-soft">
          <span className="text-mint">{open}</span> / {total} open
        </span>
      </div>
      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-paper">
        <motion.span
          className="block h-full rounded-full bg-mint"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </span>
    </button>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-white">
        {n}
      </span>
      <div>
        <p className="font-display text-sm font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-soft">{body}</p>
      </div>
    </li>
  );
}

function MiniRing({ percent, loading }: { percent: number; loading: boolean }) {
  const R = 22;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative h-[58px] w-[58px] shrink-0">
      <svg viewBox="0 0 58 58" className="h-full w-full -rotate-90">
        <circle cx="29" cy="29" r={R} fill="none" stroke="#E1E6EE" strokeWidth="6" />
        {!loading && (
          <motion.circle
            cx="29"
            cy="29"
            r={R}
            fill="none"
            stroke="#5A50E6"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (C * percent) / 100 }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
        )}
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xs font-bold text-ink tnum">
        {loading ? "…" : `${percent}%`}
      </span>
    </div>
  );
}
