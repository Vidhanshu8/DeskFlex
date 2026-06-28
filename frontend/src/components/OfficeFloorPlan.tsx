import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Desk } from "../types";
import type { AvailabilityFilter } from "./Filters";

interface OfficeFloorPlanProps {
  desks: Desk[];
  zoneFilter: string | "all";
  availabilityFilter: AvailabilityFilter;
  selectedDeskId: number | null;
  onSelect: (desk: Desk) => void;
}

const COLS = 4;
const DESK_W = 54;
const DESK_H = 42;
const DESK_GAP = 14;
const ROOM_PAD = 22;
const ROOM_HEADER = 34;
const ROOM_GAP = 34;
const CANVAS_PAD = 30;

const ROOM_INNER_W = COLS * DESK_W + (COLS - 1) * DESK_GAP;
const ROOM_W = ROOM_INNER_W + ROOM_PAD * 2;

const roomHeight = (n: number) => {
  const rows = Math.ceil(n / COLS);
  return ROOM_HEADER + ROOM_PAD * 2 + rows * DESK_H + (rows - 1) * DESK_GAP;
};

type Kind = "available" | "mine" | "occupied";
const kindOf = (d: Desk): Kind =>
  d.status === "available" ? "available" : d.booked_by_me ? "mine" : "occupied";

