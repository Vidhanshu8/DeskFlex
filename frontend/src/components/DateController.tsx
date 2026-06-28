import { useRef } from "react";
import { formatShort, stepWeekday, todayIso } from "../lib/dates";

interface DateControllerProps {
  value: string; // ISO YYYY-MM-DD (always a weekday)
  onChange: (next: string) => void;
}

export function DateController({ value, onChange }: DateControllerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isToday = value === todayIso();
  const p = formatShort(value);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* not user-activated — fall through */
      }
    }
    el.focus();
    el.click();
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
      <button
        type="button"
        aria-label="Previous weekday"
        onClick={() => onChange(stepWeekday(value, -1))}
        className="grid w-10 place-items-center text-lg text-ink-soft transition-colors hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={openPicker}
        className="relative flex items-center gap-2 border-x border-line px-4 py-2 transition-colors hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="font-mono text-[11px] uppercase text-ink-soft">{p.weekday}</span>
        <span className="font-display text-base font-bold text-ink">{p.rest}</span>
        {isToday && (
          <span className="rounded-full bg-mint-tint px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-mint">
            Today
          </span>
        )}
        <input
          ref={inputRef}
          type="date"
          min={todayIso()}
          value={value}
          onChange={(e) => onChange(e.target.value || todayIso())}
          className="pointer-events-none absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 opacity-0"
          tabIndex={-1}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        aria-label="Next weekday"
        onClick={() => onChange(stepWeekday(value, 1))}
        className="grid w-10 place-items-center text-lg text-ink-soft transition-colors hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        ›
      </button>
    </div>
  );
}
