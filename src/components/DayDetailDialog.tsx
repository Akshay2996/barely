import { useAppStore } from "@/stores/appStore";
import { Icon } from "@/components/Icon";
import type { DayDetailItem, Section } from "@/types";

function ItemList({ items, section }: { items: DayDetailItem[]; section: Section }) {
  if (items.length === 0) return null;
  const isWork = section === "work";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: isWork ? "var(--color-accent)" : "var(--color-accent-2-700)",
        }}
      >
        {isWork ? "Work" : "Personal"}
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "3px 0" }}>
          {it.done ? (
            <span
              style={{
                width: 20,
                height: 20,
                flex: "none",
                borderRadius: 999,
                background: isWork ? "var(--color-accent)" : "var(--color-accent-2-500)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="check" size={12} strokeWidth={3.4} color="var(--color-bg)" />
            </span>
          ) : (
            <span
              style={{
                width: 20,
                height: 20,
                flex: "none",
                borderRadius: 999,
                border: "2px solid var(--color-neutral-400)",
              }}
            />
          )}
          <span style={{ fontSize: 15 }}>{it.text}</span>
        </div>
      ))}
    </div>
  );
}

export function DayDetailDialog() {
  const dd = useAppStore((s) => s.dayDetail);
  const close = useAppStore((s) => s.closeDayDetail);

  if (!dd) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "color-mix(in srgb, var(--color-text) 45%, transparent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "barely-toast-in .2s ease",
      }}
    >
      <div
        className="card elev-lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "86vh",
          overflow: "hidden",
          padding: 0,
          gap: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flex: "none",
            padding: "var(--space-3) var(--space-3) var(--space-2)",
          }}
        >
          <div>
            <div className="card-kicker" style={{ margin: 0 }}>
              {dd.weekday}
            </div>
            <h3 style={{ margin: "2px 0 0" }}>{dd.label}</h3>
          </div>
          <button
            className="btn btn-icon"
            onClick={close}
            aria-label="Close"
            style={{ flex: "none" }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div
          className="barely-scroll"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            padding: "0 var(--space-2) var(--space-3) var(--space-3)",
          }}
        >
          <p className="text-muted" style={{ margin: 0 }}>
            {dd.summary}
          </p>

          {dd.isRest && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 10,
                padding: "var(--space-4) 0",
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: "var(--color-neutral-200)",
                  color: "var(--color-neutral-600)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="moon" size={24} strokeWidth={2.5} />
              </span>
              <div className="text-muted" style={{ fontSize: 14 }}>
                A quiet day. No entries - and no guilt about it.
              </div>
            </div>
          )}

          <ItemList items={dd.work} section="work" />
          <ItemList items={dd.personal} section="personal" />

          <div
            style={{
              fontSize: 11,
              color: "color-mix(in srgb, var(--color-text) 40%, transparent)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: "var(--space-1)",
            }}
          >
            <Icon name="database" size={13} />
            {dd.source}
          </div>
        </div>
      </div>
    </div>
  );
}
