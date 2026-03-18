// frontend/src/pages/ResetPassword.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Check,
  X as XIcon,
} from "lucide-react";
import api from "@/utils/api";
import { useToast } from "@/components/ToastProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PW_RULES = [
  {
    key: "len",
    label: "At least 8 characters",
    test: (p: string) => p.length >= 8,
  },
  {
    key: "upper",
    label: "One uppercase letter",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    key: "lower",
    label: "One lowercase letter",
    test: (p: string) => /[a-z]/.test(p),
  },
  { key: "num", label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCompactLayout = useMediaQuery("(max-width: 760px)");

  const allPassed = PW_RULES.every((r) => r.test(password));

  const handleReset = async () => {
    if (!allPassed)
      return toast("Password does not meet requirements", "error");
    if (password !== confirm) return toast("Passwords do not match", "error");
    setLoading(true);
    try {
      await api.post("/user/reset-password", { token, password });
      setSuccess(true);
      toast("Password updated!", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Reset failed", "error");
    } finally {
      setLoading(false);
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
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--color-text-muted)",
    pointerEvents: "none",
  };

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Invalid reset link
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "var(--color-brand)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isCompactLayout ? 16 : 20,
        color: "var(--color-text-primary)",
      }}
    >
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "100%",
          maxWidth: 420,
          padding: isCompactLayout ? 24 : 32,
          borderRadius: 16,
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        {success ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle
              size={40}
              style={{ color: "#22C55E", marginBottom: 16 }}
            />
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Password Reset
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                marginBottom: 20,
              }}
            >
              Your password has been updated. You can now log in.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: "var(--color-brand)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 8,
                fontFamily: "var(--font-display)",
              }}
            >
              Reset Password
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                marginBottom: 24,
              }}
            >
              Create a secure password for your account.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={iconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  style={{ ...inputStyle, paddingRight: 42 }}
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

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "var(--color-bg-tertiary)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isCompactLayout ? "1fr" : "1fr 1fr",
                      gap: "6px 16px",
                    }}
                  >
                    {PW_RULES.map((r) => {
                      const ok = r.test(password);
                      return (
                        <div
                          key={r.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {ok ? (
                            <Check
                              size={12}
                              style={{ color: "#22C55E", flexShrink: 0 }}
                            />
                          ) : (
                            <XIcon
                              size={12}
                              style={{
                                color: "var(--color-text-muted)",
                                opacity: 0.4,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              color: ok ? "#22C55E" : "var(--color-text-muted)",
                              fontWeight: ok ? 500 : 400,
                            }}
                          >
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ position: "relative" }}>
                <Lock size={16} style={iconStyle} />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onKeyUp={(e) => e.key === "Enter" && handleReset()}
                />
                <button
                  tabIndex={-1}
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {confirm.length > 0 && password !== confirm && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#F87171",
                    margin: "-6px 0 0 2px",
                  }}
                >
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              onClick={handleReset}
              disabled={
                loading || !allPassed || !confirm || password !== confirm
              }
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
                opacity:
                  loading || !allPassed || !confirm || password !== confirm
                    ? 0.5
                    : 1,
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <p
              style={{
                textAlign: "center",
                marginTop: 16,
                fontSize: 12,
                color: "var(--color-text-muted)",
              }}
            >
              <span
                onClick={() => navigate("/login")}
                style={{ color: "var(--color-brand)", cursor: "pointer" }}
              >
                Back to Login
              </span>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
