// frontend/src/components/layout/LandingSections.tsx
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
  CreditCard,
  Globe,
  Camera,
  Menu,
  X,
  CheckCircle2,
  Users,
  Building2,
  QrCode,
  Smartphone,
  Star,
  ChevronRight,
  Mail,
  Github,
  Twitter,
  Layers,
  Bell,
  BookOpen,
} from "lucide-react";

const APP_DOWNLOAD_URL = "/downloads/CampuSync.apk";

// ─── Animation variants ────────────────────────────────────────────────────────
export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// ─── Feature data ─────────────────────────────────────────────────────────────
export const features = [
  {
    icon: Zap,
    title: "Digital Identity Cards",
    desc: "Beautiful 3D interactive cards with QR codes, custom branding, and one-tap sharing for every student and alumnus.",
    color: "#10B981",
    tag: "Core",
  },
  {
    icon: Camera,
    title: "Memory Wall",
    desc: "Infinite-scroll photo & video gallery with cloud storage, reactions, comments, and curated cohort albums.",
    color: "#F59E0B",
    tag: "Engagement",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "JWT-scoped RBAC, encrypted data, disposable email blocking, rate limiting, and comprehensive audit trails.",
    color: "#22C55E",
    tag: "Security",
  },
  {
    icon: CreditCard,
    title: "Flexible Billing",
    desc: "Self-serve plans with Razorpay integration, automated trial periods, usage-based upgrades, and transparent pricing.",
    color: "#38BDF8",
    tag: "Billing",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Real-time insights on engagement, scan counts, storage usage, cohort activity, and custom report exports.",
    color: "#14B8A6",
    tag: "Analytics",
  },
  {
    icon: Globe,
    title: "Public Profiles",
    desc: "Each card has a unique shareable link with Open Graph meta tags, a custom public page, and SEO-friendly URLs.",
    color: "#F87171",
    tag: "Sharing",
  },
];

// ─── Stats data ───────────────────────────────────────────────────────────────
const stats = [
  { value: 50, suffix: "+", label: "Institutions", icon: Building2 },
  { value: 12000, suffix: "+", label: "Students Onboarded", icon: Users },
  { value: 48000, suffix: "+", label: "Cards Issued", icon: QrCode },
  { value: 99.9, suffix: "%", label: "Uptime SLA", icon: Star, decimals: 1 },
];

