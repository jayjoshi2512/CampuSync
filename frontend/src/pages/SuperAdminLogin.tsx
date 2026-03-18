// frontend/src/pages/SuperAdminLogin.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import GlassCard from "@/components/GlassCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ToastProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { KeyRound, Sparkles, ShieldCheck } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function SuperAdminLogin() {
  const [step, setStep] = useState<"init" | "otp">("init");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCompactLayout = useMediaQuery("(max-width: 760px)");

  // DEMO mode
  const isDemo = useAuthStore(
    (s) => s.isAuthenticated && s.role === "super_admin",
  );

  /**
   * Step 1: Request OTP — no email input needed.
   * Backend uses the hardcoded SUPER_ADMIN_EMAIL from env.
   */
  const requestOtp = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/super-admin/request-otp");
      // Backend returns a masked email like "a***n@platform.com"
      setMaskedEmail(data.masked_email || "***@***.***");
      setStep("otp");
      toast("Access code sent to your registered email", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to send access code", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const { data } = await api.post("/super-admin/verify-otp", { otp });
      setAuth(data.token, data.actor);
      toast("Welcome back, Super Admin!", "success");
      navigate("/super-admin/dashboard");
    } catch (err: any) {
      toast(err.response?.data?.error || "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // DEMO login — bypass auth for UI preview
  const handleDemoLogin = () => {
    const demoActor = {
      id: 0,
      email: "demo@superadmin.local",
      name: "Demo Super Admin",
      role: "super_admin" as const,
    };
    const demoToken = "demo_sa_token_" + Date.now();
    setAuth(demoToken, demoActor);
    toast("Demo mode — viewing with sample data", "info");
    navigate("/super-admin/dashboard");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 8,
    border: "1px solid var(--color-border-default)",
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed",
          top: 18,
          left: 20,
          zIndex: 100,
          background: "none",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ← Back
      </button>
      {/* Theme toggle in corner */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <GlassCard
        elevation={2}
        glow
        style={{
          maxWidth: 420,
          width: "100%",
          padding: isCompactLayout ? 24 : 40,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background:
              "linear-gradient(135deg, var(--color-accent-green), var(--color-brand))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            fontSize: 22,
          }}
        >
          <ShieldCheck size={22} color="#fff" />
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 6,
          }}
        >
          Super Admin Portal
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            marginBottom: 28,
          }}
        >
          Restricted access. Click below to receive a secure access code at your
          registered email.
        </p>

        <AnimatePresence mode="wait">
          {step === "init" && (
            <motion.div
              key="init"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={requestOtp}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--color-accent-green)",
                  color: "#0D1117",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <KeyRound size={14} /> Request Access Code
                  </>
                )}
              </button>

              {/* Demo login button */}
              <button
                onClick={handleDemoLogin}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px dashed var(--color-border-default)",
                  background: "transparent",
                  color: "var(--color-text-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Sparkles size={14} /> Demo Login (Preview UI)
              </button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  marginBottom: 12,
                }}
              >
                Access code sent to{" "}
                <strong style={{ color: "var(--color-accent-green)" }}>
                  {maskedEmail}
                </strong>
              </p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Paste your 15-character access code"
                style={{
                  ...inputStyle,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
                onKeyUp={(e) => e.key === "Enter" && verifyOtp()}
              />
              <button
                onClick={verifyOtp}
                disabled={loading || !otp}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--color-accent-green)",
                  color: "#0D1117",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading || !otp ? 0.6 : 1,
                }}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Verify & Login"}
              </button>
              <button
                onClick={() => {
                  setStep("init");
                  setOtp("");
                }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--color-text-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
