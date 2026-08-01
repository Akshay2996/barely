import { useAppStore } from "@/stores/appStore";
import { Icon, type IconName } from "@/components/Icon";
import { LeafBadge } from "@/components/LeafBadge";

function FeatureRow({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span
        style={{
          width: 34,
          height: 34,
          flex: "none",
          borderRadius: 999,
          background: "var(--color-accent-100)",
          color: "var(--color-accent-700)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div className="text-muted" style={{ fontSize: 13 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

export function Onboarding() {
  const startNewDay = useAppStore((s) => s.startNewDay);
  const go = useAppStore((s) => s.go);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const start = () => {
    completeOnboarding();
    startNewDay();
  };
  const skip = () => {
    completeOnboarding();
    go("today");
  };

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 520,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "var(--space-4)",
        paddingTop: "var(--space-8)",
        animation: "barely-fade-up .4s ease",
      }}
    >
      <LeafBadge size={64} icon={34} animate />
      <div>
        <h1 style={{ margin: "0 0 4px" }}>Barely</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: 16 }}>
          the least you can do.
        </p>
      </div>
      <div
        className="card elev-sm"
        style={{
          width: "100%",
          textAlign: "left",
          padding: "var(--space-4)",
          gap: "var(--space-4)",
        }}
      >
        <p style={{ margin: 0, fontSize: 15 }}>
          “Not another to-do app.” We know. This one wants you to do <em>less</em> - and to feel
          good about it.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <FeatureRow
            icon="sun"
            title="Write it in the morning."
            body="One minute, tops. Speak it or type it."
          />
          <FeatureRow
            icon="sparkles"
            title="Aim for 1%."
            body="Making the bed counts. Two minutes counts. It all counts."
          />
          <FeatureRow
            icon="leaf"
            title="Three things a day."
            body="Split between work and you. Two of them can be tiny."
          />
        </div>
      </div>
      <button className="btn btn-primary btn-block" onClick={start} style={{ maxWidth: "100%" }}>
        Start with today
        <Icon name="arrowRight" size={17} />
      </button>
      <a onClick={skip} style={{ cursor: "pointer", fontSize: 14 }}>
        skip - just show me the app
      </a>
    </section>
  );
}
