import { useAppStore } from "@/stores/appStore";
import { Icon, type IconName } from "@/components/Icon";
import type { Screen } from "@/types";

const tabStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
  cursor: "pointer",
  padding: "4px 8px",
};

function Tab({
  target,
  label,
  icon,
}: {
  target: Screen;
  label: string;
  icon: IconName;
}) {
  const screen = useAppStore((s) => s.screen);
  const go = useAppStore((s) => s.go);
  return (
    <button
      className="barely-tab"
      aria-current={screen === target ? "page" : undefined}
      onClick={() => go(target)}
      style={tabStyle}
    >
      <span
        className="barely-tabicon"
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          color: "inherit",
        }}
      >
        <Icon name={icon} size={19} />
      </span>
      {label}
    </button>
  );
}

export function BottomNav() {
  return (
    <nav
      className="barely-bottomnav"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
        zIndex: 50,
        width: "calc(100% - 28px)",
        maxWidth: 360,
        background: "var(--color-surface)",
        borderRadius: 999,
        boxShadow: "var(--shadow-lg)",
        padding: "8px 10px",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      <Tab target="today" label="Today" icon="listChecks" />
      <Tab target="progress" label="Progress" icon="calendar" />
      <Tab target="reminders" label="Nudge" icon="bell" />
    </nav>
  );
}
