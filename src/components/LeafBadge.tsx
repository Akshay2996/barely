import { Icon } from "./Icon";

interface LeafBadgeProps {
  size?: number; // circle diameter
  icon?: number; // leaf size
  animate?: boolean;
}

/** The Barely leaf-in-a-circle mark. */
export function LeafBadge({ size = 30, icon = 18, animate = false }: LeafBadgeProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: 999,
        background: "var(--color-accent-2-200)",
        color: "var(--color-accent-2-700)",
        display: "grid",
        placeItems: "center",
        animation: animate ? "barely-pop .5s ease" : undefined,
      }}
    >
      <Icon name="leaf" size={icon} strokeWidth={2.75} />
    </span>
  );
}
