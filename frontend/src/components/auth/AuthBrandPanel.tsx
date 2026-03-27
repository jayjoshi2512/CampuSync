import { ElementType, ReactNode } from "react";

export interface AuthBrandFeature {
  icon: ElementType;
  text: string;
  color: string;
}

interface AuthBrandPanelProps {
  className?: string; // used for responsive hiding
  title: ReactNode;
  description: ReactNode;
  features: AuthBrandFeature[];
  width?: number;
}

export default function AuthBrandPanel({
  className = "auth-brand-panel",
  title,
  description,
  features,
  width = 420,
}: AuthBrandPanelProps) {
  return (
    <div
      className={className}
      style={{
        flex: `0 0 ${width}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 48,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, var(--color-bg-secondary), var(--color-bg-primary))",
        borderRight: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent)",
          pointerEvents: "none",
        }}
      />

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            color: "var(--color-text-primary)",
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {features.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <item.icon size={16} color={item.color} />
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
