// frontend/src/pages/LandingPage.tsx
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  LandingNavbar,
  LandingHero,
  LandingFeatures,
  LandingHowItWorks,
  LandingCTA,
  LandingFooter,
} from "@/components/layout/LandingSections";

export default function LandingPage() {
  const isCompactLayout = useMediaQuery("(max-width: 768px)");

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
      <LandingHowItWorks isCompactLayout={isCompactLayout} />
      <LandingCTA isCompactLayout={isCompactLayout} />
      <LandingFooter isCompactLayout={isCompactLayout} />
    </div>
  );
}
