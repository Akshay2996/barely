import { useAppStore } from "@/stores/appStore";
import { LeafBadge } from "@/components/LeafBadge";
import { Icon } from "@/components/Icon";
import { today } from "@/utils/date";

export function TopNav() {
  const screen = useAppStore((s) => s.screen);
  const go = useAppStore((s) => s.go);
  const startNewDay = useAppStore((s) => s.startNewDay);

  const dateKicker = new Date(today() + "T00:00:00")
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();

  const link = (target: "today" | "progress" | "reminders", label: string) => (
    <a
      onClick={() => go(target)}
      aria-current={screen === target ? "page" : undefined}
      style={{ cursor: "pointer" }}
    >
      {label}
    </a>
  );

  return (
    <nav
      className="nav"
      style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: 980,
        margin: "0 auto",
        justifyContent: "space-between",
        // Extra top padding clears the status-bar notch when installed on iOS.
        padding: "max(var(--space-4), env(safe-area-inset-top)) var(--space-4) var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <button
          type="button"
          onClick={() => go("today")}
          aria-label="Barely - go home"
          className="nav-brand"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            margin: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "inherit",
          }}
        >
          <LeafBadge />
          Barely
        </button>
        <span
          className="barely-navlinks"
          style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}
        >
          {link("today", "Today")}
          {link("progress", "Progress")}
          {link("reminders", "Reminders")}
        </span>
      </div>
      <div
        className="barely-navright"
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
      >
        <span
          style={{
            fontSize: 12,
            letterSpacing: ".06em",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          {dateKicker}
        </span>
        <button className="btn btn-secondary" onClick={startNewDay}>
          <Icon name="plus" size={16} />
          New day
        </button>
      </div>
    </nav>
  );
}
