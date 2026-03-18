// frontend/src/components/CardViewer.tsx
// Required: npm install qrcode @types/qrcode
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Eye,
  Smartphone,
  Download,
  Share2,
  CornerUpRight,
  GraduationCap,
  RefreshCcw,
} from "lucide-react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import QRCodeLib from "qrcode";

export const TEMPLATES: Record<
  string,
  {
    name: string;
    bg: string;
    accent: string;
    textColor: string;
    mutedColor: string;
    style: string;
    font: string;
    monoFont: string;
  }
> = {
  tmpl_obsidian: {
    name: "Black Centurion",
    bg: "#050505",
    accent: "#C8A84C",
    textColor: "#F2EDE0",
    mutedColor: "rgba(200,168,76,0.5)",
    style: "obsidian",
    font: "'Cormorant Garamond', serif",
    monoFont: "'DM Mono', monospace",
  },
  tmpl_aurora: {
    name: "Sapphire Vault",
    bg: "#04091A",
    accent: "#5B8DEF",
    textColor: "#E8F2FF",
    mutedColor: "rgba(140,180,240,0.55)",
    style: "aurora",
    font: "'DM Sans', sans-serif",
    monoFont: "'DM Mono', monospace",
  },
  tmpl_crimson: {
    name: "Burgundy Vault",
    bg: "#0A0206",
    accent: "#B8860B",
    textColor: "#F0E6D0",
    mutedColor: "rgba(184,134,11,0.55)",
    style: "crimson",
    font: "'Playfair Display', serif",
    monoFont: "'Playfair Display', serif",
  },
  tmpl_solar: {
    name: "Emerald Cipher",
    bg: "#020D08",
    accent: "#00C896",
    textColor: "#D0FFE8",
    mutedColor: "rgba(0,200,150,0.5)",
    style: "solar",
    font: "'DM Sans', sans-serif",
    monoFont: "'JetBrains Mono', monospace",
  },
  tmpl_deepspace: {
    name: "Deep Space",
    bg: "#040810",
    accent: "#6494FF",
    textColor: "#E8F4FF",
    mutedColor: "rgba(140,200,255,0.55)",
    style: "deepspace",
    font: "'Clash Display', 'DM Sans', sans-serif",
    monoFont: "'JetBrains Mono', monospace",
  },
  tmpl_ivory: {
    name: "Bronze Ghost",
    bg: "#090604",
    accent: "#B87333",
    textColor: "#EAD8C0",
    mutedColor: "rgba(184,115,51,0.52)",
    style: "ivory",
    font: "'Cormorant Garamond', serif",
    monoFont: "'DM Mono', monospace",
  },
  tmpl_neon: {
    name: "Void Fintech",
    bg: "#06060C",
    accent: "#7C83F0",
    textColor: "#EDEDFF",
    mutedColor: "rgba(150,155,230,0.5)",
    style: "neon",
    font: "'DM Sans', sans-serif",
    monoFont: "'DM Mono', monospace",
  },
  tmpl_circuit: {
    name: "Arctic Ghost",
    bg: "#020508",
    accent: "#9CB8DC",
    textColor: "#E0EEFF",
    mutedColor: "rgba(156,184,220,0.48)",
    style: "circuit",
    font: "'DM Sans', sans-serif",
    monoFont: "'DM Mono', monospace",
  },
};

export interface CardData {
  name: string;
  roll_number?: string;
  branch?: string;
  batch_year?: number;
  org_name?: string;
  org_logo_url?: string;
  avatar_url?: string;
  template_id?: string;
  scan_count?: number;
  back_image_url?: string;
  card_back_image_url?: string;
  tagline?: string;
  qr_hash?: string;
  user_id?: number;
}

interface CardViewerProps {
  card: CardData;
  interactive?: boolean;
  compact?: boolean;
  renderMode?: "full" | "front" | "back";
  displayScale?: number;
}

const svgBg = (
  svgContent: string,
  w: number,
  h: number,
  op = 1,
): React.CSSProperties => ({
  backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}")`,
  backgroundSize: `${w}px ${h}px`,
  backgroundRepeat: "repeat",
  opacity: op,
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
});

