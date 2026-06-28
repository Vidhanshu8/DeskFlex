import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { DateController } from "../components/DateController";
import { Filters, type AvailabilityFilter } from "../components/Filters";
import { StatsBar } from "../components/StatsBar";
import { OfficeFloorPlan } from "../components/OfficeFloorPlan";
import { BookingDrawer } from "../components/BookingDrawer";
import { Toast, type ToastState } from "../components/Toast";
import { ViewTabs, type View } from "../components/ViewTabs";
import { MyBookings } from "../components/MyBookings";
import { fetchDesks } from "../api/desks";
import { cancelBooking, createBooking, listBookings } from "../api/bookings";
import { errorMessage } from "../api/client";
import { isWeekend, snapForward, todayIso } from "../lib/dates";
import type { Desk, BookingWithDesk } from "../types";

const POLL_MS = 12000;

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState<string>(() => {
    const q = searchParams.get("date");
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? snapForward(q) : snapForward(todayIso());
  });
  const [desks, setDesks] = useState<Desk[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeskId, setPendingDeskId] = useState<number | null>(null);
  const [selectedDeskId, setSelectedDeskId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [view, setView] = useState<View>("floor");
  const [bookings, setBookings] = useState<BookingWithDesk[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);

  const [zone, setZone] = useState<string | "all">("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");

  const load = useCallback(async (forDate: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchDesks(forDate);
      setDesks(data.desks);
    } catch (err) {
      if (!opts?.silent) setToast({ kind: "error", message: errorMessage(err) });
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      setBookings(await listBookings());
    } catch {
      /* non-critical */
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (view !== "floor") return;
    const id = setInterval(() => load(date, { silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [view, date, load]);

  const zones = useMemo(() => Array.from(new Set(desks.map((d) => d.zone))).sort(), [desks]);
  const stats = useMemo(() => {
    const total = desks.length;
    const available = desks.filter((d) => d.status === "available").length;
    return { total, available, occupied: total - available };
  }, [desks]);
  const selectedDesk = useMemo(
    () => desks.find((d) => d.id === selectedDeskId) ?? null,
    [desks, selectedDeskId],
  );
  const myDeskToday = useMemo(() => desks.find((d) => d.booked_by_me) ?? null, [desks]);

  function handleDateChange(next: string) {
    const target = isWeekend(next) ? snapForward(next) : next;
    if (isWeekend(next)) {
      setToast({ kind: "error", message: "Weekends aren't bookable — moved to the next weekday." });
    }
    setDate(target);
    setSearchParams({ date: target }, { replace: true });
  }

  function handleSelect(desk: Desk) {
    if (desk.booked_by_me) {
      setSelectedDeskId(desk.id);
      return;
    }
    if (desk.status === "occupied") {
      setToast({ kind: "error", message: `${desk.label} is already booked by someone else.` });
      return;
    }
    if (myDeskToday) {
      setToast({
        kind: "error",
        message: `You can only book one desk per day — cancel ${myDeskToday.label} first.`,
      });
      return;
    }
    setSelectedDeskId(desk.id);
  }

  async function handleBook(desk: Desk) {
    if (isWeekend(date)) {
      setToast({ kind: "error", message: "Weekends aren't bookable." });
      return;
    }
    if (myDeskToday && myDeskToday.id !== desk.id) {
      setToast({
        kind: "error",
        message: `You can only book one desk per day — cancel ${myDeskToday.label} first.`,
      });
      return;
    }
    setPendingDeskId(desk.id);
    try {
      await createBooking(desk.id, date);
      setToast({ kind: "success", message: `Reserved ${desk.label}.` });
      setSelectedDeskId(null);
      await Promise.all([load(date, { silent: true }), loadBookings()]);
      setView("bookings");
    } catch (err) {
      setToast({ kind: "error", message: errorMessage(err) });
      await load(date, { silent: true });
    } finally {
      setPendingDeskId(null);
    }
  }

  async function handleCancelFromDrawer(desk: Desk) {
    if (!desk.booking_id) return;
    setPendingDeskId(desk.id);
    try {
      await cancelBooking(desk.booking_id);
      setToast({ kind: "success", message: `Released ${desk.label}.` });
      setSelectedDeskId(null);
      await Promise.all([load(date, { silent: true }), loadBookings()]);
    } catch (err) {
      setToast({ kind: "error", message: errorMessage(err) });
      await load(date, { silent: true });
    } finally {
      setPendingDeskId(null);
    }
  }

  async function handleCancelFromList(booking: BookingWithDesk) {
    setPendingBookingId(booking.id);
    try {
      await cancelBooking(booking.id);
      setToast({ kind: "success", message: `Released ${booking.desk.label}.` });
      await Promise.all([loadBookings(), load(date, { silent: true })]);
    } catch (err) {
      setToast({ kind: "error", message: errorMessage(err) });
    } finally {
      setPendingBookingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary hover:underline"
            >
              <span aria-hidden>←</span> Choose another day
            </Link>
            <h1 className="mt-1.5 font-display text-4xl font-extrabold tracking-tight text-ink">
              Find your seat
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ViewTabs view={view} onChange={setView} bookingCount={bookings.length} />
            {view === "floor" && <DateController value={date} onChange={handleDateChange} />}
          </div>
        </motion.div>

        {view === "floor" ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mb-5 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center"
            >
              <StatsBar available={stats.available} occupied={stats.occupied} total={stats.total} />
              <div className="lg:pl-2">
                <Filters
                  zones={zones}
                  activeZone={zone}
                  onZoneChange={setZone}
                  availability={availability}
                  onAvailabilityChange={setAvailability}
                />
              </div>
            </motion.div>

            {myDeskToday && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mint/30 bg-mint-tint px-4 py-3"
              >
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-xs text-white">
                    ✓
                  </span>
                  You're booked at <strong className="font-semibold">{myDeskToday.label}</strong> ·{" "}
                  {myDeskToday.zone} for this day. One desk per day.
                </span>
                <button
                  type="button"
                  disabled={pendingDeskId === myDeskToday.id}
                  onClick={() => handleCancelFromDrawer(myDeskToday)}
                  className="shrink-0 rounded-lg border border-mint/40 bg-surface px-3 py-1.5 text-sm font-medium text-mint transition-colors hover:bg-mint hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-50"
                >
                  {pendingDeskId === myDeskToday.id ? "Cancelling…" : "Cancel booking"}
                </button>
              </motion.div>
            )}

            {loading ? (
              <div className="grid h-[calc(100vh-250px)] min-h-[460px] place-items-center rounded-4xl border border-ink/10 bg-[#0C1A2E]">
                <p className="font-mono text-sm text-white/50">Mapping the floor…</p>
              </div>
            ) : (
              <OfficeFloorPlan
                desks={desks}
                zoneFilter={zone}
                availabilityFilter={availability}
                selectedDeskId={selectedDeskId}
                onSelect={handleSelect}
              />
            )}

            <div className="mt-3 flex items-center justify-center gap-2 font-mono text-[11px] text-ink-soft">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              Live · availability auto-refreshes · tap a glowing desk to reserve
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold text-ink">Your upcoming desks</h2>
              <span className="font-mono text-xs text-ink-soft">{bookings.length} booked</span>
            </div>
            <MyBookings
              bookings={bookings}
              loading={bookingsLoading}
              pendingId={pendingBookingId}
              onCancel={handleCancelFromList}
            />
          </motion.div>
        )}
      </main>

      <BookingDrawer
        desk={selectedDesk}
        date={date}
        pending={pendingDeskId === selectedDesk?.id}
        onClose={() => setSelectedDeskId(null)}
        onBook={handleBook}
        onCancel={handleCancelFromDrawer}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
