import { motion } from "framer-motion";
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
} from "lucide-react";

export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const features = [
  {
    icon: Zap,
    title: "Digital Identity Cards",
    desc: "Beautiful 3D interactive cards with QR codes for every student and alumnus.",
    color: "#10B981",
  },
  {
    icon: Camera,
    title: "Memory Wall",
    desc: "Infinite-scroll photo & video gallery — upload, react, and relive memories.",
    color: "#F59E0B",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "JWT-scoped RBAC, encrypted data, disposable email blocking, and rate limiting.",
    color: "#22C55E",
  },
  {
    icon: CreditCard,
    title: "Flexible Billing",
    desc: "Self-serve plans with Razorpay integration, trial periods, and transparent pricing.",
    color: "#38BDF8",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Real-time insights on engagement, scan counts, storage usage, and cohort activity.",
    color: "#14B8A6",
  },
  {
    icon: Globe,
    title: "Public Profiles",
    desc: "Each card has a unique shareable link with OG meta tags and a beautiful public page.",
    color: "#F87171",
  },
];

export function LandingNavbar({ isCompactLayout }: { isCompactLayout: boolean }) {
  const navigate = useNavigate();
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        background:
          "color-mix(in srgb, var(--color-bg-primary) 85%, transparent)",
        borderBottom: "1px solid var(--color-border-subtle)",
        padding: isCompactLayout ? "0 16px" : "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          letterSpacing: -0.5,
        }}
      >
        <span style={{ color: "var(--color-text-primary)" }}>Campu</span>
        <span style={{ color: "var(--color-brand)" }}>Sync</span>
      </div>
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
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Log in
          </button>
        )}
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-brand)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {isCompactLayout ? "Start" : "Get Started"}
        </button>
      </div>
    </nav>
  );
}

export function LandingHero({ isCompactLayout }: { isCompactLayout: boolean }) {
  const navigate = useNavigate();
  return (
    <section
      style={{
        paddingTop: isCompactLayout ? 124 : 160,
        paddingBottom: isCompactLayout ? 72 : 100,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -300,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
        <span
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 20,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-secondary)",
            fontSize: 12,
            color: "var(--color-text-muted)",
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          Trusted by 50+ institutions across India
        </span>
      </motion.div>
      <motion.h1
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          fontSize: "clamp(36px, 5.5vw, 60px)",
          fontWeight: 800,
          color: "var(--color-text-primary)",
          lineHeight: 1.1,
          letterSpacing: -1.5,
          maxWidth: 720,
          margin: "0 auto 20px",
        }}
      >
        The platform for{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #10B981, #38BDF8)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          alumni engagement
        </span>
      </motion.h1>
      <motion.p
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          fontSize: 17,
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
          maxWidth: 520,
          margin: "0 auto 36px",
        }}
      >
        Transform farewells into lasting digital memories. Identity cards,
        memory walls, and alumni networks — all in one premium platform.
      </motion.p>
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
          paddingInline: 16,
        }}
      >
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "none",
            background: "var(--color-brand)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Register Your Institution <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "transparent",
            color: "var(--color-text-secondary)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          View Demo
        </button>
      </motion.div>
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 64,
          paddingInline: 16,
        }}
      >
        <div
          style={{
            background: "color-mix(in srgb, var(--color-brand) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-brand) 30%, transparent)",
            borderRadius: 12,
            padding: "16px 24px",
            maxWidth: 600,
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-primary)", fontWeight: 600 }}>
            🚀 Demo Environment Notes:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            <li><strong>Frontend:</strong> Vercel | <strong>Backend:</strong> Render | <strong>Emails:</strong> Twilio SendGrid</li>
            <li><strong>Note:</strong> Since the backend is hosted on a free Render instance, it sleeps after inactivity. <strong>Your first request (like login or loading data) may take 50+ seconds or fail.</strong> If it fails, please wait a minute and try again!</li>
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

export function LandingFeatures({ isCompactLayout }: { isCompactLayout: boolean }) {
  return (
    <section
      style={{
        padding: isCompactLayout ? "56px 16px" : "80px 40px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: 56 }}
      >
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "var(--color-text-primary)",
            marginBottom: 12,
            letterSpacing: -0.5,
          }}
        >
          Everything you need
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--color-text-muted)",
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          A complete suite of tools to create, manage, and distribute digital
          identity cards and memories.
        </p>
      </motion.div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            {...fadeUp}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            style={{
              padding: 28,
              borderRadius: 14,
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-subtle)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            whileHover={{
              borderColor: "var(--color-border-default)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${f.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <f.icon size={20} color={f.color} />
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                marginBottom: 8,
              }}
            >
              {f.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function LandingCTA({ isCompactLayout }: { isCompactLayout: boolean }) {
  const navigate = useNavigate();
  return (
    <section
      style={{
        padding: isCompactLayout ? "56px 16px" : "80px 40px",
        textAlign: "center",
      }}
    >
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "56px 40px",
          borderRadius: 20,
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--color-text-primary)",
            marginBottom: 12,
          }}
        >
          Ready to get started?
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-muted)",
            marginBottom: 28,
          }}
        >
          Register your institution in under 2 minutes. No credit card required.
        </p>
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "14px 32px",
            borderRadius: 10,
            border: "none",
            background: "var(--color-brand)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Register Now{" "}
          <ArrowRight
            size={14}
            style={{
              display: "inline",
              verticalAlign: "middle",
              marginLeft: 6,
            }}
          />
        </button>
      </motion.div>
    </section>
  );
}