export default function CardViewer({
  card,
  interactive = true,
  compact = false,
  renderMode = "full",
  displayScale = 1,
}: CardViewerProps) {
  const templateId = (card.template_id ||
    "tmpl_obsidian") as keyof typeof TEMPLATES;
  const template = TEMPLATES[templateId] || TEMPLATES.tmpl_obsidian;
  const s = template.style;
  const sc = (n: number) => Math.round(n * displayScale);
  const isExport = renderMode !== "full";

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  useEffect(() => {
    const qrValue = card.user_id
      ? `${window.location.origin}/memories/${card.user_id}`
      : card.qr_hash
        ? `${window.location.origin}/qr/${card.qr_hash}`
        : `${window.location.origin}/portal`;
    QRCodeLib.toDataURL(qrValue, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: "L",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.user_id, card.qr_hash]);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const mouseX = useMotionValue(0.5),
    mouseY = useMotionValue(0.5);
  const rotateY = useSpring(0, { stiffness: 300, damping: 32 });
  const rotateX = useSpring(0, { stiffness: 300, damping: 32 });

  const shimmerBg = useTransform([mouseX, mouseY], ([x, y]: number[]) => {
    const c =
      s === "obsidian"
        ? "rgba(200,168,76,0.2)"
        : s === "aurora"
          ? "rgba(91,141,239,0.18)"
          : s === "crimson"
            ? "rgba(184,134,11,0.15)"
            : s === "solar"
              ? "rgba(0,200,150,0.16)"
              : s === "deepspace"
                ? "rgba(100,148,255,0.18)"
                : s === "ivory"
                  ? "rgba(184,115,51,0.15)"
                  : s === "neon"
                    ? "rgba(124,131,240,0.18)"
                    : "rgba(156,184,220,0.14)";
    return `radial-gradient(circle at ${(x as number) * 100}% ${(y as number) * 100}%, ${c}, transparent 55%)`;
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || isDragging || !interactive) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
      rotateY.set((x - 0.5) * 16);
      rotateX.set((0.5 - y) * 9);
    },
    [isDragging, interactive, mouseX, mouseY, rotateX, rotateY],
  );

  const handleMouseLeave = () => {
    if (!isDragging) {
      rotateY.set(isFlipped ? 180 : 0);
      rotateX.set(0);
    }
  };
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
  };
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !interactive) return;
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    rotateY.set((isFlipped ? 180 : 0) + (cx - dragStartX.current) * 0.5);
  };
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const n = ((rotateY.get() % 360) + 360) % 360;
    const snap =
      n > 90 && n < 270 ? (isFlipped ? 0 : 180) : isFlipped ? 180 : 0;
    rotateY.set(snap);
    setIsFlipped(snap === 180);
  };
  const flip = () => {
    const n = !isFlipped;
    rotateY.set(n ? 180 : 0);
    rotateX.set(0);
    setIsFlipped(n);
  };

  const BASE_W = compact ? 280 : 360;
  const BASE_H = Math.round(BASE_W / 1.5852);
  const W = sc(BASE_W),
    H = sc(BASE_H);
  const YEAR = card.batch_year || 2026;
  const INITIAL = card.name?.[0]?.toUpperCase() || "?";

  // ── Padding system ────────────────────────────────────────────────────────
  // BR  = border-radius
  // PT  = top padding = BR + gap  →  org row clears rounded corner clip
  // PB  = bottom padding — generous so CTA always stays inside
  // PH  = horizontal padding
  const BR = sc(compact ? 12 : 16);
  const PH = sc(compact ? 13 : 15);
  const PT = BR + sc(compact ? 8 : 10);
  const PB = sc(compact ? 16 : 20);

  const tagline =
    card.tagline ||
    (s === "deepspace"
      ? "Not all who wander are lost. // Some just graduated."
      : s === "neon"
        ? "Shipped. Deployed. Graduated."
        : s === "obsidian"
          ? "Excellence is not a moment. It is a standard."
          : s === "circuit"
            ? "Classified. Graduated. Deployed."
            : s === "solar"
              ? "Encrypted. Verified. Graduated."
              : "");

  const QR_COL_W = sc(compact ? 74 : 88);
  const QR_BOX = QR_COL_W - sc(4);

  const cardBg = (): string => {
    if (s === "obsidian")
      return "radial-gradient(ellipse at 20% 0%, #141414 0%, #050505 65%)";
    if (s === "aurora")
      return "linear-gradient(150deg, #040C1E 0%, #071530 55%, #040A18 100%)";
    if (s === "crimson")
      return "radial-gradient(ellipse at 25% 0%, #180512 0%, #0A0206 70%)";
    if (s === "solar")
      return "radial-gradient(ellipse at 20% 0%, #031408 0%, #020D08 70%)";
    if (s === "deepspace") return "#040810";
    if (s === "ivory")
      return "radial-gradient(ellipse at 20% 0%, #130A05 0%, #090604 70%)";
    if (s === "neon")
      return "radial-gradient(ellipse at 15% 20%, #0C0C18 0%, #06060C 70%)";
    if (s === "circuit")
      return "radial-gradient(ellipse at 20% 0%, #070C14 0%, #020508 70%)";
    return template.bg;
  };

  const cardShadow = (): string => {
    if (isExport) return "none";
    const r = (n: number) => `${Math.round(n * displayScale)}px`;
    if (s === "obsidian")
      return `0 ${r(4)} ${r(16)} rgba(0,0,0,0.9),0 ${r(16)} ${r(48)} rgba(0,0,0,0.7),0 0 0 ${r(0.5)} rgba(200,168,76,0.25),inset 0 ${r(1)} 0 rgba(200,168,76,0.08)`;
    if (s === "aurora")
      return `0 ${r(4)} ${r(16)} rgba(0,8,30,0.9),0 ${r(16)} ${r(48)} rgba(0,8,30,0.6),0 0 0 ${r(0.5)} rgba(91,141,239,0.25),inset 0 ${r(1)} 0 rgba(91,141,239,0.1)`;
    if (s === "crimson")
      return `0 ${r(4)} ${r(16)} rgba(10,2,6,0.95),0 ${r(16)} ${r(48)} rgba(10,2,6,0.7),0 0 0 ${r(0.5)} rgba(184,134,11,0.22),inset 0 ${r(1)} 0 rgba(184,134,11,0.07)`;
    if (s === "solar")
      return `0 ${r(4)} ${r(16)} rgba(2,13,8,0.95),0 ${r(16)} ${r(48)} rgba(2,13,8,0.7),0 0 0 ${r(0.5)} rgba(0,200,150,0.2),inset 0 ${r(1)} 0 rgba(0,200,150,0.08)`;
    if (s === "deepspace")
      return `0 ${r(4)} ${r(16)} rgba(0,0,0,0.95),0 ${r(16)} ${r(48)} rgba(0,0,0,0.8),0 0 0 ${r(0.5)} rgba(100,148,255,0.18),inset 0 ${r(1)} 0 rgba(100,148,255,0.07)`;
    if (s === "ivory")
      return `0 ${r(4)} ${r(16)} rgba(9,6,4,0.95),0 ${r(16)} ${r(48)} rgba(9,6,4,0.7),0 0 0 ${r(0.5)} rgba(184,115,51,0.22),inset 0 ${r(1)} 0 rgba(184,115,51,0.07)`;
    if (s === "neon")
      return `0 ${r(4)} ${r(16)} rgba(0,0,0,0.95),0 ${r(16)} ${r(48)} rgba(0,0,0,0.8),0 0 0 ${r(0.5)} rgba(124,131,240,0.22),inset 0 ${r(1)} 0 rgba(124,131,240,0.07)`;
    if (s === "circuit")
      return `0 ${r(4)} ${r(16)} rgba(2,5,8,0.95),0 ${r(16)} ${r(48)} rgba(2,5,8,0.8),0 0 0 ${r(0.5)} rgba(156,184,220,0.2),inset 0 ${r(1)} 0 rgba(156,184,220,0.05)`;
    return `0 ${r(16)} ${r(60)} rgba(0,0,0,0.7)`;
  };

  const faceBase: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: BR,
    overflow: "hidden",
    background: cardBg(),
    boxShadow: cardShadow(),
    willChange: interactive ? "transform" : "auto",
    transform: "translateZ(0)",
    WebkitFontSmoothing: "antialiased" as any,
    MozOsxFontSmoothing: "grayscale" as any,
  };

  const sm: React.CSSProperties = {
    WebkitFontSmoothing: "antialiased" as any,
    MozOsxFontSmoothing: "grayscale" as any,
    textRendering: "optimizeLegibility" as any,
  };

  const fs = {
    orgName: sc(compact ? 6 : 7),
    name: sc(compact ? 14 : 19),
    meta: sc(compact ? 7.5 : 8.5),
    tagline: sc(compact ? 5.5 : 6.5),
    cta: sc(compact ? 5.5 : 6.5),
    icon: sc(20),
  };

  const sep =
    s === "obsidian"
      ? "rgba(200,168,76,0.15)"
      : s === "aurora"
        ? "rgba(91,141,239,0.18)"
        : s === "crimson"
          ? "rgba(184,134,11,0.15)"
          : s === "solar"
            ? "rgba(0,200,150,0.15)"
            : s === "deepspace"
              ? "rgba(100,148,255,0.15)"
              : s === "ivory"
                ? "rgba(184,115,51,0.15)"
                : s === "neon"
                  ? "rgba(124,131,240,0.15)"
                  : "rgba(156,184,220,0.12)";

  // ── CSS background-image pattern builders (html2canvas-safe) ──
  const diaPat = () => {
    const d = sc(14),
      h = sc(7);
    return svgBg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><path d="M${h},0 L${d},${h} L${h},${d} L0,${h} Z" stroke="%23C8A84C" stroke-width="0.6" fill="none"/></svg>`,
      d,
      d,
      0.04,
    );
  };
  const hLine = (col: string, sp: number) => {
    const h = sc(sp),
      m = sc(sp / 2);
    return svgBg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="${h}"><line x1="0" y1="${m}" x2="100" y2="${m}" stroke="${encodeURIComponent(col)}" stroke-width="0.5"/></svg>`,
      100,
      h,
      0.055,
    );
  };
  const xhatch = (col: string) => {
    const d = sc(18);
    return svgBg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" transform="rotate(35)"><line x1="0" y1="0" x2="0" y2="${d}" stroke="${encodeURIComponent(col)}" stroke-width="0.5"/><line x1="0" y1="0" x2="${d}" y2="0" stroke="${encodeURIComponent(col)}" stroke-width="0.25"/></svg>`,
      d,
      d,
      0.045,
    );
  };
  const dotGrid = (col: string) => {
    const d = sc(28),
      c = sc(14),
      r = sc(1);
    return svgBg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><rect width="${d}" height="${d}" fill="none" stroke="${encodeURIComponent(col)}" stroke-width="0.5"/><circle cx="${c}" cy="${c}" r="${r}" fill="${encodeURIComponent(col)}" opacity="0.6"/></svg>`,
      d,
      d,
      0.065,
    );
  };
  const sqGrid = (col: string) => {
    const d = sc(32);
    return svgBg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><rect width="${d}" height="${d}" fill="none" stroke="${encodeURIComponent(col)}" stroke-width="0.5"/></svg>`,
      d,
      d,
      0.06,
    );
  };
  const brush = (col: string) => {
    const d = sc(5);
    return svgBg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" transform="rotate(8)"><line x1="0" y1="0" x2="${d}" y2="0" stroke="${encodeURIComponent(col)}" stroke-width="0.5"/></svg>`,
      d,
      d,
      0.06,
    );
  };

  // ── Watermark helper — flex centering is html2canvas-safe ──────────────────
  // NEVER use CSS transform:translate(-50%,-50%) for centering in export context.
  // html2canvas ignores CSS transform on positioned elements, causing the element
  // to render at (50%, 50%) offset instead of centered → clips against overflow:hidden.
  // Solution: wrap in a position:absolute full-bleed flex container.
  const Watermark = ({
    children,
    fontSize,
    color,
    fontFamily,
  }: {
    children: React.ReactNode;
    fontSize: number;
    color: string;
    fontFamily: string;
  }) => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: W,
        height: H,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 300,
          color,
          fontFamily,
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {children}
      </span>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: sc(12),
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,300;1,400;1,600&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        @keyframes auroraShimmer { 0%,100%{opacity:0.5;transform:translateX(-6%)} 50%{opacity:1;transform:translateX(6%)} }
        @keyframes emeraldPulse  { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        @keyframes neonEdge      { 0%,100%{opacity:0.35} 50%{opacity:0.85} }
        @keyframes arcticGlow    { 0%,100%{opacity:0.3} 50%{opacity:0.65} }
        @keyframes goldShimmer   { 0%,100%{opacity:0.4} 50%{opacity:0.75} }
        @keyframes copperDrift   { 0%,100%{opacity:0.35} 50%{opacity:0.6} }
        .pcard-face * { -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; font-optical-sizing:auto; }
      `}</style>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        style={{
          perspective: sc(1200),
          width: W,
          height: H,
          cursor: interactive ? (isDragging ? "grabbing" : "grab") : "default",
          userSelect: "none",
          willChange: interactive ? "transform" : "auto",
          position: "relative",
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            transformStyle: renderMode === "full" ? "preserve-3d" : "flat",
            rotateY: renderMode === "full" ? rotateY : 0,
            rotateX: renderMode === "full" ? rotateX : 0,
          }}
        >
          {/* ═══════════════════ FRONT FACE ═══════════════════ */}
          {renderMode !== "back" && (
            <div
              className="pcard-face"
              style={{
                ...faceBase,
                transform:
                  renderMode === "full" ? "translateZ(1px)" : "translateZ(0)",
                backfaceVisibility:
                  renderMode === "full" ? "hidden" : "visible",
                WebkitBackfaceVisibility:
                  renderMode === "full" ? "hidden" : ("visible" as any),
              }}
            >
              {!isExport && (
                <motion.div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: shimmerBg,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    zIndex: 6,
                  }}
                />
              )}

              {/* ── OBSIDIAN ── */}
              {s === "obsidian" && (
                <>
                  <div style={{ ...diaPat(), zIndex: 1 }} />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "45%",
                      background:
                        "radial-gradient(ellipse at 30% 0%, rgba(200,168,76,0.09) 0%, transparent 65%)",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {[
                      [0.08, 0.55, sc(0.9)],
                      [0.2, 0.3, sc(0.6)],
                      [0.35, 0.72, sc(1.1)],
                      [0.48, 0.18, sc(0.7)],
                      [0.62, 0.65, sc(0.9)],
                      [0.75, 0.4, sc(0.65)],
                      [0.85, 0.75, sc(0.8)],
                      [0.14, 0.88, sc(0.55)],
                      [0.44, 0.9, sc(0.7)],
                      [0.68, 0.12, sc(0.6)],
                      [0.92, 0.55, sc(0.7)],
                      [0.3, 0.45, sc(0.5)],
                    ].map(([x, y, r], i) => (
                      <circle
                        key={i}
                        cx={`${x * 100}%`}
                        cy={`${y * 100}%`}
                        r={r}
                        fill="#C8A84C"
                        opacity="0.18"
                      />
                    ))}
                  </svg>
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  >
                    <line
                      x1={sc(8)}
                      y1={sc(8)}
                      x2={sc(28)}
                      y2={sc(8)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.5"
                    />
                    <line
                      x1={sc(8)}
                      y1={sc(8)}
                      x2={sc(8)}
                      y2={sc(28)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.5"
                    />
                    <line
                      x1={W - sc(8)}
                      y1={sc(8)}
                      x2={W - sc(28)}
                      y2={sc(8)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.5"
                    />
                    <line
                      x1={W - sc(8)}
                      y1={sc(8)}
                      x2={W - sc(8)}
                      y2={sc(28)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.5"
                    />
                    <line
                      x1={sc(8)}
                      y1={H - sc(8)}
                      x2={sc(28)}
                      y2={H - sc(8)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.35"
                    />
                    <line
                      x1={sc(8)}
                      y1={H - sc(8)}
                      x2={sc(8)}
                      y2={H - sc(28)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.35"
                    />
                    <line
                      x1={W - sc(8)}
                      y1={H - sc(8)}
                      x2={W - sc(28)}
                      y2={H - sc(8)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.35"
                    />
                    <line
                      x1={W - sc(8)}
                      y1={H - sc(8)}
                      x2={W - sc(8)}
                      y2={H - sc(28)}
                      stroke="#C8A84C"
                      strokeWidth="0.7"
                      opacity="0.35"
                    />
                    <circle
                      cx={W / 2}
                      cy={H / 2}
                      r={sc(18)}
                      fill="none"
                      stroke="#C8A84C"
                      strokeWidth="0.4"
                      opacity="0.08"
                    />
                    <circle
                      cx={W / 2}
                      cy={H / 2}
                      r={sc(6)}
                      fill="none"
                      stroke="#C8A84C"
                      strokeWidth="0.4"
                      opacity="0.12"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 5%, rgba(200,168,76,0.55) 30%, rgba(220,190,130,0.95) 50%, rgba(200,168,76,0.55) 70%, transparent 95%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 10%, rgba(200,168,76,0.35) 40%, rgba(200,168,76,0.55) 50%, rgba(200,168,76,0.35) 60%, transparent 90%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: sc(14),
                      bottom: sc(14),
                      left: 0,
                      width: `${sc(3)}px`,
                      background:
                        "linear-gradient(180deg, transparent, #C8A84C 25%, #C8A84C 75%, transparent)",
                      opacity: 0.4,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(125deg, rgba(200,168,76,0.03) 0%, transparent 40%, rgba(200,168,76,0.05) 100%)",
                      animation: "goldShimmer 5s ease-in-out infinite",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                </>
              )}

              {/* ── AURORA ── */}
              {s === "aurora" && (
                <>
                  <div style={{ ...hLine("#5B8DEF", 8), zIndex: 1 }} />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(128deg, rgba(91,141,239,0.12) 0%, transparent 48%, rgba(15,55,160,0.06) 100%)",
                      animation: "auroraShimmer 8s ease-in-out infinite",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "50%",
                      height: "60%",
                      background:
                        "radial-gradient(ellipse at 0% 0%, rgba(91,141,239,0.14) 0%, transparent 70%)",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      right: QR_COL_W + sc(8),
                      width: sc(80),
                      height: sc(80),
                      opacity: 0.22,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  >
                    {(
                      [
                        [sc(10), sc(10)],
                        [sc(30), sc(6)],
                        [sc(50), sc(14)],
                        [sc(20), sc(28)],
                        [sc(42), sc(30)],
                        [sc(60), sc(24)],
                        [sc(70), sc(8)],
                      ] as [number, number][]
                    ).map(([x, y], i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={sc(1.5)}
                        fill="#5B8DEF"
                      />
                    ))}
                    {(
                      [
                        [sc(10), sc(10), sc(30), sc(6)],
                        [sc(30), sc(6), sc(50), sc(14)],
                        [sc(30), sc(6), sc(20), sc(28)],
                        [sc(50), sc(14), sc(42), sc(30)],
                        [sc(50), sc(14), sc(60), sc(24)],
                        [sc(60), sc(24), sc(70), sc(8)],
                      ] as [number, number, number, number][]
                    ).map(([x1, y1, x2, y2], i) => (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#5B8DEF"
                        strokeWidth="0.5"
                      />
                    ))}
                  </svg>
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                      opacity: 0.12,
                    }}
                  >
                    {[
                      [0.15 * W, 0.7 * H, sc(14)],
                      [0.72 * W, 0.18 * H, sc(10)],
                      [0.5 * W, 0.88 * H, sc(7)],
                      [0.35 * W, 0.25 * H, sc(6)],
                    ].map(([cx, cy, r], i) => {
                      const pts = Array.from(
                        { length: 6 },
                        (_, k) =>
                          `${cx + r * Math.cos((k * Math.PI) / 3)},${cy + r * Math.sin((k * Math.PI) / 3)}`,
                      ).join(" ");
                      return (
                        <polygon
                          key={i}
                          points={pts}
                          fill="none"
                          stroke="#5B8DEF"
                          strokeWidth="0.6"
                        />
                      );
                    })}
                  </svg>
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {[
                      [0.12, 0.45, sc(1)],
                      [0.25, 0.78, sc(0.8)],
                      [0.45, 0.6, sc(1.2)],
                      [0.6, 0.82, sc(0.7)],
                      [0.8, 0.55, sc(1)],
                      [0.9, 0.3, sc(0.8)],
                      [0.18, 0.2, sc(0.6)],
                      [0.52, 0.3, sc(0.8)],
                    ].map(([x, y, r], i) => (
                      <circle
                        key={i}
                        cx={`${x * 100}%`}
                        cy={`${y * 100}%`}
                        r={r}
                        fill="#5B8DEF"
                        opacity="0.35"
                      />
                    ))}
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 5%, rgba(91,141,239,0.5) 30%, rgba(91,141,239,0.95) 50%, rgba(91,141,239,0.5) 70%, transparent 95%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                </>
              )}

              {/* ── CRIMSON ── */}
              {s === "crimson" && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "radial-gradient(ellipse at 35% 0%, rgba(120,40,0,0.15) 0%, transparent 60%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <div style={{ ...xhatch("#B8860B"), zIndex: 2 }} />
                  {/* Watermark uses Watermark component — no CSS transform */}
                  <Watermark
                    fontSize={sc(compact ? 90 : 125)}
                    color="rgba(184,134,11,0.06)"
                    fontFamily="'Playfair Display',serif"
                  >
                    {INITIAL}
                  </Watermark>
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {[
                      [0.08, 0.55, sc(0.8)],
                      [0.2, 0.3, sc(0.6)],
                      [0.35, 0.72, sc(1)],
                      [0.5, 0.18, sc(0.7)],
                      [0.62, 0.65, sc(0.9)],
                      [0.75, 0.4, sc(0.6)],
                      [0.85, 0.75, sc(0.8)],
                      [0.14, 0.85, sc(0.5)],
                      [0.44, 0.9, sc(0.7)],
                      [0.68, 0.12, sc(0.6)],
                    ].map(([x, y, r], i) => (
                      <circle
                        key={i}
                        cx={`${x * 100}%`}
                        cy={`${y * 100}%`}
                        r={r}
                        fill="#B8860B"
                        opacity="0.3"
                      />
                    ))}
                  </svg>
                  <svg
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: sc(60),
                      height: sc(50),
                      opacity: 0.1,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  >
                    <path
                      d={`M${sc(60)},${sc(50)} C${sc(40)},${sc(30)} ${sc(20)},${sc(40)} ${sc(10)},${sc(20)}`}
                      stroke="#B8860B"
                      strokeWidth="0.8"
                      fill="none"
                    />
                    <circle
                      cx={sc(10)}
                      cy={sc(20)}
                      r={sc(2)}
                      fill="#B8860B"
                      opacity="0.8"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: sc(14),
                      bottom: sc(14),
                      right: 0,
                      width: `${sc(2.5)}px`,
                      background:
                        "linear-gradient(180deg, transparent, #B8860B 25%, #B8860B 75%, transparent)",
                      opacity: 0.45,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 10%, rgba(184,134,11,0.45) 40%, rgba(210,165,30,0.8) 50%, rgba(184,134,11,0.45) 60%, transparent 90%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                </>
              )}

              {/* ── SOLAR / EMERALD ── */}
              {s === "solar" && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "55%",
                      height: "65%",
                      background:
                        "radial-gradient(ellipse at 0% 0%, rgba(0,200,150,0.07) 0%, transparent 70%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <div style={{ ...dotGrid("#00C896"), zIndex: 2 }} />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(135deg, rgba(0,200,150,0.05) 0%, transparent 50%, rgba(0,100,75,0.08) 100%)",
                      animation: "emeraldPulse 6s ease-in-out infinite",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 3,
                      opacity: 0.18,
                    }}
                  >
                    <path
                      d={`M${sc(10)},${H * 0.65} L${sc(40)},${H * 0.65} L${sc(40)},${H * 0.45} L${sc(80)},${H * 0.45}`}
                      stroke="#00C896"
                      strokeWidth="0.7"
                      fill="none"
                    />
                    <path
                      d={`M${sc(10)},${H * 0.8} L${sc(25)},${H * 0.8} L${sc(25)},${H * 0.55} L${sc(55)},${H * 0.55}`}
                      stroke="#00C896"
                      strokeWidth="0.5"
                      fill="none"
                    />
                    <circle
                      cx={sc(40)}
                      cy={H * 0.45}
                      r={sc(1.5)}
                      fill="#00C896"
                    />
                    <circle
                      cx={sc(25)}
                      cy={H * 0.55}
                      r={sc(1.2)}
                      fill="#00C896"
                    />
                    <circle
                      cx={sc(80)}
                      cy={H * 0.45}
                      r={sc(1)}
                      fill="#00C896"
                    />
                    {Array.from({ length: 8 }, (_, i) => (
                      <circle
                        key={i}
                        cx={W * 0.6 + i * sc(8)}
                        cy={H * 0.15}
                        r={sc(0.8)}
                        fill="#00C896"
                        opacity={i % 2 === 0 ? 0.6 : 0.3}
                      />
                    ))}
                  </svg>
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {[
                      [0.6, 0.3, sc(3)],
                      [0.72, 0.65, sc(2)],
                      [0.45, 0.85, sc(2.5)],
                      [0.82, 0.2, sc(1.5)],
                      [0.3, 0.5, sc(1.8)],
                    ].map(([x, y, r], i) => (
                      <circle
                        key={i}
                        cx={`${x * 100}%`}
                        cy={`${y * 100}%`}
                        r={r}
                        fill="none"
                        stroke="#00C896"
                        strokeWidth="0.5"
                        opacity="0.25"
                      />
                    ))}
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 5%, rgba(0,200,150,0.5) 30%, rgba(0,230,170,0.95) 50%, rgba(0,200,150,0.5) 70%, transparent 95%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                </>
              )}

              {/* ── DEEP SPACE ── */}
              {s === "deepspace" && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "radial-gradient(circle at 15% 25%, rgba(80,0,200,0.08), transparent 50%), radial-gradient(circle at 80% 75%, rgba(0,80,200,0.06), transparent 50%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {Array.from({ length: 70 }).map((_, i) => (
                      <circle
                        key={i}
                        cx={`${(i * 17.3 + i * i * 0.7) % 100}%`}
                        cy={`${(i * 23.7 + i * i * 0.3) % 100}%`}
                        r={sc(0.35 + (i % 4) * 0.2)}
                        fill="white"
                        opacity={0.15 + (i % 5) * 0.12}
                      >
                        {i % 7 === 0 && (
                          <animate
                            attributeName="opacity"
                            values="0.12;0.85;0.12"
                            dur={`${2 + (i % 3)}s`}
                            repeatCount="indefinite"
                          />
                        )}
                      </circle>
                    ))}
                    <g
                      transform={`translate(${W - sc(55)},${sc(10)})`}
                      opacity="0.38"
                    >
                      {(
                        [
                          [0, 0],
                          [sc(8), sc(5)],
                          [sc(16), sc(2)],
                          [sc(14), sc(14)],
                          [sc(4), sc(12)],
                        ] as [number, number][]
                      ).map(([x, y], i) => (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r={sc(1.2)}
                          fill="white"
                        />
                      ))}
                      {(
                        [
                          [0, 0, sc(8), sc(5)],
                          [sc(8), sc(5), sc(16), sc(2)],
                          [sc(8), sc(5), sc(14), sc(14)],
                          [sc(8), sc(5), sc(4), sc(12)],
                        ] as [number, number, number, number][]
                      ).map(([x1, y1, x2, y2], i) => (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="white"
                          strokeWidth="0.4"
                        />
                      ))}
                    </g>
                    <ellipse
                      cx={W - QR_COL_W / 2}
                      cy={H / 2}
                      rx={sc(20)}
                      ry={sc(16)}
                      fill="none"
                      stroke="rgba(100,148,255,0.1)"
                      strokeWidth="0.5"
                      strokeDasharray={`${sc(3)},${sc(5)}`}
                    />
                    <ellipse
                      cx={W - QR_COL_W / 2}
                      cy={H / 2}
                      rx={sc(32)}
                      ry={sc(24)}
                      fill="none"
                      stroke="rgba(100,148,255,0.06)"
                      strokeWidth="0.5"
                      strokeDasharray={`${sc(2)},${sc(6)}`}
                    />
                  </svg>
                </>
              )}

              {/* ── IVORY / BRONZE ── */}
              {s === "ivory" && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "60%",
                      height: "55%",
                      background:
                        "radial-gradient(ellipse at 0% 0%, rgba(184,115,51,0.08) 0%, transparent 65%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <div style={{ ...brush("#B87333"), zIndex: 2 }} />
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {[
                      [0.12, 0.6, sc(1.2)],
                      [0.28, 0.35, sc(0.8)],
                      [0.42, 0.78, sc(1)],
                      [0.55, 0.22, sc(0.7)],
                      [0.68, 0.6, sc(1)],
                      [0.8, 0.38, sc(0.8)],
                      [0.9, 0.7, sc(0.6)],
                      [0.18, 0.9, sc(0.7)],
                      [0.5, 0.92, sc(0.9)],
                      [0.75, 0.85, sc(0.6)],
                    ].map(([x, y, r], i) => (
                      <circle
                        key={i}
                        cx={`${x * 100}%`}
                        cy={`${y * 100}%`}
                        r={r}
                        fill="#B87333"
                        opacity="0.28"
                      />
                    ))}
                  </svg>
                  <svg
                    style={{
                      position: "absolute",
                      bottom: sc(10),
                      right: QR_COL_W + sc(5),
                      width: sc(80),
                      height: sc(40),
                      pointerEvents: "none",
                      zIndex: 3,
                      opacity: 0.14,
                    }}
                  >
                    <path
                      d={`M0,${sc(30)} Q${sc(40)},${sc(10)} ${sc(80)},${sc(25)}`}
                      stroke="#B87333"
                      strokeWidth="0.8"
                      fill="none"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: sc(14),
                      bottom: sc(14),
                      left: 0,
                      width: `${sc(3)}px`,
                      background:
                        "linear-gradient(180deg, transparent, #B87333 25%, #B87333 75%, transparent)",
                      opacity: 0.42,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 5%, rgba(184,115,51,0.45) 30%, rgba(210,140,70,0.9) 50%, rgba(184,115,51,0.45) 70%, transparent 95%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(125deg, rgba(184,115,51,0.04) 0%, transparent 40%, rgba(184,115,51,0.03) 100%)",
                      animation: "copperDrift 7s ease-in-out infinite",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                </>
              )}

              {/* ── NEON / VOID ── */}
              {s === "neon" && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "65%",
                      height: "65%",
                      background:
                        "radial-gradient(ellipse at 0% 0%, rgba(124,131,240,0.09) 0%, transparent 70%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <div style={{ ...sqGrid("#7C83F0"), zIndex: 2 }} />
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {[
                      [0.7, 0.2, sc(1)],
                      [0.78, 0.45, sc(0.8)],
                      [0.65, 0.68, sc(1.2)],
                      [0.85, 0.7, sc(0.7)],
                      [0.6, 0.15, sc(0.6)],
                      [0.9, 0.5, sc(0.9)],
                      [0.55, 0.82, sc(0.8)],
                      [0.4, 0.15, sc(0.6)],
                      [0.2, 0.7, sc(0.7)],
                      [0.12, 0.5, sc(0.5)],
                    ].map(([x, y, r], i) => (
                      <rect
                        key={i}
                        x={`calc(${x * 100}% - ${r}px)`}
                        y={`calc(${y * 100}% - ${r}px)`}
                        width={r * 2}
                        height={r * 2}
                        fill="#7C83F0"
                        opacity="0.25"
                      />
                    ))}
                    {Array.from({ length: 6 }, (_, i) => (
                      <line
                        key={i}
                        x1={`${12 + i * 14}%`}
                        y1="0"
                        x2={`${12 + i * 14}%`}
                        y2="100%"
                        stroke="#7C83F0"
                        strokeWidth="0.3"
                        opacity="0.06"
                      />
                    ))}
                  </svg>
                  <svg
                    style={{
                      position: "absolute",
                      bottom: sc(8),
                      right: sc(8),
                      pointerEvents: "none",
                      zIndex: 3,
                      opacity: 0.22,
                    }}
                  >
                    <rect
                      x="0"
                      y="0"
                      width={sc(20)}
                      height={sc(20)}
                      fill="none"
                      stroke="#7C83F0"
                      strokeWidth="0.5"
                    />
                    <rect
                      x={sc(4)}
                      y={sc(4)}
                      width={sc(12)}
                      height={sc(12)}
                      fill="none"
                      stroke="#7C83F0"
                      strokeWidth="0.5"
                    />
                    <circle
                      cx={sc(10)}
                      cy={sc(10)}
                      r={sc(2)}
                      fill="none"
                      stroke="#7C83F0"
                      strokeWidth="0.5"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 5%, rgba(124,131,240,0.55) 30%, rgba(124,131,240,1) 50%, rgba(124,131,240,0.55) 70%, transparent 95%)",
                      animation: "neonEdge 4s ease-in-out infinite",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 20%, rgba(124,131,240,0.3) 50%, transparent 80%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                </>
              )}

              {/* ── CIRCUIT / ARCTIC ── */}
              {s === "circuit" && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "60%",
                      height: "55%",
                      background:
                        "radial-gradient(ellipse at 100% 0%, rgba(156,184,220,0.08) 0%, transparent 70%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <div style={{ ...hLine("#9CB8DC", 10), zIndex: 2 }} />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(135deg, rgba(156,184,220,0.04) 0%, transparent 50%, rgba(60,100,160,0.05) 100%)",
                      animation: "arcticGlow 7s ease-in-out infinite",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  >
                    {[
                      [W * 0.72, H * 0.25, sc(10)],
                      [W * 0.85, H * 0.65, sc(7)],
                      [W * 0.25, H * 0.75, sc(6)],
                      [W * 0.6, H * 0.85, sc(5)],
                      [W * 0.12, H * 0.4, sc(4)],
                    ].map(([cx, cy, r], i) => (
                      <g key={i}>
                        {Array.from({ length: 6 }, (_, k) => {
                          const a = (k * Math.PI) / 3;
                          return (
                            <line
                              key={k}
                              x1={cx}
                              y1={cy}
                              x2={cx + r * Math.cos(a)}
                              y2={cy + r * Math.sin(a)}
                              stroke="#9CB8DC"
                              strokeWidth="0.5"
                              opacity="0.3"
                            />
                          );
                        })}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r * 0.18}
                          fill="#9CB8DC"
                          opacity="0.4"
                        />
                      </g>
                    ))}
                    {[
                      [0.15, 0.55, sc(0.8)],
                      [0.32, 0.28, sc(0.6)],
                      [0.48, 0.72, sc(1)],
                      [0.62, 0.38, sc(0.7)],
                      [0.88, 0.45, sc(0.8)],
                      [0.2, 0.88, sc(0.6)],
                      [0.78, 0.82, sc(0.7)],
                    ].map(([x, y, r], i) => (
                      <circle
                        key={`p${i}`}
                        cx={`${x * 100}%`}
                        cy={`${y * 100}%`}
                        r={r}
                        fill="#9CB8DC"
                        opacity="0.2"
                      />
                    ))}
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: sc(8),
                      right: QR_COL_W + sc(10),
                      width: sc(10),
                      height: sc(10),
                      borderTop: `${sc(0.5)}px solid rgba(156,184,220,0.4)`,
                      borderRight: `${sc(0.5)}px solid rgba(156,184,220,0.4)`,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: PB + sc(2),
                      left: PH + sc(2),
                      width: sc(10),
                      height: sc(10),
                      borderBottom: `${sc(0.5)}px solid rgba(156,184,220,0.22)`,
                      borderLeft: `${sc(0.5)}px solid rgba(156,184,220,0.22)`,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background:
                        "linear-gradient(90deg, transparent 5%, rgba(156,184,220,0.4) 30%, rgba(200,220,255,0.85) 50%, rgba(156,184,220,0.4) 70%, transparent 95%)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${sc(0.5)}px`,
                      background: "rgba(156,184,220,0.15)",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                </>
              )}

              {/* ══════════════════════════════════════════════════════════
                CONTENT LAYOUT

                ROOT FIX for all alignment issues:
                Use position:absolute + explicit top:0 left:0 width:W height:H
                instead of position:relative + height:H.

                Why: html2canvas re-runs layout on a cloned document. A
                position:relative child inside a position:absolute parent can
                have its % / 'auto' dimensions computed differently in the
                clone, causing the flex column to get the wrong height and
                pushing the CTA out of position.

                position:absolute top:0 left:0 with explicit W/H pixels
                is always resolved correctly, in both browser and html2canvas.
              ══════════════════════════════════════════════════════════ */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: W,
                  height: H,
                  paddingTop: PT,
                  paddingBottom: PB,
                  paddingLeft: PH,
                  paddingRight: PH,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  gap: sc(8),
                  zIndex: 10,
                  ...sm,
                }}
              >
                {/* LEFT COLUMN */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  {/* Org row — flexShrink:0 keeps it from being squeezed */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: sc(6),
                      flexShrink: 0,
                    }}
                  >
                    {card.org_logo_url ? (
                      <img
                        src={card.org_logo_url}
                        alt=""
                        style={{
                          width: fs.icon,
                          height: fs.icon,
                          borderRadius: sc(4),
                          objectFit: "cover",
                          flexShrink: 0,
                          filter:
                            s === "obsidian" || s === "crimson" || s === "ivory"
                              ? "sepia(1) saturate(1.5) brightness(0.8) hue-rotate(20deg)"
                              : undefined,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: fs.icon,
                          height: fs.icon,
                          borderRadius: sc(4),
                          background: `${template.accent}14`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: sc(9),
                          color: template.accent,
                          flexShrink: 0,
                        }}
                      >
                        <GraduationCap size={fs.icon * 0.6} />
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: fs.orgName,
                        color: template.mutedColor,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: `${sc(s === "obsidian" || s === "crimson" || s === "ivory" ? 3.5 : 2.2)}px`,
                        fontFamily: template.font,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {card.org_name || "Institution"}
                    </span>
                  </div>

                  {/* Center block — flex:1 fills remaining space, centering the name */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: fs.name,
                        fontWeight:
                          s === "obsidian" || s === "crimson" || s === "ivory"
                            ? 600
                            : s === "circuit"
                              ? 400
                              : 700,
                        margin: 0,
                        marginBottom: sc(3),
                        lineHeight: 1.15,
                        color: template.textColor,
                        fontFamily: template.font,
                        letterSpacing: `${sc(s === "obsidian" || s === "crimson" || s === "ivory" ? 0.5 : s === "circuit" ? 1 : -0.3)}px`,
                        fontStyle: s === "crimson" ? "italic" : "normal",
                        textShadow:
                          s === "obsidian"
                            ? `0 ${sc(1)}px ${sc(3)}px rgba(0,0,0,0.9)`
                            : s === "aurora"
                              ? `0 0 ${sc(14)}px rgba(91,141,239,0.45),0 ${sc(1)}px ${sc(2)}px rgba(0,0,0,0.7)`
                              : s === "deepspace"
                                ? `0 0 ${sc(14)}px rgba(100,148,255,0.5),0 ${sc(1)}px ${sc(3)}px rgba(0,0,0,0.9)`
                                : s === "neon"
                                  ? `0 0 ${sc(12)}px rgba(124,131,240,0.45)`
                                  : s === "solar"
                                    ? `0 0 ${sc(12)}px rgba(0,200,150,0.35)`
                                    : s === "circuit"
                                      ? `0 0 ${sc(10)}px rgba(156,184,220,0.25)`
                                      : `0 ${sc(1)}px ${sc(4)}px rgba(0,0,0,0.8)`,
                      }}
                    >
                      {card.name || "Student Name"}
                    </h2>
                    <p
                      style={{
                        fontSize: fs.meta,
                        color: template.accent,
                        fontWeight: 400,
                        margin: 0,
                        fontFamily: template.monoFont,
                        letterSpacing: `${sc(0.5)}px`,
                      }}
                    >
                      {card.branch || "Department"} · {YEAR}
                    </p>
                    <div
                      style={{
                        width: sc(compact ? 70 : 90),
                        height: `${sc(0.5)}px`,
                        marginTop: sc(6),
                        background: `linear-gradient(90deg, ${template.accent}CC, ${template.accent}18)`,
                      }}
                    />
                    {tagline && (
                      <p
                        style={{
                          fontSize: fs.tagline,
                          color: template.mutedColor,
                          margin: `${sc(6)}px 0 0`,
                          fontFamily: template.monoFont,
                          fontStyle:
                            s === "crimson" || s === "ivory"
                              ? "italic"
                              : "normal",
                          lineHeight: 1.55,
                          letterSpacing: `${sc(0.2)}px`,
                        }}
                      >
                        {tagline}
                      </p>
                    )}
                  </div>

                  {/* CTA removed — not needed on exported card */}
                </div>

                {/* DIVIDER */}
                <div
                  style={{
                    width: `${sc(0.5)}px`,
                    background: `linear-gradient(180deg, transparent 8%, ${sep} 30%, ${sep} 70%, transparent 92%)`,
                    flexShrink: 0,
                    alignSelf: "stretch",
                  }}
                />

                {/* RIGHT: QR centered */}
                <div
                  style={{
                    width: QR_COL_W,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: sc(5),
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: QR_BOX,
                      height: QR_BOX,
                      borderRadius: sc(8),
                      background: "#ffffff",
                      boxShadow: `0 ${sc(2)}px ${sc(10)}px rgba(0,0,0,0.4),0 0 0 ${sc(0.5)}px rgba(0,0,0,0.12)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      padding: sc(4),
                      boxSizing: "border-box",
                      flexShrink: 0,
                    }}
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                          imageRendering: "pixelated",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#f5f5f5",
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: sc(compact ? 5 : 5.5),
                      color: template.mutedColor,
                      fontFamily: template.monoFont,
                      textTransform: "uppercase",
                      letterSpacing: `${sc(0.8)}px`,
                      textAlign: "center",
                      lineHeight: 1.3,
                      flexShrink: 0,
                    }}
                  >
                    SCAN
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ BACK FACE ═══════════════════ */}
          {renderMode !== "front" && (
            <div
              className="pcard-face"
              style={{
                ...faceBase,
                transform:
                  renderMode === "full"
                    ? "rotateY(180deg) translateZ(1px)"
                    : "translateZ(0)",
                backfaceVisibility:
                  renderMode === "full" ? "hidden" : "visible",
                WebkitBackfaceVisibility:
                  renderMode === "full" ? "hidden" : ("visible" as any),
                background:
                  card.card_back_image_url || card.back_image_url
                    ? `url(${card.card_back_image_url || card.back_image_url}) center/cover no-repeat`
                    : cardBg(),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                  background:
                    card.card_back_image_url || card.back_image_url
                      ? "radial-gradient(circle, transparent 25%, rgba(0,0,0,0.5) 100%)"
                      : "none",
                }}
              />
              {/* Back content — same absolute positioning fix */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: W,
                  height: H,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: PT,
                  paddingBottom: PB,
                  paddingLeft: PH,
                  paddingRight: PH,
                  boxSizing: "border-box",
                  textAlign: "center",
                  zIndex: 2,
                  ...sm,
                }}
              >
                {!(card.card_back_image_url || card.back_image_url) && (
                  <>
                    <div
                      style={{
                        fontSize: sc(36),
                        marginBottom: sc(8),
                        opacity: 0.45,
                      }}
                    >
                      📸
                    </div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.42)",
                        fontSize: sc(11),
                        fontWeight: 500,
                        fontFamily: template.font,
                        margin: 0,
                      }}
                    >
                      Class Photo
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        fontSize: sc(9),
                        marginTop: sc(4),
                        fontFamily: template.monoFont,
                      }}
                    >
                      Uploaded by your admin
                    </p>
                  </>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: PB,
                    left: PH,
                    right: PH,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: sc(7),
                      color: template.mutedColor,
                      fontFamily: template.monoFont,
                      fontWeight: 500,
                      letterSpacing: `${sc(0.5)}px`,
                      textTransform: "uppercase",
                    }}
                  >
                    {card.org_name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {interactive && (
        <button
          onClick={flip}
          style={{
            padding: `${sc(7)}px ${sc(18)}px`,
            borderRadius: sc(20),
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-secondary)",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCcw size={13} /> {isFlipped ? "Show Front" : "Flip Card"}
        </button>
      )}
    </div>
  );
}
