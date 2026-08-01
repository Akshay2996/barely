import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/Icon";

// Stored value is a 24h "HH:MM" string; the UI works in 12h + AM/PM.

type Period = "AM" | "PM";

function parse(value: string): { hour12: number; minute: number; period: Period } {
  const [h, m] = value.split(":").map(Number);
  const period: Period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: isNaN(m) ? 0 : m, period };
}

function to24(hour12: number, minute: number, period: Period): string {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function format(value: string): string {
  const { hour12, minute, period } = parse(value);
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute steps

function Column({
  items,
  selected,
  onPick,
  fmt,
}: {
  items: number[];
  selected: number;
  onPick: (v: number) => void;
  fmt: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(".is-sel");
    el?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <div className="barely-timecol" ref={ref}>
      {items.map((it) => (
        <button
          key={it}
          type="button"
          className={"barely-timeopt" + (it === selected ? " is-sel" : "")}
          onClick={() => onPick(it)}
        >
          {fmt(it)}
        </button>
      ))}
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { hour12, minute, period } = parse(value);
  const selMinute = MINUTES.includes(minute) ? minute : Math.round(minute / 5) * 5 % 60;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pad2 = (n: number) => String(n).padStart(2, "0");

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="input barely-timetrigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="clock" size={16} color="var(--color-accent)" />
          {format(value)}
        </span>
        <Icon name="chevronDown" size={15} style={{ opacity: 0.55 }} />
      </button>

      {open && (
        <div className="barely-timepop" role="dialog" aria-label="Choose a time">
          <div className="barely-timecols">
            <Column
              items={HOURS}
              selected={hour12}
              onPick={(h) => onChange(to24(h, selMinute, period))}
              fmt={(h) => String(h)}
            />
            <span className="barely-timesep">:</span>
            <Column
              items={MINUTES}
              selected={selMinute}
              onPick={(m) => onChange(to24(hour12, m, period))}
              fmt={pad2}
            />
            <div className="barely-timeperiod">
              {(["AM", "PM"] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={"barely-timeopt" + (p === period ? " is-sel" : "")}
                  onClick={() => onChange(to24(hour12, selMinute, p))}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
