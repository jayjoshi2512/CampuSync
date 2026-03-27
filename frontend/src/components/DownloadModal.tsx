import React, { useState } from "react";
import { motion } from "framer-motion";
import { CardData } from "@/components/CardViewer";
import { useToast } from "@/components/ToastProvider";
import html2canvas from "html2canvas";
import { FileImage, FileType2, FileText, X, Loader2, Check, Download } from "lucide-react";
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
          pdf.text("Generated by NexUs", A4W / 2, A4H - 2.5, {
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
      className="fixed inset-0 bg-[rgba(0,0,0,0.75)] backdrop-blur-[8px] flex items-center justify-center z-[1000] p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="w-full max-w-[520px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden"
      >
        <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <div>
            <h2 className="m-0 text-[16px] font-bold text-[var(--color-text-primary)]">
              Export Card
            </h2>
            <p className="m-0 mt-0.5 text-[11px] text-[var(--color-text-muted)]">
              Choose format · side · quality
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border-none bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer text-[var(--color-text-muted)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="m-0 mb-2.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
            Format
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
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
                  className="p-3 rounded-[10px] cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-150"
                  style={{
                    border: `1px solid ${active ? fmtColor[key] : "var(--color-border-default)"}`,
                    background: active ? `${fmtColor[key]}12` : "var(--color-bg-tertiary)",
                    color: active ? fmtColor[key] : "var(--color-text-muted)",
                  }}
                >
                  {meta.icon}
                  <span className="text-[11px] font-semibold tracking-wide">
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className="px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] mb-4"
            style={{ borderLeft: `3px solid ${fmtColor[format]}` }}
          >
            <p className="m-0 text-[11px] text-[var(--color-text-secondary)]">
              {FORMAT_META[format].desc}
            </p>
          </div>
          <p className="m-0 mb-2.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
            Side
          </p>
          <div className="flex gap-2 mb-4">
            {(["front", "back", "both"] as ExportSide[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setSide(opt)}
                className="flex-1 py-2.5 px-3 rounded-lg cursor-pointer text-[12px] capitalize transition-all duration-150"
                style={{
                  border: `1px solid ${side === opt ? fmtColor[format] : "var(--color-border-default)"}`,
                  background: side === opt ? `${fmtColor[format]}10` : "var(--color-bg-tertiary)",
                  fontWeight: side === opt ? 600 : 400,
                  color: side === opt ? fmtColor[format] : "var(--color-text-secondary)",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {(format === "pdf" || format === "docx") && (
            <>
              <p className="m-0 mb-2.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
                Quality
              </p>
              <div className="flex gap-2 mb-4">
                {(["standard", "premium"] as ExportQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className="flex-1 py-2.5 px-3 rounded-lg cursor-pointer text-[12px] transition-all duration-150"
                    style={{
                      border: `1px solid ${quality === q ? fmtColor[format] : "var(--color-border-default)"}`,
                      background: quality === q ? `${fmtColor[format]}10` : "var(--color-bg-tertiary)",
                      fontWeight: quality === q ? 600 : 400,
                      color: quality === q ? fmtColor[format] : "var(--color-text-secondary)",
                    }}
                  >
                    <div className="capitalize mb-0.5">{q}</div>
                    <div className="text-[10px] opacity-60">
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
            className="w-full py-3.5 px-5 rounded-[10px] border-none text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background:
                status === "done"
                  ? "#22C55E"
                  : status === "error"
                    ? "#EF4444"
                    : fmtColor[format],
              cursor: status === "working" ? "not-allowed" : "pointer",
              opacity: status === "working" ? 0.8 : 1,
            }}
          >
            {status === "working" && (
              <>
                <Loader2 size={15} className="animate-[spin_1s_linear_infinite]" />
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
export default DownloadModal;