// ─── How it works steps ────────────────────────────────────────────────────────
const steps = [
  {
    step: "01",
    icon: Building2,
    title: "Register Your Institution",
    desc: "Fill out a 2-minute onboarding form. We provision your workspace, admin account, and custom branding instantly.",
    color: "#10B981",
  },
  {
    step: "02",
    icon: Users,
    title: "Onboard Students & Alumni",
    desc: "Bulk-import via CSV or let students self-register. Magic-link authentication — no passwords to manage.",
    color: "#38BDF8",
  },
  {
    step: "03",
    icon: Layers,
    title: "Launch & Engage",
    desc: "Digital ID cards go live immediately. Students scan, share, and connect — your alumni network grows organically.",
    color: "#F59E0B",
  },
];

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({
  value,
  suffix,
  decimals = 0,
  duration = 2000,
}: {
  value: number;
  suffix: string;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(parseFloat((eased * value).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, duration, decimals]);

  return (
    <span ref={ref}>
      {decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export function LandingNavbar({
  isCompactLayout,
}: {
  isCompactLayout: boolean;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Download", href: APP_DOWNLOAD_URL, download: true },
  ];

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          transition: "background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
          background: scrolled
            ? "color-mix(in srgb, var(--color-bg-primary) 92%, transparent)"
            : "color-mix(in srgb, var(--color-bg-primary) 70%, transparent)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: `1px solid ${scrolled ? "var(--color-border-subtle)" : "transparent"}`,
          boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.3)" : "none",
          padding: isCompactLayout ? "0 20px" : "0 48px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #10B981, #38BDF8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <QrCode size={18} color="#fff" />
          </div>
          <span
            style={{
              fontSize: 19,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              letterSpacing: -0.6,
              lineHeight: 1,
            }}
          >
            <span style={{ color: "var(--color-text-primary)" }}>Campu</span>
            <span style={{ color: "var(--color-brand)" }}>Sync</span>
          </span>
        </a>

        {/* Desktop nav links */}
        {!isCompactLayout && (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navLinks.map((link) =>
              link.download ? (
                <a
                  key={link.label}
                  href={link.href}
                  download="CampuSync.apk"
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    color: "var(--color-text-secondary)",
                    fontSize: 13.5,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color 0.15s, background 0.15s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
                    (e.currentTarget as HTMLElement).style.background = "var(--color-bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {link.label}
                </a>
              ) : (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    fontSize: 13.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
                    (e.currentTarget as HTMLElement).style.background = "var(--color-bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {link.label}
                </button>
              )
            )}
          </div>
        )}

        {/* Right actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ThemeToggle />
          {!isCompactLayout && (
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "1px solid var(--color-border-default)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: 500,
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-brand)";
                (e.currentTarget as HTMLElement).style.color = "var(--color-brand)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-default)";
                (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
              }}
            >
              Log in
            </button>
          )}
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: "0 0 20px rgba(16,185,129,0.35)",
              transition: "box-shadow 0.2s, transform 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(16,185,129,0.5)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(16,185,129,0.35)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            {isCompactLayout ? "Start" : "Get Started"}
            {!isCompactLayout && <ArrowRight size={14} />}
          </button>

          {/* Mobile hamburger */}
          {isCompactLayout && (
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--color-border-default)",
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isCompactLayout && menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          style={{
            position: "fixed",
            top: 68,
            left: 0,
            right: 0,
            zIndex: 199,
            background: "var(--color-bg-primary)",
            borderBottom: "1px solid var(--color-border-subtle)",
            padding: "12px 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {navLinks.map((link) =>
            link.download ? (
              <a
                key={link.label}
                href={link.href}
                download="CampuSync.apk"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  color: "var(--color-text-secondary)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "block",
                }}
              >
                {link.label}
              </a>
            ) : (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {link.label}
              </button>
            )
          )}
          <div
            style={{
              height: 1,
              background: "var(--color-border-subtle)",
              margin: "8px 0",
            }}
          />
          <button
            onClick={() => { setMenuOpen(false); navigate("/login"); }}
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Log in
          </button>
          <button
            onClick={() => { setMenuOpen(false); navigate("/register"); }}
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Register Your Institution →
          </button>
        </motion.div>
      )}
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function LandingHero({ isCompactLayout }: { isCompactLayout: boolean }) {
  const navigate = useNavigate();
  const downloadQueryActive =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("download") === "app";

  return (
    <section
      style={{
        paddingTop: isCompactLayout ? 120 : 156,
        paddingBottom: isCompactLayout ? 64 : 96,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        paddingInline: isCompactLayout ? 20 : 48,
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1100,
          height: 700,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 100,
          left: "15%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 80,
          right: "10%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Badge */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.05 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 999,
          padding: "6px 14px 6px 10px",
          marginBottom: 28,
          cursor: "default",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10B981",
            display: "inline-block",
            boxShadow: "0 0 6px #10B981",
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#10B981",
            letterSpacing: 0.3,
          }}
        >
          Enterprise Alumni Platform · Now Live
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        {...fadeUp}
        transition={{ duration: 0.65, delay: 0.1 }}
        style={{
          fontSize: isCompactLayout ? "clamp(32px, 9vw, 44px)" : "clamp(44px, 5.5vw, 68px)",
          fontWeight: 900,
          color: "var(--color-text-primary)",
          lineHeight: 1.06,
          letterSpacing: -1.5,
          maxWidth: 820,
          margin: "0 auto 20px",
          fontFamily: "var(--font-display)",
        }}
      >
        The Alumni Platform{" "}
        <br style={{ display: isCompactLayout ? "none" : "block" }} />
        <span
          style={{
            background: "linear-gradient(135deg, #10B981 10%, #38BDF8 60%, #34D399 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Built for Institutions
        </span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.18 }}
        style={{
          fontSize: isCompactLayout ? 15 : 17,
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
          maxWidth: 580,
          margin: "0 auto 32px",
        }}
      >
        Launch secure digital identity cards, curated memory walls, and
        alumni-first networking for your institution — from one
        production-ready workspace.
      </motion.p>

      {/* Trust chips */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.24 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          marginBottom: 36,
        }}
      >
        {[
          { icon: Shield, label: "Role-based access control" },
          { icon: QrCode, label: "QR-powered identity" },
          { icon: Bell, label: "Real-time notifications" },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--color-text-secondary)",
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 999,
              padding: "6px 12px",
              letterSpacing: 0.1,
            }}
          >
            <Icon size={12} style={{ color: "var(--color-brand)" }} />
            {label}
          </span>
        ))}
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "14px 32px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#fff",
            fontSize: 14.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 24px rgba(16,185,129,0.4)",
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 32px rgba(16,185,129,0.55)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(16,185,129,0.4)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          Register Your Institution <ArrowRight size={15} />
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-secondary)",
            fontSize: 14.5,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-default)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
          }}
        >
          Access Portal
        </button>
        <a
          href={APP_DOWNLOAD_URL}
          download="CampuSync.apk"
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "transparent",
            color: "var(--color-text-secondary)",
            fontSize: 14.5,
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-default)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
          }}
        >
          <Smartphone size={15} /> Download App
        </a>
      </motion.div>

      {downloadQueryActive && (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{
            marginTop: 20,
            color: "var(--color-text-muted)",
            fontSize: 13,
          }}
        >
          Could not open the app automatically. Download it and scan the QR
          code again.
        </motion.div>
      )}

      {/* Trust logos strip */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.38 }}
        style={{
          marginTop: 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            fontWeight: 600,
          }}
        >
          Trusted by forward-thinking institutions
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: isCompactLayout ? 16 : 36,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {["Nexus Institute", "TechHaven College", "GreenLeaf University", "Apex Academy"].map(
            (name) => (
              <span
                key={name}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  letterSpacing: 0.3,
                  opacity: 0.6,
                }}
              >
                {name}
              </span>
            )
          )}
        </div>
      </motion.div>
    </section>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────