const NODE_STYLE: Record<Kind, { fill: string; stroke: string; text: string; glow: string }> = {
  available: { fill: "rgba(52,224,161,0.15)", stroke: "#34E0A1", text: "#C6F6E4", glow: "#34E0A1" },
  mine: { fill: "rgba(142,132,255,0.22)", stroke: "#8E84FF", text: "#E0DCFF", glow: "#8E84FF" },
  occupied: { fill: "#15263C", stroke: "#28405F", text: "#62799B", glow: "" },
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

export function OfficeFloorPlan({
  desks,
  zoneFilter,
  availabilityFilter,
  selectedDeskId,
  onSelect,
}: OfficeFloorPlanProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportW, setViewportW] = useState(0);
  const [zoomMul, setZoomMul] = useState(1);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewportW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const byZone = desks.reduce<Record<string, Desk[]>>((acc, d) => {
      (acc[d.zone] ??= []).push(d);
      return acc;
    }, {});
    const zones = Object.keys(byZone).sort();

    const colX = [CANVAS_PAD, CANVAS_PAD + ROOM_W + ROOM_GAP];
    const colBottom = [CANVAS_PAD, CANVAS_PAD];

    const rooms = zones.map((zone) => {
      const zoneDesks = byZone[zone];
      const ci = colBottom[0] <= colBottom[1] ? 0 : 1;
      const x = colX[ci];
      const y = colBottom[ci];
      const h = roomHeight(zoneDesks.length);
      colBottom[ci] = y + h + ROOM_GAP;

      const seats = zoneDesks.map((desk, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        return {
          desk,
          x: x + ROOM_PAD + c * (DESK_W + DESK_GAP),
          y: y + ROOM_HEADER + ROOM_PAD + r * (DESK_H + DESK_GAP),
        };
      });

      const open = zoneDesks.filter((d) => d.status === "available").length;
      return { zone, x, y, w: ROOM_W, h, seats, open, total: zoneDesks.length };
    });

    const canvasW = colX[1] + ROOM_W + CANVAS_PAD;
    const canvasH = Math.max(colBottom[0], colBottom[1]) - ROOM_GAP + CANVAS_PAD;
    return { rooms, canvasW, canvasH };
  }, [desks]);

  const { rooms, canvasW, canvasH } = layout;

  // Fit-to-width at zoomMul=1; multiplier scales up/down from there.
  const fit = viewportW > 0 ? viewportW / canvasW : 1;
  const scale = fit * zoomMul;
  const pxW = Math.max(1, Math.round(canvasW * scale));
  const pxH = Math.max(1, Math.round(canvasH * scale));

  return (
    <div className="relative overflow-hidden rounded-4xl border border-ink/10 bg-[#0C1A2E] shadow-lift">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(120% 80% at 50% -10%, rgba(74,120,200,0.22), transparent 60%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24"
        style={{
          background:
            "linear-gradient(180deg, rgba(52,224,161,0) 0%, rgba(52,224,161,0.16) 50%, rgba(52,224,161,0) 100%)",
        }}
        initial={{ y: "-20%", opacity: 0 }}
        animate={{ y: ["-20%", "560%"], opacity: [0, 1, 0] }}
        transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
      />

      <div
        ref={viewportRef}
        className="plan-scroll relative z-0 h-[calc(100vh-250px)] min-h-[460px] overflow-auto"
      >
        <svg width={pxW} height={pxH} viewBox={`0 0 ${canvasW} ${canvasH}`} className="block">
          <defs>
            <pattern id="bpGrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="rgba(125,170,235,0.10)" strokeWidth="1" />
            </pattern>
            <filter id="glowMint" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width={canvasW} height={canvasH} fill="url(#bpGrid)" />

          {rooms.map((room, ri) => {
            const dimRoom = zoneFilter !== "all" && room.zone !== zoneFilter;
            return (
              <motion.g
                key={room.zone}
                initial={{ opacity: 0 }}
                animate={{ opacity: dimRoom ? 0.12 : 1 }}
                transition={{ duration: 0.4, delay: 0.25 + ri * 0.05 }}
                style={{ pointerEvents: dimRoom ? "none" : "auto" }}
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx="14"
                  fill="rgba(255,255,255,0.018)"
                  stroke="rgba(150,190,245,0.20)"
                  strokeWidth="1.5"
                />
                <rect
                  x={room.x + room.w / 2 - 16}
                  y={room.y + room.h - 1.5}
                  width="32"
                  height="3"
                  rx="1.5"
                  fill="#0C1A2E"
                />
                <text
                  x={room.x + ROOM_PAD}
                  y={room.y + 22}
                  className="font-mono"
                  fontSize="11"
                  letterSpacing="1.5"
                  fill="#9DB4D8"
                >
                  {room.zone.toUpperCase()}
                </text>
                <text
                  x={room.x + room.w - ROOM_PAD}
                  y={room.y + 22}
                  textAnchor="end"
                  className="font-mono"
                  fontSize="11"
                  fill="#34E0A1"
                >
                  {room.open}/{room.total}
                </text>

                {room.seats.map(({ desk, x, y }) => {
                  const k = kindOf(desk);
                  const s = NODE_STYLE[k];
                  const selected = desk.id === selectedDeskId;
                  const dimSeat =
                    availabilityFilter !== "all" && desk.status !== availabilityFilter;
                  const hasGlow = k !== "occupied";

                  return (
                    <motion.g
                      key={desk.id}
                      className="group/desk cursor-pointer"
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: dimSeat ? 0.18 : 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.4 + ri * 0.04 }}
                      whileHover={dimSeat ? undefined : { scale: 1.12 }}
                      whileTap={dimSeat ? undefined : { scale: 0.95 }}
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        pointerEvents: dimSeat ? "none" : "auto",
                      }}
                      onClick={() => onSelect(desk)}
                    >
                      <title>{`${desk.label} · ${desk.zone}${desk.features ? " · " + desk.features : ""} · ${k === "available" ? "Available" : k === "mine" ? "Booked by you" : "Occupied"}`}</title>

                      {hasGlow && (
                        <rect
                          x={x}
                          y={y}
                          width={DESK_W}
                          height={DESK_H}
                          rx="9"
                          fill={s.glow}
                          className="opacity-0 transition-opacity duration-300 group-hover/desk:opacity-30"
                          filter="url(#glowMint)"
                        />
                      )}
                      {hasGlow && (
                        <rect
                          x={x}
                          y={y}
                          width={DESK_W}
                          height={DESK_H}
                          rx="9"
                          fill={s.glow}
                          opacity={0.16}
                          filter="url(#glowMint)"
                        />
                      )}

                      <rect
                        x={x}
                        y={y}
                        width={DESK_W}
                        height={DESK_H}
                        rx="9"
                        fill={s.fill}
                        stroke={selected ? "#FFFFFF" : s.stroke}
                        strokeWidth={selected ? 2.5 : 1.4}
                      />
                      <rect
                        x={x + DESK_W / 2 - 9}
                        y={y + 7}
                        width="18"
                        height="3"
                        rx="1.5"
                        fill={s.stroke}
                        opacity={k === "occupied" ? 0.5 : 0.9}
                      />
                      <text
                        x={x + DESK_W / 2}
                        y={y + DESK_H - 11}
                        textAnchor="middle"
                        className="font-mono"
                        fontSize="9.5"
                        fontWeight="500"
                        fill={s.text}
                      >
                        {desk.label}
                      </text>
                      {k === "mine" && <circle cx={x + DESK_W - 9} cy={y + 9} r="3.2" fill="#8E84FF" />}
                    </motion.g>
                  );
                })}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur">
        <ZoomBtn label="Zoom in" onClick={() => setZoomMul((z) => Math.min(MAX_ZOOM, +(z * 1.25).toFixed(3)))}>
          +
        </ZoomBtn>
        <span className="px-2 py-1 text-center font-mono text-[10px] text-white/50">
          {Math.round(zoomMul * 100)}%
        </span>
        <ZoomBtn label="Zoom out" onClick={() => setZoomMul((z) => Math.max(MIN_ZOOM, +(z / 1.25).toFixed(3)))}>
          −
        </ZoomBtn>
        <ZoomBtn label="Reset zoom" onClick={() => setZoomMul(1)} small>
          ⟲
        </ZoomBtn>
      </div>

      {/* Legend */}
      <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] text-white/70 backdrop-blur">
        <LegendDot color="#34E0A1" label="OPEN" />
        <LegendDot color="#8E84FF" label="YOURS" />
        <LegendDot color="#3A4F6E" label="TAKEN" />
      </div>
    </div>
  );
}

function ZoomBtn({
  children,
  onClick,
  label,
  small,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none ${
        small ? "text-sm" : "text-lg"
      }`}
    >
      {children}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
