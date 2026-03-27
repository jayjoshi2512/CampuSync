import React from "react";
import CardViewer, { TEMPLATES, CardData } from "@/components/CardViewer";

export default function MiniCardPreview({
  id,
  card,
  active,
  onClick,
}: {
  id: string;
  card: CardData;
  active: boolean;
  onClick: () => void;
}) {
  const tmpl = TEMPLATES[id];
  if (!tmpl) return null;

  const W = 116;
  const H = Math.round(116 / 1.5852); // ~73px
  const scale = W / 340; // CardViewer base width is 340

  return (
    <button
      onClick={onClick}
      title={tmpl.name}
      style={{
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          borderRadius: 6,
          position: "relative",
          overflow: "hidden", // clip scales that overshoot
          border: `2px solid ${active ? tmpl.accent : "rgba(255,255,255,0.06)"}`,
          boxShadow: active
            ? `0 0 0 1px ${tmpl.accent}55, 0 4px 20px ${tmpl.accent}35, 0 2px 8px rgba(0,0,0,0.6)`
            : "0 2px 8px rgba(0,0,0,0.5)",
          transition: "all 0.18s",
          transform: active ? "translateY(-2px)" : "translateY(0)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: "top left", 
            width: 340, 
            height: Math.round(340/1.5852), 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            pointerEvents: 'none' 
          }}
        >
           <CardViewer card={{ ...card, template_id: id }} interactive={false} displayScale={1} />
        </div>
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: active ? 600 : 400,
          color: active ? tmpl.accent : "var(--color-text-muted)",
          letterSpacing: 0.2,
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: W,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {tmpl.name}
      </span>
    </button>
  );
}
