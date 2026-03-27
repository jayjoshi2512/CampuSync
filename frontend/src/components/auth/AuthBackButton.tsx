import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthBackButtonProps {
  to?: string;
  label?: string;
}

export default function AuthBackButton({ to = "/", label = "Back" }: AuthBackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
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
      <ArrowLeft size={14} /> {label}
    </button>
  );
}
