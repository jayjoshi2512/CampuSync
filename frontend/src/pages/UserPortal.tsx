// frontend/src/pages/UserPortal.tsx
// Required: npm install qrcode @types/qrcode jspdf docx html2canvas
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import CardViewer, { TEMPLATES, CardData } from "@/components/CardViewer";
import MemoryWall from "@/components/MemoryWall";
import MemoryUploader from "@/components/MemoryUploader";
import MemoryLightbox from "@/components/MemoryLightbox";
import NotificationBell from "@/components/NotificationBell";
import Directory from "@/components/Directory";
import EventsTab from "@/components/EventsTab";
import JobsTab from "@/components/JobsTab";
import MentorsTab from "@/components/MentorsTab";
import OrgThemeProvider from "@/components/OrgThemeProvider";
import { useAuthStore } from "@/store/authStore";
import { useMemories } from "@/hooks/useMemories";
import { useToast } from "@/components/ToastProvider";
import api from "@/utils/api";
import html2canvas from "html2canvas";
import {
  CreditCard,
  Image,
  User,
  LogOut,
  Download,
  Share2,
  Plus,
  X,
  Check,
  Loader2,
  FileImage,
  FileType2,
  FileText,
  Users,
  Calendar,
  Briefcase,
  HeartHandshake,
  Edit2
} from "lucide-react";
import InlineEditField from '@/components/InlineEditField';

const CARD_BASE_W = 360;
const CARD_BASE_H = Math.round(CARD_BASE_W / 1.5852);
const DISPLAY_SCALE = 1.35;
const EXPORT_SCALE = 3;

const TABS = [
  { key: "card", label: "My Card", icon: CreditCard },
  { key: "memories", label: "Memories", icon: Image },
  { key: "directory", label: "Directory", icon: Users },
  { key: "events", label: "Events", icon: Calendar },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "mentors", label: "Mentorship", icon: HeartHandshake },
  { key: "profile", label: "Profile", icon: User },
];

type ExportFormat = "png" | "jpg" | "pdf" | "docx";
type ExportSide = "front" | "back" | "both";
type ExportQuality = "standard" | "premium";

const FORMAT_META: Record<
  ExportFormat,
  { label: string; icon: React.ReactNode; desc: string }
> = {
  png: {
    label: "PNG",
    icon: <FileImage size={18} />,
    desc: "Lossless transparency · Best for digital use",
  },
  jpg: {
    label: "JPG",
    icon: <FileImage size={18} />,
    desc: "Compressed · Smallest file size",
  },
  pdf: {
    label: "PDF",
    icon: <FileText size={18} />,
    desc: "Print-ready document · CR80 or A4 branded layout",
  },
  docx: {
    label: "DOCX",
    icon: <FileType2 size={18} />,
    desc: "Word document · Fits A4 with student details table",
  },
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Capture a DOM element with html2canvas.
 * KEY FIX: before capturing, traverse all ancestors and temporarily make any
 * `opacity:0` / `visibility:hidden` parents fully visible. CSS opacity on a parent
 * bleeds down to children even in html2canvas — this is the root cause of blank exports.
 */
async function captureNode(
  el: HTMLElement,
  scale = 2,
): Promise<HTMLCanvasElement> {
  type SavedStyle = {
    node: HTMLElement;
    opacity: string;
    visibility: string;
    left: string;
  };
  const saved: SavedStyle[] = [];

  // Walk up the DOM tree and collect any hiding ancestors
  let cur: HTMLElement | null = el.parentElement;
  while (cur && cur !== document.body) {
    const cs = getComputedStyle(cur);
    const needsFix =
      parseFloat(cs.opacity) < 1 ||
      cs.visibility === "hidden" ||
      parseInt(cs.left || "0") < -1000;

    if (needsFix) {
      saved.push({
        node: cur,
        opacity: cur.style.opacity,
        visibility: cur.style.visibility,
        left: cur.style.left,
      });
      cur.style.opacity = "1";
      cur.style.visibility = "visible";
      if (parseInt(cs.left || "0") < -1000) cur.style.left = "0px";
    }
    cur = cur.parentElement;
  }

  // Also ensure the element itself is visible
  saved.push({
    node: el,
    opacity: el.style.opacity,
    visibility: el.style.visibility,
    left: el.style.left,
  });
  el.style.opacity = "1";
  el.style.visibility = "visible";

  // Two rAF cycles to let the browser repaint before capture
  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r())),
  );

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      backgroundColor: null,
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 20_000,
    });
  } finally {
    // Restore all ancestors to their original state
    for (const { node, opacity, visibility, left } of saved) {
      node.style.opacity = opacity;
      node.style.visibility = visibility;
      node.style.left = left;
    }
  }
  return canvas;
}