export function LandingStats({ isCompactLayout }: { isCompactLayout: boolean }) {
  return (
    <section
      style={{
        padding: isCompactLayout ? "48px 20px" : "56px 48px",
        borderTop: "1px solid var(--color-border-subtle)",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-secondary)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isCompactLayout
            ? "repeat(2, 1fr)"
            : "repeat(4, 1fr)",
          gap: isCompactLayout ? 28 : 0,
        }}
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              style={{
                textAlign: "center",
                padding: "0 24px",
                borderRight:
                  !isCompactLayout && i < stats.length - 1
                    ? "1px solid var(--color-border-subtle)"
                    : "none",
              }}
            >
              <Icon
                size={20}
                style={{
                  color: "var(--color-brand)",
                  margin: "0 auto 10px",
                  display: "block",
                }}
              />
              <div
                style={{
                  fontSize: isCompactLayout ? 32 : 40,
                  fontWeight: 900,
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                  letterSpacing: -1,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
export function LandingFeatures({
  isCompactLayout,
}: {
  isCompactLayout: boolean;
}) {
  return (
    <section
      id="features"
      style={{
        padding: isCompactLayout ? "72px 20px" : "100px 48px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: 64 }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: "var(--color-brand)",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          Platform Features
        </p>
        <h2
          style={{
            fontSize: isCompactLayout ? 28 : 40,
            fontWeight: 900,
            color: "var(--color-text-primary)",
            marginBottom: 16,
            letterSpacing: -0.8,
            fontFamily: "var(--font-display)",
            lineHeight: 1.1,
          }}
        >
          Everything your institution needs
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--color-text-muted)",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          A complete, production-ready suite to create, manage, and distribute
          digital identities and memories across your campus.
        </p>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-60px" }}
        style={{
          display: "grid",
          gridTemplateColumns: isCompactLayout
            ? "1fr"
            : "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            style={{
              padding: "32px 28px",
              borderRadius: 16,
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-subtle)",
              position: "relative",
              overflow: "hidden",
              cursor: "default",
              transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
            }}
            whileHover={{
              y: -4,
              borderColor: f.color + "50",
              boxShadow: `0 8px 40px ${f.color}18`,
            }}
          >
            {/* Subtle top glow line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${f.color}60, transparent)`,
              }}
            />

            {/* Tag */}
            <span
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: f.color,
                background: f.color + "15",
                borderRadius: 4,
                padding: "3px 8px",
              }}
            >
              {f.tag}
            </span>

            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: f.color + "14",
                border: `1px solid ${f.color}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <f.icon size={22} color={f.color} />
            </div>

            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                marginBottom: 10,
                lineHeight: 1.3,
              }}
            >
              {f.title}
            </h3>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--color-text-muted)",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {f.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
export function LandingHowItWorks({
  isCompactLayout,
}: {
  isCompactLayout: boolean;
}) {
  return (
    <section
      id="how-it-works"
      style={{
        padding: isCompactLayout ? "64px 20px" : "100px 48px",
        background: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border-subtle)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: "var(--color-brand)",
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            Getting Started
          </p>
          <h2
            style={{
              fontSize: isCompactLayout ? 28 : 40,
              fontWeight: 900,
              color: "var(--color-text-primary)",
              marginBottom: 16,
              letterSpacing: -0.8,
              fontFamily: "var(--font-display)",
              lineHeight: 1.1,
            }}
          >
            Up and running in minutes
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "var(--color-text-muted)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            No engineering team required. From registration to live digital
            cards in three simple steps.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isCompactLayout ? "1fr" : "repeat(3, 1fr)",
            gap: isCompactLayout ? 24 : 32,
            position: "relative",
          }}
        >
          {/* Connector line (desktop only) */}
          {!isCompactLayout && (
            <div
              style={{
                position: "absolute",
                top: 38,
                left: "calc(33.33% - 24px)",
                right: "calc(33.33% - 24px)",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, var(--color-border-default), transparent)",
                zIndex: 0,
              }}
            />
          )}

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{
                padding: "32px 28px",
                borderRadius: 16,
                background: "var(--color-bg-primary)",
                border: "1px solid var(--color-border-subtle)",
                position: "relative",
                zIndex: 1,
                textAlign: isCompactLayout ? "left" : "center",
              }}
            >
              {/* Step number orb */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: step.color + "12",
                  border: `1px solid ${step.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: isCompactLayout ? "0 0 20px 0" : "0 auto 20px",
                  position: "relative",
                }}
              >
                <step.icon size={24} color={step.color} />
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: step.color,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    letterSpacing: 0,
                  }}
                >
                  {i + 1}
                </span>
              </div>

              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: step.color,
                  marginBottom: 10,
                }}
              >
                Step {step.step}
              </div>

              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
