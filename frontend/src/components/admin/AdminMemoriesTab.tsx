import React from "react";
import MemoryFilters from "@/components/memories/MemoryFilters";
import MemoryStatsPanel from "@/components/memories/MemoryStatsPanel";
import MemoryWall from "@/components/memories/MemoryWall";
import MemoryUploader from "@/components/memories/MemoryUploader";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";

interface AdminMemoriesTabProps {
  cohort: any[];
  branchOptions: string[];
  setFiltersAndFetch: (filters: any) => void;
  resetFilters: () => void;
  memories: any[];
  memLoading: boolean;
  hasMore: boolean;
  fetchMemories: () => void;
  toggleReaction: (memoryId: number, emoji: string) => void;
  canReact: boolean;
  deleteMemory: (id: number) => Promise<boolean>;
  setLightboxIdx: (idx: number) => void;
  showMemoryUploader: boolean;
  setShowMemoryUploader: (val: boolean) => void;
}

export default function AdminMemoriesTab({
  cohort,
  branchOptions,
  setFiltersAndFetch,
  resetFilters,
  memories,
  memLoading,
  hasMore,
  fetchMemories,
  toggleReaction,
  canReact,
  deleteMemory,
  setLightboxIdx,
  showMemoryUploader,
  setShowMemoryUploader,
}: AdminMemoriesTabProps) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <MemoryFilters
        users={cohort}
        branches={branchOptions}
        onFilterChange={setFiltersAndFetch}
        onReset={resetFilters}
      />
      <MemoryStatsPanel />
      <MemoryWall
        memories={memories}
        loading={memLoading}
        hasMore={hasMore}
        onLoadMore={fetchMemories}
        onReaction={toggleReaction}
        canReact={canReact}
        onDeleteMemory={deleteMemory}
        onClickMemory={(m) => setLightboxIdx(memories.indexOf(m))}
      />
      <button
        onClick={() => setShowMemoryUploader(true)}
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
          boxShadow: "0 6px 24px rgba(16,185,129,0.45)",
          zIndex: 50,
        }}
      >
        <Plus size={22} />
      </button>
      <AnimatePresence>
        {showMemoryUploader && (
          <MemoryUploader onClose={() => setShowMemoryUploader(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