function downloadDataURL(dataUrl: string, filename: string) {
  const a = Object.assign(document.createElement("a"), {
    href: dataUrl,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

// ── DownloadModal ─────────────────────────────────────────────────────────────
function DownloadModal({
  cardData,
  userName,
  onClose,
}: {
  cardData: CardData;
  userName: string;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [side, setSide] = useState<ExportSide>("both");
  const [quality, setQuality] = useState<ExportQuality>("premium");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState("");
  const { toast } = useToast();
  const slug = userName.replace(/\s+/g, "-").toLowerCase() || "card";

  const getDataUrls = async (): Promise<{ front?: string; back?: string }> => {
    const frontEl = document.getElementById("pcard-export-front");
    const backEl = document.getElementById("pcard-export-back");
    const result: { front?: string; back?: string } = {};
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const q = format === "jpg" ? 0.95 : 1.0;
    const captureScale = quality === "premium" ? 2 : 1.5;

    if (side !== "back" && frontEl) {
      setProgress("Rendering front…");
      result.front = (await captureNode(frontEl, captureScale)).toDataURL(
        mime,
        q,
      );
    }
    if (side !== "front" && backEl) {
      setProgress("Rendering back…");
      result.back = (await captureNode(backEl, captureScale)).toDataURL(
        mime,
        q,
      );
    }
    return result;
  };

  const handleDownload = async () => {
    setStatus("working");
    try {
      if (format === "png" || format === "jpg") {
        const urls = await getDataUrls();
        if (urls.front) {
          downloadDataURL(urls.front, `${slug}-front.${format}`);
          await delay(400);
        }
        if (urls.back) {
          downloadDataURL(urls.back, `${slug}-back.${format}`);
        }
      } else if (format === "pdf") {
        const mod = await import("jspdf");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const JsPDF = (mod as any).jsPDF ?? (mod as any).default;
        const urls = await getDataUrls();

        if (quality === "premium") {
          const pdf = new JsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
          });
          const A4W = 210,
            A4H = 297,
            CW = 85.6,
            CH = 54,
            cx = (A4W - CW) / 2;

          const drawCard = (dataUrl: string, label: string, yPos: number) => {
            pdf.setFillColor(240, 240, 240);
            pdf.roundedRect(cx - 2, yPos - 2, CW + 4, CH + 4, 2, 2, "F");
            pdf.addImage(dataUrl, "PNG", cx, yPos, CW, CH);
            pdf.setTextColor(160, 160, 160);
            pdf.setFontSize(6);
            pdf.setFont("helvetica", "normal");
            pdf.text(label.toUpperCase(), A4W / 2, yPos + CH + 5, {
              align: "center",
              charSpace: 1.5,
            });
          };

          pdf.setFillColor(8, 8, 8);
          pdf.rect(0, 0, A4W, 18, "F");
          pdf.setTextColor(200, 168, 76);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.text(
            (cardData.org_name || "Institution").toUpperCase(),
            A4W / 2,
            11,
            { align: "center", charSpace: 2 },
          );

          const hasBoth = !!(urls.front && urls.back);
          if (hasBoth) {
            drawCard(urls.front!, "Front", 28);
            pdf.setDrawColor(230, 230, 230);
            pdf.line(20, 28 + CH + 10, A4W - 20, 28 + CH + 10);
            drawCard(urls.back!, "Back", 28 + CH + 16);
          } else if (urls.front) {
            drawCard(urls.front, "Front", (A4H - CH) / 2 - 10);
          } else if (urls.back) {
            drawCard(urls.back, "Back", (A4H - CH) / 2 - 10);
          }

          const detailY = hasBoth ? 28 + CH * 2 + 28 : (A4H - CH) / 2 + CH + 14;
          const details = [
            cardData.name,
            cardData.branch
              ? `${cardData.branch}${cardData.batch_year ? " · " + cardData.batch_year : ""}`
              : null,
            cardData.roll_number ? `Roll No. ${cardData.roll_number}` : null,
          ].filter(Boolean) as string[];
          if (detailY < A4H - 20) {
            details.forEach((d, i) => {
              pdf.setFontSize(i === 0 ? 10 : 7.5);
              pdf.setFont("helvetica", i === 0 ? "bold" : "normal");
              pdf.setTextColor(
                i === 0 ? 30 : 100,
                i === 0 ? 30 : 100,
                i === 0 ? 30 : 100,
              );
              pdf.text(d, A4W / 2, detailY + i * 6, { align: "center" });
            });
          }
          pdf.setFillColor(8, 8, 8);
          pdf.rect(0, A4H - 8, A4W, 8, "F");
          pdf.setTextColor(80, 80, 80);
          pdf.setFontSize(5);
          pdf.text("Generated by Phygital", A4W / 2, A4H - 2.5, {
            align: "center",
          });
          setProgress("Saving PDF…");
          pdf.save(`${slug}-premium.pdf`);
        } else {
          const saveSide = async (dataUrl: string, label: string) => {
            const pdf2 = new JsPDF({
              orientation: "landscape",
              unit: "mm",
              format: [85.6, 54],
            });
            pdf2.addImage(dataUrl, "PNG", 0, 0, 85.6, 54);
            pdf2.save(`${slug}-${label}-standard.pdf`);
            await delay(400);
          };
          if (urls.front) await saveSide(urls.front, "front");
          if (urls.back) await saveSide(urls.back, "back");
        }
      } else if (format === "docx") {
        const {
          Document,
          Packer,
          Paragraph,
          ImageRun,
          AlignmentType,
          TextRun,
          TableRow,
          Table,
          TableCell,
          WidthType,
          BorderStyle,
        } = await import("docx");
        const urls = await getDataUrls();
        const toBuffer = async (url: string) =>
          (await fetch(url)).arrayBuffer();

        // FIX: typed as any[] to avoid 'children: never[]' TS inference error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const children: any[] = [];
        const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
        const sepBorder = {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "EEEEEE",
        };
        const IMG_W = 540,
          IMG_H = Math.round(540 / 1.5852);

        if (quality === "premium") {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: (cardData.org_name || "Institution").toUpperCase(),
                  bold: true,
                  size: 24,
                  color: "1A1A1A",
                  characterSpacing: 80,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "─".repeat(48),
                  color: "DDDDDD",
                  size: 12,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
          );
        }
        if (urls.front) {
          const buf = await toBuffer(urls.front);
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "FRONT",
                  size: 14,
                  color: "999999",
                  characterSpacing: 80,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: buf,
                  transformation: { width: IMG_W, height: IMG_H },
                  type: "png",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 320 },
            }),
          );
        }
        if (urls.back) {
          const buf = await toBuffer(urls.back);
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "BACK",
                  size: 14,
                  color: "999999",
                  characterSpacing: 80,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: buf,
                  transformation: { width: IMG_W, height: IMG_H },
                  type: "png",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: quality === "premium" ? 480 : 200 },
            }),
          );
        }
        if (quality === "premium") {
          const rows = [
            ["Student Name", cardData.name || "—"],
            ["Branch", cardData.branch || "—"],
            ["Batch Year", String(cardData.batch_year || "—")],
            ["Roll Number", cardData.roll_number || "—"],
            ["Institution", cardData.org_name || "—"],
          ];
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "STUDENT DETAILS",
                  bold: true,
                  size: 18,
                  color: "333333",
                  characterSpacing: 60,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
            }),
            new Table({
              width: { size: 70, type: WidthType.PERCENTAGE },
              rows: rows.map(
                ([label, value]) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: label,
                                bold: true,
                                size: 18,
                                color: "555555",
                              }),
                            ],
                          }),
                        ],
                        width: { size: 38, type: WidthType.PERCENTAGE },
                        borders: {
                          top: noBorder,
                          bottom: sepBorder,
                          left: noBorder,
                          right: noBorder,
                        },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: value,
                                size: 18,
                                color: "111111",
                              }),
                            ],
                          }),
                        ],
                        borders: {
                          top: noBorder,
                          bottom: sepBorder,
                          left: noBorder,
                          right: noBorder,
                        },
                      }),
                    ],
                  }),
              ),
            }),
          );
        }
        const doc = new Document({
          sections: [
            {
              properties: {
                page: {
                  margin: { top: 900, right: 900, bottom: 900, left: 900 },
                },
              },
              children,
            },
          ],
        });
        setProgress("Building document…");
        downloadBlob(
          await Packer.toBlob(doc),
          `${slug}-card${quality === "premium" ? "-premium" : ""}.docx`,
        );
      }

      setStatus("done");
      toast(`Downloaded as ${format.toUpperCase()}!`, "success");
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error("Export error:", err);
      setStatus("error");
      toast(`Export failed: ${(err as Error).message}`, "error");
    }
  };

  const fmtColor: Record<ExportFormat, string> = {
    png: "#5B8DEF",
    jpg: "#00C896",
    pdf: "#E05A5A",
    docx: "#7C83F0",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Export Card
            </h2>
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                margin: "2px 0 0",
              }}
            >
              Choose format · side · quality
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "var(--color-bg-tertiary)",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--color-text-muted)",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--color-text-muted)",
              marginBottom: 10,
              marginTop: 0,
            }}
          >
            Format
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {(
              Object.entries(FORMAT_META) as [
                ExportFormat,
                (typeof FORMAT_META)[ExportFormat],
              ][]
            ).map(([key, meta]) => {
              const active = format === key;
              return (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 10,
                    border: `1px solid ${active ? fmtColor[key] : "var(--color-border-default)"}`,
                    background: active
                      ? `${fmtColor[key]}12`
                      : "var(--color-bg-tertiary)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s",
                    color: active ? fmtColor[key] : "var(--color-text-muted)",
                  }}
                >
                  {meta.icon}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--color-bg-tertiary)",
              marginBottom: 16,
              borderLeft: `3px solid ${fmtColor[format]}`,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              {FORMAT_META[format].desc}
            </p>
          </div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--color-text-muted)",
              marginBottom: 10,
              marginTop: 0,
            }}
          >
            Side
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["front", "back", "both"] as ExportSide[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setSide(opt)}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${side === opt ? fmtColor[format] : "var(--color-border-default)"}`,
                  background:
                    side === opt
                      ? `${fmtColor[format]}10`
                      : "var(--color-bg-tertiary)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: side === opt ? 600 : 400,
                  color:
                    side === opt
                      ? fmtColor[format]
                      : "var(--color-text-secondary)",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {(format === "pdf" || format === "docx") && (
            <>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--color-text-muted)",
                  marginBottom: 10,
                  marginTop: 0,
                }}
              >
                Quality
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(["standard", "premium"] as ExportQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1px solid ${quality === q ? fmtColor[format] : "var(--color-border-default)"}`,
                      background:
                        quality === q
                          ? `${fmtColor[format]}10`
                          : "var(--color-bg-tertiary)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: quality === q ? 600 : 400,
                      color:
                        quality === q
                          ? fmtColor[format]
                          : "var(--color-text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{ textTransform: "capitalize", marginBottom: 2 }}
                    >
                      {q}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>
                      {q === "standard"
                        ? format === "pdf"
                          ? "CR80 size, bare card"
                          : "Image only"
                        : format === "pdf"
                          ? "A4 branded layout"
                          : "With student details"}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={handleDownload}
            disabled={status === "working"}
            style={{
              width: "100%",
              padding: "13px 20px",
              borderRadius: 10,
              border: "none",
              background:
                status === "done"
                  ? "#22C55E"
                  : status === "error"
                    ? "#EF4444"
                    : fmtColor[format],
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: status === "working" ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
              opacity: status === "working" ? 0.8 : 1,
            }}
          >
            {status === "working" && (
              <>
                <Loader2
                  size={15}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                {progress || "Preparing…"}
              </>
            )}
            {status === "done" && (
              <>
                <Check size={15} /> Downloaded!
              </>
            )}
            {status === "error" && (
              <>
                <X size={15} /> Failed — Try Again
              </>
            )}
            {status === "idle" && (
              <>
                <Download size={15} /> Download {FORMAT_META[format].label}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── MiniCardPreview: faithful CSS replica of each card design ─────────────────
// Uses CSS background-image data URIs matching the actual CardViewer patterns.
// No CardViewer instances = no extra SVG ID risk, fast render.
function MiniCardPreview({
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
  const s = tmpl.style;

  const W = 116,
    H = Math.round(116 / 1.5852); // ~73px

  const bg = (): string => {
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
    return "radial-gradient(ellipse at 20% 0%, #070C14 0%, #020508 70%)";
  };

  // Tiny pattern overlay matching the actual card pattern
  const patternStyle = (): React.CSSProperties => {
    const enc = (svg: string, sz: number) => ({
      backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`,
      backgroundSize: `${sz}px ${sz}px`,
      position: "absolute" as const,
      inset: 0,
      opacity: 0.08,
      pointerEvents: "none" as const,
    });
    if (s === "obsidian")
      return enc(
        `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6"><path d="M3,0 L6,3 L3,6 L0,3 Z" stroke="%23C8A84C" stroke-width="0.5" fill="none"/></svg>`,
        6,
      );
    if (s === "aurora")
      return enc(
        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="4"><line x1="0" y1="2" x2="30" y2="2" stroke="%235B8DEF" stroke-width="0.5"/></svg>`,
        4,
      );
    if (s === "crimson")
      return enc(
        `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" transform="rotate(35)"><line x1="0" y1="0" x2="0" y2="8" stroke="%23B8860B" stroke-width="0.4"/></svg>`,
        8,
      );
    if (s === "solar")
      return enc(
        `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="none" stroke="%2300C896" stroke-width="0.4"/></svg>`,
        12,
      );
    if (s === "neon")
      return enc(
        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><rect width="14" height="14" fill="none" stroke="%237C83F0" stroke-width="0.4"/></svg>`,
        14,
      );
    if (s === "circuit")
      return enc(
        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="4"><line x1="0" y1="2" x2="30" y2="2" stroke="%239CB8DC" stroke-width="0.3"/></svg>`,
        4,
      );
    if (s === "ivory")
      return enc(
        `<svg xmlns="http://www.w3.org/2000/svg" width="3" height="3" transform="rotate(8)"><line x1="0" y1="0" x2="3" y2="0" stroke="%23B87333" stroke-width="0.4"/></svg>`,
        3,
      );
    return {};
  };

  // Side/top accent matching actual card
  const accentBar = (): React.CSSProperties => {
    if (s === "obsidian")
      return {
        position: "absolute",
        top: sc(14, W),
        bottom: sc(14, W),
        left: 0,
        width: 1.5,
        background: `linear-gradient(180deg, transparent, ${tmpl.accent} 25%, ${tmpl.accent} 75%, transparent)`,
        opacity: 0.45,
      };
    if (s === "crimson")
      return {
        position: "absolute",
        top: sc(14, W),
        bottom: sc(14, W),
        right: 0,
        width: 1.2,
        background: `linear-gradient(180deg, transparent, ${tmpl.accent} 25%, ${tmpl.accent} 75%, transparent)`,
        opacity: 0.5,
      };
    if (s === "ivory")
      return {
        position: "absolute",
        top: sc(14, W),
        bottom: sc(14, W),
        left: 0,
        width: 1.5,
        background: `linear-gradient(180deg, transparent, ${tmpl.accent} 25%, ${tmpl.accent} 75%, transparent)`,
        opacity: 0.45,
      };
    return { display: "none" };
  };

  const sc = (n: number, base: number) => Math.round((n / 360) * base);

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
      {/* Card thumbnail */}
      <div
        style={{
          width: W,
          height: H,
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
          border: `2px solid ${active ? tmpl.accent : "rgba(255,255,255,0.06)"}`,
          boxShadow: active
            ? `0 0 0 1px ${tmpl.accent}55,0 4px 20px ${tmpl.accent}35,0 2px 8px rgba(0,0,0,0.6)`
            : "0 2px 8px rgba(0,0,0,0.5)",
          transition: "all 0.18s",
          transform: active ? "translateY(-2px)" : "translateY(0)",
          background: bg(),
        }}
      >
        {/* Pattern overlay */}
        <div style={patternStyle()} />
        {/* Top accent hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1.5,
            background: `linear-gradient(90deg, transparent 5%, ${tmpl.accent}AA 35%, ${tmpl.accent} 50%, ${tmpl.accent}AA 65%, transparent 95%)`,
            zIndex: 2,
          }}
        />
        {/* Side accent bar */}
        <div style={accentBar()} />
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 25% 30%, ${tmpl.accent}18 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
        {/* Org icon */}
        <div
          style={{
            position: "absolute",
            top: 5,
            left: 5,
            width: 11,
            height: 11,
            borderRadius: 2,
            background: `${tmpl.accent}22`,
            border: `0.5px solid ${tmpl.accent}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 6,
          }}
        >
          <svg viewBox="0 0 16 16" width="7" height="7" fill="none" stroke={tmpl.accent} strokeWidth="1.2" strokeLinecap="round">
            <path d="M8 1L14 4V7C14 11 11 14 8 15C5 14 2 11 2 7V4L8 1Z" />
          </svg>
        </div>
        {/* Org name */}
        <div style={{
          position: 'absolute', top: 5, left: 18, fontSize: 4.5,
          color: tmpl.accent, fontFamily: tmpl.monoFont,
          letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: W - 28,
        }}>
          {card.org_name || 'ORG'}
        </div>
        {/* Name */}
        <div style={{ position: "absolute", bottom: 18, left: 6, right: 22 }}>
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: tmpl.textColor,
              fontFamily: tmpl.font,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              WebkitFontSmoothing: "antialiased" as any,
              textShadow: `0 0 8px ${tmpl.accent}55`,
              fontStyle: s === "crimson" ? "italic" : "normal",
            }}
          >
            {card.name || "Student"}
          </div>
          <div
            style={{
              fontSize: 5.5,
              color: tmpl.accent,
              fontFamily: tmpl.monoFont,
              marginTop: 1.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              WebkitFontSmoothing: "antialiased" as any,
            }}
          >
            {card.branch
              ? `${card.branch} · ${card.batch_year || ""}`
              : tmpl.name}
          </div>
        </div>
        {/* Accent divider */}
        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: 6,
            width: 28,
            height: 0.5,
            background: `linear-gradient(90deg, ${tmpl.accent}CC, ${tmpl.accent}22)`,
          }}
        />
        {/* QR placeholder */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: 5,
            transform: "translateY(-50%)",
            width: 18,
            height: 18,
            borderRadius: 2,
            background: "#fff",
            padding: 2,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 0.5,
              height: "100%",
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: [
                    0, 1, 4, 5, 3, 6, 10, 15, 8, 11, 12, 13,
                  ].includes(i)
                    ? "#000"
                    : "#fff",
                  borderRadius: 0.3,
                }}
              />
            ))}
          </div>
        </div>
        {/* Removed CTA button placeholder as requested by user */}
        {/* Active indicator dot */}
        {active && (
          <div
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: tmpl.accent,
              boxShadow: `0 0 6px ${tmpl.accent}`,
            }}
          />
        )}
      </div>
      {/* Name label */}
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

function calculateProfileScore(actor: any): number {
  if (!actor) return 0;
  let score = 40; // Base score for having an account
  if (actor.avatar_url) score += 15;
  if (actor.roll_number) score += 10;
  if (actor.branch) score += 10;
  if (actor.linkedin_url) score += 15;
  if (actor.bio) score += 10;
  // Make sure it maxes at 100
  return Math.min(100, Math.max(0, score));
}

// ── UserPortal ────────────────────────────────────────────────────────────────
export default function UserPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "card";
  const [tab, setTab] = useState(initialTab);
  const [showUploader, setShowUploader] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [localTemplateId, setLocalTemplateId] = useState<string | null>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const actor = useAuthStore((s) => s.actor);
  const isDemo = useAuthStore((s) => s.token?.startsWith("demo_"));
  const { toast } = useToast();
  const { memories, loading, hasMore, fetchMemories, toggleReaction } =
    useMemories(!!isDemo);
  const isMagicLogin = !!searchParams.get("magic");

  useEffect(() => {
    if (
      !isMagicLogin &&
      (useAuthStore.getState().isAuthenticated || isDemo) &&
      tab === "memories"
    )
      fetchMemories(true);
  }, [fetchMemories, isMagicLogin, isDemo, tab]);

  useEffect(() => {
    if (!isMagicLogin && !isDemo && useAuthStore.getState().isAuthenticated) {
      api
        .get("/user/me", { _silent: true } as any)
        .then(({ data }) => {
          const t = useAuthStore.getState().token;
          if (t && data.actor) setAuth(t, data.actor);
        })
        .catch(() => {});
    }
  }, [isMagicLogin, isDemo, setAuth]);

  const verifyAttempted = useRef<string | null>(null);
  useEffect(() => {
    const magicToken = searchParams.get("magic");
    if (magicToken && verifyAttempted.current !== magicToken) {
      verifyAttempted.current = magicToken;
      (async () => {
        try {
          const { data } = await api.get(
            `/user/verify-magic-link/${magicToken}`,
          );
          setAuth(data.token, data.actor);
          const p = new URLSearchParams(searchParams);
          p.delete("magic");
          setSearchParams(p, { replace: true });
          toast("Successfully logged in!", "success");
        } catch (err: any) {
          toast(
            err.response?.data?.error || "Invalid or expired link.",
            "error",
          );
          navigate("/");
        }
      })();
    } else if (
      !isMagicLogin &&
      !useAuthStore.getState().isAuthenticated &&
      !isDemo
    ) {
      navigate("/login");
    }
  }, [
    searchParams,
    setSearchParams,
    setAuth,
    toast,
    navigate,
    isDemo,
    isMagicLogin,
  ]);

  const baseCardData: CardData = {
    name: actor?.name || "User",
    roll_number: actor?.roll_number || "",
    branch: actor?.branch || "",
    batch_year: actor?.batch_year,
    org_name: actor?.organization?.name || "Organization",
    template_id:
      localTemplateId ||
      actor?.organization?.selected_card_template ||
      "tmpl_obsidian",
    card_back_image_url: actor?.organization?.card_back_image_url,
    avatar_url: actor?.avatar_url,
    qr_hash: (actor as any)?.qr_hash, // qr_hash may not be in Actor type yet
  };

  const displayW = Math.round(CARD_BASE_W * DISPLAY_SCALE);
  const displayH = Math.round(CARD_BASE_H * DISPLAY_SCALE);
  const activeTemplateId = baseCardData.template_id || "tmpl_obsidian";
  const activeTmpl = TEMPLATES[activeTemplateId];

  if (isMagicLogin)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg-primary)",
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
          <p style={{ fontSize: 14 }}>Authenticating…</p>
        </div>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <OrgThemeProvider>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:var(--color-border-default); border-radius:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--color-bg-primary)",
          color: "var(--color-text-primary)",
        }}
      >
        {/* ─── Sidebar ─── */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            background: "var(--color-bg-secondary)",
            borderRight: "1px solid var(--color-border-subtle)",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <div
            style={{
              padding: "18px 16px 14px",
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--color-brand), #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "#fff",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {actor?.name?.[0] || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    margin: 0,
                  }}
                >
                  {actor?.name || "User"}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    margin: "2px 0 0",
                  }}
                >
                  {actor?.organization?.name || "Organization"}
                  {isDemo && (
                    <span
                      style={{
                        color: "#F59E0B",
                        marginLeft: 6,
                        fontSize: 9,
                        fontWeight: 600,
                      }}
                    >
                      DEMO
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ThemeToggle />
                <NotificationBell />
              </div>
            </div>
            
            {/* Gamification Widget: Profile Completeness */}
            <div style={{ marginTop: 16, background: 'var(--color-bg-tertiary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Profile Score</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-brand)' }}>{calculateProfileScore(actor)}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--color-border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${calculateProfileScore(actor)}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-brand), #10B981)', borderRadius: 2, transition: 'width 0.5s ease-out' }} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: '6px 0 0', lineHeight: 1.3 }}>
                {calculateProfileScore(actor) === 100 ? 'All-star profile!' : 'Add social links & bio to boost score.'}
              </p>
            </div>
          </div>

          <nav
            style={{
              flex: 1,
              padding: "12px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    background: active
                      ? "var(--color-brand-muted)"
                      : "transparent",
                    color: active
                      ? "var(--color-brand)"
                      : "var(--color-text-muted)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div
            style={{
              padding: "10px 8px 14px",
              borderTop: "1px solid var(--color-border-subtle)",
            }}
          >
            <button
              onClick={() => {
                clearAuth();
                navigate("/");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 11px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: 12,
                width: "100%",
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ─── Main ─── */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {/* ══ CARD TAB: two-column layout ══
              Left: 3D card + actions | Right: template selector panel */}
          {tab === "card" && (
            <div style={{ display: "flex", minHeight: "100%" }}>
              {/* LEFT: card area */}
              <div
                style={{
                  flex: 1,
                  padding: "40px 32px 48px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                {/* Ambient glow + card viewer */}
                <div
                  style={{
                    filter: `drop-shadow(0 0 ${Math.round(52 * DISPLAY_SCALE)}px ${activeTmpl?.accent || "#fff"}26)`,
                  }}
                >
                  <CardViewer
                    card={baseCardData}
                    interactive
                    displayScale={DISPLAY_SCALE}
                  />
                </div>

                {/* Export + Share buttons — directly below the flip button */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => setShowDownload(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "9px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--color-brand)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Download size={14} /> Export Card
                  </button>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "transparent",
                      color: "var(--color-text-secondary)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <Share2 size={14} /> Share
                  </button>
                </div>

                {/* Card info strip */}
                <div
                  style={{
                    width: displayW,
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 10,
                    marginTop: 24,
                  }}
                >
                  {[
                    { label: "Roll No.", value: actor?.roll_number || "—" },
                    { label: "Branch", value: actor?.branch || "—" },
                    { label: "Batch", value: actor?.batch_year || "—" },
                  ].map((f) => (
                    <div
                      key={f.label}
                      style={{
                        padding: "11px 14px",
                        borderRadius: 10,
                        background: "var(--color-bg-secondary)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          color: "var(--color-text-muted)",
                          margin: "0 0 4px",
                        }}
                      >
                        {f.label}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Export nodes — hidden but with opacity trick + ancestor fix in captureNode */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "fixed",
                    left: "-9999px",
                    top: 0,
                    pointerEvents: "none",
                    zIndex: -1,
                  }}
                >
                  <div
                    id="pcard-export-front"
                    style={{ display: "inline-block" }}
                  >
                    <CardViewer
                      card={baseCardData}
                      interactive={false}
                      renderMode="front"
                      displayScale={EXPORT_SCALE}
                    />
                  </div>
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    position: "fixed",
                    left: "-9999px",
                    top: 0,
                    pointerEvents: "none",
                    zIndex: -1,
                  }}
                >
                  <div
                    id="pcard-export-back"
                    style={{ display: "inline-block" }}
                  >
                    <CardViewer
                      card={baseCardData}
                      interactive={false}
                      renderMode="back"
                      displayScale={EXPORT_SCALE}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: template selector panel */}
              <div
                style={{
                  width: 288,
                  flexShrink: 0,
                  borderLeft: "1px solid var(--color-border-subtle)",
                  padding: "28px 20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      color: "var(--color-text-muted)",
                      margin: "0 0 4px",
                    }}
                  >
                    Card Theme
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      margin: "0 0 16px",
                      opacity: 0.65,
                    }}
                  >
                    Select a style for your card
                  </p>
                </div>

                {/* 2-column grid of actual card previews */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  {Object.keys(TEMPLATES).map((id) => (
                    <MiniCardPreview
                      key={id}
                      id={id}
                      card={baseCardData}
                      active={activeTemplateId === id}
                      onClick={() => setLocalTemplateId(id)}
                    />
                  ))}
                </div>

                {/* Active template details */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--color-bg-secondary)",
                    border: `1px solid ${activeTmpl?.accent}30`,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: activeTmpl?.accent,
                        boxShadow: `0 0 8px ${activeTmpl?.accent}`,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        margin: 0,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {activeTmpl?.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MEMORIES ── */}
          {tab === "memories" && (
            <div style={{ padding: "28px 36px" }}>
              {/* Removed Memories Heading */}
              <MemoryWall
                memories={memories}
                loading={loading}
                hasMore={hasMore}
                onLoadMore={fetchMemories}
                onReaction={toggleReaction}
                onClickMemory={(m) => setLightboxIdx(memories.indexOf(m))}
              />
            </div>
          )}

          {tab === "directory" && <Directory />}
          {tab === "events" && <EventsTab />}
          {tab === "jobs" && <JobsTab />}
          {tab === "mentors" && <MentorsTab />}

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div style={{ padding: "28px 36px" }}>
              <div style={{ maxWidth: 540 }}>
                <div
                  style={{
                    padding: 22,
                    borderRadius: 14,
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border-subtle)",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, var(--color-brand), #059669)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {actor?.name?.[0] || "U"}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                        {actor?.name || "User"}
                      </h2>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-muted)",
                          margin: "2px 0 0",
                        }}
                      >
                        {actor?.organization?.name || "Organization"} {actor?.role === 'alumni' ? '· Alumni' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        fontSize: 9,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontWeight: 600,
                        marginBottom: 5,
                        display: "block",
                      }}
                    >
                      Email
                    </label>
                    <div
                      style={{
                        padding: "9px 12px",
                        borderRadius: 8,
                        background: "var(--color-bg-tertiary)",
                        border: "1px solid var(--color-border-default)",
                        fontSize: 13,
                        color: "var(--color-text-muted)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{actor?.email || ""}</span>
                      <span style={{ fontSize: 10, opacity: 0.55 }}>
                        Read-only
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {[
                      {
                        label: "Roll Number",
                        value: actor?.roll_number || "—",
                      },
                      { label: "Branch / Dept", value: actor?.branch || "—" },
                      { label: "Batch Year", value: actor?.batch_year || "—" },
                      {
                        label: "Institution",
                        value: actor?.organization?.name || "—",
                      },
                    ].map((f) => (
                      <div
                        key={f.label}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "var(--color-bg-tertiary)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 9,
                            color: "var(--color-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                            margin: "0 0 3px",
                            fontWeight: 600,
                          }}
                        >
                          {f.label}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                          {f.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline Bio */}
                <div
                  style={{
                    padding: "16px 18px",
                    borderRadius: 14,
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border-subtle)",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--color-text-muted)', margin: '0 0 8px' }}>Bio</p>
                  <InlineEditField
                    fieldKey="bio"
                    currentValue={actor?.bio || ''}
                    placeholder="Write a short bio..."
                    isTextarea
                  />
                </div>

                {/* Inline Social Links */}
                <div
                  style={{
                    padding: "16px 18px",
                    borderRadius: 14,
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border-subtle)",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--color-text-muted)', margin: '0 0 12px' }}>Social Links</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
                      { key: 'github_url', label: 'GitHub', placeholder: 'https://github.com/...' },
                      { key: 'twitter_url', label: 'Twitter / X', placeholder: 'https://x.com/...' },
                      { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                      { key: 'website_url', label: 'Website', placeholder: 'https://yoursite.com' },
                    ].map(s => (
                      <InlineEditField
                        key={s.key}
                        fieldKey={s.key}
                        currentValue={(actor as any)?.[s.key] || ''}
                        placeholder={s.placeholder}
                        label={s.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Setup Password — only shown if user has NOT set a password yet */}
                {!actor?.has_password && (
                <div
                  style={{
                    padding: "16px 18px",
                    borderRadius: 14,
                    border: "1px dashed var(--color-border-default)",
                    background: "var(--color-bg-secondary)",
                  }}
                >
                  <p
                    style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}
                  >
                    Setup Password
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      margin: "0 0 10px",
                    }}
                  >
                    Log in without a magic link by setting up a password.
                  </p>
                  <button
                    onClick={async () => {
                      if (isDemo)
                        return toast("Not available in demo", "error");
                      try {
                        const { data } = await api.post(
                          "/user/request-password-link",
                        );
                        toast(data.message || "Setup link sent!", "success");
                      } catch (err: any) {
                        toast(err.response?.data?.error || "Failed", "error");
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--color-brand)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Request Setup Link
                  </button>
                </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {tab === "memories" && (
        <button
          onClick={() => setShowUploader(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "none",
            background: "var(--color-brand)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 6px 24px rgba(124,127,250,0.45)",
            zIndex: 50,
          }}
        >
          <Plus size={22} />
        </button>
      )}

      <AnimatePresence>
        {showDownload && (
          <DownloadModal
            cardData={baseCardData}
            userName={actor?.name || "card"}
            onClose={() => setShowDownload(false)}
          />
        )}
        {showUploader && (
          <MemoryUploader onClose={() => setShowUploader(false)} />
        )}
      </AnimatePresence>

      {lightboxIdx !== null && memories[lightboxIdx] && (
        <MemoryLightbox
          memory={memories[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={
            lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : undefined
          }
          onNext={
            lightboxIdx < memories.length - 1
              ? () => setLightboxIdx(lightboxIdx + 1)
              : undefined
          }
          onReaction={toggleReaction}
        />
      )}
    </OrgThemeProvider>
  );
}
