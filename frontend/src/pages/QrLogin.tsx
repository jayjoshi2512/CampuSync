// frontend/src/pages/QrLogin.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function QrLogin() {
  const { qr_hash } = useParams<{ qr_hash: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Opening CampuSync app...");
  const attempted = useRef(false);
  const isCompactLayout = useMediaQuery("(max-width: 760px)");

  useEffect(() => {
    if (!qr_hash || attempted.current) return;
    attempted.current = true;
    const deepLink = `campusync://qr-login/${encodeURIComponent(qr_hash)}`;

    // Attempt to open mobile app first.
    window.location.href = deepLink;

    const timer = window.setTimeout(() => {
      setStatus("App not detected. Redirecting you to download CampuSync...");
      navigate("/?download=app", { replace: true });
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [qr_hash, navigate]);

  if (!qr_hash) {
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
        <div
          style={{
            padding: 40,
            borderRadius: 16,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-subtle)",
            textAlign: "center",
            maxWidth: 400,
            width: "100%",
            margin: isCompactLayout ? "0 12px" : "0 20px",
          }}
        >
          <Smartphone
            size={40}
            style={{ color: "var(--color-text-muted)", marginBottom: 16 }}
          />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Invalid QR Link
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-text-muted)",
              marginBottom: 20,
            }}
          >
            This QR code is missing a valid login token.
          </p>
          <button
            onClick={() => navigate("/?download=app")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "var(--color-brand)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Go to Home
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
        color: "var(--color-text-muted)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Smartphone size={28} />
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid var(--color-border-default)",
            borderTopColor: "var(--color-brand)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: 14 }}>{status}</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
