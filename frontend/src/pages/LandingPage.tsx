// frontend/src/pages/LandingPage.tsx
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  LandingNavbar,
  LandingHero,
  LandingFeatures,
  LandingCTA,
} from "@/components/layout/LandingSections";

export default function LandingPage() {
  const isCompactLayout = useMediaQuery("(max-width: 760px)");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <LandingNavbar isCompactLayout={isCompactLayout} />
      <LandingHero isCompactLayout={isCompactLayout} />
      <LandingFeatures isCompactLayout={isCompactLayout} />
      <LandingCTA isCompactLayout={isCompactLayout} />

      {/* ─── Footer ─── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border-subtle)",
          padding: isCompactLayout ? "18px 16px" : "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: isCompactLayout ? "flex-start" : "center",
          flexDirection: isCompactLayout ? "column" : "row",
          gap: isCompactLayout ? 8 : 0,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          © 2026 NexUs. All rights reserved.
        </span>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          Built with ❤️ in India
        </span>
      </footer>
    </div>
  );
}
