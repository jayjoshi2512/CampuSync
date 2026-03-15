// frontend/src/components/CardViewer.tsx
import { useState, useRef, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import QRCode from 'react-qr-code';

// ─── 8 Premium CR80 Card Templates ────────────────────────────────────────────
export const TEMPLATES: Record<string, {
  name: string;
  bg: string;
  accent: string;
  textColor: string;
  mutedColor: string;
  style: string;
  font: string;
  monoFont: string;
}> = {
  tmpl_obsidian: {
    name: 'Obsidian Sovereign',
    bg: '#0A0A0A',
    accent: '#C9A84C',
    textColor: '#FFFFFF',
    mutedColor: '#888888',
    style: 'obsidian',
    font: "'Cormorant Garamond', serif",
    monoFont: "'Optima', 'Cormorant Garamond', serif",
  },
  tmpl_aurora: {
    name: 'Aurora Glass',
    bg: 'rgba(255,255,255,0.06)',
    accent: '#00F5FF',
    textColor: '#FFFFFF',
    mutedColor: 'rgba(255,255,255,0.55)',
    style: 'aurora',
    font: "'DM Sans', sans-serif",
    monoFont: "'DM Mono', monospace",
  },
  tmpl_crimson: {
    name: 'Crimson Chapter',
    bg: '#1C0A0A',
    accent: '#C8A45A',
    textColor: '#F5ECD7',
    mutedColor: 'rgba(245,236,215,0.55)',
    style: 'crimson',
    font: "'Playfair Display', serif",
    monoFont: "'Playfair Display', serif",
  },
  tmpl_solar: {
    name: 'Solar Pulse',
    bg: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)',
    accent: '#1A0A00',
    textColor: '#1A0A00',
    mutedColor: 'rgba(30,12,0,0.55)',
    style: 'solar',
    font: "'DM Sans', sans-serif",
    monoFont: "'DM Sans', sans-serif",
  },
  tmpl_deepspace: {
    name: 'Deep Space',
    bg: '#040810',
    accent: '#6494FF',
    textColor: '#E8F4FF',
    mutedColor: 'rgba(140,200,255,0.55)',
    style: 'deepspace',
    font: "'Clash Display', 'DM Sans', sans-serif",
    monoFont: "'JetBrains Mono', monospace",
  },
  tmpl_ivory: {
    name: 'Ivory Press',
    bg: '#F5F0E8',
    accent: '#1A1814',
    textColor: '#1A1814',
    mutedColor: 'rgba(26,24,20,0.55)',
    style: 'ivory',
    font: "'Cormorant Garamond', serif",
    monoFont: "'Cormorant Garamond', serif",
  },
  tmpl_neon: {
    name: 'Neon Gradient',
    bg: '#08060E',
    accent: '#3A86FF',
    textColor: '#FFFFFF',
    mutedColor: 'rgba(255,255,255,0.4)',
    style: 'neon',
    font: "'Clash Display', 'DM Sans', sans-serif",
    monoFont: "'DM Mono', monospace",
  },
  tmpl_circuit: {
    name: 'Silver Circuit',
    bg: '#B8BCC4',
    accent: '#1A1E26',
    textColor: '#1A1E26',
    mutedColor: 'rgba(26,30,38,0.55)',
    style: 'circuit',
    font: "'DM Mono', monospace",
    monoFont: "'DM Mono', monospace",
  },
};

interface CardData {
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
}

interface CardViewerProps {
  card: CardData;
  interactive?: boolean;
  compact?: boolean;
  renderMode?: 'full' | 'front' | 'back';
}

