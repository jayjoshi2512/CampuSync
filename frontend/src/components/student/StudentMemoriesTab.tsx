import React from "react";
import MemoryFilters from "@/components/memories/MemoryFilters";
import MemoryWall from "@/components/memories/MemoryWall";
import api from "@/utils/api";

interface StudentMemoriesTabProps {
  isCompactLayout: boolean;
  directoryUsers: any;
  branches: string[];
  setFiltersAndFetch: (filters: any) => void;
  resetFilters: () => void;
  memories: any[];
  memoriesLoading: boolean;
  hasMore: boolean;
  fetchMemories: () => void;
  toggleReaction: (memoryId: number, emoji: string) => void;
  actorId: number | undefined;
  deleteMemory: (id: number) => Promise<boolean>;
  toast: (msg: string, type: "success" | "error" | "info") => void;
  setMemoryUsage: (val: any) => void;
  setLightboxIdx: (idx: number) => void;
}

export default function StudentMemoriesTab({
  isCompactLayout,
  directoryUsers,
  branches,
  setFiltersAndFetch,
  resetFilters,
  memories,
  memoriesLoading,
  hasMore,
  fetchMemories,
  toggleReaction,
  actorId,
  deleteMemory,
  toast,
  setMemoryUsage,
  setLightboxIdx,
}: StudentMemoriesTabProps) {
  return (
    <div className={isCompactLayout ? "pt-[20px] px-[16px] pb-[28px]" : "py-[28px] px-[36px]"}>
      <MemoryFilters
        users={directoryUsers}
        branches={branches}
        onFilterChange={setFiltersAndFetch}
        onReset={resetFilters}
      />
      <MemoryWall
        memories={memories}
        loading={memoriesLoading}
        hasMore={hasMore}
        onLoadMore={fetchMemories}
        onReaction={toggleReaction}
        canReact={true}
        currentUserId={actorId}
        onDeleteMemory={async (id: number) => {
          if (confirm("Are you sure you want to delete this memory?")) {
            const success = await deleteMemory(id);
            if (success) {
              toast("Memory deleted successfully", "success");
              api.get("/memories/usage", { _silent: true } as any)
                .then(({ data }) => setMemoryUsage(data.usage || null))
                .catch(() => {});
            } else {
              toast("Failed to delete memory", "error");
            }
          }
        }}
        onClickMemory={(m: any) => setLightboxIdx(memories.indexOf(m))}
      />
    </div>
  );
}
