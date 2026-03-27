// frontend/src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ToastProvider";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  Zap,
  Shield,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import AuthBackButton from "@/components/auth/AuthBackButton";

type LoginMode = "admin" | "student" | "alumni";

export default function Login() {
  const [mode, setMode] = useState<LoginMode>("admin");
  const [email, setEmail] = useState("joshijay075@gmail.com");
  const [password, setPassword] = useState("11111aA@");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forgotLoading, setForgotLoading] = useState(false);
  const isCompactLayout = useMediaQuery("(max-width: 768px)");

  const handleForgotPassword = async () => {
    if (!email) return toast("Enter your email first", "error");
    setForgotLoading(true);
    try {
      await api.post("/user/forgot-password", { email });
      toast(
        "If this email is registered, a reset link has been sent.",
        "success",
      );
    } catch {
      toast("Failed to send reset link", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      setAuth(data.token, data.actor);
      toast("Welcome back!", "success");
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast(err.response?.data?.error || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post("/user/login", { email, password });
      if (data?.actor?.role === "alumni") {
        toast("This is an alumni account. Please use the Alumni tab to sign in.", "error");
        return;
      }
      setAuth(data.token, data.actor);
      toast("Welcome back!", "success");
      navigate("/portal");
    } catch (err: any) {
      toast(err.response?.data?.error || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAlumniLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post("/user/login", { email, password });
      if (data?.actor?.role !== "alumni") {
        toast("This account is not alumni. Please try again.", "warning");
        return;
      }
      setAuth(data.token, data.actor);
      toast("Welcome back, Alumni!", "success");
      navigate("/alumni");
    } catch (err: any) {
      toast(err.response?.data?.error || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    if (mode === "admin") {
      setAuth("demo_admin_token_" + Date.now(), {
        id: 0,
        email: "demo@admin.local",
        name: "Demo Admin",
        role: "admin" as const,
        org_role: "owner" as const,
        organization: {
          id: 1,
          name: "BITS Pilani — Farewell 2025",
          slug: "bits-pilani-2025",
          plan: "demo",
          brand_color: "#10B981",
          logo_url: undefined,
        },
      });
      toast("Demo mode — viewing Admin panel", "info");
      navigate("/admin/dashboard");
    } else if (mode === "student") {
      setAuth("demo_user_token_" + Date.now(), {
        id: 0,
        email: "aarav@bits.ac.in",
        name: "Aarav Patel",
        role: "user" as const,
        roll_number: "CS2022001",
        branch: "Computer Science",
        batch_year: 2026,
        organization: {
          id: 1,
          name: "BITS Pilani — Farewell 2025",
          slug: "bits-pilani-2025",
          plan: "demo",
          brand_color: "#10B981",
          logo_url: undefined,
        },
      });
      toast("Demo mode — viewing Student Portal", "info");
      navigate("/portal");
    } else {
      setAuth("demo_alumni_token_" + Date.now(), {
        id: 0,
        email: "priya-sharma@bits.ac.in",
        name: "Priya Sharma",
        role: "alumni" as const,
        roll_number: "CS2020042",
        branch: "Computer Science",
        batch_year: 2021,
        organization: {
          id: 1,
          name: "BITS Pilani — Farewell 2025",
          slug: "bits-pilani-2025",
          plan: "demo",
          brand_color: "#10B981",
          logo_url: undefined,
        },
      });
      toast("Demo mode — viewing Alumni Portal", "info");
      navigate("/alumni");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px 12px 42px",
    borderRadius: 10,
    border: "1px solid var(--color-border-default)",
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--color-text-muted)",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        display: "flex",
      }}
    >
      {/* Responsive: inject hide styles for left panel on mobile */}
      <style>{`@media(max-width:768px){.auth-brand-panel{display:none !important;}.login-form-panel{flex:1 !important;}}`}</style>

      <AuthBackButton />

      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 120 }}>
        <ThemeToggle />
      </div>

      <AuthBrandPanel
        className="auth-brand-panel"
        title="Welcome back"
        description="Sign in to manage your institution's cards, memories, and student engagement."
        features={[
          { icon: ShieldCheck, text: "End-to-end encrypted", color: "#F59E0B" },
          { icon: Zap, text: "Sub-200ms response times", color: "#F87171" },
          { icon: Shield, text: "SOC 2 compliant infrastructure", color: "#38BDF8" },
        ]}
      />

      {/* Right: Login form */}
      <div
        className="login-form-panel"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isCompactLayout ? "72px 16px 20px" : 40,
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Tab Toggle */}
          <div
            style={{
              display: "flex",
              borderRadius: 10,
              padding: 3,
              background: "var(--color-bg-tertiary)",
              marginBottom: 28,
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {(["admin", "student", "alumni"] as LoginMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setMagicSent(false);
                  setPassword("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                  background: mode === m ? "var(--color-brand)" : "transparent",
                  color: mode === m ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {m === "admin"
                  ? "Admin"
                  : m === "student"
                    ? "Student"
                    : "Alumni"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {magicSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center", padding: "32px 0" }}
              >
                <Mail
                  size={40}
                  style={{
                    color: "var(--color-accent-green)",
                    marginBottom: 16,
                  }}
                />
                <p
                  style={{
                    color: "var(--color-text-primary)",
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Check your inbox
                </p>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  We sent a magic link to {email}
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border-default)",
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Try again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "admin" ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {/* Email */}
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={iconStyle} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        mode === "admin"
                          ? "admin@college.edu"
                          : "your.email@college.edu"
                      }
                      style={inputStyle}
                      onKeyUp={(e) =>
                        e.key === "Enter" &&
                        (mode === "admin"
                          ? handleAdminLogin()
                          : mode === "student"
                            ? handleStudentLogin()
                            : handleAlumniLogin())
                      }
                    />
                  </div>

                  {/* Password */}
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={iconStyle} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      style={{ ...inputStyle, paddingRight: 42 }}
                      onKeyUp={(e) =>
                        e.key === "Enter" &&
                        (mode === "admin"
                          ? handleAdminLogin()
                          : mode === "student"
                            ? handleStudentLogin()
                            : handleAlumniLogin())
                      }
                    />
                    <button
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>



                {/* Submit */}
                <button
                  onClick={
                    mode === "admin"
                      ? handleAdminLogin
                      : mode === "student"
                        ? handleStudentLogin
                        : handleAlumniLogin
                  }
                  disabled={loading || !email || !password}
                  style={{
                    width: "100%",
                    marginTop: 20,
                    padding: 13,
                    borderRadius: 10,
                    border: "none",
                    background: "var(--color-brand)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                    opacity: loading || !email || !password ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Sign In"}
                </button>

                {/* Forgot password */}
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <button
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-brand)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                      opacity: forgotLoading ? 0.5 : 1,
                    }}
                  >
                    {forgotLoading ? "Sending..." : "Forgot password?"}
                  </button>
                </div>

                {/* Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    margin: "20px 0",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "var(--color-border-subtle)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    or
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "var(--color-border-subtle)",
                    }}
                  />
                </div>

                {/* Demo */}
                <button
                  onClick={handleDemoLogin}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--color-border-default)",
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Sparkles size={14} /> Demo{" "}
                  {mode === "admin"
                    ? "Admin"
                    : mode === "student"
                      ? "Student"
                      : "Alumni"}{" "}
                  Portal
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{
                color: "var(--color-brand)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Register your institution
            </span>{" "}
            or{" "}
            <span
              onClick={() => navigate("/register/alumni")}
              style={{
                color: "var(--color-brand)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              request alumni access
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