export default function CardViewer({ card, interactive = true, compact = false, renderMode = 'full' }: CardViewerProps) {
  const templateId = (card.template_id || 'tmpl_obsidian') as keyof typeof TEMPLATES;
  const template = TEMPLATES[templateId] || TEMPLATES.tmpl_obsidian;
  const s = template.style;

  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateY = useSpring(0, { stiffness: 260, damping: 28 });
  const rotateX = useSpring(0, { stiffness: 260, damping: 28 });

  const shimmerBg = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${s === 'obsidian' ? 'rgba(201,168,76,0.2)' : s === 'aurora' ? 'rgba(0,245,255,0.15)' : s === 'neon' ? 'rgba(131,56,236,0.2)' : 'rgba(255,255,255,0.12)'}, transparent 55%)`
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x); mouseY.set(y);
    if (interactive) { rotateY.set((x - 0.5) * 18); rotateX.set((0.5 - y) * 10); }
  }, [isDragging, interactive, mouseX, mouseY, rotateX, rotateY]);

  const handleMouseLeave = () => { if (!isDragging) { rotateY.set(isFlipped ? 180 : 0); rotateX.set(0); } };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
  };
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !interactive) return;
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    rotateY.set((isFlipped ? 180 : 0) + (cx - dragStartX.current) * 0.5);
  };
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const cur = rotateY.get();
    const snap = Math.abs(cur % 360) > 90 ? (isFlipped ? 0 : 180) : (isFlipped ? 180 : 0);
    rotateY.set(snap); setIsFlipped(snap === 180);
  };
  const flip = () => { const n = !isFlipped; rotateY.set(n ? 180 : 0); rotateX.set(0); setIsFlipped(n); };

  // CR80 horizontal: 85.6:54 ≈ 1.585
  const W = compact ? 280 : 360;
  const H = Math.round(W / 1.585);
  const P = compact ? 14 : 16;
  const YEAR = card.batch_year || 2026;
  const INITIAL = card.name?.[0]?.toUpperCase() || '?';
  const TAGLINE = card.tagline || (s === 'deepspace' ? 'Not all who wander are lost. // Some just graduated.' : s === 'circuit' ? 'Engineered to last. // Graduated to build.' : s === 'crimson' ? 'The chapter ends. The story begins.' : '');

  // Card background
  const cardBg = (): string => {
    if (s === 'obsidian' || s === 'ivory') return template.bg;
    if (s === 'crimson') return 'radial-gradient(circle at center, #2A0E0E, #120606)';
    if (s === 'solar') return 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)';
    if (s === 'deepspace') return '#040810';
    if (s === 'circuit') return '#B8BCC4';
    if (s === 'aurora') return 'linear-gradient(145deg, rgba(15,23,42,0.92), rgba(30,41,59,0.75))';
    if (s === 'neon') return 'linear-gradient(135deg, #FF006E22, #8338EC33, #3A86FF33, #06FFB422)';
    return template.bg;
  };

  const faceBase: React.CSSProperties = {
    position: 'absolute', width: '100%', height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: s === 'ivory' ? 8 : compact ? 12 : 16,
    overflow: 'hidden',
    background: cardBg(),
    boxShadow: s === 'ivory'
      ? '0 4px 20px rgba(0,0,0,0.08)'
      : `0 16px 60px rgba(0,0,0,0.5), 0 0 0 1px ${s === 'obsidian' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)'}`,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes auroraShift { 0%,100%{filter:hue-rotate(0deg)} 50%{filter:hue-rotate(60deg)} }
        @keyframes starTwinkle { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
        @keyframes neonPulse { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
      `}</style>

      <div ref={containerRef}
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        onMouseDown={handleDragStart} onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
        style={{ perspective: 1200, width: W, height: H, cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default', userSelect: 'none' }}
      >
        <motion.div style={{
          width: '100%', height: '100%',
          transformStyle: renderMode === 'full' ? 'preserve-3d' : 'flat',
          rotateY: renderMode === 'full' ? rotateY : (renderMode === 'back' ? 180 : 0),
          rotateX: renderMode === 'full' ? rotateX : 0
        }}>

          {/* ═══════════════ FRONT FACE ═══════════════ */}
          {renderMode !== 'back' && (
            <div style={{
              ...faceBase,
              transform: renderMode === 'full' ? 'translateZ(1px)' : 'none',
              backfaceVisibility: renderMode === 'full' ? 'hidden' : 'visible'
            }}>
            {/* Shimmer overlay (all templates) */}
            <motion.div style={{ position: 'absolute', inset: 0, background: shimmerBg, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 5 }} />

            {/* ── Template-specific background layers ── */}

            {/* OBSIDIAN: gold edge lines + foil sheen */}
            {s === 'obsidian' && <>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 1, background: 'linear-gradient(180deg, transparent, #C9A84C55, transparent)' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 1, background: 'linear-gradient(180deg, transparent, #C9A84C55, transparent)' }} />
            </>}

            {/* AURORA: frosted glass + iridescent layer + corner brackets */}
            {s === 'aurora' && <>
              <div style={{ position: 'absolute', inset: 0, background: 'conic-gradient(from 45deg, #00F5FF22, #FF00E522, #00FF8822, #7B2FFF22, #00F5FF22)', animation: 'auroraShift 6s ease infinite', pointerEvents: 'none', zIndex: 1 }} />
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07, pointerEvents: 'none', zIndex: 2 }}>
                <defs><pattern id="cb" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 20H15M25 20H40M20 0V15M20 25V40" stroke="#38BDF8" strokeWidth="0.5" />
                  <circle cx="20" cy="20" r="2.5" stroke="#38BDF8" strokeWidth="0.5" fill="none" />
                </pattern></defs>
                <rect width="100%" height="100%" fill="url(#cb)" />
              </svg>
              {/* Corner brackets */}
              {[[6,6,'top-left'],[6,H-14,'bottom-left'],[W-14,6,'top-right'],[W-14,H-14,'bottom-right']].map(([x,y,key]) => (
                <div key={key as string} style={{ position: 'absolute', left: x as number, top: y as number, width: 8, height: 8, border: '0.5px solid rgba(255,255,255,0.3)',
                  borderRight: key === 'top-left' || key === 'bottom-left' ? 'none' : undefined,
                  borderLeft: key === 'top-right' || key === 'bottom-right' ? 'none' : undefined,
                  borderBottom: key === 'top-left' || key === 'top-right' ? 'none' : undefined,
                  borderTop: key === 'bottom-left' || key === 'bottom-right' ? 'none' : undefined,
                  zIndex: 3, pointerEvents: 'none',
                }} />
              ))}
            </>}

            {/* CRIMSON: warm gradient + deboss pattern + decorative column */}
            {s === 'crimson' && <>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #2A0E0E, #120606)', zIndex: 0, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'3\' stroke=\'%23C8A45A\' stroke-width=\'0.3\' fill=\'none\'/%3E%3C/svg%3E")', opacity: 0.04, pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: 8, bottom: 8, right: 0, width: 4, background: '#C8A45A', opacity: 0.2, zIndex: 2, pointerEvents: 'none' }} />
            </>}

            {/* SOLAR: sun rays + gloss */}
            {s === 'solar' && <>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 60%)', pointerEvents: 'none', zIndex: 1 }} />
              <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '100%', opacity: 0.12, pointerEvents: 'none', zIndex: 2 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={i} x1="100%" y1="100%" x2={`${50 + Math.cos(i * 0.5) * 120}%`} y2={`${50 + Math.sin(i * 0.5) * 120}%`} stroke="#FFD700" strokeWidth="0.5" />
                ))}
              </svg>
            </>}

            {/* DEEP SPACE: star field + nebula */}
            {s === 'deepspace' && <>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 25%, rgba(80,0,200,0.08), transparent 50%), radial-gradient(circle at 80% 75%, rgba(0,80,200,0.06), transparent 50%)', pointerEvents: 'none', zIndex: 1 }} />
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                {Array.from({ length: 60 }).map((_, i) => (
                  <circle key={i} cx={`${(i * 17.3 + i * i * 0.7) % 100}%`} cy={`${(i * 23.7 + i * i * 0.3) % 100}%`} r={0.3 + (i % 4) * 0.2} fill="white" opacity={0.15 + (i % 5) * 0.12}>
                    {i % 7 === 0 && <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2 + i % 3}s`} repeatCount="indefinite" />}
                  </circle>
                ))}
                {/* Constellation */}
                <g transform={`translate(${W - 36}, 10)`} opacity="0.3">
                  <circle cx="0" cy="0" r="1" fill="white" /><circle cx="6" cy="4" r="1" fill="white" />
                  <circle cx="12" cy="2" r="1" fill="white" /><circle cx="10" cy="10" r="1" fill="white" />
                  <line x1="0" y1="0" x2="6" y2="4" stroke="white" strokeWidth="0.3" />
                  <line x1="6" y1="4" x2="12" y2="2" stroke="white" strokeWidth="0.3" />
                  <line x1="6" y1="4" x2="10" y2="10" stroke="white" strokeWidth="0.3" />
                </g>
                {/* Orbital ring around QR area */}
                <ellipse cx={W - 28} cy={H - 28} rx="28" ry="22" fill="none" stroke="rgba(100,148,255,0.12)" strokeWidth="0.5" strokeDasharray="3,4" />
              </svg>
            </>}

            {/* IVORY: paper grain + hairline rule */}
            {s === 'ivory' && <>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23F5F0E8\'/%3E%3Crect x=\'0\' y=\'0\' width=\'2\' height=\'2\' fill=\'%23EDE8DF\' opacity=\'0.3\'/%3E%3C/svg%3E")', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, height: 0.5, background: 'rgba(26,24,20,0.12)', zIndex: 2, pointerEvents: 'none' }} />
            </>}

            {/* NEON: vivid gradient wash */}
            {s === 'neon' && <>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,0,110,0.35), rgba(131,56,236,0.35), rgba(58,134,255,0.35), rgba(6,255,180,0.25))', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'conic-gradient(from 0deg, rgba(255,0,110,0.1), rgba(131,56,236,0.1), rgba(58,134,255,0.1), rgba(255,0,110,0.1))', animation: 'neonPulse 3s ease infinite', pointerEvents: 'none', zIndex: 2 }} />
            </>}

            {/* CIRCUIT: brushed metal + PCB traces */}
            {s === 'circuit' && <>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 60%)', pointerEvents: 'none', zIndex: 2 }} />
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '40%', height: '50%', opacity: 0.05, pointerEvents: 'none', zIndex: 3 }}>
                <path d="M0,100 L30,100 L30,70 L60,70 L60,40 L90,40 M30,70 L30,30 L50,30" stroke="#1A1E26" strokeWidth="1" fill="none" />
                <circle cx="30" cy="70" r="3" stroke="#1A1E26" strokeWidth="0.5" fill="none" />
                <circle cx="60" cy="40" r="3" stroke="#1A1E26" strokeWidth="0.5" fill="none" />
              </svg>
            </>}

            {/* ── Content Layer ── */}
            <div style={{ position: 'relative', zIndex: 10, padding: P, height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

              {/* Top row: logo/name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {card.org_logo_url ? (
                    <img src={card.org_logo_url} alt="" style={{ width: 22, height: 22, borderRadius: s === 'ivory' ? 2 : 4, objectFit: 'cover', filter: s === 'obsidian' ? 'sepia(1) saturate(3) brightness(0.9) hue-rotate(10deg)' : undefined }} />
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: s === 'ivory' ? 2 : 4, background: s === 'obsidian' ? '#C9A84C22' : s === 'ivory' ? '#1A181408' : `${template.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: template.accent }}>
                      🎓
                    </div>
                  )}
                  <span style={{
                    fontSize: compact ? 6.5 : 7.5, color: s === 'obsidian' ? '#C9A84C' : template.mutedColor,
                    fontWeight: s === 'ivory' ? 400 : 600, textTransform: 'uppercase',
                    letterSpacing: s === 'crimson' || s === 'obsidian' ? '0.25em' : '0.15em',
                    fontFamily: template.font,
                  }}>
                    {card.org_name || 'Institution'}
                  </span>
                </div>
              </div>

              {/* CRIMSON: watermark initial */}
              {s === 'crimson' && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: compact ? 80 : 110, fontWeight: 700, color: 'rgba(200,164,90,0.07)', fontFamily: "'Playfair Display', serif", pointerEvents: 'none', zIndex: 0 }}>
                  {INITIAL}
                </div>
              )}

              {/* Center: name + details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <h2 style={{
                  fontSize: compact ? 16 : s === 'ivory' ? 22 : 20,
                  fontWeight: s === 'ivory' ? 700 : s === 'crimson' ? 600 : 800,
                  margin: 0, marginBottom: 3, lineHeight: 1.2,
                  color: s === 'obsidian' ? '#FFFFFF' : template.textColor,
                  fontFamily: template.font,
                  letterSpacing: s === 'obsidian' ? 0 : -0.3,
                  textShadow: s === 'aurora' ? '0 0 20px rgba(0,245,255,0.5)' : s === 'neon' ? '0 0 30px rgba(58,134,255,0.4)' : 'none',
                  filter: s === 'ivory' ? 'drop-shadow(0 0.5px 0 rgba(200,190,170,1))' : 'none',
                }}>
                  {card.name || 'Student Name'}
                </h2>
                <p style={{ fontSize: compact ? 8.5 : 9, color: s === 'obsidian' ? '#888' : s === 'crimson' ? '#C8A45A' : template.accent, fontWeight: 500, margin: 0, fontFamily: template.monoFont, fontStyle: s === 'crimson' ? 'italic' : 'normal' }}>
                  {card.branch || 'Department'} · {YEAR}
                </p>
                <div style={{ width: s === 'ivory' ? '100%' : compact ? 80 : 100, height: s === 'crimson' ? 0.5 : s === 'solar' ? 2 : 1, marginTop: 6, background: s === 'ivory' ? 'rgba(26,24,20,0.12)' : s === 'obsidian' ? '#C9A84C' : s === 'crimson' ? '#C8A45A' : `${template.accent}44` }} />

                {/* Tagline (if applicable) */}
                {TAGLINE && (
                  <p style={{ fontSize: compact ? 6.5 : 7.5, color: template.mutedColor, marginTop: 6, fontFamily: template.monoFont, fontStyle: s === 'crimson' ? 'italic' : 'normal', lineHeight: 1.5, maxWidth: '70%' }}>
                    {TAGLINE}
                  </p>
                )}

                {/* VARSITY-style year for Solar */}
                {s === 'solar' && (
                  <div style={{ position: 'absolute', right: 0, bottom: 0, fontSize: compact ? 36 : 48, fontWeight: 900, color: 'rgba(30,12,0,0.08)', fontFamily: template.font, lineHeight: 1 }}>
                    {YEAR}
                  </div>
                )}
              </div>

              {/* Bottom row: CTA + QR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  {/* CTA */}
                  {s === 'obsidian' || s === 'solar' ? (
                    <div style={{
                      display: 'inline-block', padding: `${compact ? 3 : 4}px ${compact ? 8 : 12}px`,
                      border: `0.5px solid ${s === 'obsidian' ? '#C9A84C' : 'rgba(30,12,0,0.3)'}`,
                      borderRadius: 10, background: s === 'solar' ? 'rgba(255,255,255,0.18)' : 'transparent',
                    }}>
                      <span style={{ fontSize: compact ? 5.5 : 6.5, color: s === 'obsidian' ? '#C9A84C' : '#1A0A00', fontFamily: template.monoFont, fontWeight: 500 }}>
                        {s === 'obsidian' ? 'View Memories' : 'Open Memories'}
                      </span>
                    </div>
                  ) : s === 'neon' ? (
                    <div style={{
                      display: 'inline-block', padding: `${compact ? 3 : 4}px ${compact ? 8 : 12}px`,
                      border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                      backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.06)',
                    }}>
                      <span style={{ fontSize: compact ? 5.5 : 6.5, color: '#fff', fontFamily: template.font, fontWeight: 600 }}>See Memories</span>
                    </div>
                  ) : (
                    <span style={{
                      fontSize: compact ? 6 : 7,
                      color: s === 'aurora' ? 'rgba(0,245,255,0.8)' : s === 'crimson' ? '#C8A45A' : s === 'circuit' ? 'rgba(26,30,38,0.65)' : template.mutedColor,
                      fontFamily: template.monoFont,
                      fontStyle: s === 'crimson' ? 'italic' : 'normal',
                    }}>
                  {s === 'aurora' ? 'View Memories →' : s === 'crimson' ? 'Read the Story →' : s === 'deepspace' ? 'Launch Portal →' : s === 'ivory' ? 'View Memories' : s === 'circuit' ? 'Access Memories >' : 'View Memories →'}
                    </span>
                  )}
                </div>

                {/* QR code area — actual functional QR */}
                <div style={{
                  width: compact ? 38 : 46, height: compact ? 38 : 46, borderRadius: 6,
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  <QRCode
                    value={card.qr_hash ? `${window.location.origin}/api/user/qr-login/${card.qr_hash}` : `${window.location.origin}/portal?user=${card.name}`}
                    size={compact ? 30 : 38}
                    level="L"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>
              </div>
            </div>
          )}

          {/* ═══════════════ BACK FACE ═══════════════ */}
          {renderMode !== 'front' && (
            <div style={{
              ...faceBase,
              transform: renderMode === 'full' ? 'rotateY(180deg)' : 'none',
              backfaceVisibility: renderMode === 'full' ? 'hidden' : 'visible',
              background: (card.card_back_image_url || card.back_image_url)
                ? `url(${card.card_back_image_url || card.back_image_url}) center/cover`
              : s === 'ivory' ? '#F5F0E8'
              : s === 'solar' ? 'linear-gradient(315deg, #FFD700 0%, #FF8C00 100%)'
              : s === 'circuit' ? '#B8BCC4'
              : 'linear-gradient(145deg, #0a0a0a, #1a1a2e)',
          }}>
            {/* Vignette / overlay */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: card.card_back_image_url || card.back_image_url
                ? (s === 'crimson' ? 'radial-gradient(circle, rgba(200,140,80,0.1) 30%, rgba(28,10,10,0.55) 100%)' : 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.55) 100%)')
                : 'none',
            }} />

              <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: P, textAlign: 'center' }}>
              {!(card.card_back_image_url || card.back_image_url) && (
                <>
                  <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.6 }}>📸</div>
                  <p style={{ color: s === 'ivory' ? '#5D3A1A' : s === 'solar' ? '#1A0A00' : s === 'circuit' ? '#1A1E26' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, fontFamily: template.font }}>Class Photo</p>
                  <p style={{ color: s === 'ivory' ? '#8B7355' : s === 'solar' ? 'rgba(30,12,0,0.5)' : s === 'circuit' ? 'rgba(26,30,38,0.5)' : 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4, fontFamily: template.monoFont }}>Uploaded by your admin</p>
                </>
              )}

              <div style={{ position: 'absolute', bottom: P, left: P, right: P, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 8, color: s === 'ivory' ? 'rgba(26,24,20,0.5)' : s === 'solar' ? 'rgba(30,12,0,0.45)' : s === 'circuit' ? 'rgba(26,30,38,0.45)' : 'rgba(255,255,255,0.35)', fontFamily: template.monoFont, fontWeight: 600 }}>{card.org_name}</span>
              </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>

      {interactive && (
        <button onClick={flip} style={{
          padding: '8px 20px', borderRadius: 20,
          border: '1px solid var(--color-border-default)',
          background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)',
          fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s',
        }}>
          🔄 {isFlipped ? 'Show Front' : 'Flip Card'}
        </button>
      )}
    </div>
  );
}
