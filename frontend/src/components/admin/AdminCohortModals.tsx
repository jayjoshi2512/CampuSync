import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface AdminCohortModalsProps {
  showManualAdd: boolean;
  showEdit: boolean;
  setShowManualAdd: (val: boolean) => void;
  setShowEdit: (val: boolean) => void;
  manualData: any;
  setManualData: (val: any) => void;
  editData: any;
  setEditData: (val: any) => void;
  manualLoading: boolean;
  editLoading: boolean;
  handleManualAdd: (e: React.FormEvent) => void;
  handleEditSubmit: (e: React.FormEvent) => void;
  isCompactLayout: boolean;
}

export default function AdminCohortModals({
  showManualAdd,
  showEdit,
  setShowManualAdd,
  setShowEdit,
  manualData,
  setManualData,
  editData,
  setEditData,
  manualLoading,
  editLoading,
  handleManualAdd,
  handleEditSubmit,
  isCompactLayout,
}: AdminCohortModalsProps) {
  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border-default)",
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <AnimatePresence>
      {(showManualAdd || showEdit) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-[100] flex items-center justify-center p-5 backdrop-blur-[4px]"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-[450px] bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-default)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
              <h3 className="m-0 text-[15px] font-bold text-[var(--color-text-primary)]">
                {showEdit ? "Edit Student" : "Add Student"}
              </h3>
              <button
                onClick={() => {
                  setShowManualAdd(false);
                  setShowEdit(false);
                }}
                className="bg-transparent border-none text-[var(--color-text-muted)] cursor-pointer p-0 flex items-center"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={showEdit ? handleEditSubmit : handleManualAdd}
              className="p-5 flex flex-col gap-3.5"
            >
              <div
                className={`grid gap-3 ${
                  isCompactLayout ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Name
                  </label>
                  <input
                    required
                    type="text"
                    value={(showEdit ? editData : manualData)?.name || ""}
                    onChange={(e) =>
                      showEdit
                        ? setEditData({ ...editData, name: e.target.value })
                        : setManualData({ ...manualData, name: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={(showEdit ? editData : manualData)?.email || ""}
                    onChange={(e) =>
                      showEdit
                        ? setEditData({ ...editData, email: e.target.value })
                        : setManualData({
                            ...manualData,
                            email: e.target.value,
                          })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
              <div
                className={`grid gap-3 ${
                  isCompactLayout ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={(showEdit ? editData : manualData)?.roll_number || ""}
                    onChange={(e) =>
                      showEdit
                        ? setEditData({
                            ...editData,
                            roll_number: e.target.value,
                          })
                        : setManualData({
                            ...manualData,
                            roll_number: e.target.value,
                          })
                    }
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={(showEdit ? editData : manualData)?.branch || ""}
                    onChange={(e) =>
                      showEdit
                        ? setEditData({ ...editData, branch: e.target.value })
                        : setManualData({
                            ...manualData,
                            branch: e.target.value,
                          })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
              <div
                className={`grid gap-3 ${
                  isCompactLayout ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Batch Year
                  </label>
                  <input
                    type="number"
                    value={
                      (showEdit ? editData : manualData)?.batch_year || ""
                    }
                    onChange={(e) =>
                      showEdit
                        ? setEditData({
                            ...editData,
                            batch_year: e.target.value,
                          })
                        : setManualData({
                            ...manualData,
                            batch_year: e.target.value,
                          })
                    }
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Role
                  </label>
                  <select
                    value={(showEdit ? editData : manualData)?.role || "user"}
                    onChange={(e) =>
                      showEdit
                        ? setEditData({ ...editData, role: e.target.value })
                        : setManualData({ ...manualData, role: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="user">Student</option>
                    <option value="alumni">Alumni/Mentor</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={showEdit ? editLoading : manualLoading}
                className="mt-1 p-3 rounded-xl border-none bg-[var(--color-brand)] text-white text-[13px] font-bold cursor-pointer"
              >
                {(showEdit ? editLoading : manualLoading)
                  ? "Saving..."
                  : showEdit
                  ? "Save Changes"
                  : "Add Student"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
