import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Check, Download } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import api from "@/utils/api";
import CardViewer, { CardData } from "@/components/CardViewer";
import { useAuthStore } from "@/store/authStore";

// Same exact capture logic as DownloadModal to ensure perfect parity
async function captureNode(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  const saved: any[] = [];
  let cur: HTMLElement | null = el.parentElement;
  
  while (cur && cur !== document.body) {
    const cs = getComputedStyle(cur);
    const needsFix = parseFloat(cs.opacity) < 1 || cs.visibility === "hidden" || parseInt(cs.left || "0") < -1000;
    if (needsFix) {
      saved.push({ node: cur, opacity: cur.style.opacity, visibility: cur.style.visibility, left: cur.style.left });
      cur.style.opacity = "1";
      cur.style.visibility = "visible";
      if (parseInt(cs.left || "0") < -1000) cur.style.left = "0px";
    }
    cur = cur.parentElement;
  }
  
  saved.push({ node: el, opacity: el.style.opacity, visibility: el.style.visibility, left: el.style.left });
  el.style.opacity = "1";
  el.style.visibility = "visible";
  
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, { backgroundColor: null, scale, useCORS: true, allowTaint: false, logging: false, imageTimeout: 20000 });
  } finally {
    for (const { node, opacity, visibility, left } of saved) {
      node.style.opacity = opacity;
      node.style.visibility = visibility;
      node.style.left = left;
    }
  }
  return canvas;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function BulkExportModal({ onClose, isDemo }: { onClose: () => void, isDemo: boolean }) {
  const [status, setStatus] = useState<"idle" | "fetching" | "generating" | "zipping" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  
  const actor = useAuthStore(s => s.actor);
  const orgName = actor?.organization?.name || "Institution";
  const orgTemplateId = actor?.organization?.selected_card_template || "tmpl_obsidian";
  
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);

  const startExport = async () => {
    if (isDemo) {
      setErrorMsg("Bulk export is not available in demo mode.");
      setStatus("error");
      return;
    }
    
    setStatus("fetching");
    try {
      // 1. Fetch cohort
      const { data } = await api.get("/admin/cohort", { params: { limit: 10000 } });
      const users = data.users || [];
      if (users.length === 0) {
        throw new Error("No students found in cohort.");
      }
      
      setTotal(users.length);
      setStatus("generating");
      
      const zip = new JSZip();
      
      // 2. Loop & Generate JPEGs
      let idx = 0;
      for (const user of users) {
        idx++;
        setProgress(idx);
        
        const cardData: CardData = {
          name: user.name,
          roll_number: user.roll_number || "Unknown",
          branch: user.branch || "General",
          batch_year: user.batch_year,
          org_name: orgName,
          template_id: orgTemplateId,
          card_back_image_url: actor?.organization?.card_back_image_url,
          avatar_url: user.avatar_url,
          qr_hash: user.qr_hash,
        };
        
        setCurrentCard(cardData);
        // Wait for React to render CardViewer
        await delay(300); 
        
        const frontEl = document.getElementById("pcard-export-front");
        const backEl = document.getElementById("pcard-export-back");
        
        if (frontEl && backEl) {
          const frontCanvas = await captureNode(frontEl, 2);
          const backCanvas = await captureNode(backEl, 2);
          
          const frontData = frontCanvas.toDataURL("image/jpeg", 0.95).split(",")[1];
          const backData = backCanvas.toDataURL("image/jpeg", 0.95).split(",")[1];
          
          const branchFolder = cardData.branch || "General";
          const rollFolder = cardData.roll_number || cardData.name.replace(/\s+/g, '_');
          
          const userFolder = zip.folder(branchFolder)?.folder(rollFolder);
          userFolder?.file(`front.jpg`, frontData, { base64: true });
          userFolder?.file(`back.jpg`, backData, { base64: true });
        }
      }
      
      setStatus("zipping");
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${orgName.replace(/\s+/g, "_")}_Bulk_Cards.zip`);
      
      setStatus("done");
      setTimeout(onClose, 2000);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unknown error occurred.");
      setStatus("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[rgba(0,0,0,0.75)] backdrop-blur-[8px] flex items-center justify-center z-[2000] p-6"
    >
      <div className="w-full max-w-[420px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-none bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer text-[var(--color-text-muted)]">
          <X size={16} />
        </button>
        
        <h2 className="m-0 text-[18px] font-bold text-[var(--color-text-primary)] mb-2">Bulk Export Cards</h2>
        <p className="m-0 text-[13px] text-[var(--color-text-muted)] mb-6">
          Generate front and back JPEGs for all students, organized neatly into a ZIP file.
        </p>

        {status === "idle" && (
          <button onClick={startExport} className="w-full py-3 bg-[var(--color-brand)] text-white text-[14px] font-bold rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
            <Download size={18} /> Start Bulk Generation
          </button>
        )}

        {status === "fetching" && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Fetching entire cohort data...</span>
          </div>
        )}

        {status === "generating" && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Rendering & capturing {progress} / {total}</span>
            <div className="w-full bg-[var(--color-bg-tertiary)] h-2 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-[var(--color-brand)] transition-all duration-300" style={{ width: `${(progress/total)*100}%` }} />
            </div>
          </div>
        )}

        {status === "zipping" && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Compressing files into ZIP...</span>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-12 h-12 bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center rounded-full">
              <Check size={24} />
            </div>
            <span className="text-[15px] font-bold text-[#22C55E]">Export Complete!</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-500 flex items-center justify-center rounded-full">
              <X size={24} />
            </div>
            <span className="text-[15px] font-bold text-red-500">Export Failed</span>
            <p className="text-[12px] text-[var(--color-text-muted)] m-0">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Hidden container for rendering the CardViewer */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
        {status === 'generating' && currentCard && (
           <>
             <div id="pcard-export-front"><CardViewer card={currentCard} interactive={false} displayScale={3} renderMode="front" /></div>
             <div id="pcard-export-back"><CardViewer card={currentCard} interactive={false} displayScale={3} renderMode="back" /></div>
           </>
        )}
      </div>
    </motion.div>
  );
}
