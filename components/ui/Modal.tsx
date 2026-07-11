"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconTile } from "@/components/ui/IconTile";
import type { Accent } from "@/components/ui/accent";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: Accent;
  children: React.ReactNode;
  /** max-width utility, defaults to max-w-lg */
  widthClassName?: string;
};

/**
 * Shared glass modal. Renders in a portal above the dashboard, closes on
 * backdrop click / Escape. Keep forms inside; footer buttons belong to the caller.
 */
export function Modal({ open, onClose, title, subtitle, icon, accent = "blue", children, widthClassName }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "cv-glass-strong relative my-auto w-full rounded-panel p-5 shadow-glass-hover sm:p-6",
              widthClassName ?? "max-w-lg"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {icon ? <IconTile icon={icon} accent={accent} size="sm" /> : null}
                <div>
                  <h2 className="text-[15px] font-bold leading-tight text-cv-ink">{title}</h2>
                  {subtitle ? <p className="mt-0.5 text-xs text-cv-slate">{subtitle}</p> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="cv-ring-focus inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