export function LandingCTA({ isCompactLayout }: { isCompactLayout: boolean }) {
  const navigate = useNavigate();
  return (
    <section
      style={{
        padding: isCompactLayout ? "64px 20px" : "100px 48px",
        textAlign: "center",
      }}
    >
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: isCompactLayout ? "48px 28px" : "72px 60px",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(56,189,248,0.06) 50%, rgba(16,185,129,0.08) 100%)",
          border: "1px solid rgba(16,185,129,0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow blob */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 500,
            height: 300,
            background:
              "radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <p
          style={{
            fontSize: 11,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: "var(--color-brand)",
            fontWeight: 700,
            marginBottom: 18,
            position: "relative",
          }}
        >
          Start Today
        </p>

        <h2
          style={{
            fontSize: isCompactLayout ? 26 : 38,
            fontWeight: 900,
            color: "var(--color-text-primary)",
            marginBottom: 16,
            letterSpacing: -0.8,
            fontFamily: "var(--font-display)",
            lineHeight: 1.1,
            position: "relative",
          }}
        >
          Ready to transform your{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #10B981, #38BDF8)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            alumni network?
          </span>
        </h2>

        <p
          style={{
            fontSize: 14.5,
            color: "var(--color-text-muted)",
            marginBottom: 36,
            lineHeight: 1.7,
            maxWidth: 480,
            margin: "0 auto 36px",
            position: "relative",
          }}
        >
          Register your institution in under 2 minutes. No credit card
          required. Full platform access from day one.
        </p>

        {/* Checkmarks */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
            marginBottom: 36,
            position: "relative",
          }}
        >
          {["Free 14-day trial", "No setup fees", "Cancel anytime"].map(
            (item) => (
              <span
                key={item}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={14} color="#10B981" />
                {item}
              </span>
            )
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "14px 36px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#fff",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 24px rgba(16,185,129,0.4)",
              transition: "box-shadow 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(16,185,129,0.55)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(16,185,129,0.4)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Register Now <ChevronRight size={16} />
          </button>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              border: "1px solid var(--color-border-strong)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: 14.5,
              fontWeight: 500,
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
            }}
          >
            Sign In Instead
          </button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function LandingFooter({
  isCompactLayout,
}: {
  isCompactLayout: boolean;
}) {
  const navigate = useNavigate();

  const footerLinks = {
    Platform: [
      { label: "Features", action: () => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" }) },
      { label: "How It Works", action: () => document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" }) },
      { label: "Download App", href: APP_DOWNLOAD_URL, download: true },
    ],
    Account: [
      { label: "Register Institution", action: () => navigate("/register") },
      { label: "Admin Login", action: () => navigate("/login") },
      { label: "Super Admin", action: () => navigate("/super-admin") },
    ],
    Resources: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Release Notes", href: "#" },
    ],
  };

  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-secondary)",
      }}
    >
      {/* Main footer */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isCompactLayout ? "48px 20px 32px" : "64px 48px 40px",
          display: "grid",
          gridTemplateColumns: isCompactLayout
            ? "1fr"
            : "2fr repeat(3, 1fr)",
          gap: isCompactLayout ? 40 : 32,
        }}
      >
        {/* Brand column */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #10B981, #38BDF8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QrCode size={16} color="#fff" />
            </div>
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: -0.5,
              }}
            >
              <span style={{ color: "var(--color-text-primary)" }}>Campu</span>
              <span style={{ color: "var(--color-brand)" }}>Sync</span>
            </span>
          </div>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--color-text-muted)",
              lineHeight: 1.7,
              maxWidth: 280,
              marginBottom: 24,
            }}
          >
            Enterprise alumni platform for digital identity, memory walls, and
            institution-grade networking workflows.
          </p>

          {/* Social icons */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: Github, href: "https://github.com", label: "GitHub" },
              { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
              { icon: Mail, href: "mailto:joshijayc075@gmail.com", label: "Email" },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid var(--color-border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-muted)",
                  transition: "border-color 0.2s, color 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-brand)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-brand)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-default)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                }}
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
                marginBottom: 16,
              }}
            >
              {category}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {links.map((link) =>
                "href" in link && link.href ? (
                  <a
                    key={link.label}
                    href={link.href as string}
                    download={"download" in link && link.download ? "CampuSync.apk" : undefined}
                    target={("href" in link && link.href && !(link.href as string).startsWith("/") && !(link.href as string).startsWith("#")) ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13.5,
                      color: "var(--color-text-muted)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                    }}
                  >
                    {link.label}
                  </a>
                ) : (
                  <button
                    key={link.label}
                    onClick={"action" in link ? link.action : undefined}
                    style={{
                      fontSize: 13.5,
                      color: "var(--color-text-muted)",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                    }}
                  >
                    {link.label}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid var(--color-border-subtle)",
          padding: isCompactLayout ? "16px 20px" : "20px 48px",
          display: "flex",
          flexDirection: isCompactLayout ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isCompactLayout ? "flex-start" : "center",
          gap: 12,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          © 2026 CampuSync. All rights reserved.
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy Policy", "Terms of Service"].map((item) => (
            <a
              key={item}
              href="#"
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
              }}
            >
              {item}
            </a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          Built with ❤️ in India
        </span>
      </div>
    </footer>
  );
}
