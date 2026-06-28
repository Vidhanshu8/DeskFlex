import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastKind = "success" | "error";

export interface ToastState {
  kind: ToastKind;
  message: string;
}

export function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 px-4"
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
        >
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-lift">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: toast.kind === "success" ? "#0FA876" : "#D9543C" }}
            />
            <span>{toast.message}</span>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="ml-1 text-ink-soft hover:text-ink focus:outline-none"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
