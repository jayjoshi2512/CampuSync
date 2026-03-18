import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useToast } from "@/components/ToastProvider";
import { ArrowLeft, Users, Image, Network, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type Org = { id: number; name: string; slug: string };

export default function AlumniRegisterPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [form, setForm] = useState({
    organization_id: "",
    name: "",
    email: "",
    branch: "",
    batch_year: "",
    linkedin_url: "",
    reason: "",
    otp: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const isCompactLayout = useMediaQuery("(max-width: 768px)");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 9,
    border: "1px solid var(--color-border-default)",
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    marginBottom: 5,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const res = await api.get("/register/alumni/organizations", {
          _silent: true,
        } as any);
        setOrgs(res.data.organizations || []);
      } catch {
        try {
          const fallback = await api.get("/register/alumni-organizations", {
            _silent: true,
          } as any);
          setOrgs(fallback.data.organizations || []);
        } catch {
          toast("Failed to load organizations", "error");
        }
      }
    };
    loadOrgs();
  }, [toast]);

  const sendOtp = async () => {
    if (!form.email || !form.name)
      return toast("Name and email are required", "error");
    setLoading(true);
    try {
      await api.post("/register/alumni/send-otp", {
        email: form.email,
        name: form.name,
        cf_turnstile_token: "test_key",
      });
      setOtpSent(true);
      toast("Verification code sent to your email", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!form.otp) return toast("Enter OTP", "error");
    setLoading(true);
    try {
      await api.post("/register/alumni/verify-otp", {
        email: form.email,
        otp: form.otp,
      });
      setVerified(true);
      toast("Email verified successfully", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return toast("Please verify your email first", "error");
    setLoading(true);
    try {
      await api.post("/register/alumni/submit", {
        organization_id: Number(form.organization_id),
        name: form.name,
        email: form.email,
        branch: form.branch || null,
        batch_year: form.batch_year ? Number(form.batch_year) : null,
        linkedin_url: form.linkedin_url || null,
        reason: form.reason || null,
        cf_turnstile_token: "test_key",
      });
      toast("Alumni request submitted. Wait for admin approval.", "success");
      navigate("/login");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        display: "flex",
      }}
    >
      <style>{`@media(max-width:768px){.alumni-brand-panel{display:none !important;}.alumni-form-panel{flex:1 !important;}}`}</style>

      <button
        onClick={() => navigate("/login")}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 120,
          background: "none",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={14} /> Back to Login
      </button>
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 120 }}>
        <ThemeToggle />
      </div>

      {/* Left brand panel */}
      <div
        className="alumni-brand-panel"
        style={{
          flex: "0 0 400px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(145deg, var(--color-bg-secondary), var(--color-bg-primary))",
          borderRight: "1px solid var(--color-border-subtle)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.07), transparent)",
            pointerEvents: "none",
          }}
        />
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
            <span style={{ color: "var(--color-brand)" }}>Nex</span>
            <span style={{ color: "var(--color-text-primary)" }}>Us</span>
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "var(--color-text-primary)",
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            Join your alumni network
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-text-muted)",
              lineHeight: 1.7,
            }}
          >
            Request access to your institution's alumni portal. Once approved by
            your admin, you'll get access to the memory wall, jobs board, and
            mentorship network.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            {
              icon: Users,
              text: "Connect with batchmates & alumni",
              color: "#6366F1",
            },
            {
              icon: Image,
              text: "Access the shared memory wall",
              color: "#10B981",
            },
            {
              icon: Network,
              text: "Jobs board & mentorship network",
              color: "#F59E0B",
            },
            {
              icon: ShieldCheck,
              text: "Verified by your institution admin",
              color: "#38BDF8",
            },
          ].map((item) => (
            <div
              key={item.text}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <item.icon size={16} color={item.color} />
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form panel */}
      <div
        className="alumni-form-panel"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isCompactLayout ? "72px 16px 24px" : "40px 40px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 4,
              marginTop: 0,
            }}
          >
            Alumni Access Request
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              marginBottom: 24,
            }}
          >
            Submit your request. Your institution admin will review and approve
            it.
          </p>

          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label style={labelStyle}>Institution *</label>
              <select
                required
                value={form.organization_id}
                onChange={(e) =>
                  setForm({ ...form, organization_id: e.target.value })
                }
                style={{ ...inputStyle, appearance: "none" }}
              >
                <option value="">Select your institution</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isCompactLayout ? "1fr" : "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  required
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Batch Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={form.batch_year}
                  onChange={(e) =>
                    setForm({ ...form, batch_year: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email *</label>
              <input
                required
                type="email"
                placeholder="your.email@college.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Branch / Department</label>
              <input
                placeholder="e.g. Computer Science"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>LinkedIn URL (optional)</label>
              <input
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin_url}
                onChange={(e) =>
                  setForm({ ...form, linkedin_url: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Why do you want alumni access? (optional)
              </label>
              <textarea
                placeholder="Describe briefly..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              />
            </div>

            {/* OTP flow */}
            {!otpSent && (
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading}
                style={{
                  padding: "12px",
                  borderRadius: 9,
                  border: "none",
                  background: "var(--color-brand)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Send Verification Code →"
                )}
              </button>
            )}

            {otpSent && !verified && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div>
                  <label style={labelStyle}>Verification Code</label>
                  <input
                    placeholder="Enter 6-digit OTP"
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value })}
                    style={inputStyle}
                    maxLength={6}
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading}
                  style={{
                    padding: "12px",
                    borderRadius: 9,
                    border: "none",
                    background: "var(--color-brand)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Verify Email"}
                </button>
              </div>
            )}

            {verified && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  fontSize: 13,
                  color: "#22C55E",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                ✓ Email verified
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !verified}
              style={{
                padding: "13px",
                borderRadius: 9,
                border: "none",
                background: verified
                  ? "var(--color-brand)"
                  : "var(--color-bg-tertiary)",
                color: verified ? "#fff" : "var(--color-text-muted)",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !verified ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <LoadingSpinner size="sm" /> : "Submit Alumni Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
