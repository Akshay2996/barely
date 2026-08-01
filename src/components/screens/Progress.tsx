import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useTaskStore } from "@/stores/taskStore";
import { useMonthHistory } from "@/hooks/useMonthHistory";
import { Icon } from "@/components/Icon";
import { toneCopy, daySummary } from "@/utils/tone";
import { toDateString, weekdayLong, monthDay } from "@/utils/date";
import { SEED_MONTHS_BACK } from "@/utils/history";

function tint(c: number | null): string {
  if (c == null || c <= 0) return "color-mix(in srgb, var(--color-text) 6%, transparent)";
  if (c === 1) return "var(--color-accent-2-300)";
  if (c === 2) return "var(--color-accent-2-400)";
  if (c === 3) return "var(--color-accent-300)";
  if (c === 4) return "var(--color-accent-400)";
  return "var(--color-accent-500)";
}

function StatCard({
  kicker,
  value,
  valueColor,
  body,
}: {
  kicker: string;
  value: React.ReactNode;
  valueColor?: string;
  body: string;
}) {
  return (
    <div className="card elev-sm">
      <div className="card-kicker">{kicker}</div>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 44,
          lineHeight: 1,
          color: valueColor,
        }}
      >
        {value}
      </div>
      <p className="card-body">{body}</p>
    </div>
  );
}

const LEGEND = [
  "color-mix(in srgb, var(--color-text) 6%, transparent)",
  "var(--color-accent-2-300)",
  "var(--color-accent-300)",
  "var(--color-accent-400)",
  "var(--color-accent-500)",
];

export function Progress() {
  const tone = useAppStore((s) => s.settings.tone);
  const openDayDetail = useAppStore((s) => s.openDayDetail);
  const tasks = useTaskStore((s) => s.tasks);
  const copy = toneCopy(tone);

  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const { y, m } = view;

  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
  // Day-of-month that "today" falls on within the viewed month; a full month
  // when viewing the past, and the real date when viewing the current month.
  const dim = new Date(y, m + 1, 0).getDate();
  const td = isCurrentMonth ? now.getDate() : dim;

  // Reload history whenever today's completion state changes.
  const version = tasks.filter((t) => t.done).length + tasks.length;
  const history = useMonthHistory(y, m, version);

  const first = new Date(y, m, 1).getDay();

  // Month navigation bounds: from SEED_MONTHS_BACK ago up to the current month.
  const earliest = new Date(now.getFullYear(), now.getMonth() - SEED_MONTHS_BACK, 1);
  const canPrev = new Date(y, m, 1) > earliest;
  const canNext = !isCurrentMonth;
  const step = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const countFor = (d: number): number => {
    const key = toDateString(new Date(y, m, d));
    return history[key]?.count ?? 0;
  };

  const pastCounts: number[] = [];
  for (let d = 1; d <= td; d++) pastCounts.push(countFor(d));

  const shown = pastCounts.filter((x) => x > 0).length;
  const skipped = pastCounts.length - shown;
  const compound = Math.pow(1.01, shown).toFixed(2);
  const last7 = pastCounts.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = pastCounts.slice(-14, -7).reduce((a, b) => a + b, 0);

  const openDay = (d: number) => {
    const dateStr = toDateString(new Date(y, m, d));
    const rec = history[dateStr];
    const work = rec?.work ?? [];
    const personal = rec?.personal ?? [];
    const count = rec?.count ?? 0;
    const isToday = isCurrentMonth && d === td;
    openDayDetail({
      weekday: weekdayLong(dateStr),
      label: monthDay(dateStr),
      summary: daySummary(count),
      work,
      personal,
      isRest: work.length === 0 && personal.length === 0,
      source: isToday ? "Today - live" : "From your history",
    });
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < first; i++) cells.push(<div key={`b${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const future = isCurrentMonth && d > td;
    const isToday = isCurrentMonth && d === td;
    const cnt = future ? null : countFor(d);
    const numColor =
      cnt != null && cnt >= 3
        ? "color-mix(in srgb, var(--color-bg) 85%, transparent)"
        : "color-mix(in srgb, var(--color-text) 45%, transparent)";
    cells.push(
      <div
        key={`d${d}`}
        className="barely-cell"
        onClick={future ? undefined : () => openDay(d)}
        role="button"
        tabIndex={future ? -1 : 0}
        onKeyDown={(e) => {
          if (!future && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openDay(d);
          }
        }}
        style={{
          position: "relative",
          aspectRatio: "1",
          borderRadius: 9,
          background: tint(cnt),
          boxShadow: isToday ? "inset 0 0 0 2px var(--color-accent)" : "none",
          opacity: future ? 0.4 : 1,
          cursor: future ? "default" : "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: numColor }}>{d}</span>
      </div>,
    );
  }

  const monthName = new Date(y, m, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 940,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        paddingTop: "var(--space-4)",
        animation: "barely-fade-up .35s ease",
      }}
    >
      <div>
        <h1 className="barely-h1" style={{ margin: "0 0 4px" }}>
          Your progress
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          Or something like it. Reported gently, on purpose.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        <StatCard
          kicker="Days you showed up"
          value={
            <>
              {shown}{" "}
              <span style={{ fontSize: 18, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
                of {pastCounts.length} days
              </span>
            </>
          }
          body={`You showed up ${shown} times. The other ${skipped} are between you and your conscience.`}
        />
        <StatCard
          kicker="The 1% thing, compounded"
          value={`${compound}×`}
          valueColor="var(--color-accent-600)"
          body={`Tiny wins, multiplied - about ${Math.round((Number(compound) - 1) * 100)}% better than a month ago. Allegedly.`}
        />
        <StatCard
          kicker="You vs. past you"
          value={`${last7} vs ${prev7}`}
          valueColor="var(--color-accent-2-700)"
          body={
            last7 >= prev7
              ? "Things done this week vs last. Look at you go."
              : "This week vs last. A quieter stretch - allowed."
          }
        />
      </div>

      <div className="card elev-sm" style={{ gap: "var(--space-3)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={18} color="var(--color-accent)" />
            <button
              className="btn btn-icon"
              onClick={() => step(-1)}
              disabled={!canPrev}
              aria-label="Previous month"
              style={{ width: 30, height: 30 }}
            >
              <Icon name="arrowLeft" size={16} />
            </button>
            <span className="card-title" style={{ minWidth: 130, textAlign: "center" }}>
              {monthName}
            </span>
            <button
              className="btn btn-icon"
              onClick={() => step(1)}
              disabled={!canNext}
              aria-label="Next month"
              style={{ width: 30, height: 30 }}
            >
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
            }}
          >
            less
            {LEGEND.map((bg, i) => (
              <span
                key={i}
                style={{ width: 13, height: 13, borderRadius: 4, background: bg }}
              />
            ))}
            more
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 7 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "color-mix(in srgb, var(--color-text) 45%, transparent)",
              }}
            >
              {day}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 7 }}>{cells}</div>
        <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
          Tap any day to see what you actually did. Gaps are just gaps.
        </p>
      </div>

      <div
        className="card elev-sm"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: "var(--space-3)",
          background: "var(--color-accent-100)",
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            flex: "none",
            borderRadius: 999,
            background: "var(--color-accent-200)",
            color: "var(--color-accent-700)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="trendingUp" size={19} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{copy.skipped(skipped)}</div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Streaks are nice. Kindness to yourself is nicer.
          </div>
        </div>
      </div>
    </section>
  );
}
